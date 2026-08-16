/* DEVA mobile interaction reliability patch v5 — iOS/Android categories, details, contact. */
(() => {
  'use strict';
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const norm=v=>String(v==null?'':v);

  function closeMenu(){
    const panel=q('#mainMenu'), back=q('#mainMenuBackdrop'), btn=q('#mainMenuBtn');
    panel?.classList.remove('open'); back?.classList.remove('open');
    panel?.setAttribute('aria-hidden','true'); btn?.setAttribute('aria-expanded','false');
    document.body.classList.remove('menu-open');
  }
  function openCategory(cat){
    closeMenu();
    const c=norm(cat||'all');
    if(typeof window.selectCategory==='function') window.selectCategory(c);
    else {
      const f=qa('#filterButtons [data-cat],.filter[data-cat]').find(x=>norm(x.dataset.cat)===c);
      if(f) f.click();
      q('#products')?.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }
  function openDetails(id){
    closeMenu();
    const v=norm(id);
    if(!v) return;
    if(typeof window.openModal==='function'){ window.openModal(v); return; }
    const btn=qa('.view-btn').find(x=>norm(x.dataset.id)===v);
    if(btn) btn.click();
  }
  function openContact(){
    closeMenu();
    const m=q('#contactModal');
    if(m){
      m.classList.add('open'); m.setAttribute('aria-hidden','false');
      document.body.classList.add('modal-open');
      requestAnimationFrame(()=>m.querySelector('.contact-mobile-box')?.scrollTo({top:0}));
    } else q('#contact')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function closeContact(){
    const m=q('#contactModal');
    m?.classList.remove('open'); m?.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
  }
  function targetFromEvent(e){
    const t=e.target;
    if(t?.closest) return t;
    const p=e.composedPath?.();
    return p?.find(x=>x?.closest) || null;
  }
  function dispatch(e){
    const t=targetFromEvent(e); if(!t) return false;
    const close=t.closest('#contactModalClose');
    if(close){e.preventDefault();e.stopPropagation();closeContact();return true;}
    const cm=q('#contactModal'); if(cm && t===cm){e.preventDefault();closeContact();return true;}
    const contact=t.closest('[data-action="contact"],a[href="#contact"],#contactMenuLink');
    if(contact){e.preventDefault();e.stopPropagation();openContact();return true;}
    const details=t.closest('.view-btn,[data-action="details"]');
    if(details){e.preventDefault();e.stopPropagation();openDetails(details.dataset.id||details.closest('.product-card')?.dataset.id);return true;}
    const card=t.closest('.product-card');
    if(card && !t.closest('.wish-toggle,.compare-toggle,a,input,select,textarea,label')){
      e.preventDefault();e.stopPropagation();openDetails(card.dataset.id);return true;
    }
    const category=t.closest('.category-card,[data-cat].collection-card');
    if(category){e.preventDefault();e.stopPropagation();openCategory(category.dataset.cat);return true;}
    return false;
  }

  // iOS Safari can lose synthetic click events after overlays/scrolling. Handle touchend directly.
  let touchAt=0;
  document.addEventListener('touchend',e=>{ if(dispatch(e)) touchAt=Date.now(); },{capture:true,passive:false});
  document.addEventListener('click',e=>{ if(Date.now()-touchAt<700) return; dispatch(e); },true);

  function arm(){
    qa('.category-card,.product-card,.view-btn,[data-action="contact"],a[href="#contact"]').forEach(el=>{
      el.style.touchAction='manipulation';
      el.style.webkitTapHighlightColor='rgba(212,175,55,.18)';
      if(!el.hasAttribute('tabindex')&&!['A','BUTTON'].includes(el.tagName)) el.tabIndex=0;
    });
    // Never let invisible overlays block the page.
    const b=q('#mainMenuBackdrop'); if(b&&!b.classList.contains('open')) b.style.pointerEvents='none';
    const loader=q('#loader'); if(loader?.classList.contains('hide')) loader.style.pointerEvents='none';
  }
  new MutationObserver(arm).observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('DOMContentLoaded',arm,{once:true});
  window.addEventListener('load',()=>{
    arm();
    const loader=q('#loader');
    if(loader){loader.classList.add('hide');loader.style.pointerEvents='none';setTimeout(()=>loader.remove(),700);}
  });
  setTimeout(()=>{const l=q('#loader');if(l){l.style.pointerEvents='none';l.classList.add('hide');}},2500);

  // This release intentionally disables the old PWA worker while interaction fixes roll out.
  if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.unregister()))).catch(()=>{});}
  if('caches' in window){caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).catch(()=>{});}

  window.DEVA_MOBILE_INTERACTIONS={openCategory,openDetails,openContact,closeContact};
})();
