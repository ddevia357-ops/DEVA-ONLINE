# DEVA Build 48 — Rewards Security & Weekly Gift

## Included

- SMS OTP verification for new or unverified DEVA Rewards members.
- Strict validation for name, Iraqi mobile number, and email address.
- Weekly-gift Admin form with gift name, image, description, sponsor name, sponsor address, and sponsor phone.
- Create, edit, activate, deactivate, and delete actions for weekly gifts.
- Active weekly gift is published to the website and the mobile app through `/api/monthly-gift`.
- The old fixed-prize list was removed from the public Rewards display.
- Weekly-gift participation is app-only.

## Required Render environment variables

Set these before testing SMS verification:

```text
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
```

The SMS endpoints intentionally return a configuration error until all three values are set.

