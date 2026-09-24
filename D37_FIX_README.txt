DEVA D37 ADMIN ACTION FIX
- Fixed Activate/Disable button UI refresh (previous 5-second load throttle could hide successful changes).
- Activate/Disable now resolves built-in products to their canonical database row before update.
- Admin product list now loads product tombstones so deleted built-in items cannot reappear from frontend fallback data.
- Delete remains persistent through product_tombstones.
- Quick Save Price remains backed by product_price_overrides and database verification.
- No product images/assets were removed.
