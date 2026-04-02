import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import crypto from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PayFastRequest {
  amount: number;
  currency: string;
  description: string;
  bookingId: string;
  userId: string;
  email: string;
  merchantId: string;
  merchantKey: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: PayFastRequest = await req.json();
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const data: Record<string, string> = {
      merchant_id: payload.merchantId,
      merchant_key: payload.merchantKey,
      return_url: `${payload.returnUrl}?paymentId=${paymentId}`,
      cancel_url: payload.cancelUrl,
      notify_url: payload.notifyUrl,
      name_first: "Customer",
      name_last: "User",
      email_address: payload.email,
      m_payment_id: paymentId,
      amount: payload.amount.toFixed(2),
      item_name: payload.description,
      item_description: `Booking: ${payload.bookingId}`,
      custom_int1: payload.bookingId,
      custom_int2: payload.userId,
    };

    const signature = generatePayFastSignature(data, payload.merchantKey);
    data.signature = signature;

    const params = new URLSearchParams(data);
    const redirectUrl = `https://sandbox.payfast.co.za/?${params.toString()}`;

    return new Response(
      JSON.stringify({
        redirectUrl,
        paymentId,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

function generatePayFastSignature(
  data: Record<string, string>,
  passPhrase: string
): string {
  const items = Object.keys(data)
    .filter((key) => data[key] !== "")
    .sort()
    .map((key) => `${key}=${encodeURIComponent(data[key])}`)
    .join("&");

  const signatureString = `${items}&passphrase=${encodeURIComponent(passPhrase)}`;
  return crypto.createHash("md5").update(signatureString).digest("hex");
}
