import fs from 'node:fs';

const baseUrl=String(process.env.SUPABASE_URL||'').replace(/\/+$/,'');
const secretKey=String(process.env.SUPABASE_SECRET_KEY||'').trim();
const mediaBucket=String(process.env.SUPABASE_MEDIA_BUCKET||'DEVA-media').trim();
const privateBucket=String(process.env.SUPABASE_PRIVATE_BUCKET||'deva-private').trim();
const databaseObject=String(process.env.SUPABASE_DATABASE_OBJECT||'deva.sqlite').trim();

export const remoteStorageEnabled=Boolean(baseUrl&&secretKey&&mediaBucket&&privateBucket);

const encodeObjectPath=value=>String(value).split('/').filter(Boolean).map(encodeURIComponent).join('/');
const objectUrl=(bucket,object,publicObject=false)=>`${baseUrl}/storage/v1/object/${publicObject?'public/':''}${encodeURIComponent(bucket)}/${encodeObjectPath(object)}`;
const apiHeaders=extra=>({apikey:secretKey,...extra});

async function errorMessage(response){
  try{return (await response.text()).slice(0,500)}catch{return `${response.status} ${response.statusText}`}
}

async function uploadObject(bucket,object,body,contentType){
  if(!remoteStorageEnabled)throw new Error('Supabase Storage is not configured');
  const response=await fetch(objectUrl(bucket,object),{
    method:'POST',
    headers:apiHeaders({'Content-Type':contentType||'application/octet-stream','x-upsert':'true'}),
    body
  });
  if(!response.ok)throw new Error(`Supabase upload failed (${response.status}): ${await errorMessage(response)}`);
}

export async function restoreDatabaseSnapshot(dbPath){
  if(!remoteStorageEnabled)return false;
  const candidates=[databaseObject];
  if(databaseObject==='deva.sqlite')candidates.push('DEVA.sqlite');
  let response;
  let restoredObject=databaseObject;
  for(const candidate of candidates){
    response=await fetch(objectUrl(privateBucket,candidate),{headers:apiHeaders()});
    if(response.ok){restoredObject=candidate;break}
    if(response.status!==400&&response.status!==404)break;
  }
  if(response.status===400||response.status===404){
    console.log('[supabase] No remote database snapshot yet');
    return false;
  }
  if(!response.ok)throw new Error(`Supabase database restore failed (${response.status}): ${await errorMessage(response)}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length<100||bytes.subarray(0,16).toString('utf8')!=='SQLite format 3\u0000')throw new Error('Remote database snapshot is not a valid SQLite database');
  const temp=`${dbPath}.restore-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temp,bytes,{mode:0o600});
  fs.renameSync(temp,dbPath);
  console.log(`[supabase] Restored ${restoredObject} (${bytes.length} bytes)`);
  return true;
}

export async function uploadDatabaseSnapshot(filePath){
  if(!remoteStorageEnabled)return false;
  await uploadObject(privateBucket,databaseObject,fs.readFileSync(filePath),'application/vnd.sqlite3');
  console.log('[supabase] Database snapshot saved');
  return true;
}

export async function uploadMediaObject(object,buffer,mimetype){
  await uploadObject(mediaBucket,object,buffer,mimetype);
  return objectUrl(mediaBucket,object,true);
}
