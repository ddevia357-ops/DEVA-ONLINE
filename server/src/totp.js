import crypto from 'node:crypto';
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32Encode(buf){let bits='',out='';for(const b of buf)bits+=b.toString(2).padStart(8,'0');for(let i=0;i<bits.length;i+=5)out+=alphabet[parseInt(bits.slice(i,i+5).padEnd(5,'0'),2)];return out;}
function base32Decode(s){s=s.replace(/=|\s/g,'').toUpperCase();let bits='';for(const c of s){const i=alphabet.indexOf(c);if(i<0)throw new Error('Invalid base32');bits+=i.toString(2).padStart(5,'0');}const a=[];for(let i=0;i+8<=bits.length;i+=8)a.push(parseInt(bits.slice(i,i+8),2));return Buffer.from(a);}
export function newTotpSecret(){return base32Encode(crypto.randomBytes(20));}
export function totp(secret,time=Date.now(),step=30,digits=6){const counter=Math.floor(time/1000/step);const b=Buffer.alloc(8);b.writeBigUInt64BE(BigInt(counter));const h=crypto.createHmac('sha1',base32Decode(secret)).update(b).digest();const o=h[h.length-1]&15;const n=(h.readUInt32BE(o)&0x7fffffff)%10**digits;return String(n).padStart(digits,'0');}
export function verifyTotp(secret,code,window=1){code=String(code||'').replace(/\s/g,'');if(!/^\d{6}$/.test(code))return false;for(let w=-window;w<=window;w++)if(totp(secret,Date.now()+w*30000)===code)return true;return false;}
export function otpauthUri(secret,email){return `otpauth://totp/${encodeURIComponent('DEVA Admin:'+email)}?secret=${secret}&issuer=${encodeURIComponent('DEVA Furniture')}&algorithm=SHA1&digits=6&period=30`;}
