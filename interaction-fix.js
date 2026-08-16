/* DEVA interaction reliability patch — categories, product details, menu/contact. */
(() => {
  'use strict';

  const q = (s, root=document) => root.querySelector(s);
  const qa = (s, root=document) => Array.from(root.querySelectorAll(s));

  function normalizeId(v){ return String(v == null ? '' : v); }
  function findProduct(id){
    const data = window.DEVA_DATA;
    if(!data || !Array.isArray(data.products)) return null;
    const wanted = normalizeId(id);
    return data.products.find(p => normalizeId(p.id) === wanted) || null;
  }

  function safeOpenProduct(id){
    try {
      if(typeof window.openModal === 'function'){
        window.openModal(normalizeId(id));
        return true;
      }
    } catch(e){ console.warn('DEVA openModal fallback:', e); }

    // Standalone fallback in case the main click binding was interrupted.
    const p = findProduct(id);
    const modal = q('#modal');
    if(!p || !modal) return false;
    const main = q('#modalImg');
    if(main) main.src = p.image || (Array.isArray(p.images) ? p.images[0] : '') || '';
    const name = q('#modalName'); if(name) name.textContent = p.name || '';
    const cat = q('#modalCat'); if(cat) cat.textContent = p.category || '';
    const code = q('#modalCode'); if(code) code.textContent = 'CODE ' + String(p.code || p.product_code || '');
    const price = q('#modalPrice'); if(price) price.textContent = p.price || '';
    const wa = q('#modalWa');
    if(wa) wa.href = 'https://wa.me/9647509412626?text=' + encodeURIComponent('DEVA FURNITURE\nPRODUCT: ' + (p.name || ''));
    modal.classList.add('open');
    return true;
  }

  function safeSelectCategory(cat){
    const next = String(cat || 'all');
    try {
      if(typeof window.selectCategory === 'function'){
        window.selectCategory(next);
        return true;
      }
    } catch(e){ console.warn('DEVA selectCategory fallback:', e); }

    // Minimal standalone filter if the main handler is unavailable.
    qa('.product-card').forEach(card => {
      const p = findProduct(card.dataset.id);
      card.hidden = next !== 'all' && (!p || String(p.category) !== next);
    });
    q('#products')?.scrollIntoView({behavior:'smooth', block:'start'});
    return true;
  }

  function closeMainMenu(){
    q('#mainMenu')?.classList.remove('open');
    q('#mainMenuBackdrop')?.classList.remove('open');
    q('#mainMenu')?.setAttribute('aria-hidden','true');
    q('#mainMenuBtn')?.setAttribute('aria-expanded','false');
    document.body.classList.remove('menu-open');
  }

  // Capture phase makes these interactions work even if another handler stops bubbling.
  document.addEventListener('click', (e) => {
    const category = e.target.closest('.category-card');
    if(category){
      e.preventDefault();
      e.stopPropagation();
      safeSelectCategory(category.dataset.cat);
      return;
    }

    const details = e.target.closest('.view-btn');
    if(details){
      e.preventDefault();
      e.stopPropagation();
      safeOpenProduct(details.dataset.id);
      return;
    }

    // Make the whole product card open details, except interactive controls.
    const card = e.target.closest('.product-card');
    if(card && !e.target.closest('button,a,input,select,textarea')){
      e.preventDefault();
      safeOpenProduct(card.dataset.id);
      return;
    }

    const contact = e.target.closest('[data-action="contact"],a[href="#contact"]');
    if(contact){
      e.preventDefault();
      closeMainMenu();
      const footer = q('#contact');
      if(footer){
        history.replaceState(null, '', '#contact');
        requestAnimationFrame(() => footer.scrollIntoView({behavior:'smooth', block:'start'}));
      }
      return;
    }

    const hashLink = e.target.closest('a[href^="#"]');
    if(hashLink){
      const href = hashLink.getAttribute('href');
      if(href && href.length > 1){
        const target = q(href);
        if(target){
          e.preventDefault();
          closeMainMenu();
          history.replaceState(null, '', href);
          target.scrollIntoView({behavior:'smooth', block:'start'});
        }
      }
    }
  }, true);

  // Ensure an old loader can never block clicks after page load.
  window.addEventListener('load', () => {
    const loader = q('#loader');
    if(loader){
      loader.classList.add('hide');
      loader.style.pointerEvents = 'none';
      setTimeout(() => { loader.style.display = 'none'; }, 900);
    }
  });

  // Remove stale service-worker caches from older site versions once.
  if('serviceWorker' in navigator){
    navigator.serviceWorker.ready.then(() => {
      if('caches' in window){
        caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('deva-') && k !== 'deva-v13-interactions').map(k => caches.delete(k)))).catch(()=>{});
      }
    }).catch(()=>{});
  }
})();
