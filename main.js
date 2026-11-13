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
  let lastY = scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    const menuOpen = document.body.classList.contains('menu-open');
    header.classList.toggle('is-hidden', !menuOpen && y > 600 && y > lastY + 4);
    if (y < lastY - 4) header.classList.remove('is-hidden');
    toTop.classList.toggle('is-show', y > 900);
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

  /* ---------- T-shirt calculator ----------
     價格改這裡：單件價寫在 index.html 的 data-price；套組折扣規則在 dealFor() */
  const calc = $('#calc');
  if (calc) {
    const DOUBLE = 150, SHIP = 60, FREE_SHIP_MIN = 3; // 雙面 +$150／件；3 件以上免運
    const money = (n) => '$' + n.toLocaleString('en-US');
    const rows = $$('.calc-row[data-price]', calc);
    // PLAN A 彩色：1 人 $600、2 人 $1,200、3 人 $1,500、第 4 人起每位（人物或毛孩）+$400
    // PLAN A 單色線稿：1 人 $500、2 人 $1,000、3 人 $1,200、第 4 人起每位 +$300；特殊場景 +$800 起
    const PRICE = { color: { one: 600, three: 1500, extra: 400 }, mono: { one: 500, three: 1200, extra: 300 } };
    const designFor = (p, t) => (p <= 0 ? 0 : p === 1 ? t.one : p === 2 ? t.one * 2 : t.three + t.extra * (p - 3));
    const BG = 800;
    const dealFor = (n) => {
      if (n >= 8) return { name: '大家族價（每件 −$80＋免運）', off: 80 * n, freeShip: true };
      if (n >= 5) return { name: '全家福價（每件 −$50）', off: 50 * n };
      if (n === 4) return { name: '三人幸福價＋1 件', off: 202 };
      if (n === 3) return { name: '小家庭三人幸福價', off: 202 };
      if (n === 2) return { name: '情侶雙人套組', off: 126 };
      return { name: '套組優惠', off: 0 };
    };
    const update = () => {
      let n = 0, sub = 0;
      rows.forEach((r) => { const q = +$('output', r).value; n += q; sub += q * +r.dataset.price; });
      if ($('#calc-double').checked) sub += DOUBLE * n;
      const deal = dealFor(n);
      const freeShip = n >= FREE_SHIP_MIN || deal.freeShip;
      const ship = n === 0 || freeShip ? 0 : SHIP;
      $('#calc-sub').textContent = money(sub);
      $('#calc-deal-name').textContent = deal.name;
      $('#calc-deal').textContent = '−' + money(deal.off);
      $('#calc-ship').textContent = n && freeShip ? '免運' : money(ship);
      const people = +$('#calc-people output').value, pets = +$('#calc-pets output').value, bg = $('#calc-bg').checked;
      const t = $('#calc-mono').checked ? PRICE.mono : PRICE.color;
      $('#calc-people-note').textContent = `1 人 ${money(t.one)}・3 人 ${money(t.three)}`;
      $('#calc-pets-note').textContent = `+${money(t.extra)}／隻`;
      const design = designFor(people, t) + t.extra * pets + (bg ? BG : 0);
      $('#calc-design').textContent = money(design) + (bg ? ' 起' : '');
      $('#calc-total').textContent = money(design + sub - deal.off + ship) + (bg ? ' 起' : '');
    };
    calc.addEventListener('click', (e) => {
      const b = e.target.closest('[data-step]');
      if (!b) return;
      const out = $('output', b.parentElement);
      out.value = Math.min(30, Math.max(0, +out.value + +b.dataset.step));
      update();
    });
    $('#calc-double').addEventListener('change', update);
    $('#calc-bg').addEventListener('change', update);
    $('#calc-mono').addEventListener('change', update);
    update();
  }

  /* ---------- Swipe carousels on phones (plans + packages): dots indicator ---------- */
  const swipeDots = (grid, cardSel, label) => {
    if (!grid) return;
    const cards = $$(cardSel, grid);
    const dots = document.createElement('div');
    dots.className = 'swipe-dots';
    dots.setAttribute('aria-label', label + '切換');
    const pad = () => parseFloat(getComputedStyle(grid).scrollPaddingLeft) || 0;
    const posOf = (c) => c.offsetLeft - grid.offsetLeft - pad();
    cards.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', '第 ' + (i + 1) + ' 個' + label);
      b.addEventListener('click', () => grid.scrollTo({ left: posOf(c), behavior: 'smooth' }));
      dots.appendChild(b);
    });
    grid.after(dots);
    const sync = () => {
      const x = grid.scrollLeft;
      let best = 0, bestD = Infinity;
      cards.forEach((c, i) => { const d = Math.abs(posOf(c) - x); if (d < bestD) { bestD = d; best = i; } });
      if (x > 0 && x + grid.clientWidth >= grid.scrollWidth - 4) best = cards.length - 1;
      $$('button', dots).forEach((b, i) => b.classList.toggle('is-active', i === best));
    };
    grid.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    window.addEventListener('resize', sync);
    sync();
  };
  swipeDots($('.plans'), '.plan', '方案');
  swipeDots($('.pack-grid'), '.pack', '套組');

  /* ---------- Image protection: no right-click / drag on illustrations ---------- */
  const isProtected = (t) => t instanceof Element && (t.tagName === 'IMG' || t.closest('.w-item, .f-card, .hero-stage, .lightbox figure'));
  document.addEventListener('contextmenu', (e) => { if (isProtected(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart', (e) => { if (isProtected(e.target)) e.preventDefault(); });
  $$('img').forEach((img) => img.setAttribute('draggable', 'false'));
})();
