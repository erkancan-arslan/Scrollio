# Scrollio Backend — Railway / Railway-compatible Deployment

## One-command deploy to Railway

1. Go to https://railway.app and sign in with GitHub
2. Click **New Project → Deploy from GitHub repo → scrollio/backend** (or upload a zip)
3. Set environment variables (see below)
4. Railway auto-detects Node.js and runs `npm run start:prod`
5. Click **Generate Domain** — you get a public HTTPS URL instantly

## Environment Variables to set in Railway

Copy these from your local `.env` into Railway's variable editor:

```
NODE_ENV=production
PORT=3000

SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

FAL_KEY=...

BUNNY_CDN_URL=...
BUNNY_STORAGE_API_KEY=...
BUNNY_STORAGE_ZONE_NAME=...
BUNNY_CDN_DOMAIN=...
BUNNY_STORAGE_REGION=

CORS_ORIGINS=https://your-app.com
```

## After deploying

Update `EXPO_PUBLIC_API_PROD_URL` in the mobile app `.env` with your Railway URL.
