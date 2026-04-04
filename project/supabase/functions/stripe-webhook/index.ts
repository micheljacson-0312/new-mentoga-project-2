import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Stripe-Signature, X-Client-Info, Apikey",
};

const encoder = new TextEncoder();

function secureCompare(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function hmacSha256(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function parseStripeSignature(header: string) {
  const parts = Object.fromEntries(
    header.split(",").map((item) => {
      const [key, value] = item.split("=");
      return [key, value];
    })
  );

  return {
    timestamp: parts.t,
    signature: parts.v1,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!webhookSecret || !supabaseUrl || !serviceRoleKey) {
      throw new Error("Stripe webhook secrets are not configured");
    }

    const signatureHeader = req.headers.get("Stripe-Signature");
    if (!signatureHeader) {
      throw new Error("Missing Stripe-Signature header");
    }

    const rawBody = await req.text();
    const { timestamp, signature } = parseStripeSignature(signatureHeader);
    if (!timestamp || !signature) {
      throw new Error("Invalid Stripe signature header");
    }

    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = await hmacSha256(webhookSecret, signedPayload);
    if (!secureCompare(expectedSignature, signature)) {
      throw new Error("Webhook signature verification failed");
    }

    const event = JSON.parse(rawBody);
    const stripeObject = event.data?.object;
    const metadata = stripeObject?.metadata || {};
    const paymentId = metadata.paymentId || stripeObject?.client_reference_id || null;
    const bookingId = metadata.bookingId || null;
    const stripePaymentId = stripeObject?.payment_intent || stripeObject?.id || null;

    if (!paymentId && !stripePaymentId) {
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
      await supabase
        .from("payments")
        .update({ status: "completed", stripe_payment_id: stripePaymentId, updated_at: new Date().toISOString() })
        .eq("id", paymentId);

      if (bookingId) {
        await supabase
          .from("bookings")
          .update({ status: "confirmed", updated_at: new Date().toISOString() })
          .eq("id", bookingId);
      }
    }

    if (event.type === "payment_intent.payment_failed" || event.type === "checkout.session.expired") {
      await supabase
        .from("payments")
        .update({ status: "failed", stripe_payment_id: stripePaymentId, updated_at: new Date().toISOString() })
        .eq("id", paymentId);
    }

    if (event.type === "charge.refunded") {
      await supabase
        .from("payments")
        .update({ status: "refunded", stripe_payment_id: stripePaymentId, updated_at: new Date().toISOString() })
        .eq("id", paymentId);
    }

    await supabase
      .from("payment_provider_settings")
      .update({ webhook_last_verified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("provider", "stripe");

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Webhook error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
