# DEVA Security Setup

1. Copy `.env.example` to `.env`.
2. Generate two independent random secrets of at least 64 characters.
3. Set a unique admin password of at least 14 characters.
4. Keep `.env` outside Git and never put FIB credentials in browser JavaScript.
5. Use HTTPS only in production and set `PUBLIC_BASE_URL` to the HTTPS domain.
6. Restrict `ALLOWED_ORIGINS` to the exact production domain.
7. Obtain FIB sandbox credentials, test create/status/callback, then request production credentials.
8. Back up `server/data/deva.sqlite` daily. For multi-server deployment migrate to PostgreSQL.

Security included: Helmet/CSP, CORS allowlist, rate limits, bcrypt password hashing, short-lived signed admin JWT, input validation, server-side amount calculation, audit login records, callback secret, no card data storage, HTTP body limits, and protected admin routes.

## Security hardening added
- Admin JWT is stored only in an HttpOnly, SameSite=Strict cookie (Secure in production).
- CSRF token is bound to the signed session and required on every state-changing admin request.
- Five failed logins lock the account for 15 minutes; login endpoints are rate-limited.
- Passwords require 14+ characters with upper/lowercase, number, and symbol; bcrypt cost 14.
- JWT verification is pinned to HS256, issuer, audience and token version.
- Admin/API responses use no-store caching and request IDs.
- SQLite uses WAL, FULL synchronous mode, foreign keys and busy timeout.
- FIB callback secret must be sent in a header, not a URL query parameter.
- Revoked sessions and old audit logs are pruned automatically.

## Production checklist (required)
1. Use HTTPS only. Put the app behind Cloudflare or a hardened reverse proxy.
2. Set a random 64-byte JWT secret and a different callback secret.
3. Set ALLOWED_ORIGINS to the exact production origin only.
4. Set TRUST_PROXY=true only when one trusted reverse proxy is in front of Node.
5. Keep the SQLite database outside the public web root and back it up encrypted daily.
6. Run the Node process as a non-root user and keep dependencies patched.
7. Restrict the admin URL/IP at Cloudflare when practical.

## Professional Security V2
- TOTP two-factor authentication compatible with Google/Microsoft Authenticator.
- Security Center with failed-login statistics, alerts, and recent login activity.
- Logout All Devices through token-version invalidation.
- Fine-grained role permissions stored in `role_permissions`.
- Encrypted-session design using HttpOnly/Secure/SameSite cookies and CSRF binding.
- On-demand SQLite backups recorded in the dashboard.
- Internal alerts for brute-force, locked accounts, failed 2FA, and security changes.

### Important production checklist
1. Use HTTPS only and set `NODE_ENV=production`.
2. Put the application behind Cloudflare or a trusted reverse proxy.
3. Keep `.env`, database files, and backup files outside the public web root.
4. Enable 2FA for every Super Admin and Admin.
5. Test database restore regularly; a backup is not useful until restoration is verified.
6. Configure external email/Telegram delivery separately if immediate off-site alerts are required.

## Professional Dashboard V4
- Modern responsive sidebar and top navigation.
- Theme preference is stored locally; no sensitive data is stored with it.
- Live dashboard refresh runs every 30 seconds while an authenticated admin session is active.
- Notifications are derived from authenticated order data and never exposed publicly.
- Charts are rendered locally without third-party scripts or external analytics.


## First-install welcome discount (WELCOME20)
- The PWA unlocks a 20% gift after installation / first standalone launch.
- The browser UI marks it used after the first local order and does not stack it with coupon discounts.
- The backend enforces one claim per normalized customer phone through `welcome_discount_claims`, so reinstalling the app does not create another server-side entitlement for the same phone.
- FIB orders reserve the claim atomically; failed payment creation releases the reservation; successful FIB callback marks it redeemed.
- The final order stores subtotal, discount amount and discount code for audit/admin visibility.

## DEVA Rewards security (V7)
- Membership activation is unique by normalized customer phone number.
- The showroom QR secret is read from `REWARDS_QR_TOKEN`; do not commit the real production value.
- Weekly winners are selected with Node.js `crypto.randomInt`, not `Math.random`.
- Draws are unique per draw key/type and store a SHA-256 proof hash plus participant count.
- Reward management endpoints require authenticated admin permission `rewards.manage` and CSRF protection for writes.
- Public winner history masks customer names/phone numbers.
