const EXPO_PUSH_URL='https://exp.host/--/api/v2/push/send';

export async function sendExpoPush(tokens,{title,body,data={}}){
  const valid=[...new Set((tokens||[]).filter(t=>typeof t==='string' && (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['))))];
  if(!valid.length)return {sent:0,receipts:[]};
  const messages=valid.map(to=>({to,title,body,data,sound:'default',channelId:'deva-updates'}));
  const receipts=[];
  for(let i=0;i<messages.length;i+=100){
    const chunk=messages.slice(i,i+100);
    const r=await fetch(EXPO_PUSH_URL,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify(chunk)});
    if(!r.ok)throw new Error(`Push service failed (${r.status})`);
    receipts.push(await r.json());
  }
  return {sent:valid.length,receipts};
}
