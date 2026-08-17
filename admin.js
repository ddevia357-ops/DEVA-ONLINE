const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);let csrfToken='',me=null,loginNeeds2fa=false,sessionToken=sessionStorage.getItem('deva_admin_token')||'';
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const note=(m,ok=true)=>{const n=$('#notice');n.textContent=m;n.className=ok?'ok':'error';setTimeout(()=>n.textContent='',4000)};
const api=async(path,opt={})=>{const method=(opt.method||'GET').toUpperCase();const isForm=opt.body instanceof FormData;const r=await fetch(path,{...opt,credentials:'same-origin',headers:{...(isForm?{}:{'content-type':'application/json'}),...(sessionToken?{'authorization':'Bearer '+sessionToken}:{}),...((method!=='GET'&&csrfToken)?{'x-csrf-token':csrfToken}:{}),...(opt.headers||{})}});const body=r.status===204?null:await r.json().catch(()=>({}));if(r.status===401&&path!='/api/admin/login'){localLogout();throw new Error('Session expired — تکایە دووبارە بچۆ ژوورەوە')}if(!r.ok&&r.status!==202)throw new Error(body?.error||'Request failed');return body};
function localLogout(){csrfToken='';sessionToken='';sessionStorage.removeItem('deva_admin_token');me=null;loginNeeds2fa=false;$('#panel').hidden=true;$('#login').hidden=false;$('#codeWrap').hidden=true}
$('#logout').onclick=async()=>{try{await api('/api/admin/logout',{method:'POST'})}catch{}localLogout()};
$('#loginForm').onsubmit=async e=>{e.preventDefault();try{const payload={email:$('#email').value,password:$('#password').value};if(loginNeeds2fa)payload.code=$('#code').value;const d=await api('/api/admin/login',{method:'POST',body:JSON.stringify(payload)});if(d.requires2fa){loginNeeds2fa=true;$('#codeWrap').hidden=false;$('#code').focus();$('#msg').textContent='کۆدی Google Authenticator بنووسە';return}csrfToken=d.csrfToken;sessionToken=d.sessionToken||'';if(sessionToken)sessionStorage.setItem('deva_admin_token',sessionToken);await start()}catch(x){$('#msg').textContent=x.message}};
$$('[data-tab]').forEach(b=>b.onclick=()=>{$$('.tab').forEach(t=>t.hidden=true);$('#'+b.dataset.tab).hidden=false;if(b.dataset.tab==='logsTab')loadLogs();if(b.dataset.tab==='adminsTab')loadAdmins();if(b.dataset.tab==='securityTab')loadSecurity();if(b.dataset.tab==='giftsTab')loadGifts()});
async function start(){me=await api('/api/admin/me');csrfToken=me.csrfToken;$('#msg').textContent='';$('#login').hidden=true;$('#panel').hidden=false;$('#who').textContent=`${me.email} · ${me.role}`;$$('.super-only').forEach(x=>x.hidden=me.role!=='SUPER_ADMIN');if(me.role==='STAFF')$('#productForm').hidden=true;$('#statRole').textContent=me.role;$('#stat2fa').textContent=me.totpEnabled?'ON':'OFF';$('#twoFactorState').textContent=me.totpEnabled?'2FA چالاکە':'2FA هێشتا چالاک نەکراوە';$('#setup2fa').hidden=me.totpEnabled;await load();loadNextProductCode()}
function renderAdminProducts(rows){
  const q=String($('#productAdminSearch')?.value||'').trim().toLowerCase();
  const p=(rows||[]).filter(x=>!q||String(x.name||'').toLowerCase().includes(q)||String(x.product_code||'').toLowerCase().includes(q)||String(x.id||'').toLowerCase().includes(q));
  const count=$('#productSearchCount');if(count)count.textContent=q?`${p.length} بەرهەم دۆزرایەوە`:'';
  $('#products').innerHTML=p.length?p.map(x=>`<div class="product-admin-row price-edit-row"><img src="${esc(x.image||'')}" alt="" onerror="this.style.visibility='hidden'"><div><b>${esc(x.name)}</b><div class="muted">کۆد: <b>${esc(x.product_code||'—')}</b> · ${esc(x.category)} · ${x.catalog_origin==='BUILTIN'?'کەتەلۆگ':'Admin'}</div></div><div class="quick-price-box"><label>نرخی ئێستا ($)<input type="number" min="0" step="0.01" data-qprice="${esc(x.id)}" value="${Number(x.price_usd||0)}"></label><label>نرخی پێشوو ($)<input type="number" min="0" step="0.01" data-qoldprice="${esc(x.id)}" value="${Number(x.old_price_usd||0)||''}" placeholder="بۆ داشکاندن"></label><button class="primary quick-price-save" data-save-price="${esc(x.id)}">💾 هەڵگرتنی نرخ</button></div>${me.role!=='STAFF'?`<div class="product-admin-actions"><button data-edit-product="${esc(x.id)}">دەستکاری تەواو</button><button data-toggle-product="${esc(x.id)}" data-active="${x.active?1:0}">${x.active?'ناچالاک':'چالاک'}</button><button class="danger" data-del="${esc(x.id)}">🗑 سڕینەوە</button></div>`:''}</div>`).join(''):'<p class="muted">هیچ بەرهەمێک نەدۆزرایەوە.</p>';
  bindRows();
}
async function load(){const [p,o]=await Promise.all([api('/api/admin/products'),api('/api/admin/orders')]);$('#statProducts').textContent=p.length;$('#statOrders').textContent=o.length;$('#statPending').textContent=o.filter(x=>x.status==='PENDING').length;$('#statLowStock').textContent=p.filter(x=>x.active&&Number(x.stock_qty)>0&&Number(x.stock_qty)<=Number(x.low_stock_threshold)).length;$('#statOutStock').textContent=p.filter(x=>x.active&&Number(x.stock_qty)<=0).length;window.__adminProducts=p;renderAdminProducts(p);const pcb=$('#productCountBadge');if(pcb)pcb.textContent='('+p.length+')';$('#orders').innerHTML=o.map(x=>`<div class="row"><div><b>${esc(x.id)}</b><div class="muted">${esc(x.customer_name)} · ${esc(x.phone)} · ${esc(x.payment_status)}</div></div><span>${Number(x.total_iqd).toLocaleString()} IQD</span><select data-order="${esc(x.id)}">${['PENDING','CONFIRMED','PREPARING','SHIPPED','DELIVERED','CANCELLED','PAID'].map(s=>`<option ${s===x.status?'selected':''}>${s}</option>`).join('')}</select></div>`).join('');renderDashboard(o);$('#recentOverview').innerHTML=o.slice(0,5).map(x=>`<div class="row"><b>${esc(x.id)}</b><span>${esc(x.status)}</span><span>${esc(x.created_at)}</span></div>`).join('')||'<p class="muted">هیچ داواکارییەک نییە</p>';bindRows()}

function bindRows(){
  $$('[data-save-price]').forEach(b=>b.onclick=async()=>{const id=b.dataset.savePrice;const price=Number(document.querySelector(`[data-qprice="${CSS.escape(id)}"]`)?.value||0);const old=Number(document.querySelector(`[data-qoldprice="${CSS.escape(id)}"]`)?.value||0);b.disabled=true;try{await api('/api/admin/products/'+encodeURIComponent(id)+'/price',{method:'PATCH',body:JSON.stringify({price_usd:price,old_price_usd:old})});note('✓ نرخەکە گۆڕدرا');await load()}catch(e){note(e.message,false)}finally{b.disabled=false}});
  $$('[data-edit-product]').forEach(b=>b.onclick=()=>editProduct(b.dataset.editProduct));
  $$('[data-toggle-product]').forEach(b=>b.onclick=async()=>{try{await api('/api/admin/products/'+encodeURIComponent(b.dataset.toggleProduct)+'/active',{method:'PATCH',body:JSON.stringify({active:b.dataset.active!=='1'})});note(b.dataset.active==='1'?'بەرهەم ناچالاک کرا':'بەرهەم چالاک کرا');load()}catch(e){note(e.message,false)}});
  $$('[data-del]').forEach(b=>b.onclick=async()=>{if(!confirm('دڵنیایت ئەم بەرهەمە بە تەواوی بسڕدرێتەوە؟ ئەم کردارە ناگەڕێتەوە.'))return;try{await api('/api/admin/products/'+encodeURIComponent(b.dataset.del),{method:'DELETE'});note('بەرهەمەکە بە تەواوی سڕایەوە');load()}catch(e){note(e.message,false)}});
  $$('[data-order]').forEach(s=>s.onchange=async()=>{try{await api('/api/admin/orders/'+encodeURIComponent(s.dataset.order),{method:'PATCH',body:JSON.stringify({status:s.value})});note('دۆخی داواکاری گۆڕدرا')}catch(e){note(e.message,false)}})
}
let editingProductId=null;
function slugProduct(value){
  return String(value||'product').trim().toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g,'-')
    .replace(/^-+|-+$/g,'') || 'product';
}
async function loadNextProductCode(){if(editingProductId)return;try{const d=await api('/api/admin/products/next-code');if($('#pcode'))$('#pcode').value=d.product_code||'...'}catch{if($('#pcode'))$('#pcode').value='...'}}
function resetProductForm(){
  editingProductId=null;
  const form=$('#productForm');
  if(form) form.reset();
  if($('#pid')){$('#pid').disabled=false;$('#pid').value='';}
  if($('#pstock')) $('#pstock').value='0';
  if($('#plowstock')) $('#plowstock').value='2';
  if($('#pactive')) $('#pactive').checked=true;
  if($('#pimage')) $('#pimage').value='';
  if($('#pfile')) $('#pfile').value='';
  if($('#productPreview')) $('#productPreview').innerHTML='<span>🖼️</span><small>وێنەی بەرهەم</small>';
  if($('#productSaveBtn')) $('#productSaveBtn').textContent='＋ زیادکردنی بەرهەم';
  if($('#productResetBtn')) $('#productResetBtn').hidden=true;
  if($('#productDeleteBtn')) $('#productDeleteBtn').hidden=true;
  if($('#pcode')) $('#pcode').value='...';
  loadNextProductCode();
}
function editProduct(id){const x=(window.__adminProducts||[]).find(p=>p.id===id);if(!x)return;editingProductId=id;if($('#pcode'))$('#pcode').value=x.product_code||'—';$('#pid').value=x.id;$('#pid').disabled=true;$('#pname').value=x.name||'';$('#pcat').value=x.category||'';$('#pprice').value=x.price_usd||0;$('#poldprice').value=x.old_price_usd||'';updatePricePreview();$('#pstock').value=Number(x.stock_qty||0);$('#plowstock').value=Number(x.low_stock_threshold??2);$('#pimage').value=x.image||'';$('#pactive').checked=!!x.active;$('#productSaveBtn').textContent='✓ هەڵگرتنی گۆڕانکاری';$('#productResetBtn').hidden=false;$('#productDeleteBtn').hidden=false;if(x.image)$('#productPreview').innerHTML=`<img src="${esc(x.image)}" alt="preview">`;$('#productForm').scrollIntoView({behavior:'smooth',block:'start'})}
$('#productResetBtn').onclick=resetProductForm;
$('#productDeleteBtn').onclick=async()=>{if(!editingProductId)return;if(!confirm('دڵنیایت ئەم بەرهەمە بە تەواوی بسڕدرێتەوە؟ ئەم کردارە ناگەڕێتەوە.'))return;try{await api('/api/admin/products/'+encodeURIComponent(editingProductId),{method:'DELETE'});note('بەرهەمەکە بە تەواوی سڕایەوە');resetProductForm();load()}catch(e){note(e.message,false)}};
$('#pfile').onchange=e=>{const f=e.target.files?.[0];if(!f)return;if(!editingProductId)loadNextProductCode();if(!['image/jpeg','image/png','image/webp'].includes(f.type)){e.target.value='';note('تەنها JPG / PNG / WEBP ڕێگەپێدراوە',false);return}if(f.size>8*1024*1024){e.target.value='';note('قەبارەی وێنە نابێت لە 8MB زیاتر بێت',false);return}const reader=new FileReader();reader.onload=()=>{$('#productPreview').innerHTML=`<img src="${reader.result}" alt="preview">`};reader.onerror=()=>note('Preview ـی وێنە دروست نەبوو',false);reader.readAsDataURL(f)};
$('#pimage').oninput=e=>{if(e.target.value.trim())$('#productPreview').innerHTML=`<img src="${esc(e.target.value.trim())}" alt="preview">`};
function updatePricePreview(){const n=Number($('#pprice')?.value||0),o=Number($('#poldprice')?.value||0),el=$('#pricePreview');if(!el)return;if(o>n&&n>=0){const pct=Math.round((o-n)/o*100);el.innerHTML=`<b>داشکاندن: ${pct}%</b> · <span style="text-decoration:line-through">${o.toLocaleString()}$</span> → <b>${n.toLocaleString()}$</b>`}else if(n>0){el.innerHTML=`نرخی فرۆشتن: <b>${n.toLocaleString()}$</b>${o>0&&o<=n?' · داشکاندن نییە':''}`}else el.textContent='نرخەکە بنووسە'}
$('#pprice')?.addEventListener('input',updatePricePreview);$('#poldprice')?.addEventListener('input',updatePricePreview);
$('#productForm').onsubmit=async e=>{e.preventDefault();try{const fd=new FormData();const id=editingProductId||$('#pid').value.trim()||slugProduct($('#pname').value)+'-'+Date.now().toString(36);fd.append('id',id);fd.append('name',$('#pname').value.trim());fd.append('category',$('#pcat').value);fd.append('price_usd',$('#pprice').value);fd.append('old_price_usd',$('#poldprice').value||'0');fd.append('active',$('#pactive').checked?'true':'false');fd.append('stock_qty',$('#pstock').value||'0');fd.append('low_stock_threshold',$('#plowstock').value||'2');fd.append('image',$('#pimage').value.trim());const file=$('#pfile').files?.[0];if(file)fd.append('productImage',file);const saved=await api('/api/admin/products/upload',{method:'POST',body:fd});note(editingProductId?'بەرهەم نوێکرایەوە':`بەرهەم زیاد کرا — کۆد: ${saved?.product_code||''}`);resetProductForm();load()}catch(x){note(x.message,false)}};
$('#adminForm').onsubmit=async e=>{e.preventDefault();try{await api('/api/admin/admins',{method:'POST',body:JSON.stringify({email:$('#aemail').value,password:$('#apassword').value,role:$('#arole').value})});e.target.reset();note('Admin زیاد کرا');loadAdmins()}catch(x){note(x.message,false)}};
async function loadAdmins(){if(me?.role!=='SUPER_ADMIN')return;const a=await api('/api/admin/admins');$('#admins').innerHTML=a.map(x=>`<div class="row"><div><b>${esc(x.email)}</b><div class="muted">${esc(x.created_at)}</div></div><select data-role="${x.id}">${['SUPER_ADMIN','ADMIN','STAFF'].map(r=>`<option ${r===x.role?'selected':''}>${r}</option>`).join('')}</select><label><input type="checkbox" data-active="${x.id}" ${x.active?'checked':''}> Active</label>${x.id!==me.sub?`<button class="danger" data-adel="${x.id}">سڕینەوە</button>`:''}</div>`).join('');$$('[data-role]').forEach(s=>s.onchange=()=>updateAdmin(s.dataset.role,{role:s.value}));$$('[data-active]').forEach(c=>c.onchange=()=>updateAdmin(c.dataset.active,{active:c.checked}));$$('[data-adel]').forEach(b=>b.onclick=async()=>{if(!confirm('Admin بسڕدرێتەوە؟'))return;try{await api('/api/admin/admins/'+b.dataset.adel,{method:'DELETE'});note('Admin سڕایەوە');loadAdmins()}catch(e){note(e.message,false)}})}
async function updateAdmin(id,data){try{await api('/api/admin/admins/'+id,{method:'PATCH',body:JSON.stringify(data)});note('Admin نوێکرایەوە');loadAdmins()}catch(e){note(e.message,false)}}
async function loadLogs(){if(me?.role!=='SUPER_ADMIN')return;const l=await api('/api/admin/audit-logs');$('#logs').innerHTML=l.map(x=>`<div class="row"><div><b>${esc(x.action)}</b><div class="muted">${esc(x.actor)} · ${esc(x.ip)}</div></div><span>${esc(x.target||'')}</span><span>${esc(x.created_at)}</span></div>`).join('')}
async function loadSecurity(){if(me?.role!=='SUPER_ADMIN')return;const [d,b,sys]=await Promise.all([api('/api/admin/security-center'),api('/api/admin/backups'),api('/api/admin/system-status')]);$('#failed24h').textContent=d.stats.failed24h;$('#alertsUnread').textContent=d.stats.alertsUnread;$('#activeAdmins').textContent=d.stats.admins;$('#enabled2fa').textContent=d.stats.twoFactor;$('#lockedAdmins').textContent=d.stats.lockedAdmins||0;$('#systemHealth').textContent=sys.database?.ok?'OK':'ERROR';$('#alerts').innerHTML=d.alerts.map(x=>`<div class="row alert-${esc(x.severity.toLowerCase())}"><div><b>${esc(x.type)}</b><div class="muted">${esc(x.message)} · ${esc(x.ip||'')}</div></div><span>${esc(x.severity)}</span><span>${esc(x.created_at)}</span></div>`).join('')||'<p class="muted">Alert نییە</p>';$('#securityRecent').innerHTML=d.recent.map(x=>`<div class="row"><div><b>${esc(x.action)}</b><div class="muted">${esc(x.actor)} · ${esc(x.ip)}</div></div><span>${esc(x.created_at)}</span></div>`).join('');$('#backups').innerHTML=b.map(x=>`<div class="row"><div><b>${esc(x.file_name)}</b><div class="muted">${esc(x.kind||'MANUAL')}</div></div><span>${esc(x.created_at)}</span><a class="button-link" href="/api/admin/backups/${encodeURIComponent(x.file_name)}/download" target="_blank">Download</a></div>`).join('')||'<p class="muted">Backup نییە</p>';$('#systemStatus').innerHTML=`Database: <b>${sys.database?.ok?'OK':'ERROR'}</b> · Uptime: <b>${Math.floor((sys.uptimeSeconds||0)/60)} min</b> · Node: <b>${esc(sys.node||'')}</b><br>Products: ${Number(sys.products?.active||0)} active · ${Number(sys.products?.lowStock||0)} low stock · ${Number(sys.products?.outOfStock||0)} sold out<br>Last Backup: ${esc(sys.lastBackup?.created_at||'—')} · Reset events: ${Number(sys.resetEvents||0)}`}
$('#refreshSecurity').onclick=loadSecurity;$('#markAlerts').onclick=async()=>{try{await api('/api/admin/security-alerts/read',{method:'POST',body:'{}'});loadSecurity()}catch(e){note(e.message,false)}};$('#createBackup').onclick=async()=>{try{await api('/api/admin/backups',{method:'POST',body:'{}'});note('Backup دروست کرا');loadSecurity()}catch(e){note(e.message,false)}};
$('#setup2fa').onclick=async()=>{try{const d=await api('/api/admin/2fa/setup',{method:'POST',body:'{}'});$('#twoFactorSetup').hidden=false;$('#totpSecret').textContent=d.secret;note('Secret دروست کرا؛ لە Authenticator زیاد بکە')}catch(e){note(e.message,false)}};
$('#enable2fa').onclick=async()=>{try{await api('/api/admin/2fa/enable',{method:'POST',body:JSON.stringify({code:$('#totpCode').value})});alert('2FA چالاک کرا. دووبارە بچۆ ژوورەوە.');localLogout()}catch(e){note(e.message,false)}};
$('#logoutAll').onclick=async()=>{if(!confirm('هەموو Session ـەکان دەرکرێن؟'))return;try{await api('/api/admin/logout-all',{method:'POST',body:'{}'});localLogout()}catch(e){note(e.message,false)}};
$('#passwordForm').onsubmit=async e=>{e.preventDefault();try{await api('/api/admin/change-password',{method:'POST',body:JSON.stringify({currentPassword:$('#currentPassword').value,newPassword:$('#newPassword').value})});alert('Password گۆڕدرا. دووبارە بچۆ ژوورەوە.');localLogout()}catch(x){note(x.message,false)}};

const isoLocal=v=>v?new Date(v).toISOString():'';
$('#giftForm').onsubmit=async e=>{e.preventDefault();try{await api('/api/admin/monthly-gifts',{method:'POST',body:JSON.stringify({title:$('#giftTitle').value,gift_name:$('#giftName').value,image:$('#giftImage').value,description:$('#giftDescription').value,terms:$('#giftTerms').value,start_at:isoLocal($('#giftStart').value),end_at:isoLocal($('#giftEnd').value),status:$('#giftStatus').value})});e.target.reset();note('دیاریی مانگانە زیاد کرا');loadGifts()}catch(x){note(x.message,false)}};
async function loadGifts(){try{const rows=await api('/api/admin/monthly-gifts');$('#gifts').innerHTML=rows.map(x=>`<div class="row"><div><b>${esc(x.title)}</b><div class="muted">${esc(x.gift_name)} · ${esc(x.start_at)} تا ${esc(x.end_at)}</div></div><span>${x.entries} بەژداربوو</span><span>${esc(x.status)}</span><div><button data-gentries="${x.id}">بەژداربووان</button> ${!x.winner_entry_id&&x.entries?`<button data-gdraw="${x.id}">هەڵبژاردنی براوە</button>`:''}${x.winner_name?`<b> براوە: ${esc(x.winner_name)}</b>`:''}</div></div>`).join('')||'<p class="muted">هیچ دیارییەک نییە</p>';$$('[data-gentries]').forEach(b=>b.onclick=()=>loadGiftEntries(b.dataset.gentries));$$('[data-gdraw]').forEach(b=>b.onclick=async()=>{if(!confirm('براوە بە شێوەی هەڕەمەکی هەڵبژێردرێت؟ دووبارە ناکرێتەوە.'))return;try{const d=await api('/api/admin/monthly-gifts/'+b.dataset.gdraw+'/draw',{method:'POST',body:'{}'});alert(`براوە: ${d.winner.customer_name} - ${d.winner.phone}`);loadGifts();loadGiftEntries(b.dataset.gdraw)}catch(e){note(e.message,false)}})}catch(e){note(e.message,false)}}
async function loadGiftEntries(id){try{const a=await api('/api/admin/monthly-gifts/'+id+'/entries');$('#giftEntries').innerHTML=a.map(x=>`<div class="row"><div><b>${esc(x.customer_name)}</b><div class="muted">${esc(x.phone)} · ${esc(x.email||'')} · ${esc(x.city||'')}</div></div><span>${esc(x.created_at)}</span></div>`).join('')||'<p class="muted">هێشتا کەس بەژدار نەبووە</p>'}catch(e){note(e.message,false)}}
$('#refreshGifts').onclick=loadGifts;

initDashboardUI();
// Only restore an existing browser session when this tab actually has a saved bearer token.
// Starting an unauthenticated /me request during page load can race with a fresh login
// and incorrectly call localLogout(), producing a false 'Session expired' message.
if(sessionToken){start().catch(()=>localLogout());}else{localLogout();}


const tabTitles={overviewTab:'پوختە',analyticsTab:'Analytics',productsTab:'بەرهەمەکان',ordersTab:'داواکارییەکان',giftsTab:'دیاریی مانگانە',rewardsTab:'DEVA Rewards',adsTab:'ڕیکلام و Sponsor',securityTab:'Security Center',adminsTab:'Admin ـەکان',logsTab:'Audit Log',settingsTab:'ڕێکخستن'};
let liveTimer=null,lastOrderSignature='';
function switchTab(id){
  $$('.tab').forEach(t=>t.hidden=true);const target=$('#'+id);if(target)target.hidden=false;
  $$('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));
  $('#pageTitle').textContent=tabTitles[id]||'DEVA Dashboard';
  closeSidebar();
  if(id==='logsTab')loadLogs();if(id==='adminsTab')loadAdmins();if(id==='securityTab')loadSecurity();if(id==='giftsTab')loadGifts();if(id==='analyticsTab')loadAnalytics();if(id==='adsTab'&&window.loadSponsors)window.loadSponsors();
}
$$('[data-tab]').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
$$('[data-quick]').forEach(b=>b.onclick=()=>switchTab(b.dataset.quick));

function initDashboardUI(){
  const saved=localStorage.getItem('deva-admin-theme');
  if(saved==='dark')document.documentElement.dataset.theme='dark';
  updateThemeIcon();
  $('#themeToggle').onclick=()=>{const dark=document.documentElement.dataset.theme==='dark';if(dark)delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme='dark';localStorage.setItem('deva-admin-theme',dark?'light':'dark');updateThemeIcon();setTimeout(()=>{if(window.__lastOrders)drawOrdersChart(window.__lastOrders)},50)};
  $('#menuToggle').onclick=()=>{$('#sidebar').classList.add('open');$('#sidebarOverlay').hidden=false};
  $('#sidebarOverlay').onclick=closeSidebar;
  $('#notificationBtn').onclick=()=>$('#notificationPanel').hidden=!$('#notificationPanel').hidden;
  $('#closeNotifications').onclick=()=>$('#notificationPanel').hidden=true;
  $('#refreshDashboard').onclick=load;
  const d=new Intl.DateTimeFormat('ku',{dateStyle:'full'}).format(new Date());$('#todayText').textContent=d;
  window.addEventListener('resize',()=>{if(window.__lastOrders)drawOrdersChart(window.__lastOrders)});
}
function closeSidebar(){$('#sidebar')?.classList.remove('open');if($('#sidebarOverlay'))$('#sidebarOverlay').hidden=true}
function updateThemeIcon(){$('#themeToggle').textContent=document.documentElement.dataset.theme==='dark'?'☀':'☾'}

function renderDashboard(orders){
  window.__lastOrders=orders;drawOrdersChart(orders);renderStatusBreakdown(orders);renderNotifications(orders);
  const sig=orders.slice(0,5).map(x=>x.id+':'+x.status).join('|');
  if(lastOrderSignature&&sig!==lastOrderSignature)note('داواکارییەکان نوێ بوونەوە');lastOrderSignature=sig;
  if(!liveTimer)liveTimer=setInterval(()=>{if(me)load().catch(()=>{})},30000);
}
function renderStatusBreakdown(orders){
  const statuses=['PENDING','CONFIRMED','PREPARING','SHIPPED','DELIVERED','CANCELLED','PAID'];
  const total=Math.max(orders.length,1);
  $('#statusBreakdown').innerHTML=statuses.map(st=>{const n=orders.filter(o=>o.status===st).length;const pct=Math.round(n/total*100);return `<div class="status-row"><span>${st}</span><div class="progress"><span style="width:${pct}%"></span></div><b>${n}</b></div>`}).join('');
}
function renderNotifications(orders){
  const pending=orders.filter(o=>o.status==='PENDING').slice(0,6);
  const recent=orders.slice(0,6);
  const items=(pending.length?pending:recent).map(o=>({title:o.status==='PENDING'?'داواکاریی نوێ':'گۆڕانکاریی داواکاری',body:`${o.id} · ${o.customer_name||''}`,time:o.created_at||''}));
  $('#notificationCount').hidden=!pending.length;$('#notificationCount').textContent=pending.length>99?'99+':pending.length;
  $('#liveNotifications').innerHTML=items.length?items.map(x=>`<div class="notification-item"><b>${esc(x.title)}</b><div>${esc(x.body)}</div><small>${esc(x.time)}</small></div>`).join(''):'<p class="muted">ئاگادارکردنەوە نییە</p>';
}
function drawOrdersChart(orders){
  const canvas=$('#ordersChart');if(!canvas)return;const parent=canvas.parentElement;const w=Math.max(280,parent.clientWidth-40),h=240,dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';const c=canvas.getContext('2d');c.scale(dpr,dpr);c.clearRect(0,0,w,h);
  const css=getComputedStyle(document.documentElement),muted=css.getPropertyValue('--muted').trim(),border=css.getPropertyValue('--border').trim(),accent=css.getPropertyValue('--accent').trim();
  const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);days.push(d)}
  const vals=days.map(d=>orders.filter(o=>{const od=new Date(o.created_at);return od>=d&&od<new Date(d.getTime()+86400000)}).length);const max=Math.max(...vals,1);const pad={l:30,r:15,t:18,b:35},cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
  c.strokeStyle=border;c.lineWidth=1;c.fillStyle=muted;c.font='12px Arial';c.textAlign='center';
  for(let i=0;i<4;i++){const y=pad.t+ch*i/3;c.beginPath();c.moveTo(pad.l,y);c.lineTo(w-pad.r,y);c.stroke()}
  const pts=vals.map((v,i)=>({x:pad.l+cw*i/6,y:pad.t+ch-(v/max)*ch}));c.strokeStyle=accent;c.lineWidth=3;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();
  c.fillStyle=accent;pts.forEach((p,i)=>{c.beginPath();c.arc(p.x,p.y,4,0,Math.PI*2);c.fill();c.fillStyle=muted;c.fillText(new Intl.DateTimeFormat('ku',{weekday:'short'}).format(days[i]),p.x,h-10);c.fillStyle=accent});
}

// ---- Professional Analytics ----
let analyticsData=null;
async function loadAnalytics(){
  try{
    const days=Number($('#analyticsDays')?.value||30);analyticsData=await api('/api/admin/analytics?days='+days);
    const s=analyticsData.summary;
    $('#aTodayVisits').textContent=Number(s.todayVisits).toLocaleString();$('#aTodayVisitors').textContent=Number(s.todayVisitors).toLocaleString()+' کەسی جیاواز';
    $('#aVisits').textContent=Number(s.visits).toLocaleString();$('#aUniqueVisitors').textContent=Number(s.uniqueVisitors).toLocaleString()+' کەسی جیاواز';
    $('#aSales').textContent=Number(s.salesCount).toLocaleString();$('#aRevenue').textContent='$'+Number(s.revenueUsd).toLocaleString(undefined,{maximumFractionDigits:2});$('#aPending').textContent=Number(s.pendingOrders).toLocaleString()+' داواکاری چاوەڕوان';
    const maxPage=Math.max(1,...analyticsData.topPages.map(x=>x.views));
    $('#topPages').innerHTML=analyticsData.topPages.length?analyticsData.topPages.map(x=>`<div class="analytics-bar"><span class="analytics-label">${esc(x.path)}</span><div class="mini-meter"><span style="width:${Math.round(x.views/maxPage*100)}%"></span></div><b>${Number(x.views).toLocaleString()}</b></div>`).join(''):'<p class="muted">هێشتا داتای سەردان نییە</p>';
    const maxProduct=Math.max(1,...analyticsData.topProducts.map(x=>x.views));
    $('#topProducts').innerHTML=analyticsData.topProducts.length?analyticsData.topProducts.map(x=>`<div class="analytics-bar"><span class="analytics-label">${esc(x.product_id)}</span><div class="mini-meter"><span style="width:${Math.round(x.views/maxProduct*100)}%"></span></div><b>${Number(x.views).toLocaleString()}</b></div>`).join(''):'<p class="muted">هێشتا داتای بینینی بەرهەم نییە</p>';
    drawAnalyticsChart(analyticsData.daily);
  }catch(e){note(e.message,false)}
}
function drawAnalyticsChart(rows){
  const canvas=$('#analyticsChart');if(!canvas||!rows)return;const parent=canvas.parentElement;const w=Math.max(280,parent.clientWidth-40),h=260,dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';const c=canvas.getContext('2d');c.scale(dpr,dpr);c.clearRect(0,0,w,h);
  const css=getComputedStyle(document.documentElement),muted=css.getPropertyValue('--muted').trim(),border=css.getPropertyValue('--border').trim(),accent=css.getPropertyValue('--accent').trim();const accent2=css.getPropertyValue('--accent2').trim();const pad={l:34,r:16,t:18,b:40},cw=w-pad.l-pad.r,ch=h-pad.t-pad.b,max=Math.max(1,...rows.flatMap(x=>[Number(x.visits),Number(x.orders)]));
  c.strokeStyle=border;c.lineWidth=1;for(let i=0;i<4;i++){const y=pad.t+ch*i/3;c.beginPath();c.moveTo(pad.l,y);c.lineTo(w-pad.r,y);c.stroke()}
  const xAt=i=>pad.l+(rows.length===1?cw/2:cw*i/(rows.length-1)),yAt=v=>pad.t+ch-(Number(v)/max)*ch;
  const line=(key,color)=>{c.strokeStyle=color;c.lineWidth=3;c.beginPath();rows.forEach((r,i)=>{const x=xAt(i),y=yAt(r[key]);i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke()};line('visits',accent);line('orders',accent2);
  c.fillStyle=muted;c.font='11px Arial';c.textAlign='center';const step=Math.max(1,Math.ceil(rows.length/6));rows.forEach((r,i)=>{if(i%step===0||i===rows.length-1)c.fillText(String(r.date).slice(5),xAt(i),h-12)});
  c.textAlign='left';c.fillStyle=accent;c.fillText('Visits',pad.l,12);c.fillStyle=accent2;c.fillText('Orders',pad.l+55,12);
}
if($('#refreshAnalytics'))$('#refreshAnalytics').onclick=loadAnalytics;if($('#analyticsDays'))$('#analyticsDays').onchange=loadAnalytics;
window.addEventListener('resize',()=>{if(analyticsData)drawAnalyticsChart(analyticsData.daily)});

const __rp=$('#refreshProductsBtn');if(__rp)__rp.onclick=()=>load();
const __ps=$('#productAdminSearch');if(__ps)__ps.addEventListener('input',()=>renderAdminProducts(window.__adminProducts||[]));
