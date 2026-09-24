# DEVA Rewards Weekly Live
- New rewards_entries table with one entry per member per weekly draw key.
- POST /api/rewards/scan validates official showroom QR and records weekly entry.
- Friday draw selects only customers who scanned for that week's draw.
- Admin Rewards shows weekly entry count, draw key, and recent QR scans.
- Existing prizes, winners, redemption, QR print, target, Friday hour and live room remain available.
