# PMO Network Auth & Email Environment Setup

Configure these environment variables in a local `.env` file (never commit secrets):

## Core NextAuth
- `NEXTAUTH_URL` = Full base URL (e.g. `http://localhost:3000` in dev, production domain in prod).
- `NEXTAUTH_SECRET` = Long random string (e.g. output of `openssl rand -hex 32`). Required for JWT encryption.

## Credentials Provider (already uses stored Prisma user records)
No extra env needed beyond DB.

## Google OAuth
- `GOOGLE_CLIENT_ID` = OAuth client ID from Google Cloud Console.
- `GOOGLE_CLIENT_SECRET` = Matching client secret.
Redirect URI must include: `http://localhost:3000/api/auth/callback/google`

## LinkedIn OAuth (placeholder provider)
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
Add authorized redirect: `http://localhost:3000/api/auth/callback/linkedin`
Note: Current implementation uses minimal profile mapping; production should request profile & name endpoints.

## Azure AD (Microsoft) OAuth
- `AZURE_AD_TENANT_ID` = Directory (tenant) ID.
- `AZURE_AD_CLIENT_ID` = App registration client ID.
- `AZURE_AD_CLIENT_SECRET` = Client secret.
Redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`

## SMTP Email (Verification / Password Reset)
- `SMTP_HOST`
- `SMTP_PORT` (465 for secure, 587 typical TLS)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (optional override; defaults to `SMTP_USER` if not set)

## Optional: Future Stripe Integration
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Prisma / Database
- `DATABASE_URL` (SQLite example: `file:./dev.db`; Postgres example: `postgresql://user:pass@host:5432/db?schema=public`)

## Example .env (development)
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DATABASE_URL=file:./dev.db

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret

SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=test
SMTP_PASS=test
SMTP_FROM="PMO Network <no-reply@pmonetwork.example>"
```

## Provisioning Flow Summary
1. Credentials signup -> user + profile created via `register` API.
2. First social OAuth login -> JWT callback auto-provisions a `User` (role defaults to `CANDIDATE`).
3. User can later enrich profile through registration completion UI (future enhancement).
4. Email verification currently handled for credential signup; for OAuth you may skip or add provider email verification step.

## Hardening Recommendations
- Replace placeholder LinkedIn/Azure providers with official configurations & proper scope mapping.
- Add Prisma Adapter (`@next-auth/prisma-adapter`) for account linking; prevents duplicate users across providers.
- Enforce email domain restrictions for employer social logins (e.g., corporate domains).
- Implement rate limiting on password reset and login attempts.
- Add reCAPTCHA or hCaptcha on password reset + registration forms.

## Next Steps (Optional)
- Create a post-login onboarding page if auto-provisioned via OAuth without profile data.
- Add role selection UI after first OAuth login.
- Store provider avatar / name when available.

