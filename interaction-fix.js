/* DEVA mobile interaction reliability patch — categories, details, contact. */
(() => {
  'use strict';
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const norm=v=>String(v==null?'':v);
  const data=()=>window.DEVA_DATA||{};
  const findProduct=id=>Array.isArray(data().products)?data().products.find(p=>norm(p.id)===norm(id)):null;

  function closeMenu(){
    q('#mainMenu')?.classList.remove('open');
    q('#mainMenuBackdrop')?.classList.remove('open');
    q('#mainMenu')?.setAttribute('aria-hidden','true');
    q('#mainMenuBtn')?.setAttribute('aria-expanded','false');
    document.body.classList.remove('menu-open');
  }

  function openCategory(cat){
    closeMenu();
    const next=norm(cat||'all');
    try{ if(typeof window.selectCategory==='function'){ window.selectCategory(next); return true; } }catch(e){console.warn(e)}
    qa('.product-card').forEach(card=>{
      const p=findProduct(card.dataset.id);
      card.hidden=next!=='all'&&(!p||norm(p.category)!==next);
    });
    q('#products')?.scrollIntoView({behavior:'smooth',block:'start'});
    return true;
  }

  function openDetails(id){
    closeMenu();
    try{ if(typeof window.openModal==='function'){ window.openModal(norm(id)); return true; } }catch(e){console.warn(e)}
    const p=findProduct(id), modal=q('#modal');
    if(!p||!modal) return false;
    const img=q('#modalImg'); if(img) img.src=p.image||p.images?.[0]||'';
    const name=q('#modalName'); if(name) name.textContent=p.name||'';
    const cat=q('#modalCat'); if(cat) cat.textContent=p.category||'';
    const code=q('#modalCode'); if(code) code.textContent='CODE '+norm(p.code||p.product_code||'');
    const price=q('#modalPrice'); if(price) price.textContent=p.price||'';
    const wa=q('#modalWa'); if(wa) wa.href='https://wa.me/9647509412626?text='+encodeURIComponent('DEVA FURNITURE\nPRODUCT: '+(p.name||''));
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    return true;
  }

  function openContact(){
    closeMenu();
    const m=q('#contactModal');
    if(m){
      m.classList.add('open'); m.setAttribute('aria-hidden','false');
      document.body.classList.add('modal-open');
      return true;
    }
    q('#contact')?.scrollIntoView({behavior:'smooth',block:'start'});
    return true;
  }
  function closeContact(){
    const m=q('#contactModal');
    if(m){m.classList.remove('open');m.setAttribute('aria-hidden','true')}
    document.body.classList.remove('modal-open');
  }

  let lastHandled=0;
  function handle(e){
    if(!e.target || !e.target.closest) return;
    const now=Date.now();
    if(e.type==='click' && now-lastHandled<450) return;
    const cat=e.target.closest('.category-card,[data-cat].collection-card');
    if(cat){ e.preventDefault(); e.stopPropagation(); lastHandled=now; openCategory(cat.dataset.cat); return; }
    const details=e.target.closest('.view-btn,[data-action="details"]');
    if(details){ e.preventDefault(); e.stopPropagation(); lastHandled=now; openDetails(details.dataset.id||details.closest('.product-card')?.dataset.id); return; }
    const card=e.target.closest('.product-card');
    if(card && !e.target.closest('button,a,input,select,textarea,label')){ e.preventDefault(); e.stopPropagation(); lastHandled=now; openDetails(card.dataset.id); return; }
    const contact=e.target.closest('[data-action="contact"],a[href="#contact"],#contactMenuLink');
    if(contact){ e.preventDefault(); e.stopPropagation(); lastHandled=now; openContact(); return; }
    if(e.target.closest('#contactModalClose')){ e.preventDefault(); lastHandled=now; closeContact(); return; }
    const cm=q('#contactModal'); if(cm && e.target===cm){ closeContact(); return; }
  }

  // pointerup is the most reliable unified event for iOS/Android; click remains as fallback.
  document.addEventListener('pointerup', handle, true);
  document.addEventListener('click', handle, true);

  // Make touch targets explicitly interactive on mobile.
  function arm(){
    qa('.category-card,.product-card,.view-btn,[data-action="contact"],a[href="#contact"]').forEach(el=>{
      el.style.touchAction='manipulation';
      if(!el.hasAttribute('tabindex') && !['A','BUTTON'].includes(el.tagName)) el.setAttribute('tabindex','0');
    });
  }
  new MutationObserver(arm).observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('DOMContentLoaded',arm,{once:true});
  window.addEventListener('load',()=>{
    arm();
    const loader=q('#loader'); if(loader){loader.classList.add('hide');loader.style.pointerEvents='none';setTimeout(()=>loader.style.display='none',500)}
  });

  // Remove stale SW/cache so phones don't keep an old broken interaction bundle.
  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.unregister()))).catch(()=>{});
  }
  if('caches' in window){ caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).catch(()=>{}); }

  window.DEVA_MOBILE_INTERACTIONS={openCategory,openDetails,openContact};
})();
