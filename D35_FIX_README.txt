DEVA D35 FIX

Root cause fixed:
1. Product mutation routes were calling allowPermission() before requireAdmin(), so req.admin was undefined and Save Price / Active toggle / Delete could fail together.
2. All product mutation routes now use requireAdmin -> requireCsrf -> allowPermission -> action.
3. Old price remains stored in product_price_overrides and public /api/products returns it via COALESCE.
4. No design, product image, category or catalog UI changes.

Verified routes:
- PATCH /api/admin/products/:id/price
- PATCH /api/admin/products/:id/active
- DELETE /api/admin/products/:id
- POST /api/admin/products
- POST /api/admin/products/upload
