/* 檸檬手繪家 — interactions (vanilla JS, no dependencies) */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');

  // Contact links — 換成你的 LINE / IG 連結即可全站生效
  const LINKS = {
    line: 'https://line.me/ti/p/~komo2102',
    social: 'https://www.instagram.com/ball_ball_cute/',
  };
  const setExternal = (sel, url) => $$(sel).forEach((a) => { a.href = url; a.target = '_blank'; a.rel = 'noopener'; });
  setExternal('[data-line]', LINKS.line);
  setExternal('[data-social]', LINKS.social);

  /* ---------- In-page links: smooth scroll without adding #section to the address ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    const target = id === 'top' ? document.body : document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (id === 'top') scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });

  /* ---------- Build dynamic content ---------- */
  // Character marquee
  const charTrack = $('#charTrack');
  if (charTrack) {
    const chars = Array.from({ length: 21 }, (_, i) => `assets/chars/c${pad(i)}.webp`);
    const html = chars.map((src) => `<img src="${src}" alt="" loading="lazy" width="93" height="93">`).join('');
    charTrack.innerHTML = html + html.replace(/alt=""/g, 'alt="" aria-hidden="true"');
    charTrack.style.setProperty('--dur', '46s');
  }

  // Family grid
  const familyGrid = $('#familyGrid');
  // Order follows the staggered grid in Figma (1352:2110):
  // row 1 = illustrations, rows 2–3 = T-shirt mockups (full-bleed photos)
  const familyData = [
    ['f0', 'Happy Family 大家族合畫', ''],
    ['f1', 'Sweet Family 全家福', 'bg-beige'],
    ['f2', 'Happy Wedding 婚禮插畫', ''],
    ['tee-navy-longsleeve', '深藍長袖紀念 T 恤：正面小圖＋背面 Cute Family 合畫', 'photo'],
    ['tee-blue-back', '淺藍 T 恤背面 Happy Family 合畫', 'photo'],
    ['tee-beige-back', '米色 T 恤背面 Sweet Family 合畫', 'photo'],
    ['tee-navy-star-back', '深藍 T 恤背面 Cute Family 星星合畫', 'photo'],
    ['tee-blue-pair', '淺藍紀念 T 恤：正面小圖＋背面 Happy Family 合畫', 'photo'],
    ['tee-beige-pair', '米色紀念 T 恤：正面小圖＋背面 Sweet Family 合畫', 'photo'],
  ];
  if (familyGrid) {
    familyGrid.innerHTML = familyData
      .map(([f, alt, cls], i) => `<figure class="f-card ${cls} reveal" style="--d:${i % 3}" data-full="assets/family/${f}.webp" role="button" tabindex="0" aria-label="放大：${alt}"><img src="assets/family/${f}.webp" alt="${alt}" loading="lazy"></figure>`)
      .join('');
  }

  // Works wall: 4 rows, alternating direction
  const worksWall = $('#worksWall');
  const works = Array.from({ length: 46 }, (_, i) => `assets/works/w${pad(i)}.webp`);
  if (worksWall) {
    const rows = 4;
    const per = Math.ceil(works.length / rows);
    let out = '';
    for (let r = 0; r < rows; r++) {
      const set = works.slice(r * per, r * per + per);
      while (set.length < per) set.push(works[set.length]);
      const items = (hidden) => set.map((src) => `<button class="w-item" data-full="${src}" ${hidden ? 'tabindex="-1" aria-hidden="true"' : 'aria-label="放大作品"'}><img src="${src}" alt="${hidden ? '' : '家庭插畫作品'}" loading="lazy"></button>`).join('');
      out += `<div class="works-row marquee ${r % 2 ? 'reverse' : ''}"><div class="marquee-track" style="--dur:${60 + r * 8}s">${items(false)}${items(true)}</div></div>`;
    }
    worksWall.innerHTML = out;
  }

  document.documentElement.classList.remove('no-js');
  requestAnimationFrame(() => document.body.classList.add('is-loaded'));

  /* ---------- Reveal on scroll ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, .squiggle').forEach((el) => revealIO.observe(el));

  /* ---------- Header: shrink, hide on scroll down, scrollspy ---------- */
  const header = $('.site-header');
  const toTop = $('.to-top');
  const fab = $('.fab-line');
  let lastY = scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    const menuOpen = document.body.classList.contains('menu-open');
    header.classList.toggle('is-hidden', !menuOpen && y > 600 && y > lastY + 4);
    if (y < lastY - 4) header.classList.remove('is-hidden');
    toTop.classList.toggle('is-show', y > 900);
    fab.classList.toggle('is-show', y > 500);
    lastY = y;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  const navLinks = $$('.main-nav a');
  const spyIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['features', 'works', 'pricing', 'process', 'faq'].forEach((id) => { const s = document.getElementById(id); if (s) spyIO.observe(s); });

  /* ---------- Mobile menu ---------- */
  const toggle = $('.menu-toggle');
  const menu = $('#mobile-menu');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
    if (open) { menu.hidden = false; document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; setTimeout(() => { if (!document.body.classList.contains('menu-open')) menu.hidden = true; }, 250); }
  };
  toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('#mobile-menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false); });
  matchMedia('(min-width: 961px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });

  /* ---------- Hero slider ---------- */
  const slides = $$('.hero-slide');
  const dots = $$('.hero-dots button');
  let current = 0;
  let timer;
  const go = (i) => {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === current));
    dots.forEach((d, k) => { d.classList.toggle('is-active', k === current); d.setAttribute('aria-selected', String(k === current)); });
  };
  const play = () => { if (reduceMotion) return; clearInterval(timer); timer = setInterval(() => go(current + 1), 6000); };
  dots.forEach((d, k) => d.addEventListener('click', () => { go(k); play(); }));
  // swipe on touch
  const stage = $('.hero-stage');
  let sx = null;
  stage.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) { go(current + (dx < 0 ? 1 : -1)); play(); }
    sx = null;
  });
  document.addEventListener('visibilitychange', () => (document.hidden ? clearInterval(timer) : play()));
  play();

  /* ---------- Hero mouse parallax ---------- */
  const shell = $('.hero-shell');
  if (!reduceMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let raf = 0, tx = 0, ty = 0;
    shell.addEventListener('pointermove', (e) => {
      const r = shell.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    shell.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(apply); });
    function apply() {
      raf = 0;
      $$('.hero-slide.is-active [data-depth]').forEach((el) => {
        const d = +el.dataset.depth;
        el.style.translate = `${(-tx * 14 * d).toFixed(1)}px ${(-ty * 10 * d).toFixed(1)}px`;
      });
      $('.hero-tee').style.translate = `${(tx * 10).toFixed(1)}px ${(ty * 8).toFixed(1)}px`;
    }
  }

  /* ---------- FAQ: animated accordion + filters ---------- */
  const qas = $$('.qa');
  qas.forEach((qa) => {
    const summary = $('summary', qa);
    const body = $('.qa-body', qa);
    summary.addEventListener('click', (e) => {
      e.preventDefault();
      if (reduceMotion) { qa.open = !qa.open; return; }
      if (qa.open) {
        const h = body.scrollHeight;
        body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.22,.9,.3,1)' }).onfinish = () => { qa.open = false; };
      } else {
        qa.open = true;
        const h = body.scrollHeight;
        body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.22,.9,.3,1)' });
      }
    });
  });
  const filters = $$('.faq-filters button');
  filters.forEach((btn) => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filters.forEach((b) => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-selected', String(b === btn)); });
    qas.forEach((qa, i) => {
      const show = f === 'all' || qa.dataset.cat === f;
      qa.hidden = !show;
      if (show && !reduceMotion) qa.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: i * 40, easing: 'ease-out', fill: 'backwards' });
    });
  }));

  /* ---------- Lightbox ---------- */
  const lb = $('#lightbox');
  const lbImg = $('img', lb);
  const lbCount = $('.lb-count', lb);
  let group = [];
  let idx = 0;
  let lastFocus = null;
  const show = (i) => {
    idx = (i + group.length) % group.length;
    lbImg.src = group[idx];
    lbCount.textContent = `${idx + 1} / ${group.length}`;
  };
  const openLB = (list, i) => {
    group = list; lastFocus = document.activeElement;
    lb.hidden = false; document.body.style.overflow = 'hidden';
    show(i);
    requestAnimationFrame(() => lb.classList.add('is-open'));
    $('.lb-close', lb).focus();
  };
  const closeLB = () => {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { lb.hidden = true; lastFocus && lastFocus.focus(); }, 300);
  };
  document.addEventListener('click', (e) => {
    const work = e.target.closest('.w-item');
    if (work) { openLB(works, works.indexOf(work.dataset.full)); return; }
    const fam = e.target.closest('.f-card[data-full]');
    if (fam) {
      const list = $$('.f-card[data-full]').map((c) => c.dataset.full);
      openLB(list, list.indexOf(fam.dataset.full));
    }
  });
  // keyboard: Enter / Space on a family card opens it too
  document.addEventListener('keydown', (e) => {
    const fam = e.target.closest && e.target.closest('.f-card[data-full]');
    if (fam && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); fam.click(); }
  });
  $('.lb-close', lb).addEventListener('click', closeLB);
  $('.lb-prev', lb).addEventListener('click', () => show(idx - 1));
  $('.lb-next', lb).addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLB(); });
  addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLB();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  let lsx = null;
  lb.addEventListener('touchstart', (e) => { lsx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => { if (lsx == null) return; const dx = e.changedTouches[0].clientX - lsx; if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1)); lsx = null; });

  /* ---------- Image protection: no right-click / drag on illustrations ---------- */
  const isProtected = (t) => t instanceof Element && (t.tagName === 'IMG' || t.closest('.w-item, .f-card, .hero-stage, .lightbox figure'));
  document.addEventListener('contextmenu', (e) => { if (isProtected(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart', (e) => { if (isProtected(e.target)) e.preventDefault(); });
  $$('img').forEach((img) => img.setAttribute('draggable', 'false'));
})();
