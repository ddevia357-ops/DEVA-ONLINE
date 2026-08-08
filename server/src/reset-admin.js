import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { passwordIsStrong } from './security.js';

const email=(process.env.ADMIN_EMAIL||'admin@devafurniture.com').trim().toLowerCase();
const password=process.env.ADMIN_PASSWORD||'';
if(!passwordIsStrong(password)) throw new Error('ADMIN_PASSWORD must be 14+ chars with uppercase, lowercase, number and symbol');
const hash=bcrypt.hashSync(password,14);
const row=db.prepare('SELECT id FROM admins WHERE email=?').get(email);
if(row){
  db.prepare("UPDATE admins SET password_hash=?,role='SUPER_ADMIN',active=1,failed_attempts=0,lock_until=NULL,totp_secret=NULL,totp_enabled=0,token_version=token_version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(hash,row.id);
}else{
  db.prepare("INSERT INTO admins(email,password_hash,role,active,failed_attempts,lock_until,totp_secret,totp_enabled) VALUES(?,?,'SUPER_ADMIN',1,0,NULL,NULL,0)").run(email,hash);
}
console.log('DEVA Admin reset successfully');
console.log('Email: '+email);
console.log('2FA: OFF (you can enable it again after login)');
