import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import {db} from './db.js';

const prod=process.env.NODE_ENV==='production';
const COOKIE='deva_admin_session';

export const authLimiter=rateLimit({
  windowMs:15*60*1000,limit:6,standardHeaders:true,legacyHeaders:false,
  skipSuccessfulRequests:true,message:{error:'Too many login attempts. Try again later.'}
});
export const apiLimiter=rateLimit({windowMs:60*1000,limit:120,standardHeaders:true,legacyHeaders:false,message:{error:'Too many requests'}});
export const sensitiveLimiter=rateLimit({windowMs:15*60*1000,limit:20,standardHeaders:true,legacyHeaders:false,message:{error:'Too many sensitive requests'}});

export function audit(req,action,target='',details={}){try{db.prepare('INSERT INTO audit_logs(admin_id,actor,action,target,details,ip,user_agent) VALUES(?,?,?,?,?,?,?)').run(req.admin?.sub||null,req.admin?.email||req.body?.email||'SYSTEM',action,target,JSON.stringify(details),req.ip,String(req.headers['user-agent']||'').slice(0,300));}catch(e){console.error('Audit error:',e.message)}}

function cookies(req){return Object.fromEntries(String(req.headers.cookie||'').split(';').map(v=>v.trim()).filter(Boolean).map(v=>{const i=v.indexOf('=');return i<0?[v,'']:[decodeURIComponent(v.slice(0,i)),decodeURIComponent(v.slice(i+1))]}));}
function tokenFrom(req){const c=cookies(req)[COOKIE];if(c)return c;if(process.env.ALLOW_BEARER_AUTH==='true'){const h=req.headers.authorization||'';return h.startsWith('Bearer ')?h.slice(7):null}return null;}

export function setSessionCookie(res,token){res.cookie(COOKIE,token,{httpOnly:true,secure:prod,sameSite:'strict',path:'/api/admin',maxAge:8*60*60*1000});}
export function clearSessionCookie(res){res.clearCookie(COOKIE,{httpOnly:true,secure:prod,sameSite:'strict',path:'/api/admin'});}

export function requireAdmin(req,res,next){const t=tokenFrom(req);if(!t)return res.status(401).json({error:'Unauthorized'});try{const p=jwt.verify(t,process.env.JWT_SECRET,{algorithms:['HS256'],issuer:'deva-store',audience:'deva-admin',clockTolerance:5});const revoked=db.prepare('SELECT 1 FROM revoked_tokens WHERE jti=? AND expires_at>?').get(p.jti,Math.floor(Date.now()/1000));if(revoked)return res.status(401).json({error:'Session revoked'});const a=db.prepare('SELECT id,email,role,active,token_version FROM admins WHERE id=?').get(p.sub);if(!a||!a.active||a.token_version!==p.ver)return res.status(401).json({error:'Unauthorized'});req.admin={sub:a.id,email:a.email,role:a.role,jti:p.jti,exp:p.exp,ver:p.ver,csrf:p.csrf};next()}catch{return res.status(401).json({error:'Unauthorized'})}}
export function requireCsrf(req,res,next){const supplied=String(req.headers['x-csrf-token']||'');const expected=String(req.admin?.csrf||'');if(!supplied||!expected||supplied.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(supplied),Buffer.from(expected)))return res.status(403).json({error:'Invalid CSRF token'});next();}
export const allowRoles=(...roles)=>(req,res,next)=>roles.includes(req.admin.role)?next():res.status(403).json({error:'Forbidden'});
export function signAdmin(admin){const csrf=crypto.randomBytes(32).toString('base64url');const token=jwt.sign({sub:admin.id,email:admin.email,role:admin.role,ver:admin.token_version,csrf,jti:crypto.randomUUID()},process.env.JWT_SECRET,{algorithm:'HS256',expiresIn:'8h',issuer:'deva-store',audience:'deva-admin'});return {token,csrf};}
export function revokeCurrentToken(req){if(req.admin?.jti&&req.admin?.exp)db.prepare('INSERT OR REPLACE INTO revoked_tokens(jti,expires_at) VALUES(?,?)').run(req.admin.jti,req.admin.exp)}
export function passwordIsStrong(v){return typeof v==='string'&&v.length>=14&&v.length<=128&&/[a-z]/.test(v)&&/[A-Z]/.test(v)&&/\d/.test(v)&&/[^A-Za-z0-9]/.test(v)}
export function pruneSecurityTables(){db.prepare('DELETE FROM revoked_tokens WHERE expires_at<=?').run(Math.floor(Date.now()/1000));db.prepare("DELETE FROM audit_logs WHERE created_at < datetime('now','-365 days')").run();}
export const allowPermission=(permission)=>(req,res,next)=>{const ok=db.prepare('SELECT 1 FROM role_permissions WHERE role=? AND permission=?').get(req.admin.role,permission);return ok?next():res.status(403).json({error:'Permission denied'});};
export function securityAlert(req,type,message,severity='WARNING',adminId=null){try{db.prepare('INSERT INTO security_alerts(severity,type,message,ip,admin_id) VALUES(?,?,?,?,?)').run(severity,type,message,req.ip,adminId||req.admin?.sub||null)}catch(e){console.error('Security alert error:',e.message)}}
