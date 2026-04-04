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
