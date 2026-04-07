# Mentoga Deployment

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## Run Production Server Locally

```bash
npm run start
```

This serves the Vite `dist` output through a small Node server with SPA fallback.

## Required Environment Variables

Create `.env` with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Migration

Apply the latest database policies before production:

```bash
supabase db push
```

If your CLI is not linked yet:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## Hostinger Node App Deploy

1. Upload the project files to Hostinger.
2. In Hostinger Node app settings, use startup file `server.js`.
3. Set environment variables in the Hostinger panel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `PORT` if Hostinger provides one
4. Install dependencies:

```bash
npm install
```

5. Build the app:

```bash
npm run build
```

6. Start the server:

```bash
npm run start
```

## Notes

- The app is a frontend SPA backed by Supabase.
- The Node server only serves the built frontend and supports SPA routes like `/c/:slug`.
- Direct chat billing requires the included Supabase migration to be applied.

## Stripe Setup

Use Supabase Edge Functions for Stripe secrets and webhook handling.

1. Save non-secret Stripe settings from the admin panel:
   - Enable Stripe
   - Set test/live mode
   - Save the Stripe publishable key
   - Copy the webhook endpoint

2. Set secret values in Supabase, not in the frontend:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx STRIPE_WEBHOOK_SECRET=whsec_xxx
```

3. Deploy Stripe functions:

```bash
supabase functions deploy stripe-create-payment
supabase functions deploy stripe-webhook
```

4. In Stripe dashboard, create a webhook using the admin panel webhook URL and subscribe to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`

5. Apply database migrations:

```bash
supabase db push
```

Recommended architecture:
- `Publishable key`: store in admin-managed Supabase table
- `Secret key`: Supabase Edge Function secret
- `Webhook secret`: Supabase Edge Function secret
- `Webhook confirmation`: handled by `stripe-webhook` and reflected in admin settings

## Additional Gateways

The admin panel now supports configuration rows for:
- `Easypaisa`
- `JazzCash`
- `PayFast`

Recommended architecture for all three:
- Save only non-secret identifiers in `payment_provider_settings`
- Store merchant passwords, salts, passphrases, and hash keys in Supabase secrets
- Build signed redirect or server-to-server requests in Edge Functions
- Use provider-specific webhook functions for payment confirmation

Scaffolded functions are included for:

```bash
supabase functions deploy easypaisa-create-payment
supabase functions deploy easypaisa-webhook
supabase functions deploy jazzcash-create-payment
supabase functions deploy jazzcash-webhook
supabase functions deploy payfast-create-payment
supabase functions deploy payfast-webhook
```

Note:
- Stripe is wired end-to-end.
- Easypaisa, JazzCash, and PayFast admin/config scaffolds are ready, but their final signed checkout payloads still depend on your merchant account formats and secrets.
