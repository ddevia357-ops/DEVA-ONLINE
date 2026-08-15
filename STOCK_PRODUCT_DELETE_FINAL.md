# DEVA Product Stock/Delete Final Fix

This build makes SQLite the single source of truth for products once the API is online.

- The 155 original products from `data.js` are migrated into SQLite **one time only**.
- A migration marker (`app_meta.catalog_seed_v1`) prevents deleted products from being re-created after a restart/redeploy.
- `data.js` remains only as an offline fallback when the API cannot be reached.
- When `/api/products` is reachable, the website/app uses only products returned from SQLite — even when the result is empty.
- DEVA Admin can edit, deactivate/reactivate, or permanently delete both original and newly-added products.
- Permanent delete uses `DELETE /api/admin/products/:id` and cascades related cart/favorite references.
- Original products are labeled `سەرەتایی` in Admin; products created later are labeled `Admin`.
- Original catalog items are seeded with stock quantity 1 so they do not appear as sold-out immediately. Adjust stock from Admin as needed.

Recommended stock workflow:
1. While available: Active + stock quantity > 0.
2. Temporarily unavailable: set stock to 0 or deactivate.
3. Permanently discontinued: press `🗑 سڕینەوە`; it will not come back after restart/redeploy.
