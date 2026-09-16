import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import {db} from './db.js';

function bearer(req){
  const h=String(req.headers.authorization||'');
  return h.startsWith('Bearer ')?h.slice(7):null;
}

export function signCustomer(customer){
  return jwt.sign(
    {sub:customer.id,email:customer.email,phone:customer.phone,ver:customer.token_version,jti:crypto.randomUUID()},
    process.env.JWT_SECRET,
    {algorithm:'HS256',expiresIn:'30d',issuer:'deva-store',audience:'deva-customer'}
  );
}

export function requireCustomer(req,res,next){
  const token=bearer(req);
  if(!token)return res.status(401).json({error:'Unauthorized'});
  try{
    const p=jwt.verify(token,process.env.JWT_SECRET,{algorithms:['HS256'],issuer:'deva-store',audience:'deva-customer',clockTolerance:5});
    const c=db.prepare('SELECT id,name,email,phone,active,token_version,created_at,updated_at FROM customers WHERE id=?').get(p.sub);
    if(!c||!c.active||c.token_version!==p.ver)return res.status(401).json({error:'Unauthorized'});
    req.customer=c;next();
  }catch{return res.status(401).json({error:'Unauthorized'});}
}

export function optionalCustomer(req,_res,next){
  const token=bearer(req);
  if(!token)return next();
  try{
    const p=jwt.verify(token,process.env.JWT_SECRET,{algorithms:['HS256'],issuer:'deva-store',audience:'deva-customer',clockTolerance:5});
    const c=db.prepare('SELECT id,name,email,phone,active,token_version FROM customers WHERE id=?').get(p.sub);
    if(c&&c.active&&c.token_version===p.ver)req.customer=c;
  }catch{}
  next();
}
