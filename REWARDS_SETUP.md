# DEVA Rewards Club V7

## What was added
- One-time showroom QR activation for each customer phone number.
- Permanent Rewards membership after the first activation.
- Rewards remain locked until the active member count reaches 1,000 (editable in Dashboard).
- Automatic Friday draw at 21:00 Asia/Baghdad after the threshold is reached.
- Previous winners stay eligible and can win again in future weeks.
- Weekly prizes: 10%, 15%, 20%, 25% discount and $50/$100/$150/$200/$300 DEVA Credit.
- DEVA Credit has configurable minimum purchase amounts and expiry days.
- Super Prize every 90 days after the 1,000-member milestone: TV Unit or 3-Piece Coffee Table Set.
- Mystery Gift Box reveal for winners.
- Hall of Winners with masked public identity.
- Admin dashboard: member count, target/progress, QR image, prize weights, active/inactive prizes, manual draw, winner history, redeem status.
- Draw proof hash and Audit Log integration.

## Required environment configuration
Set a long random showroom QR secret in `.env`:

`REWARDS_QR_TOKEN=<at least 32 random characters>`

Also set the real production site URL:

`PUBLIC_BASE_URL=https://your-real-domain.example`

The QR displayed inside Admin Dashboard encodes the production activation URL.

## Install / run
Run `npm install` after deploying because V7 adds the `qrcode` package, then start the secure server normally.

## Important showroom note
The QR is intended to be shown inside the DEVA showroom. A static QR can be photographed/shared, so for strict physical-presence enforcement DEVA should keep it staff-supervised or add a rotating code/location validation in a later version.


## QR registration flow (V7.2)
1. Admin > DEVA Rewards shows the showroom QR.
2. Customer scans it with the phone camera.
3. If no customer profile exists, the customer registration/account form opens automatically.
4. After saving name + phone, Rewards activation happens automatically with the scanned QR token.
5. Customer is taken directly to the DEVA Rewards section and stays in weekly draws.
6. Set `PUBLIC_BASE_URL` to the real HTTPS website URL and `REWARDS_QR_TOKEN` to a long random secret (24+ chars) before printing the QR.
