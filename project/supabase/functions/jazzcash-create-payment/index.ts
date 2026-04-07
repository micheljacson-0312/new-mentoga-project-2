import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface JazzCashPaymentRequest {
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

function formatTxnDate(date = new Date()) {
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

async function hmacSha256Hex(secret: string, values: string[]) {
  const payload = `${secret}&${values.join("&")}`;
  const utf8 = new TextEncoder().encode(payload);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, utf8);
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function parsePipeResponse(response: string) {
  const trimmed = response.replace(/^Response!?\[/, "").replace(/\]$/, "");
  const parts = trimmed.split("|");
  return {
    pp_Amount: parts[0] || "",
    pp_AuthCode: parts[1] || "",
    pp_BankID: parts[2] || "",
    pp_BillReference: parts[3] || "",
    pp_Language: parts[4] || "",
    pp_MerchantID: parts[5] || "",
    pp_ResponseCode: parts[6] || "",
    pp_ResponseMessage: parts[7] || "",
    pp_RetreivalReferenceNo: parts[8] || "",
    pp_SecureHash: parts[9] || "",
    pp_ProductID: parts[12] || "",
    pp_TxnCurrency: parts[13] || "",
    pp_TxnDateTime: parts[14] || "",
    pp_TxnRefNo: parts[15] || "",
    pp_TxnType: parts[16] || "",
    pp_Version: parts[17] || "",
    ppmpf_1: parts[22] || "",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const merchantId = Deno.env.get("JAZZCASH_MERCHANT_ID");
    const password = Deno.env.get("JAZZCASH_PASSWORD");
    const integritySalt = Deno.env.get("JAZZCASH_INTEGRITY_SALT");
    const returnUrl = Deno.env.get("JAZZCASH_RETURN_URL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!merchantId || !password || !integritySalt || !returnUrl || !supabaseUrl || !serviceRoleKey) {
      throw new Error("JazzCash or Supabase secrets are not configured");
    }

    const payload: JazzCashPaymentRequest = await req.json();
    if (!/^03\d{9}$/.test(payload.mobileNumber || "")) {
      throw new Error("Please enter a valid JazzCash mobile number (03XXXXXXXXX)");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: providerConfig, error: providerError } = await supabase
      .from("payment_provider_settings")
      .select("is_enabled")
      .eq("provider", "jazzcash")
      .maybeSingle();

    if (providerError) throw providerError;
    if (!providerConfig?.is_enabled) {
      throw new Error("JazzCash is not enabled in admin settings");
    }

    const { data: paymentRow, error: paymentInsertError } = await supabase
      .from("payments")
      .insert([
        {
          booking_id: payload.bookingId,
          user_id: payload.userId,
          consultant_id: payload.consultantId,
          amount: payload.amount,
          currency: "PKR",
          payment_method: "jazzcash",
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

    const now = new Date();
    const expiry = new Date(now.getTime() + 30 * 60 * 1000);
    const pp_TxnDateTime = formatTxnDate(now);
    const pp_TxnExpiryDateTime = formatTxnDate(expiry);
    const pp_TxnRefNo = `T${pp_TxnDateTime}${paymentRow.id.replace(/-/g, "").slice(0, 6)}`;
    const pp_Amount = String(Math.round(payload.amount * 100));

    const requestFields = {
      pp_Amount,
      pp_BillReference: payload.bookingId,
      pp_Description: payload.description.replace(/[<>*=%/:"'{}|]/g, " "),
      pp_Language: "EN",
      pp_MerchantID: merchantId,
      pp_Password: password,
      pp_ReturnURL: returnUrl,
      pp_TxnCurrency: "PKR",
      pp_TxnDateTime,
      pp_TxnExpiryDateTime,
      pp_TxnRefNo,
      pp_TxnType: "MWALLET",
      pp_Version: "1.1",
      ppmpf_1: payload.mobileNumber,
      ppmpf_2: "",
      ppmpf_3: "",
      ppmpf_4: "",
      ppmpf_5: "",
      pp_BankID: "",
      pp_ProductID: "",
      pp_SubMerchantID: "",
    };

    const hashFields = Object.entries(requestFields)
      .filter(([key, value]) => key.startsWith("pp_") && key !== "pp_SecureHash" && value !== "")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);

    const pp_SecureHash = await hmacSha256Hex(integritySalt, hashFields);

    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:DoPaymentViaAPI>
      <tem:pp_Version>${escapeXml(requestFields.pp_Version)}</tem:pp_Version>
      <tem:pp_TxnType>${escapeXml(requestFields.pp_TxnType)}</tem:pp_TxnType>
      <tem:pp_Language>${escapeXml(requestFields.pp_Language)}</tem:pp_Language>
      <tem:pp_MerchantID>${escapeXml(requestFields.pp_MerchantID)}</tem:pp_MerchantID>
      <tem:pp_SubMerchantID>${escapeXml(requestFields.pp_SubMerchantID)}</tem:pp_SubMerchantID>
      <tem:pp_Password>${escapeXml(requestFields.pp_Password)}</tem:pp_Password>
      <tem:pp_BankID>${escapeXml(requestFields.pp_BankID)}</tem:pp_BankID>
      <tem:pp_ProductID>${escapeXml(requestFields.pp_ProductID)}</tem:pp_ProductID>
      <tem:pp_TxnRefNo>${escapeXml(requestFields.pp_TxnRefNo)}</tem:pp_TxnRefNo>
      <tem:pp_Amount>${escapeXml(requestFields.pp_Amount)}</tem:pp_Amount>
      <tem:pp_TxnCurrency>${escapeXml(requestFields.pp_TxnCurrency)}</tem:pp_TxnCurrency>
      <tem:pp_TxnDateTime>${escapeXml(requestFields.pp_TxnDateTime)}</tem:pp_TxnDateTime>
      <tem:pp_BillReference>${escapeXml(requestFields.pp_BillReference)}</tem:pp_BillReference>
      <tem:pp_Description>${escapeXml(requestFields.pp_Description)}</tem:pp_Description>
      <tem:pp_TxnExpiryDateTime>${escapeXml(requestFields.pp_TxnExpiryDateTime)}</tem:pp_TxnExpiryDateTime>
      <tem:pp_ReturnURL>${escapeXml(requestFields.pp_ReturnURL)}</tem:pp_ReturnURL>
      <tem:pp_SecureHash>${escapeXml(pp_SecureHash)}</tem:pp_SecureHash>
      <tem:ppmpf_1>${escapeXml(requestFields.ppmpf_1)}</tem:ppmpf_1>
      <tem:ppmpf_2>${escapeXml(requestFields.ppmpf_2)}</tem:ppmpf_2>
      <tem:ppmpf_3>${escapeXml(requestFields.ppmpf_3)}</tem:ppmpf_3>
      <tem:ppmpf_4>${escapeXml(requestFields.ppmpf_4)}</tem:ppmpf_4>
      <tem:ppmpf_5>${escapeXml(requestFields.ppmpf_5)}</tem:ppmpf_5>
    </tem:DoPaymentViaAPI>
  </soapenv:Body>
</soapenv:Envelope>`;

    const endpoint = "http://119.160.80.70/ExternalStatusService/StatusService_v11.svc";
    const gatewayResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: '"http://tempuri.org/IStatusService_v11/DoPaymentViaAPI"',
      },
      body: soapBody,
    });

    const rawXml = await gatewayResponse.text();
    const responseMatch = rawXml.match(/<DoPaymentViaAPIResult>([\s\S]*?)<\/DoPaymentViaAPIResult>/);
    if (!gatewayResponse.ok || !responseMatch?.[1]) {
      throw new Error("JazzCash gateway did not return a valid payment response");
    }

    const parsed = parsePipeResponse(responseMatch[1]);
    const responseCode = parsed.pp_ResponseCode;
    const responseMessage = parsed.pp_ResponseMessage || "JazzCash payment failed";
    const retrievalReference = parsed.pp_RetreivalReferenceNo || pp_TxnRefNo;

    if (responseCode !== "000") {
      await supabase
        .from("payments")
        .update({ status: "failed", stripe_payment_id: retrievalReference, updated_at: new Date().toISOString() })
        .eq("id", paymentRow.id);

      throw new Error(responseMessage);
    }

    await supabase
      .from("payments")
      .update({ status: "completed", stripe_payment_id: retrievalReference, updated_at: new Date().toISOString() })
      .eq("id", paymentRow.id);

    await supabase
      .from("bookings")
      .update({ status: "confirmed", notes: `${payload.description}\nJazzCash Ref: ${retrievalReference}`, updated_at: new Date().toISOString() })
      .eq("id", payload.bookingId);

    await supabase
      .from("payment_provider_settings")
      .update({ webhook_last_verified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("provider", "jazzcash");

    return new Response(
      JSON.stringify({
        checkoutUrl: payload.successUrl,
        paymentId: paymentRow.id,
        transactionId: retrievalReference,
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
