import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EasyPasiaRequest {
  amount: number;
  currency: string;
  description: string;
  bookingId: string;
  userId: string;
  email: string;
  storeId: string;
  authToken: string;
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
    const payload: EasyPasiaRequest = await req.json();
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const sessionId = `SES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const params = new URLSearchParams({
      storeId: payload.storeId,
      authToken: payload.authToken,
      amount: payload.amount.toString(),
      currency: payload.currency,
      orderRef: payload.bookingId,
      description: payload.description,
      email: payload.email,
      returnUrl: `${payload.returnUrl}?paymentId=${paymentId}&sessionId=${sessionId}`,
      cancelUrl: payload.cancelUrl,
      notifyUrl: payload.notifyUrl,
    });

    const redirectUrl = `https://sandbox.easypaisa.com.pk/payment?${params.toString()}`;

    return new Response(
      JSON.stringify({
        redirectUrl,
        paymentId,
        sessionId,
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
