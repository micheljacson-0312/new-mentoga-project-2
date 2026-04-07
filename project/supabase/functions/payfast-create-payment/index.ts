import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PayFastPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  bookingId: string;
  consultantId: string;
  userId: string;
  email: string;
  mobileNumber: string;
  successUrl: string;
  cancelUrl: string;
  cnicNumber?: string;
  accountNumber?: string;
  bankCode?: string;
  otp?: string;
  transactionId?: string;
  step?: "validate" | "confirm";
}

async function getAccessToken(baseUrl: string, merchantId: string, securedKey: string, customerIp: string) {
  const tokenResponse = await fetch(`${baseUrl}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      merchant_id: merchantId,
      grant_type: "client_credentials",
      secured_key: securedKey,
      customer_ip: customerIp,
    }),
  });

  const tokenBody = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenBody.token) {
    throw new Error(tokenBody.message || tokenBody.error || "Could not get PayFast access token");
  }

  return tokenBody.token as string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const merchantId = Deno.env.get("PAYFAST_MERCHANT_ID");
    const securedKey = Deno.env.get("PAYFAST_SECURED_KEY");
    const merCatCode = Deno.env.get("PAYFAST_MERCHANT_CATEGORY_CODE");
    const accountTypeId = Deno.env.get("PAYFAST_ACCOUNT_TYPE_ID") || "4";
    const baseUrl = Deno.env.get("PAYFAST_BASE_URL") || "https://ipguat.apps.net.pk/Ecommerce/api";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!merchantId || !securedKey || !merCatCode || !supabaseUrl || !serviceRoleKey) {
      throw new Error("PayFast or Supabase secrets are not configured");
    }

    const payload: PayFastPaymentRequest = await req.json();
    if (!/^03\d{9}$/.test(payload.mobileNumber || "")) {
      throw new Error("Please enter a valid PayFast mobile number (03XXXXXXXXX)");
    }

    const customerIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const token = await getAccessToken(baseUrl, merchantId, securedKey, customerIp);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: providerConfig } = await supabase
      .from("payment_provider_settings")
      .select("is_enabled")
      .eq("provider", "payfast")
      .maybeSingle();

    if (!providerConfig?.is_enabled) {
      throw new Error("PayFast is not enabled in admin settings");
    }

    if (payload.step !== "confirm") {
      if (!payload.bankCode || !payload.accountNumber || !payload.cnicNumber) {
        throw new Error("PayFast requires bank code, account number, and CNIC");
      }

      const validateResponse = await fetch(`${baseUrl}/customer/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
        body: new URLSearchParams({
          basket_id: payload.bookingId,
          txnamt: String(payload.amount),
          customer_mobile_no: `92-${payload.mobileNumber.slice(1)}`,
          customer_email_address: payload.email,
          account_type_id: accountTypeId,
          bank_code: payload.bankCode,
          cnic_number: payload.cnicNumber,
          account_number: payload.accountNumber,
          order_date: new Date().toISOString().slice(0, 19).replace("T", " "),
          otp_required: "yes",
          recurring_txn: "no",
          merCatCode: merCatCode,
          customer_ip: customerIp,
        }),
      });

      const validateBody = await validateResponse.json();
      if (!validateResponse.ok || !validateBody.transaction_id) {
        throw new Error(validateBody.message || validateBody.status_msg || "PayFast validation failed");
      }

      return new Response(JSON.stringify({
        requiresOtp: true,
        transactionId: validateBody.transaction_id,
        message: validateBody.message || validateBody.status_msg || "OTP sent to customer mobile number.",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payload.transactionId || !payload.otp || !payload.bankCode || !payload.accountNumber || !payload.cnicNumber) {
      throw new Error("PayFast OTP confirmation is missing required fields");
    }

    const { data: paymentRow, error: paymentInsertError } = await supabase
      .from("payments")
      .insert([
        {
          booking_id: payload.bookingId,
          user_id: payload.userId,
          consultant_id: payload.consultantId,
          amount: payload.amount,
          currency: payload.currency.toUpperCase(),
          payment_method: "payfast",
          status: "pending",
          description: `${payload.description} | Mobile: ${payload.mobileNumber}`,
        },
      ])
      .select("id")
      .single();

    if (paymentInsertError) throw paymentInsertError;

    await supabase.from("bookings").update({ payment_id: paymentRow.id }).eq("id", payload.bookingId);

    const transactionResponse = await fetch(`${baseUrl}/transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
      body: new URLSearchParams({
        basket_id: payload.bookingId,
        txnamt: String(payload.amount),
        customer_email_address: payload.email,
        account_type_id: accountTypeId,
        customer_mobile_no: `92-${payload.mobileNumber.slice(1)}`,
        account_number: payload.accountNumber,
        cnic_number: payload.cnicNumber,
        account_title: "",
        bank_code: payload.bankCode,
        order_date: new Date().toISOString().slice(0, 19).replace("T", " "),
        otp_required: "yes",
        recurring_txn: "no",
        otp: payload.otp,
        transaction_id: payload.transactionId,
        merCatCode: merCatCode,
        customer_ip: customerIp,
      }),
    });

    const transactionBody = await transactionResponse.json();
    if (!transactionResponse.ok || transactionBody.code || !transactionBody.transaction_id) {
      await supabase.from("payments").update({ status: "failed" }).eq("id", paymentRow.id);
      throw new Error(transactionBody.status_msg || transactionBody.message || "PayFast transaction failed");
    }

    await supabase.from("payments").update({
      status: "completed",
      stripe_payment_id: transactionBody.transaction_id,
      updated_at: new Date().toISOString(),
    }).eq("id", paymentRow.id);

    await supabase.from("bookings").update({
      status: "confirmed",
      updated_at: new Date().toISOString(),
    }).eq("id", payload.bookingId);

    return new Response(JSON.stringify({
      checkoutUrl: payload.successUrl,
      paymentId: paymentRow.id,
      transactionId: transactionBody.transaction_id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Internal server error",
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
