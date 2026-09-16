DEVA ONLINE - ئامادەی Hosting

ئەم وەشانە بۆ Online Hosting ئامادە کراوە.
- Database: SQLite لە persistent volume ـدا
- Product images: /var/data/uploads/products
- Backups: /var/data/backups
- Health check: /health
- Admin + Website: هەمان Server

بۆ بڵاوکردنەوە لە Render/Railway:
1) پڕۆژەکە بخە GitHub.
2) Web Service دروست بکە.
3) Persistent Disk/Volume لە /var/data دابنێ.
4) Environment variables: PUBLIC_BASE_URL, ALLOWED_ORIGINS, ADMIN_EMAIL, ADMIN_PASSWORD.
5) JWT_SECRET/ANALYTICS_SALT/REWARDS_QR_TOKEN بە secret ـی درێژ دابنێ.
6) Deploy بکە.

گرنگ: .env ـی local مەخە سەر GitHub.
