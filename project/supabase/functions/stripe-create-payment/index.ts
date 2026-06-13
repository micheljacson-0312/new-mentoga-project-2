import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  bookingId: string;
  consultantId: string;
  userId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey || !supabaseUrl || !serviceRoleKey) {
      throw new Error("Stripe or Supabase secrets are not configured");
    }

    const payload: PaymentRequest = await req.json();
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: stripeConfig, error: configError } = await supabase
      .from("payment_provider_settings")
      .select("is_enabled")
      .eq("provider", "stripe")
      .maybeSingle();

    if (configError) throw configError;
    if (!stripeConfig?.is_enabled) {
      throw new Error("Stripe is not enabled in admin settings");
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
          payment_method: "stripe",
          status: "pending",
          description: payload.description,
        },
      ])
      .select("id")
      .single();

    if (paymentInsertError) throw paymentInsertError;

    const checkoutResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "payment",
        success_url: payload.successUrl,
        cancel_url: payload.cancelUrl,
        customer_email: payload.email,
        client_reference_id: paymentRow.id,
        "line_items[0][price_data][currency]": payload.currency.toLowerCase(),
        "line_items[0][price_data][product_data][name]": payload.description,
        "line_items[0][price_data][unit_amount]": String(Math.round(payload.amount * 100)),
        "line_items[0][quantity]": "1",
        "payment_intent_data[metadata][paymentId]": paymentRow.id,
        "payment_intent_data[metadata][bookingId]": payload.bookingId,
        "payment_intent_data[metadata][userId]": payload.userId,
        "payment_intent_data[metadata][consultantId]": payload.consultantId,
        "metadata[paymentId]": paymentRow.id,
        "metadata[bookingId]": payload.bookingId,
      }),
    });

    if (!checkoutResponse.ok) {
      const error = await checkoutResponse.json();
      await supabase.from("payments").delete().eq("id", paymentRow.id);
      throw new Error(error.error?.message || "Failed to create Stripe checkout session");
    }

    const checkoutSession = await checkoutResponse.json();

    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({ stripe_payment_id: checkoutSession.id, updated_at: new Date().toISOString() })
      .eq("id", paymentRow.id);

    if (paymentUpdateError) throw paymentUpdateError;

    const { error: bookingUpdateError } = await supabase
      .from("bookings")
      .update({ payment_id: paymentRow.id, updated_at: new Date().toISOString() })
      .eq("id", payload.bookingId);

    if (bookingUpdateError) throw bookingUpdateError;

    return new Response(
      JSON.stringify({
        checkoutUrl: checkoutSession.url,
        checkoutSessionId: checkoutSession.id,
        paymentId: paymentRow.id,
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
