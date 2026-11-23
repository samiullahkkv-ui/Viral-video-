# Sami Social AI

YouTube-first creator dashboard built with Next.js, Supabase Auth/Postgres, Google OAuth and YouTube Data API.

## Current features
- Passwordless email sign-in with Supabase Auth.
- Secure Google OAuth flow for a YouTube channel.
- AES-256-GCM encrypted refresh-token storage.
- Upload a video with title, description, tags and visibility.
- Upload history saved per authenticated user.
- Row Level Security on all user data.

## Required environment variables
Copy `.env.example` to `.env.local`.
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (production: `https://YOUR_DOMAIN/api/youtube/callback`)
- `TOKEN_ENCRYPTION_KEY` (64 hex characters / 32 random bytes)

## Google setup
Enable YouTube Data API v3 in Google Cloud. Configure OAuth consent screen and add the account as a test user while the app is in testing. Create a Web application OAuth client. Add the exact redirect URI above. Never commit OAuth secrets.

## Run locally
```bash
npm install
npm run dev
```

## Notes
- YouTube uploads use the official YouTube Data API and the user's explicit OAuth authorization.
- The first release limits uploads to 64 MB to stay within serverless request/runtime constraints.
- Trend research and AI script generation are the next module; no fake trend data is shown.
