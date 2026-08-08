import Database from 'better-sqlite3';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const defaultDataDir = fileURLToPath(new URL('../data/', import.meta.url));
const dataDir = process.env.DATA_DIR ? fileURLToPath(new URL('file://' + (process.env.DATA_DIR.endsWith('/') ? process.env.DATA_DIR : process.env.DATA_DIR + '/'))) : defaultDataDir;
const dbPath = process.env.DB_PATH || new URL('deva.sqlite', 'file://' + (dataDir.endsWith('/') ? dataDir : dataDir + '/')).pathname;
fs.mkdirSync(dataDir, { recursive: true });
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');db.pragma('foreign_keys = ON');db.pragma('busy_timeout = 5000');db.pragma('synchronous = FULL');
db.exec(`
CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'ADMIN',active INTEGER NOT NULL DEFAULT 1,token_version INTEGER NOT NULL DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,failed_attempts INTEGER NOT NULL DEFAULT 0,lock_until INTEGER,last_login_at TEXT);
CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY,name TEXT NOT NULL,category TEXT NOT NULL,price_usd REAL DEFAULT 0,image TEXT,active INTEGER DEFAULT 1,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,customer_name TEXT NOT NULL,phone TEXT NOT NULL,email TEXT,total_usd REAL NOT NULL,total_iqd INTEGER NOT NULL,status TEXT DEFAULT 'PENDING',items_json TEXT NOT NULL,payment_method TEXT DEFAULT 'FIB',payment_id TEXT,payment_status TEXT DEFAULT 'UNPAID',created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,admin_id INTEGER,actor TEXT,action TEXT NOT NULL,target TEXT,details TEXT,ip TEXT,user_agent TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE SET NULL);
CREATE TABLE IF NOT EXISTS revoked_tokens(jti TEXT PRIMARY KEY,expires_at INTEGER NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS security_alerts(id INTEGER PRIMARY KEY AUTOINCREMENT,severity TEXT NOT NULL DEFAULT 'INFO',type TEXT NOT NULL,message TEXT NOT NULL,ip TEXT,admin_id INTEGER,read_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS backups(id INTEGER PRIMARY KEY AUTOINCREMENT,file_name TEXT NOT NULL,created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS role_permissions(role TEXT NOT NULL,permission TEXT NOT NULL,PRIMARY KEY(role,permission));
CREATE TABLE IF NOT EXISTS monthly_gifts(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',gift_name TEXT NOT NULL,image TEXT,terms TEXT NOT NULL DEFAULT '',start_at TEXT NOT NULL,end_at TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'DRAFT',winner_entry_id INTEGER,created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(created_by) REFERENCES admins(id) ON DELETE SET NULL);
CREATE TABLE IF NOT EXISTS monthly_gift_entries(id INTEGER PRIMARY KEY AUTOINCREMENT,gift_id INTEGER NOT NULL,customer_name TEXT NOT NULL,phone TEXT NOT NULL,email TEXT,city TEXT,consent INTEGER NOT NULL DEFAULT 1,ip TEXT,user_agent TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(gift_id) REFERENCES monthly_gifts(id) ON DELETE CASCADE,UNIQUE(gift_id,phone));
CREATE TABLE IF NOT EXISTS visitor_events(id INTEGER PRIMARY KEY AUTOINCREMENT,session_id TEXT NOT NULL,event_type TEXT NOT NULL,path TEXT NOT NULL DEFAULT '/',referrer TEXT,product_id TEXT,ip_hash TEXT,user_agent TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS welcome_discount_claims(phone TEXT PRIMARY KEY,order_id TEXT UNIQUE NOT NULL,status TEXT NOT NULL DEFAULT 'RESERVED',created_at TEXT DEFAULT CURRENT_TIMESTAMP,redeemed_at TEXT);
CREATE TABLE IF NOT EXISTS rewards_settings(id INTEGER PRIMARY KEY CHECK(id=1),target_members INTEGER NOT NULL DEFAULT 1000,enabled INTEGER NOT NULL DEFAULT 1,friday_hour INTEGER NOT NULL DEFAULT 21,timezone TEXT NOT NULL DEFAULT 'Asia/Baghdad',credit_expiry_days INTEGER NOT NULL DEFAULT 30,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS rewards_members(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_name TEXT NOT NULL,phone TEXT NOT NULL UNIQUE,email TEXT,active INTEGER NOT NULL DEFAULT 1,consent INTEGER NOT NULL DEFAULT 1,joined_at TEXT DEFAULT CURRENT_TIMESTAMP,last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,wins_count INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS rewards_prizes(id INTEGER PRIMARY KEY AUTOINCREMENT,label TEXT NOT NULL,type TEXT NOT NULL CHECK(type IN ('DISCOUNT','CREDIT','PRODUCT')),value REAL NOT NULL DEFAULT 0,min_purchase_usd REAL NOT NULL DEFAULT 0,weight INTEGER NOT NULL DEFAULT 1,active INTEGER NOT NULL DEFAULT 1,is_grand INTEGER NOT NULL DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS rewards_draws(id INTEGER PRIMARY KEY AUTOINCREMENT,draw_key TEXT NOT NULL,member_id INTEGER NOT NULL,prize_id INTEGER NOT NULL,is_grand INTEGER NOT NULL DEFAULT 0,participant_count INTEGER NOT NULL DEFAULT 0,redeem_code TEXT NOT NULL UNIQUE,redeem_status TEXT NOT NULL DEFAULT 'AVAILABLE',expires_at TEXT,proof_hash TEXT NOT NULL,drawn_at TEXT DEFAULT CURRENT_TIMESTAMP,redeemed_at TEXT,FOREIGN KEY(member_id) REFERENCES rewards_members(id),FOREIGN KEY(prize_id) REFERENCES rewards_prizes(id),UNIQUE(draw_key,is_grand));
CREATE TABLE IF NOT EXISTS sponsor_ads(id INTEGER PRIMARY KEY AUTOINCREMENT,company_name TEXT NOT NULL,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',image TEXT,cta_label TEXT NOT NULL DEFAULT 'زیاتر ببینە',cta_url TEXT,whatsapp TEXT,placement TEXT NOT NULL DEFAULT 'HOME' CHECK(placement IN ('HOME','PRODUCTS','PARTNERS')),start_at TEXT NOT NULL,end_at TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,views INTEGER NOT NULL DEFAULT 0,clicks INTEGER NOT NULL DEFAULT 0,created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(created_by) REFERENCES admins(id) ON DELETE SET NULL);
CREATE INDEX IF NOT EXISTS idx_sponsor_ads_active_dates ON sponsor_ads(active,start_at,end_at,placement);
CREATE INDEX IF NOT EXISTS idx_rewards_members_active ON rewards_members(active,joined_at);
CREATE INDEX IF NOT EXISTS idx_rewards_draws_date ON rewards_draws(drawn_at);
CREATE INDEX IF NOT EXISTS idx_rewards_draws_member ON rewards_draws(member_id,drawn_at);

CREATE INDEX IF NOT EXISTS idx_visitor_events_created ON visitor_events(created_at);
CREATE INDEX IF NOT EXISTS idx_visitor_events_session ON visitor_events(session_id,created_at);
CREATE INDEX IF NOT EXISTS idx_visitor_events_type ON visitor_events(event_type,created_at);
CREATE INDEX IF NOT EXISTS idx_welcome_claims_status ON welcome_discount_claims(status,created_at);
CREATE INDEX IF NOT EXISTS idx_monthly_gifts_status_dates ON monthly_gifts(status,start_at,end_at);
CREATE INDEX IF NOT EXISTS idx_monthly_entries_gift ON monthly_gift_entries(gift_id,created_at);

INSERT OR IGNORE INTO rewards_settings(id) VALUES(1);
`);
const cols=db.prepare('PRAGMA table_info(admins)').all().map(x=>x.name);
for(const [name,sql] of [
 ['role',"ALTER TABLE admins ADD COLUMN role TEXT NOT NULL DEFAULT 'ADMIN'"],
 ['active',"ALTER TABLE admins ADD COLUMN active INTEGER NOT NULL DEFAULT 1"],
 ['token_version',"ALTER TABLE admins ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0"],
 ['updated_at',"ALTER TABLE admins ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP"],
 ['failed_attempts',"ALTER TABLE admins ADD COLUMN failed_attempts INTEGER NOT NULL DEFAULT 0"],
 ['lock_until',"ALTER TABLE admins ADD COLUMN lock_until INTEGER"],
 ['last_login_at',"ALTER TABLE admins ADD COLUMN last_login_at TEXT"],
 ['totp_secret',"ALTER TABLE admins ADD COLUMN totp_secret TEXT"],
 ['totp_enabled',"ALTER TABLE admins ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0"]
]) if(!cols.includes(name)) db.exec(sql);
const backupCols=db.prepare('PRAGMA table_info(backups)').all().map(x=>x.name);
if(!backupCols.includes('kind')) db.exec("ALTER TABLE backups ADD COLUMN kind TEXT NOT NULL DEFAULT 'MANUAL'");
const auditCols=db.prepare('PRAGMA table_info(audit_logs)').all().map(x=>x.name);
for(const [name,sql] of [
 ['admin_id','ALTER TABLE audit_logs ADD COLUMN admin_id INTEGER'],['target','ALTER TABLE audit_logs ADD COLUMN target TEXT'],['details','ALTER TABLE audit_logs ADD COLUMN details TEXT'],['user_agent','ALTER TABLE audit_logs ADD COLUMN user_agent TEXT']
]) if(!auditCols.includes(name)) db.exec(sql);

const orderCols=db.prepare('PRAGMA table_info(orders)').all().map(x=>x.name);
for(const [name,sql] of [
 ['subtotal_usd','ALTER TABLE orders ADD COLUMN subtotal_usd REAL'],
 ['discount_usd','ALTER TABLE orders ADD COLUMN discount_usd REAL NOT NULL DEFAULT 0'],
 ['discount_code','ALTER TABLE orders ADD COLUMN discount_code TEXT']
]) if(!orderCols.includes(name)) db.exec(sql);


const rewardPrizeCount=db.prepare('SELECT count(*) n FROM rewards_prizes').get().n;
if(!rewardPrizeCount){
  const rp=db.prepare('INSERT INTO rewards_prizes(label,type,value,min_purchase_usd,weight,active,is_grand) VALUES(?,?,?,?,?,1,?)');
  [
    ['10% Discount','DISCOUNT',10,0,20,0],['15% Discount','DISCOUNT',15,0,16,0],['20% Discount','DISCOUNT',20,500,10,0],['25% Discount','DISCOUNT',25,1000,5,0],
    ['50$ DEVA Credit','CREDIT',50,300,20,0],['100$ DEVA Credit','CREDIT',100,500,14,0],['150$ DEVA Credit','CREDIT',150,750,8,0],['200$ DEVA Credit','CREDIT',200,1000,5,0],['300$ DEVA Credit','CREDIT',300,1500,2,0],
    ['TV Unit','PRODUCT',0,0,1,1],['3-Piece Coffee Table Set','PRODUCT',0,0,1,1]
  ].forEach(x=>rp.run(...x));
}
const defaultPerms={SUPER_ADMIN:['products.read','products.write','products.delete','orders.read','orders.write','admins.manage','audit.read','security.manage','backups.manage','gifts.manage','rewards.manage','ads.manage'],ADMIN:['products.read','products.write','products.delete','orders.read','orders.write','gifts.manage','rewards.manage','ads.manage'],STAFF:['products.read','orders.read','orders.write']};
const insPerm=db.prepare('INSERT OR IGNORE INTO role_permissions(role,permission) VALUES(?,?)');for(const [r,ps] of Object.entries(defaultPerms))for(const p of ps)insPerm.run(r,p);
