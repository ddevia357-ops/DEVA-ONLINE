DEVA D27 — Price + Categories stability fix

1) Price save now uses /api/admin/products/:id/price and guarantees the built-in row exists before update.
2) Price-only updates never change product name, category, image, code, gallery, or active state.
3) Compatibility PATCH /api/admin/products/:id supports older admin builds.
4) One-time recovery restores all 155 built-in products/categories active after earlier broken patches.
5) Public storefront merges API price data ON TOP OF the full 155-product built-in catalog instead of replacing the catalog with a partial DB response.
6) Admin request storm protection from D26 is retained.
7) Build marker: D27.
