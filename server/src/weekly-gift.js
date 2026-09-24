(()=>{
  const q=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const copy={ku:{title:'هەموو هەفتەیەک دیارییەک بەرەوە!',text:'تەنها بە بەشداریکردنت لە ئەپی DEVA، دەرفەتی بردنەوەی دیارییە تایبەتەکانی هەفتانەت هەیە.',sponsored:'بە سپۆنسەری'},ar:{title:'اربح هدية كل أسبوع!',text:'بمجرد مشاركتك في تطبيق DEVA، تحصل على فرصة للفوز بهدية أسبوعية مميزة.',sponsored:'برعاية'},en:{title:'Win a gift every week!',text:'Join through the DEVA app for a chance to win a special weekly gift.',sponsored:'Sponsored by'},tr:{title:'Her hafta bir hediye kazanın!',text:'DEVA uygulamasına katılarak özel haftalık hediyeyi kazanma şansı elde edin.',sponsored:'Sponsor'}};
  const lang=()=>localStorage.getItem('deva-lang')||document.documentElement.lang||'ku';
  let gift=null;
  function render(){const box=q('#weeklyGiftCard');if(!box)return;const c=copy[lang()]||copy.ku;if(!gift){box.innerHTML='<div class="weekly-gift-empty"><b>'+esc(c.title)+'</b><p>'+esc(c.text)+'</p></div>';return}const digits=String(gift.sponsor_phone||'').replace(/\D/g,'');box.innerHTML='<article class="weekly-gift-live">'+(gift.image?'<img src="'+esc(gift.image)+'" alt="'+esc(gift.gift_name)+'">':'<div class="weekly-gift-icon">🎁</div>')+'<div class="weekly-gift-copy"><span>DEVA WEEKLY GIFT</span><h3>'+esc(gift.gift_name)+'</h3><p>'+esc(gift.description||c.text)+'</p>'+(gift.sponsor_name?'<div class="weekly-gift-sponsor"><b>'+esc(c.sponsored)+' '+esc(gift.sponsor_name)+'</b>'+(gift.sponsor_address?'<small>⌖ '+esc(gift.sponsor_address)+'</small>':'')+(gift.sponsor_phone?'<a href="tel:+'+esc(digits)+'">☎ '+esc(gift.sponsor_phone)+'</a>':'')+(gift.sponsor_text?'<small>'+esc(gift.sponsor_text)+'</small>':'')+'</div>':'')+'</div></article>'}
  async function load(){try{const r=await fetch('/api/monthly-gift?ts='+Date.now(),{cache:'no-store'});gift=r.ok?await r.json():null}catch{gift=null}render()}
  function init(){load()}
  window.addEventListener('deva-language-change',render);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
