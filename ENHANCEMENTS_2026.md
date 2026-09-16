# DEVA enhancements added

This build keeps the existing security model and adds practical management features:

- Removed duplicate one-time admin reset execution block.
- Inventory stock quantity and low-stock threshold for products.
- Dashboard Low Stock and Sold Out counters.
- Security Center locked-admin counter.
- System Status endpoint/card (database health, uptime, Node version, stock summary, last backup, reset events).
- Secure backup download for admins with backups.manage permission.
- Existing automatic/manual backup, 2FA, audit log, roles, rewards and sponsor systems are preserved.

Deployment note: keep secrets only in Render Environment. Do not commit JWT_SECRET, ADMIN_PASSWORD, RESET_ADMIN_ONCE_TOKEN or payment secrets.
