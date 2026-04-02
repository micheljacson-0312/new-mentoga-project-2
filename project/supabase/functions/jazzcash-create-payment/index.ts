import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface JazzCashRequest {
  amount: number;
  currency: string;
  description: string;
  bookingId: string;
  userId: string;
  email: string;
  merchantId: string;
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
    const payload: JazzCashRequest = await req.json();

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const paymentParams = {
      pp_Version: "1.1",
      pp_TxnType: "MPAY",
      pp_Language: "EN",
      pp_MerchantID: payload.merchantId,
      pp_SubMerchantID: "",
      pp_Password: payload.authToken,
      pp_BankID: "",
      pp_ProductID: "",
      pp_TxnRefNo: transactionId,
      pp_Amount: (payload.amount * 100).toString(),
      pp_TxnCurrency: "PKR",
      pp_TxnDateTime: new Date().toISOString().replace(/[-T:]/g, "").split(".")[0],
      pp_BillReference: payload.bookingId,
      pp_Description: payload.description,
      pp_CustomerID: payload.userId,
      pp_CustomerEmail: payload.email,
      pp_ReturnURL: `${payload.returnUrl}?transactionId=${transactionId}&paymentId=${paymentId}`,
      pp_CancelURL: payload.cancelUrl,
      pp_NotificationURL: payload.notifyUrl,
      pp_BillingAddress: "",
      pp_BillingCity: "",
      pp_BillingState: "",
      pp_BillingZipCode: "",
      pp_BillingCountry: "",
    };

    const redirectUrl = `https://sandbox.jazzcash.com.pk/ApplicationAPI/API/Payment/DoTransaction?${Object.entries(
      paymentParams
    )
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&")}`;

    return new Response(
      JSON.stringify({
        redirectUrl,
        paymentId,
        transactionId,
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
