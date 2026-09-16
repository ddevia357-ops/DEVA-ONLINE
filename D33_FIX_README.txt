DEVA D33 — OLD PRICE SINGLE-SOURCE FIX

Root fix:
- Added product_price_overrides table so Admin-entered price and old price are stored independently from catalog reseed/identity repair.
- Public /api/products always returns effective price_usd + old_price_usd from that override layer.
- Quick price save, full product save, and upload save all write both values to the override layer.
- Frontend explicitly maps API old_price_usd to oldPrice and keeps the existing discount display logic.
- Existing design, images, categories, names, product codes, and layout are unchanged.

Expected test: old price 2380 + current price 1699 => website shows 2,380$ crossed out, 1,699$ current, and discount percentage.
