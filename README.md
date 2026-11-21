# Sami X Manager

A mobile-friendly workspace for managing your own X profiles through the official X OAuth 2.0 flow.

## Starter features
- Supabase email/password workspace sign-in.
- Official X OAuth 2.0 authorization with PKCE.
- Multiple authorized X profiles per workspace user.
- Server-side encrypted OAuth tokens.
- Publish a post to a selected connected account.
- Browser-local drafts and schedule planning.
- Overview, account list, composer, schedule, drafts, analytics preview, inbox placeholder and settings.

The analytics chart is illustrative. Drafts and schedule plans are stored in the browser; automated scheduled publishing, media uploads, inbox and live analytics are not active yet.

## Deploy on Vercel
1. Import this repository into Vercel.
2. Add the environment variables below in Vercel Project Settings → Environment Variables.
3. Run the SQL in supabase/schema.sql in your Supabase SQL Editor.
4. In Supabase Auth, configure your site URL and allowed redirect URLs to your Vercel domain.
5. In the X Developer Portal, create an OAuth 2.0 app. Enable user authentication, set app permissions to Read and Write, and set the callback URL to https://YOUR-DOMAIN/api/oauth/callback.
6. Set the same callback URL as X_REDIRECT_URI in Vercel. Redeploy after adding environment variables.

## Required Vercel environment variables
- APP_URL — deployed site origin, e.g. https://your-project.vercel.app
- APP_SECRET — long random secret used to sign the short-lived OAuth state cookie.
- TOKEN_ENCRYPTION_KEY — exactly 64 hexadecimal characters (32 bytes) for AES-256-GCM token encryption.
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY — server-side only; never expose this value in frontend code.
- X_CLIENT_ID
- X_CLIENT_SECRET — set if your X OAuth app is a confidential client; otherwise leave unset.
- X_REDIRECT_URI — exact callback URL registered in the X Developer Portal.

Never commit API keys, passwords, OAuth secrets or access tokens to GitHub. Do not send them in chat.

## Security notes
- X passwords are never requested or stored.
- OAuth tokens are encrypted before database storage and only used by server endpoints.
- Supabase service-role key and X client secret must remain in Vercel server environment variables.
- Use official X API access and follow X developer policies and rate limits.
- Token refresh and disconnect/revocation controls are not included in this starter version. Reconnect an account if its access token expires.
