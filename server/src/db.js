import Database from 'better-sqlite3';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const defaultDataDir = fileURLToPath(new URL('../data/', import.meta.url));
const dataDir = process.env.DATA_DIR ? fileURLToPath(new URL('file://' + (process.env.DATA_DIR.endsWith('/') ? process.env.DATA_DIR : process.env.DATA_DIR + '/'))) : defaultDataDir;
const dbPath = process.env.DB_PATH || new URL('deva.sqlite', 'file://' + (dataDir.endsWith('/') ? dataDir : dataDir + '/')).pathname;
fs.mkdirSync(dataDir, { recursive: true });
export const db = new Database(dbPath);
function ensureProductsLiveSchemaD48(){
  const cols=db.prepare("PRAGMA table_info(products)").all().map(x=>x.name);
  const migrations=[
    ['product_code',"ALTER TABLE products ADD COLUMN product_code TEXT"],
    ['images_json',"ALTER TABLE products ADD COLUMN images_json TEXT"],
    ['catalog_origin',"ALTER TABLE products ADD COLUMN catalog_origin TEXT DEFAULT 'ADMIN'"],
    ['stock_qty',"ALTER TABLE products ADD COLUMN stock_qty INTEGER NOT NULL DEFAULT 0"],
    ['low_stock_threshold',"ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 0"],
    ['updated_at',"ALTER TABLE products ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP"]
  ];
  for(const [name,sql] of migrations){
    if(!cols.includes(name)){
      db.exec(sql);
      console.log(`[D48] Added missing products.${name}`);
      cols.push(name);
    }
  }
  // backfill product_code deterministically for old rows without one
  const rows=db.prepare("SELECT id,product_code FROM products").all();
  const upd=db.prepare("UPDATE products SET product_code=? WHERE id=?");
  let seq=1;
  for(const row of rows){
    if(row.product_code==null || String(row.product_code).trim()===''){
      const raw=String(row.id||'').match(/\d+/);
      const code=raw?String(raw[0]).padStart(4,'0'):String(seq++).padStart(4,'0');
      upd.run(code,String(row.id));
    }
  }
  const finalCols=db.prepare("PRAGMA table_info(products)").all().map(x=>x.name);
  if(!finalCols.includes('product_code')) throw new Error('[D48] products.product_code migration failed');
  console.log('[D48] LIVE PRODUCT SCHEMA OK:',finalCols.join(','));
}

db.pragma('journal_mode = WAL');db.pragma('foreign_keys = ON');db.pragma('busy_timeout = 5000');db.pragma('synchronous = FULL');
db.exec(`
CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'ADMIN',active INTEGER NOT NULL DEFAULT 1,token_version INTEGER NOT NULL DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,failed_attempts INTEGER NOT NULL DEFAULT 0,lock_until INTEGER,last_login_at TEXT);
CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY,name TEXT NOT NULL,category TEXT NOT NULL,price_usd REAL DEFAULT 0,image TEXT,active INTEGER DEFAULT 1,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS app_meta(key TEXT PRIMARY KEY,value TEXT,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS product_tombstones(product_id TEXT PRIMARY KEY,deleted_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,customer_name TEXT NOT NULL,phone TEXT NOT NULL,email TEXT,total_usd REAL NOT NULL,total_iqd INTEGER NOT NULL,status TEXT DEFAULT 'PENDING',items_json TEXT NOT NULL,payment_method TEXT DEFAULT 'FIB',payment_id TEXT,payment_status TEXT DEFAULT 'UNPAID',created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,admin_id INTEGER,actor TEXT,action TEXT NOT NULL,target TEXT,details TEXT,ip TEXT,user_agent TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE SET NULL);
CREATE TABLE IF NOT EXISTS revoked_tokens(jti TEXT PRIMARY KEY,expires_at INTEGER NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS admin_reset_events(token_hash TEXT PRIMARY KEY,applied_at TEXT DEFAULT CURRENT_TIMESTAMP);
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
CREATE TABLE IF NOT EXISTS customers(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,phone TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,token_version INTEGER NOT NULL DEFAULT 0,last_login_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS customer_favorites(customer_id INTEGER NOT NULL,product_id TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(customer_id,product_id),FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE,FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS customer_cart(customer_id INTEGER NOT NULL,product_id TEXT NOT NULL,qty INTEGER NOT NULL DEFAULT 1,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(customer_id,product_id),FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE,FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS customer_push_tokens(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER NOT NULL,platform TEXT NOT NULL CHECK(platform IN ('IOS','ANDROID')),token TEXT UNIQUE NOT NULL,active INTEGER NOT NULL DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE);
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

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customer_favorites_customer ON customer_favorites(customer_id,created_at);
CREATE INDEX IF NOT EXISTS idx_customer_cart_customer ON customer_cart(customer_id,updated_at);
CREATE INDEX IF NOT EXISTS idx_customer_push_tokens_customer ON customer_push_tokens(customer_id,active);

INSERT OR IGNORE INTO rewards_settings(id) VALUES(1);
`);
ensureProductsLiveSchemaD48();

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

const productCols=db.prepare('PRAGMA table_info(products)').all().map(x=>x.name);
for(const [name,sql] of [
 ['stock_qty','ALTER TABLE products ADD COLUMN stock_qty INTEGER NOT NULL DEFAULT 0'],
 ['low_stock_threshold','ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 2'],
 ['product_code','ALTER TABLE products ADD COLUMN product_code TEXT'],
 ['old_price_usd','ALTER TABLE products ADD COLUMN old_price_usd REAL'],
 ['images_json',"ALTER TABLE products ADD COLUMN images_json TEXT NOT NULL DEFAULT '[]'"],
 ['catalog_origin',"ALTER TABLE products ADD COLUMN catalog_origin TEXT NOT NULL DEFAULT 'ADMIN'"]
]) if(!productCols.includes(name)) db.exec(sql);

// One-time migration of the original catalog into SQLite.
// After this marker is written, deleted products stay deleted across restarts.
const catalogSeedKey='catalog_seed_v1';
if(!db.prepare('SELECT 1 FROM app_meta WHERE key=?').get(catalogSeedKey)){
  try{
    const publicRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../');
    const raw=fs.readFileSync(path.join(publicRoot,'data.js'),'utf8').trim();
    const prefix='window.DEVA_DATA=';
    const jsonText=raw.startsWith(prefix)?raw.slice(prefix.length).replace(/;\s*$/,''):'';
    const catalog=JSON.parse(jsonText);
    const insert=db.prepare(`INSERT OR IGNORE INTO products
      (id,name,category,price_usd,image,active,stock_qty,low_stock_threshold,product_code,old_price_usd,images_json,catalog_origin,updated_at)
      VALUES(?,?,?,?,?,1,1,2,?,?,?,?,CURRENT_TIMESTAMP)`);
    const tx=db.transaction((items)=>{
      for(const p of items){
        const money=v=>{const n=Number(String(v||'').replace(/[^0-9.]/g,''));return Number.isFinite(n)?n:0};
        insert.run(p.id,p.name,p.category,money(p.price),p.image||'',p.code||null,p.oldPrice?money(p.oldPrice):null,JSON.stringify(Array.isArray(p.images)?p.images:(p.image?[p.image]:[])),'BUILTIN');
      }
      db.prepare(`INSERT INTO app_meta(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP`).run(catalogSeedKey,String(items.length));
    });
    tx(Array.isArray(catalog.products)?catalog.products:[]);
  }catch(e){console.error('DEVA catalog seed failed:',e.message)}
}

// D14 recovery migration: older deployments could write catalog_seed_v1 while the
// products table was still empty. Import the current built-in catalog once more,
// without overwriting any product already edited in Admin. The v2 marker ensures
// this recovery runs only once, so later intentional deletes stay deleted.
const catalogRecoveryKey='catalog_seed_v2_recovery';
if(!db.prepare('SELECT 1 FROM app_meta WHERE key=?').get(catalogRecoveryKey)){
  try{
    const publicRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../');
    const raw=fs.readFileSync(path.join(publicRoot,'data.js'),'utf8').trim();
    const prefix='window.DEVA_DATA=';
    const jsonText=raw.startsWith(prefix)?raw.slice(prefix.length).replace(/;\s*$/,''):'';
    const catalog=JSON.parse(jsonText);
    const insert=db.prepare(`INSERT OR IGNORE INTO products
      (id,name,category,price_usd,image,active,stock_qty,low_stock_threshold,product_code,old_price_usd,images_json,catalog_origin,updated_at)
      VALUES(?,?,?,?,?,1,1,2,?,?,?,?,CURRENT_TIMESTAMP)`);
    const tx=db.transaction((items)=>{
      for(const p of items){
        const money=v=>{const n=Number(String(v||'').replace(/[^0-9.]/g,''));return Number.isFinite(n)?n:0};
        insert.run(p.id,p.name,p.category,money(p.price),p.image||'',p.code||null,p.oldPrice?money(p.oldPrice):null,JSON.stringify(Array.isArray(p.images)?p.images:(p.image?[p.image]:[])),'BUILTIN');
      }
      db.prepare(`INSERT INTO app_meta(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP`).run(catalogRecoveryKey,String(items.length));
    });
    tx(Array.isArray(catalog.products)?catalog.products:[]);
  }catch(e){console.error('DEVA catalog recovery failed:',e.message)}
}


// D15 robust catalog bootstrap: if the database is completely empty, restore the
// built-in storefront catalog. This intentionally runs only when count(*) is 0,
// so normal Admin edits and intentional single-product deletes are preserved.
export function readBuiltinCatalog(){
  const here=path.dirname(fileURLToPath(import.meta.url));
  const candidates=[
    path.resolve(here,'../../data.js'),
    path.resolve(process.cwd(),'data.js'),
    path.resolve(process.cwd(),'../data.js')
  ];
  let lastErr='data.js not found';
  for(const file of [...new Set(candidates)]){
    try{
      const raw=fs.readFileSync(file,'utf8').trim();
      const prefix='window.DEVA_DATA=';
      if(!raw.startsWith(prefix)) throw new Error('unexpected data.js format');
      const catalog=JSON.parse(raw.slice(prefix.length).replace(/;\s*$/,''));
      if(!Array.isArray(catalog.products)) throw new Error('products array missing');
      return {file,catalog};
    }catch(e){ lastErr=`${file}: ${e.message}`; }
  }
  throw new Error(lastErr);
}

export function syncBuiltinCatalog({onlyWhenEmpty=false}={}){
  const current=Number(db.prepare('SELECT count(*) n FROM products').get()?.n||0);
  if(onlyWhenEmpty && current>0) return {ok:true,skipped:true,current,inserted:0,total:current};
  let file='server/src/builtin-products.json';
  let catalog;
  try {
    const bundledPath=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'builtin-products.json');
    catalog={products:JSON.parse(fs.readFileSync(bundledPath,'utf8'))};
    file=bundledPath;
  } catch (bundledErr) {
    const fallback=readBuiltinCatalog();
    file=fallback.file; catalog=fallback.catalog;
  }
  const money=v=>{const n=Number(String(v||'').replace(/[^0-9.]/g,''));return Number.isFinite(n)?n:0};
  const insert=db.prepare(`INSERT OR IGNORE INTO products
    (id,name,category,price_usd,image,active,stock_qty,low_stock_threshold,product_code,old_price_usd,images_json,catalog_origin,updated_at)
    VALUES(?,?,?,?,?,1,1,2,?,?,?,?,CURRENT_TIMESTAMP)`);
  let inserted=0;
  const restoringEmpty=current===0;
  if(restoringEmpty){
    // D45 recovery: an empty DB must be able to rebuild the full bundled catalog.
    // Old tombstones from broken deployments must not keep all 155 products hidden.
    db.prepare('DELETE FROM product_tombstones').run();
  }
  const tx=db.transaction((items)=>{
    for(const p of items){
      if(!restoringEmpty){
        const deleted=db.prepare('SELECT 1 FROM product_tombstones WHERE product_id=?').get(String(p.id));
        if(deleted) continue;
      }
      const info=insert.run(p.id,p.name,p.category,money(p.price),p.image||'',p.code||null,p.oldPrice?money(p.oldPrice):null,JSON.stringify(Array.isArray(p.images)?p.images:(p.image?[p.image]:[])),'BUILTIN');
      inserted += Number(info.changes||0);
    }
  });
  tx(catalog.products);
  const total=Number(db.prepare('SELECT count(*) n FROM products').get()?.n||0);
  return {ok:true,file,inserted,total,catalogCount:catalog.products.length};
}

try{
  const r=syncBuiltinCatalog({onlyWhenEmpty:true});
  if(r.inserted) console.log(`[D15] Restored ${r.inserted} built-in products from ${r.file}`);
}catch(e){ console.error('[D15] Built-in catalog bootstrap failed:',e.message); }

// Give products without a code a stable public reference code after the built-in catalog.
{const base=155;const rows=db.prepare("SELECT rowid,id,product_code FROM products ORDER BY rowid").all();let next=base+1;for(const r of rows){if(r.product_code&&/^\d{4,}$/.test(String(r.product_code))){next=Math.max(next,Number(r.product_code)+1);continue;}db.prepare('UPDATE products SET product_code=? WHERE id=?').run(String(next++).padStart(4,'0'),r.id);}}

const orderCols=db.prepare('PRAGMA table_info(orders)').all().map(x=>x.name);
for(const [name,sql] of [
 ['subtotal_usd','ALTER TABLE orders ADD COLUMN subtotal_usd REAL'],
 ['discount_usd','ALTER TABLE orders ADD COLUMN discount_usd REAL NOT NULL DEFAULT 0'],
 ['discount_code','ALTER TABLE orders ADD COLUMN discount_code TEXT'],
 ['customer_id','ALTER TABLE orders ADD COLUMN customer_id INTEGER']
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
