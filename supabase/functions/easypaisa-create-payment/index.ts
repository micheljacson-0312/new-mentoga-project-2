import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EasyPaisaPaymentRequest {
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
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const storeId = Deno.env.get("EASYPAISA_STORE_ID");
    const apiKey = Deno.env.get("EASYPAISA_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!storeId || !apiKey || !supabaseUrl || !serviceRoleKey) {
      throw new Error("Easypaisa or Supabase secrets are not configured");
    }

    const payload: EasyPaisaPaymentRequest = await req.json();

    if (!/^03\d{9}$/.test(payload.mobileNumber || "")) {
      throw new Error("Please enter a valid EasyPaisa mobile number (03XXXXXXXXX)");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: providerConfig, error: providerError } = await supabase
      .from("payment_provider_settings")
      .select("is_enabled")
      .eq("provider", "easypaisa")
      .maybeSingle();

    if (providerError) throw providerError;
    if (!providerConfig?.is_enabled) {
      throw new Error("Easypaisa is not enabled in admin settings");
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
          payment_method: "easypaisa",
          status: "pending",
          description: `${payload.description} | Mobile: ${payload.mobileNumber}`,
        },
      ])
      .select("id")
      .single();

    if (paymentInsertError) throw paymentInsertError;

    await supabase
      .from("bookings")
      .update({ payment_id: paymentRow.id, updated_at: new Date().toISOString() })
      .eq("id", payload.bookingId);

    const endpoint = "https://easypay.easypaisa.com.pk/easypay-service/rest/v4/initiate-ma-transaction";
    const easypaisaOrderId = `${payload.bookingId}_${Date.now()}`;

    const gatewayResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Credentials: apiKey,
      },
      body: JSON.stringify({
        orderId: easypaisaOrderId,
        storeId: Number(storeId),
        transactionAmount: Number(payload.amount).toFixed(2),
        transactionType: "MA",
        mobileAccountNo: payload.mobileNumber,
        emailAddress: payload.email,
      }),
    });

    const bodyText = await gatewayResponse.text();
    let gatewayBody: Record<string, unknown> = {};

    try {
      gatewayBody = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      gatewayBody = { raw: bodyText };
    }

    const responseDesc = String(gatewayBody.responseDesc || "");
    const transactionId = String(gatewayBody.transactionId || easypaisaOrderId);

    if (!gatewayResponse.ok || responseDesc.toUpperCase() !== "SUCCESS") {
      await supabase
        .from("payments")
        .update({ status: "failed", stripe_payment_id: transactionId, updated_at: new Date().toISOString() })
        .eq("id", paymentRow.id);

      await supabase
        .from("bookings")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", payload.bookingId);

      throw new Error(responseDesc || "EasyPaisa payment failed. Please try again.");
    }

    await supabase
      .from("payments")
      .update({ status: "completed", stripe_payment_id: transactionId, updated_at: new Date().toISOString() })
      .eq("id", paymentRow.id);

    await supabase
      .from("bookings")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", payload.bookingId);

    await supabase
      .from("payment_provider_settings")
      .update({ webhook_last_verified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("provider", "easypaisa");

    return new Response(
      JSON.stringify({
        checkoutUrl: payload.successUrl,
        paymentId: paymentRow.id,
        transactionId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
