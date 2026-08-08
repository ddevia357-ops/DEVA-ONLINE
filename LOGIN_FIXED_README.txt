DEVA ADMIN - FIXED LOGIN

1) First time only: double-click RESET_DEVA_ADMIN.bat
2) Then double-click START_DEVA_LOCAL.bat
3) Open: http://localhost:3000/admin.html

Email: admin@devafurniture.com
Password: Deva@2026Admin!
2FA: OFF after reset

The reset preserves products/orders and resets only the matching admin account:
- password
- SUPER_ADMIN role
- active status
- failed-login lock
- old 2FA secret
- old sessions

After login, enable 2FA again from Settings if desired.
