# DEVA Production Readiness

This package is prepared as a safer production candidate, not a claim that external services are already activated.

## Completed in this package
- Expo SDK 54 mobile configuration.
- Native mobile header and bottom navigation around the official store experience.
- Mobile app points to the same official Render origin as the backend/site, avoiding the old Pages deployment mismatch.
- EAS development, preview and production profiles retained; fake App Store submission IDs removed.
- Admin order status mutation now requires authenticated admin + CSRF + permission.
- Production environment template refuses to ship with the FIB stage URL by default.
- Existing privacy, terms, delete-account, admin, products, rewards, sponsors, customer account and push-token backend are retained.

## Must be supplied before real launch
- Real production domain (recommended) and DNS/TLS. Replace Render URL in mobile app and environment when ready.
- Strong unique JWT_SECRET, FIB_CALLBACK_SECRET, ANALYTICS_SALT and REWARDS_QR_TOKEN.
- Real FIB production client ID, client secret and live base URL.
- Real admin email/password, then enable 2FA.
- Apple Developer membership + App Store Connect app record for iOS distribution.
- Google Play developer account/service account for automated Android submission.
- APNs/FCM credentials for production push notifications.
- Final privacy/terms/company contact details reviewed by the business.
- Production database/storage strategy and backups verified under real traffic.

## Release gate
Do not submit to stores until checkout, login, account deletion, rewards, push notifications, external links, offline/error states and all four languages are tested on physical iPhone and Android devices.
