# DEVA Formal App Readiness

## Added in this build
- Customer accounts API with JWT mobile sessions
- Cross-device Favorites sync
- Cross-device Cart sync
- Customer order history endpoint
- Account deletion endpoint
- Push-token registration foundation for iOS/Android
- Orders can be linked to authenticated customer accounts
- Public Privacy, Terms and Account Deletion pages
- Expo/React Native mobile app starter connected to DEVA Online

## Requires external credentials before production
- Apple Developer account
- Google Play Console account
- Firebase/APNs push credentials
- FIB production credentials and verified callback
- Final legal/privacy text and official contact details
- Final app icon, splash screen and store screenshots

## Scaling recommendation
SQLite + Render persistent disk is acceptable for pilot/testing. Before a high-traffic public launch, migrate customer/order/rewards data to managed PostgreSQL and product media to durable object storage/CDN.
