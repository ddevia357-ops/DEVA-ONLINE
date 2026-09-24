DEVA D34 compatibility fix
- Removes Admin dependency on /api/admin/product-tombstones to prevent 404 request spam.
- Removes public dependency on /api/product-tombstones.
- Keeps D33 old-price single-source logic and all product/price routes unchanged.
- Existing DELETE /api/admin/products/:id remains the delete action.
- Adds inline favicon to avoid favicon.ico 404.
- No design, image, category, product identity, or pricing UI changes.
