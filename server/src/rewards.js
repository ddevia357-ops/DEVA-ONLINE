(()=>{
const qs=s=>document.querySelector(s); let publicData=null,scanStream=null,pollTimer=null;
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const phone=()=>{try{return JSON.parse(localStorage.getItem('deva-customer')||'null')?.phone||''}catch{return''}};
const profile=()=>{try{return JSON.parse(localStorage.getItem('deva-customer')||'null')}catch{return null}};
async function jfetch(url,opt){const r=await fetch(url,{headers:{'content-type':'application/json'},...opt});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Request failed');return d}
function prizeText(p){return window.DEVA_REWARDS_I18N?.prizeLabel(p)||(p.type==='DISCOUNT'?`${p.value}%`:p.type==='CREDIT'?`${p.value}$ DEVA Credit`:p.label)}
function nextFriday9(){const now=new Date();for(let i=0;i<8;i++){const d=new Date(now);d.setDate(now.getDate()+i);d.setHours(21,0,0,0);if(d.getDay()===5&&d>now)return d}const d=new Date(now);d.setDate(now.getDate()+7);d.setHours(21,0,0,0);return d}
function countdown(){const el=qs('#rewardCountdown');if(!el)return;const x=window.DEVA_REWARDS_I18N?.t?.()||{days:'ڕۆژ',hours:'کاتژمێر',minutes:'خولەک'};const ms=nextFriday9()-new Date();const days=Math.floor(ms/86400000),h=Math.floor(ms%86400000/3600000),m=Math.floor(ms%3600000/60000);el.textContent=`${days} ${x.days} • ${h} ${x.hours} • ${m} ${x.minutes}`}
function renderOfflineFallback(){const prizes=[['10% داشکاندن'],['15% داشکاندن'],['20% داشکاندن'],['25% داشکاندن'],['50$ DEVA Credit'],['100$ DEVA Credit'],['150$ DEVA Credit'],['200$ DEVA Credit'],['300$ DEVA Credit'],['👑 TV Unit • Super Prize'],['👑 3-Piece Coffee Table Set • Super Prize']];if(qs('#rewardMemberCount'))qs('#rewardMemberCount').textContent='0 / 1,000';if(qs('#rewardProgress'))qs('#rewardProgress').style.width='0%';if(qs('#rewardStartState'))qs('#rewardStartState').textContent=(window.DEVA_REWARDS_I18N?.t?.().preview||'Preview Mode');if(qs('#rewardPrizes'))qs('#rewardPrizes').innerHTML=prizes.map((p,i)=>`<div class="reward-prize ${i>8?'grand':''}">${p[0]}</div>`).join('');if(qs('#rewardWinners'))qs('#rewardWinners').innerHTML='<p>'+esc(window.DEVA_REWARDS_I18N?.t?.().noWinners||'No winners yet')+'</p>';if(qs('#rewardMyStatus'))qs('#rewardMyStatus').innerHTML=esc(window.DEVA_REWARDS_I18N?.t?.().scanOnline||'')}
async function loadPublic(){try{publicData=await jfetch('/api/rewards/public');const pct=Math.min(100,Math.round(publicData.members/publicData.target*100));qs('#rewardMemberCount').textContent=`${Number(publicData.members).toLocaleString()} / ${Number(publicData.target).toLocaleString()}`;qs('#rewardProgress').style.width=pct+'%';qs('#rewardStartState').textContent=publicData.started?(window.DEVA_REWARDS_I18N?.t?.().started||'✅'):(window.DEVA_REWARDS_I18N?.t?.().membersLeft?.(Math.max(0,publicData.target-publicData.members).toLocaleString())||'');qs('#rewardPrizes').innerHTML=publicData.prizes.map(p=>`<div class="reward-prize ${p.is_grand?'grand':''}">${p.is_grand?'👑 ':''}${esc(prizeText(p))}${p.is_grand?'<small><br>Super Prize • هەر ٣ مانگ</small>':''}</div>`).join('');qs('#rewardWinners').innerHTML=publicData.recent.length?publicData.recent.map(x=>`<div class="reward-winner"><span>${x.is_grand?'👑':'🎁'} ${esc(x.customer_name)} <small>${esc(x.phone)}</small></span><b>${esc(x.label)}</b></div>`).join(''):'<p>'+esc(window.DEVA_REWARDS_I18N?.t?.().noWinners||'No winners yet')+'</p>';await loadMember()}catch(e){renderOfflineFallback()} }
async function loadMember(){const p=phone();const box=qs('#rewardMyStatus');if(!p){box.innerHTML=esc(window.DEVA_REWARDS_I18N?.t?.().needAccount||'');return}try{const d=await jfetch('/api/rewards/member?phone='+encodeURIComponent(p));if(!d.member){box.innerHTML=esc(window.DEVA_REWARDS_I18N?.t?.().notMember||'');return}box.innerHTML=esc(window.DEVA_REWARDS_I18N?.t?.().active?.(Number(d.member.wins_count).toLocaleString())||'')+(d.wins[0]?`<br><b>${esc(window.DEVA_REWARDS_I18N?.t?.().lastGift||'Latest prize')}: ${esc(d.wins[0].label)} — ${esc(d.wins[0].redeem_status)}</b>`:'');const unseen=d.wins.find(w=>localStorage.getItem('deva-reward-seen-'+w.id)!=='1');if(unseen){showGift(unseen);localStorage.setItem('deva-reward-seen-'+unseen.id,'1');if('Notification'in window&&Notification.permission==='granted')new Notification('DEVA Friday Gift',{body:`پیرۆزە! ${unseen.label} ـت بردووەتەوە.`})}}catch(e){box.textContent=e.message}}
function openJoin(token=''){const p=profile();qs('#rewardName').value=p?.name||'';qs('#rewardPhone').value=p?.phone||'';qs('#rewardEmail').value=p?.email||'';qs('#rewardToken').value=token;qs('#rewardJoinModal').classList.add('open')}
function closeModal(id){qs(id)?.classList.remove('open');if(id==='#rewardJoinModal')stopCamera()}
async function activateWithProfile(p,token){if(!p?.name||!p?.phone||!token)return false;await jfetch('/api/rewards/activate',{method:'POST',body:JSON.stringify({customer_name:String(p.name).trim(),phone:String(p.phone).trim(),email:String(p.email||'').trim(),token:String(token).trim(),consent:true})});localStorage.setItem('deva-reward-activated','1');localStorage.removeItem('deva-reward-pending-token');return true}
async function activate(){const body={customer_name:qs('#rewardName').value.trim(),phone:qs('#rewardPhone').value.trim(),email:qs('#rewardEmail').value.trim(),token:qs('#rewardToken').value.trim(),consent:qs('#rewardConsent').checked};try{await jfetch('/api/rewards/activate',{method:'POST',body:JSON.stringify(body)});localStorage.setItem('deva-reward-activated','1');localStorage.removeItem('deva-reward-pending-token');qs('#rewardJoinMsg').textContent=window.DEVA_REWARDS_I18N?.t?.().activated||'✅';setTimeout(()=>{closeModal('#rewardJoinModal');loadPublic();document.querySelector('#devaRewards')?.scrollIntoView({behavior:'smooth',block:'start'})},700)}catch(e){qs('#rewardJoinMsg').textContent='❌ '+e.message}}
async function startCamera(){if(!navigator.mediaDevices?.getUserMedia){qs('#rewardJoinMsg').textContent=window.DEVA_REWARDS_I18N?.t?.().cameraUnsupported||'';return}if(!('BarcodeDetector'in window)){qs('#rewardJoinMsg').textContent=window.DEVA_REWARDS_I18N?.t?.().scannerUnsupported||'';return}try{scanStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});const v=qs('#rewardVideo');v.srcObject=scanStream;await v.play();const det=new BarcodeDetector({formats:['qr_code']});const loop=async()=>{if(!scanStream)return;try{const codes=await det.detect(v);if(codes[0]){const raw=codes[0].rawValue||'';const token=parseToken(raw);if(token){qs('#rewardToken').value=token;qs('#rewardJoinMsg').textContent=window.DEVA_REWARDS_I18N?.t?.().qrScanned||'✅';stopCamera();return}}}catch{}requestAnimationFrame(loop)};loop()}catch(e){qs('#rewardJoinMsg').textContent=window.DEVA_REWARDS_I18N?.t?.().cameraDenied||''}}
function parseToken(raw){try{const u=new URL(raw);return u.searchParams.get('deva_reward')||raw}catch{return raw}}
function stopCamera(){if(scanStream){scanStream.getTracks().forEach(t=>t.stop());scanStream=null}const v=qs('#rewardVideo');if(v)v.srcObject=null}
function showGift(w){qs('#giftRevealTitle').textContent=w.label;qs('#giftRevealCode').textContent=(window.DEVA_REWARDS_I18N?.t?.().giftCode||'Prize code')+': '+w.redeem_code;qs('#mysteryGiftBox').classList.remove('opened');qs('#rewardGiftModal').classList.add('open')}
function init(){
 qs('#rewardJoinBtn')?.addEventListener('click',()=>openJoin(''));const openScanner=()=>{openJoin('');setTimeout(startCamera,120)};qs('#rewardScanBtn')?.addEventListener('click',openScanner);qs('#rewardActivateBtn')?.addEventListener('click',activate);qs('#rewardNotifyBtn')?.addEventListener('click',async()=>{if('Notification'in window)await Notification.requestPermission()});document.querySelectorAll('[data-reward-close]').forEach(b=>b.onclick=()=>closeModal('#'+b.dataset.rewardClose));qs('#mysteryGiftBox')?.addEventListener('click',e=>e.currentTarget.classList.add('opened'));
 const token=new URLSearchParams(location.search).get('deva_reward');if(token){localStorage.setItem('deva-reward-pending-token',token);history.replaceState({},'',location.pathname+location.hash);setTimeout(async()=>{const p=profile();if(p?.name&&p?.phone){try{await activateWithProfile(p,token);await loadPublic();document.querySelector('#devaRewards')?.scrollIntoView({behavior:'smooth',block:'start'});const box=qs('#rewardMyStatus');if(box)box.innerHTML=esc(window.DEVA_REWARDS_I18N?.t?.().scanSuccess||'✅')}catch(e){openJoin(token);qs('#rewardJoinMsg').textContent='❌ '+e.message}}else{window.__DEVA_REWARD_PENDING__=token;document.querySelector('#accountBtn')?.click();setTimeout(()=>{const n=document.querySelector('#customerName');if(n)n.focus()},250)}},500)}
 window.DEVA_REWARDS={handleProfileSaved:async(p)=>{const t=localStorage.getItem('deva-reward-pending-token')||window.__DEVA_REWARD_PENDING__;if(!t)return false;try{await activateWithProfile(p,t);window.__DEVA_REWARD_PENDING__='';await loadPublic();document.querySelector('#accountModal [data-close=accountModal]')?.click();document.querySelector('#devaRewards')?.scrollIntoView({behavior:'smooth',block:'start'});const box=qs('#rewardMyStatus');if(box)box.innerHTML=esc(window.DEVA_REWARDS_I18N?.t?.().autoActive||'✅');return true}catch(e){openJoin(t);qs('#rewardJoinMsg').textContent='❌ '+e.message;return false}}};
 loadPublic();countdown();setInterval(countdown,60000);pollTimer=setInterval(loadMember,60000)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

// V9 — Live Draw Room, exact countdown and live presence
(()=>{
 const sid=localStorage.getItem('deva-live-session')||((crypto.randomUUID?.()||('s'+Math.random().toString(36).slice(2)+Date.now())));localStorage.setItem('deva-live-session',sid);
 let warned15=false;
 function target(){return nextFriday9()}
 function tickExact(){const el=qs('#rewardCountdown'),state=qs('#rewardDrawState');if(!el)return;let ms=target()-new Date();if(ms<0)ms=0;const total=Math.floor(ms/1000),d=Math.floor(total/86400),h=Math.floor(total%86400/3600),m=Math.floor(total%3600/60),sec=total%60;el.textContent=`${d} ڕۆژ • ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;if(state)state.textContent=ms<=1000?(window.DEVA_REWARDS_I18N?.t?.().drawLive||'🔴'):(window.DEVA_REWARDS_I18N?.t?.().drawWait||'⏳');if(ms>0&&ms<=15*60*1000&&!warned15){warned15=true;if('Notification'in window&&Notification.permission==='granted')new Notification('DEVA Friday Gift',{body:(window.DEVA_REWARDS_I18N?.t?.().notif15||'DEVA draw soon')})}}
 function inRewards(){const r=document.querySelector('#devaRewards');if(!r)return false;const b=r.getBoundingClientRect();return b.top<innerHeight&&b.bottom>0}
 async function heartbeat(){if(document.hidden)return;const area=inRewards()?'REWARDS':'APP';try{await fetch('/api/rewards/presence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:sid,area,waiting:area==='REWARDS'})});const d=await fetch('/api/rewards/live',{cache:'no-store'}).then(r=>r.json());const el=qs('#rewardWaitingNow');if(el)el.textContent=Number(d.waitingForDraw||0).toLocaleString()}catch{}}
 setInterval(tickExact,1000);setInterval(heartbeat,15000);addEventListener('scroll',()=>heartbeat(),{passive:true});document.addEventListener('visibilitychange',heartbeat);tickExact();heartbeat();
})();


// DEVA Rewards — complete 4-language UI localization
(()=>{
const R={
ku:{nav:'دیارییەکانی DEVA',launchTitle:'دیارییەکانی DEVA',launchText:'یەک جار لە پێشانگا QR سکان بکە و بەردەوام لە ڕاکێشانی هەفتانە بەژدار بە. دوای گەیشتن بە 1,000 ئەندام، هەموو هەینی کاتژمێر 9ی شەو خەڵات دەدرێت.',view:'بینینی دیارییەکان',mainTitle:'خەڵاتی هەفتانەی DEVA',mainText:'ئەپلیکەیشنەکە دابەزێنە، تەنها یەک جار لە پێشانگا QR سکان بکە و ببە بە ئەندامی هەمیشەیی. دوای گەیشتن بە 1,000 ئەندام، هەموو هەینی کاتژمێر 9ی شەو ڕاکێشان دەکرێت.',drawLabel:'کاتی ڕاکێشان',drawText:'هەموو هەینی • 9:00 شەو',prizes:'🎁 خەڵاتەکان',scan:'QR سکان بکە',join:'ئەندامێتی خۆم بپشکنە',notify:'Notification چالاک بکە',credit:'DEVA Credit پارەی نەقد نییە و تەنها بۆ کڕینی داهاتوو بەکاردێت. مەرج و کەمترین بڕی کڕین لەلایەن DEVA دیاری دەکرێت.',winners:'🏆 لیستی براوەکان',float:'دیارییەکان',activateTitle:'چالاککردنی DEVA Rewards',activateHelp:'لە پێشانگا QR سکان بکە. تەنها یەک جار پێویستە.',name:'ناوی تەواو',phone:'ژمارەی مۆبایل',consent:'ڕازیم بە مەرجەکانی DEVA Rewards',activate:'چالاککردنی ئەندامێتی',congrats:'🎉 پیرۆزە!',giftHelp:'سندوقەکە بکەرەوە بۆ بینینی خەڵاتەکەت.'},
ar:{nav:'هدايا DEVA',launchTitle:'هدايا DEVA',launchText:'امسح رمز QR مرة واحدة في المعرض وشارك باستمرار في السحب الأسبوعي. بعد الوصول إلى 1,000 عضو، تُقدَّم الجوائز كل يوم جمعة الساعة 9 مساءً.',view:'عرض الهدايا',mainTitle:'جوائز DEVA الأسبوعية',mainText:'نزّل التطبيق وامسح رمز QR مرة واحدة فقط في المعرض لتصبح عضواً دائماً. بعد الوصول إلى 1,000 عضو، يُجرى السحب كل جمعة الساعة 9 مساءً.',drawLabel:'موعد السحب',drawText:'كل جمعة • 9:00 مساءً',prizes:'🎁 الجوائز',scan:'امسح QR',join:'تحقق من عضويتي',notify:'تفعيل الإشعارات',credit:'رصيد DEVA ليس نقداً ويُستخدم فقط للمشتريات القادمة. تحدد DEVA الشروط والحد الأدنى للشراء.',winners:'🏆 قائمة الفائزين',float:'الهدايا',activateTitle:'تفعيل DEVA Rewards',activateHelp:'امسح رمز QR في المعرض. تحتاج إلى ذلك مرة واحدة فقط.',name:'الاسم الكامل',phone:'رقم الهاتف',consent:'أوافق على شروط DEVA Rewards',activate:'تفعيل العضوية',congrats:'🎉 مبروك!',giftHelp:'افتح الصندوق لرؤية جائزتك.'},
en:{nav:'DEVA Gifts',launchTitle:'DEVA Gifts',launchText:'Scan the showroom QR once and stay entered in the weekly draw. After reaching 1,000 members, prizes are drawn every Friday at 9:00 PM.',view:'View gifts',mainTitle:'DEVA Weekly Rewards',mainText:'Download the app and scan the showroom QR once to become a permanent member. After reaching 1,000 members, the draw takes place every Friday at 9:00 PM.',drawLabel:'Draw time',drawText:'Every Friday • 9:00 PM',prizes:'🎁 Prizes',scan:'Scan QR',join:'Check my membership',notify:'Enable notifications',credit:'DEVA Credit is not cash and can only be used for future purchases. Terms and minimum purchase are set by DEVA.',winners:'🏆 Hall of Winners',float:'Gifts',activateTitle:'Activate DEVA Rewards',activateHelp:'Scan the QR in the showroom. You only need to do this once.',name:'Full name',phone:'Mobile number',consent:'I agree to the DEVA Rewards terms',activate:'Activate membership',congrats:'🎉 Congratulations!',giftHelp:'Open the box to reveal your prize.'},
tr:{nav:'DEVA Hediyeleri',launchTitle:'DEVA Hediyeleri',launchText:'Mağazadaki QR kodunu bir kez tarayın ve haftalık çekilişe sürekli katılın. 1.000 üyeye ulaşıldıktan sonra her Cuma saat 21:00’de ödüller verilir.',view:'Hediyeleri gör',mainTitle:'DEVA Haftalık Ödülleri',mainText:'Uygulamayı indirin ve kalıcı üye olmak için mağazadaki QR kodunu yalnızca bir kez tarayın. 1.000 üyeye ulaşıldıktan sonra çekiliş her Cuma saat 21:00’de yapılır.',drawLabel:'Çekiliş zamanı',drawText:'Her Cuma • 21:00',prizes:'🎁 Ödüller',scan:'QR Tara',join:'Üyeliğimi kontrol et',notify:'Bildirimleri aç',credit:'DEVA Credit nakit değildir ve yalnızca gelecekteki alışverişlerde kullanılabilir. Koşullar ve minimum alışveriş tutarı DEVA tarafından belirlenir.',winners:'🏆 Kazananlar',float:'Hediyeler',activateTitle:'DEVA Rewards Aktivasyonu',activateHelp:'Mağazadaki QR kodunu tarayın. Bunu yalnızca bir kez yapmanız yeterlidir.',name:'Ad Soyad',phone:'Telefon numarası',consent:'DEVA Rewards koşullarını kabul ediyorum',activate:'Üyeliği etkinleştir',congrats:'🎉 Tebrikler!',giftHelp:'Ödülünüzü görmek için kutuyu açın.'}
};
const q=s=>document.querySelector(s), put=(s,v)=>{const e=q(s);if(e)e.textContent=v};
function apply(l){const x=R[l]||R.en;put('#rewardNavText',x.nav);put('#rewardLaunchTitle',x.launchTitle);put('#rewardLaunchText',x.launchText);put('#rewardLaunchBtn',x.view);put('#rewardMainTitle',x.mainTitle);put('#rewardMainText',x.mainText);put('#rewardDrawTimeLabel',x.drawLabel);put('#rewardDrawTimeText',x.drawText);put('#rewardPrizesTitle',x.prizes);put('#rewardScanBtn span',x.scan);put('#rewardJoinBtn',x.join);put('#rewardNotifyBtn span',x.notify);put('#rewardCreditNote',x.credit);put('#rewardWinnersTitle',x.winners);put('#rewardFloatText',x.float);put('#rewardActivateTitle',x.activateTitle);put('#rewardActivateHelp',x.activateHelp);const n=q('#rewardName'),p=q('#rewardPhone');if(n)n.placeholder=x.name;if(p)p.placeholder=x.phone;put('#rewardConsentText',x.consent);put('#rewardActivateBtn',x.activate);put('#rewardCongrats',x.congrats);put('#rewardGiftHelp',x.giftHelp)}
window.addEventListener('deva-language-change',e=>apply(e.detail?.lang||localStorage.getItem('deva-lang')||'ku'));
window.addEventListener('deva-rewards-language-sync',e=>apply(e.detail?.lang||localStorage.getItem('deva-lang')||'ku'));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>apply(localStorage.getItem('deva-lang')||'ku'));else apply(localStorage.getItem('deva-lang')||'ku');
})();


// DEVA Rewards V10 — complete runtime localization for KU / AR / EN / TR
(()=>{
  const L={
    ku:{
      days:'ڕۆژ',hours:'کاتژمێر',minutes:'خولەک',drawWait:'⏳ چاوەڕێی ڕاکێشانی داهاتوو',drawLive:'🔴 ڕاکێشان دەستی پێکرد',
      preview:'Preview Mode • پاش پەیوەستکردنی Server ژمارەی ڕاستەقینە نیشان دەدرێت',noWinners:'هێشتا براوەیەک تۆمار نەکراوە.',scanOnline:'📍 بۆ چالاککردنی ئەندامێتی، لە وەشانی ئۆنلاین QR ـی پێشانگا سکان بکە.',
      started:'✅ خەڵاتە هەفتانەکان چالاکن',membersLeft:n=>`تەنها ${n} ئەندام ماوە بۆ دەستپێکردن`,needAccount:'بۆ چالاککردنی DEVA Rewards سەرەتا هەژماری کریار دروست بکە.',notMember:'❌ هێشتا ئەندامی DEVA Rewards نیت. یەک جار QR ـی پێشانگا سکان بکە.',
      active:n=>`✅ ئەندامێتی تۆ چالاکە • ${n} خەڵات بردووەتەوە`,lastGift:'دوا خەڵات',activated:'✅ ئەندامێتی DEVA Rewards چالاک کرا.',cameraUnsupported:'کامێرا لەم وێبگەڕەدا پشتگیری ناکرێت؛ QR بە Camera ـی مۆبایل سکان بکە.',scannerUnsupported:'Scan ـی ناوخۆیی لەم مۆبایلەدا پشتگیری ناکرێت؛ QR بە Camera ـی مۆبایل سکان بکە.',qrScanned:'✅ QR سکان کرا',cameraDenied:'دەستگەیشتن بە کامێرا ڕێگەپێنەدرا',giftCode:'کۆدی خەڵات',scanSuccess:'✅ سکانکردن سەرکەوتوو بوو — تۆ ئێستا ئەندامی DEVA Rewards یت.',autoActive:'✅ خۆت تۆمار کرد و ئەندامێتی DEVA Rewards ـت خۆکارانە چالاک بوو.',
      notif15:'15 خولەک ماوە بۆ ڕاکێشانی DEVA — ئێستا بچۆ ناو بەشی دیارییەکان.',discount:'داشکاندن',superEvery:'Super Prize • هەر ٣ مانگ',cashNote:'DEVA Credit',waiting:'کەس چاوەڕێن'
    },
    ar:{
      days:'يوم',hours:'ساعة',minutes:'دقيقة',drawWait:'⏳ بانتظار السحب القادم',drawLive:'🔴 بدأ السحب الآن',
      preview:'وضع المعاينة • سيظهر العدد الحقيقي بعد الاتصال بالخادم',noWinners:'لا يوجد فائزون مسجلون بعد.',scanOnline:'📍 لتفعيل العضوية، امسح رمز QR الخاص بالمعرض في النسخة المتصلة بالإنترنت.',
      started:'✅ الجوائز الأسبوعية مفعّلة',membersLeft:n=>`تبقّى ${n} عضو فقط لبدء السحب`,needAccount:'أنشئ حساب عميل أولاً لتفعيل DEVA Rewards.',notMember:'❌ لست عضواً في DEVA Rewards بعد. امسح رمز QR في المعرض مرة واحدة.',
      active:n=>`✅ عضويتك فعّالة • فزت بـ ${n} جائزة`,lastGift:'آخر جائزة',activated:'✅ تم تفعيل عضوية DEVA Rewards.',cameraUnsupported:'الكاميرا غير مدعومة في هذا المتصفح؛ امسح رمز QR بكاميرا الهاتف.',scannerUnsupported:'المسح داخل الموقع غير مدعوم على هذا الهاتف؛ استخدم كاميرا الهاتف.',qrScanned:'✅ تم مسح رمز QR',cameraDenied:'لم يتم السماح بالوصول إلى الكاميرا',giftCode:'رمز الجائزة',scanSuccess:'✅ تم المسح بنجاح — أصبحت الآن عضواً في DEVA Rewards.',autoActive:'✅ تم تسجيلك وتفعيل عضوية DEVA Rewards تلقائياً.',
      notif15:'تبقّى 15 دقيقة على سحب DEVA — ادخل الآن إلى قسم الهدايا.',discount:'خصم',superEvery:'الجائزة الكبرى • كل 3 أشهر',cashNote:'رصيد DEVA',waiting:'شخص بانتظار السحب'
    },
    en:{
      days:'days',hours:'hours',minutes:'minutes',drawWait:'⏳ Waiting for the next draw',drawLive:'🔴 Draw is now live',
      preview:'Preview Mode • Live member totals will appear after the server is connected',noWinners:'No winners have been recorded yet.',scanOnline:'📍 To activate membership, scan the showroom QR in the online version.',
      started:'✅ Weekly rewards are active',membersLeft:n=>`Only ${n} members left to start`,needAccount:'Create a customer account first to activate DEVA Rewards.',notMember:'❌ You are not a DEVA Rewards member yet. Scan the showroom QR once.',
      active:n=>`✅ Your membership is active • ${n} prizes won`,lastGift:'Latest prize',activated:'✅ DEVA Rewards membership activated.',cameraUnsupported:'Camera is not supported in this browser; scan the QR with your phone camera.',scannerUnsupported:'In-app scanning is not supported on this device; use your phone camera.',qrScanned:'✅ QR scanned',cameraDenied:'Camera access was not allowed',giftCode:'Prize code',scanSuccess:'✅ Scan successful — you are now a DEVA Rewards member.',autoActive:'✅ Your account was saved and DEVA Rewards was activated automatically.',
      notif15:'15 minutes left until the DEVA draw — open the Gifts section now.',discount:'discount',superEvery:'Super Prize • every 3 months',cashNote:'DEVA Credit',waiting:'people waiting'
    },
    tr:{
      days:'gün',hours:'saat',minutes:'dakika',drawWait:'⏳ Sonraki çekiliş bekleniyor',drawLive:'🔴 Çekiliş başladı',
      preview:'Önizleme Modu • Sunucu bağlandıktan sonra gerçek üye sayısı gösterilir',noWinners:'Henüz kayıtlı kazanan yok.',scanOnline:'📍 Üyeliği etkinleştirmek için çevrimiçi sürümde mağaza QR kodunu tarayın.',
      started:'✅ Haftalık ödüller aktif',membersLeft:n=>`Başlamak için yalnızca ${n} üye kaldı`,needAccount:'DEVA Rewards’ı etkinleştirmek için önce müşteri hesabı oluşturun.',notMember:'❌ Henüz DEVA Rewards üyesi değilsiniz. Mağaza QR kodunu bir kez tarayın.',
      active:n=>`✅ Üyeliğiniz aktif • ${n} ödül kazandınız`,lastGift:'Son ödül',activated:'✅ DEVA Rewards üyeliği etkinleştirildi.',cameraUnsupported:'Bu tarayıcı kamerayı desteklemiyor; QR kodunu telefon kamerasıyla tarayın.',scannerUnsupported:'Bu cihazda yerleşik tarama desteklenmiyor; telefon kamerasını kullanın.',qrScanned:'✅ QR tarandı',cameraDenied:'Kamera erişimine izin verilmedi',giftCode:'Ödül kodu',scanSuccess:'✅ Tarama başarılı — artık DEVA Rewards üyesisiniz.',autoActive:'✅ Kaydınız yapıldı ve DEVA Rewards üyeliğiniz otomatik olarak etkinleştirildi.',
      notif15:'DEVA çekilişine 15 dakika kaldı — şimdi Hediyeler bölümüne gidin.',discount:'indirim',superEvery:'Büyük Ödül • her 3 ayda bir',cashNote:'DEVA Credit',waiting:'kişi bekliyor'
    }
  };
  const lang=()=>localStorage.getItem('deva-lang')||document.documentElement.lang||'ku';
  const t=()=>L[lang()]||L.ku;
  const q=s=>document.querySelector(s);
  const fmt=n=>Number(n||0).toLocaleString(lang()==='ar'?'ar-IQ':lang()==='tr'?'tr-TR':'en-US');
  function prizeLabel(p){const x=t();if(p.type==='DISCOUNT')return `${p.value}% ${x.discount}`;if(p.type==='CREDIT')return `${p.value}$ ${x.cashNote}`;return p.label}
  function repaintStaticRuntime(){
    const x=t();
    const state=q('#rewardDrawState'); if(state && !state.textContent.includes('🔴')) state.textContent=x.drawWait;
    const live=q('.reward-live-pill'); if(live){const strong=live.querySelector('strong')?.outerHTML||'<strong id="rewardWaitingNow">0</strong>'; live.innerHTML=`<i></i> LIVE ${strong} ${x.waiting}`;}
  }
  window.DEVA_REWARDS_I18N={L,lang,t,fmt,prizeLabel,repaintStaticRuntime};
  window.addEventListener('deva-language-change',()=>setTimeout(repaintStaticRuntime,0));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',repaintStaticRuntime);else repaintStaticRuntime();
})();


// DEVA Rewards V11 — robust complete 4-language showroom instructions and UI
(()=>{
  const TEXT={
    ku:{
      title:'خەڵاتی هەفتانەی DEVA',
      intro:'بۆ بەژداربوون لە دیارییەکانی DEVA، پێویستە سەردانی پێشانگای DEVA بکەیت و تەنها یەک جار QR ـی تایبەت بە پێشانگا سکان بکەیت. دوای سکانکردن، ئەندامێتی تۆ چالاک دەبێت و بەردەوام لە ڕاکێشانە هەفتانەکان بەژدار دەبیت. دوای گەیشتن بە 1,000 ئەندام، ڕاکێشان هەموو هەینی کاتژمێر 9ی شەو ئەنجام دەدرێت.',
      howTitle:'چۆن بەژدار بم؟',
      step1:'١. سەردانی پێشانگای DEVA لە هەولێر بکە.',
      step2:'٢. لە ناو پێشانگا QR ـی DEVA Rewards سکان بکە.',
      step3:'٣. زانیارییەکانت تۆمار بکە تا ئەندامێتی تۆ چالاک بێت.',
      step4:'٤. دوای چالاکبوون، خۆکارانە لە ڕاکێشانە هەفتانەکان بەژدار دەبیت.',
      showroom:'📍 سکانکردنی QR تەنها لە پێشانگای DEVA ئەنجام دەدرێت.',
      members:'ئەندامانی چالاک', waiting:'کەس چاوەڕێن', drawWait:'⏳ چاوەڕێی ڕاکێشانی داهاتوو', drawLive:'🔴 ڕاکێشان دەستی پێکرد',
      superEvery:'Super Prize • هەر ٣ مانگ', notifTitle:'DEVA Friday Gift', notifBody:x=>`پیرۆزە! ${x} ـت بردووەتەوە.`,
      email:'ئیمەیڵ (ئارەزوومەندانە)', live:'LIVE'
    },
    ar:{
      title:'جوائز DEVA الأسبوعية',
      intro:'للمشاركة في هدايا DEVA، يجب زيارة معرض DEVA ومسح رمز QR الخاص بالمعرض مرة واحدة فقط. بعد المسح يتم تفعيل عضويتك وتبقى مشاركاً تلقائياً في السحوبات الأسبوعية. بعد الوصول إلى 1,000 عضو، يُجرى السحب كل يوم جمعة الساعة 9:00 مساءً.',
      howTitle:'كيف أشارك؟',
      step1:'١. قم بزيارة معرض DEVA في أربيل.',
      step2:'٢. امسح رمز QR الخاص بـ DEVA Rewards داخل المعرض.',
      step3:'٣. سجّل معلوماتك لتفعيل عضويتك.',
      step4:'٤. بعد التفعيل ستشارك تلقائياً في السحوبات الأسبوعية.',
      showroom:'📍 مسح رمز QR يتم داخل معرض DEVA فقط.',
      members:'الأعضاء النشطون', waiting:'شخص بانتظار السحب', drawWait:'⏳ بانتظار السحب القادم', drawLive:'🔴 بدأ السحب الآن',
      superEvery:'الجائزة الكبرى • كل 3 أشهر', notifTitle:'هدية DEVA الأسبوعية', notifBody:x=>`مبروك! لقد ربحت ${x}.`,
      email:'البريد الإلكتروني (اختياري)', live:'مباشر'
    },
    en:{
      title:'DEVA Weekly Rewards',
      intro:'To join DEVA Gifts, visit the DEVA showroom and scan the showroom QR code once. After scanning, your membership is activated and you remain automatically entered in the weekly draws. Once DEVA reaches 1,000 members, the draw is held every Friday at 9:00 PM.',
      howTitle:'How to join',
      step1:'1. Visit the DEVA showroom in Erbil.',
      step2:'2. Scan the DEVA Rewards QR code inside the showroom.',
      step3:'3. Register your details to activate your membership.',
      step4:'4. Once activated, you are automatically entered in the weekly draws.',
      showroom:'📍 The QR code must be scanned inside the DEVA showroom.',
      members:'Active members', waiting:'people waiting', drawWait:'⏳ Waiting for the next draw', drawLive:'🔴 Draw is now live',
      superEvery:'Super Prize • every 3 months', notifTitle:'DEVA Friday Gift', notifBody:x=>`Congratulations! You won ${x}.`,
      email:'Email (optional)', live:'LIVE'
    },
    tr:{
      title:'DEVA Haftalık Ödülleri',
      intro:'DEVA Hediyelerine katılmak için DEVA mağazasını ziyaret edin ve mağazaya özel QR kodunu yalnızca bir kez tarayın. Tarama sonrasında üyeliğiniz etkinleşir ve haftalık çekilişlere otomatik olarak katılmaya devam edersiniz. DEVA 1.000 üyeye ulaştıktan sonra çekiliş her Cuma saat 21:00’de yapılır.',
      howTitle:'Nasıl katılırım?',
      step1:'1. Erbil’deki DEVA mağazasını ziyaret edin.',
      step2:'2. Mağaza içinde DEVA Rewards QR kodunu tarayın.',
      step3:'3. Üyeliğinizi etkinleştirmek için bilgilerinizi kaydedin.',
      step4:'4. Etkinleştirmeden sonra haftalık çekilişlere otomatik olarak katılırsınız.',
      showroom:'📍 QR kodu yalnızca DEVA mağazasının içinde taranmalıdır.',
      members:'Aktif üyeler', waiting:'kişi bekliyor', drawWait:'⏳ Sonraki çekiliş bekleniyor', drawLive:'🔴 Çekiliş başladı',
      superEvery:'Büyük Ödül • her 3 ayda bir', notifTitle:'DEVA Cuma Hediyesi', notifBody:x=>`Tebrikler! ${x} kazandınız.`,
      email:'E-posta (isteğe bağlı)', live:'CANLI'
    }
  };
  const q=s=>document.querySelector(s);
  const lang=()=>localStorage.getItem('deva-lang')||document.documentElement.lang||'ku';
  const get=()=>TEXT[lang()]||TEXT.ku;
  function ensureHow(){
    const main=q('#rewardMainText'); if(!main||q('#rewardHowTo'))return;
    const box=document.createElement('div'); box.id='rewardHowTo'; box.className='reward-howto';
    box.innerHTML='<h3 id="rewardHowTitle"></h3><ol><li id="rewardHow1"></li><li id="rewardHow2"></li><li id="rewardHow3"></li><li id="rewardHow4"></li></ol><p id="rewardShowroomOnly" class="reward-showroom-only"></p>';
    main.insertAdjacentElement('afterend',box);
  }
  function put(s,v){const e=q(s);if(e)e.textContent=v}
  function applyAll(){
    const x=get(); ensureHow();
    put('#rewardMainTitle',x.title); put('#rewardMainText',x.intro);
    put('#rewardHowTitle',x.howTitle); put('#rewardHow1',x.step1); put('#rewardHow2',x.step2); put('#rewardHow3',x.step3); put('#rewardHow4',x.step4); put('#rewardShowroomOnly',x.showroom);
    const memberLabel=q('.rewards-count > small'); if(memberLabel)memberLabel.textContent=x.members;
    const live=q('.reward-live-pill'); if(live){const strong=live.querySelector('strong')?.outerHTML||'<strong id="rewardWaitingNow">0</strong>';live.innerHTML=`<i></i> ${x.live} ${strong} ${x.waiting}`;}
    const state=q('#rewardDrawState'); if(state){state.textContent=state.textContent.includes('🔴')?x.drawLive:x.drawWait;}
    const email=q('#rewardEmail');if(email)email.placeholder=x.email;
    document.querySelectorAll('.reward-prize.grand small').forEach(e=>e.textContent=x.superEvery);
  }
  window.DEVA_REWARDS_FULL_I18N={TEXT,applyAll};
  window.addEventListener('deva-language-change',()=>setTimeout(applyAll,0));
  window.addEventListener('storage',e=>{if(e.key==='deva-lang')applyAll()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyAll);else applyAll();
  // Keep translations correct after reward data refreshes the DOM.
  const root=q('#devaRewards'); if(root){new MutationObserver(()=>{clearTimeout(window.__devaRewardLangTimer);window.__devaRewardLangTimer=setTimeout(applyAll,40)}).observe(root,{childList:true,subtree:true});}
})();

// DEVA Rewards V12 — hard-sync rewards language with the main site language.
(()=>{
  let last='';
  function current(){return localStorage.getItem('deva-lang')||document.documentElement.lang||'ku'}
  function sync(force=false){
    const l=current();
    if(!force && l===last)return;
    last=l;
    try{ window.DEVA_REWARDS_FULL_I18N?.applyAll?.(); }catch(e){}
    try{
      // Trigger every other Rewards translation layer too.
      window.dispatchEvent(new CustomEvent('deva-rewards-language-sync',{detail:{lang:l}}));
    }catch(e){}
  }
  // Directly watch every language control, including the hamburger menu.
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-lang],[data-menu-lang],.lang-chip'))setTimeout(()=>sync(true),0);
  },true);
  window.addEventListener('deva-language-change',()=>setTimeout(()=>sync(true),0));
  window.addEventListener('storage',e=>{if(e.key==='deva-lang')sync(true)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>sync(true));else sync(true);
  // Safety net for any UI path that changes language without emitting an event.
  setInterval(sync,250);
})();
