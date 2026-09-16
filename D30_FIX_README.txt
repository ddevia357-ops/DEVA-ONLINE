DEVA D30 COMPATIBILITY FIX

1. Removed frontend dependency on /api/admin/product-tombstones and /api/product-tombstones (these were returning 404 on production).
2. Quick price save now uses the already-supported /api/admin/products/upload endpoint and sends the complete existing product record, including old_price_usd. This preserves the same ID/name/category/image/code and verifies both prices after save.
3. Delete now uses the already-supported active=false route. The product disappears from the public API and Admin list without triggering built-in catalog self-heal/recreation.
4. No design, gallery, menu, category, or image changes.
