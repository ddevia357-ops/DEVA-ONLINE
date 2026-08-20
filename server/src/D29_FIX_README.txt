DEVA D29 — OLD PRICE + PERMANENT DELETE FIX

1) Old price / discount
- Saving price now verifies both price_usd and old_price_usd in the database.
- Public showroom reads old_price_usd and displays the old price + calculated discount.
- Admin refuses to report success if old_price_usd was not persisted.

2) Permanent product deletion
- Built-in products now use persistent tombstones when deleted.
- Deleted built-in products are not re-seeded by self-heal/catalog repair.
- Admin fallback catalog excludes tombstoned products.
- Public data.js fallback also excludes tombstoned products.
- Deleting an uploaded product also removes its uploaded image when applicable.

3) Existing design/assets
- No design, image, menu, category layout, or customer-facing styling was changed.
