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
    social: 'https://www.instagram.com/lemonhomeme/',
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
    ['art-happy-family-hd', 'Happy Family 大家族合畫', 'photo'],
    ['art-sweet-family-hd', 'Sweet Family 全家福', 'photo'],
    ['art-wedding-hd', 'Happy Wedding 婚禮插畫', 'photo'],
    ['frame-love-mom-hd', '木框插畫：Love Mom 媽媽與家人、毛孩', 'photo'],
    ['art-peanut-mom-hd', '尊貴の花生媽媽：夫妻與寶寶的期待插畫', 'photo'],
    ['art-jojo-birthday-hd', 'JoJo 20 歲生日插畫：坐在草莓蛋糕上', 'photo'],
    ['frame-cat-temple-hd', '木框插畫：噗萶宮 毛孩大合照與主人', 'photo'],
    ['frame-family-cats-hd', '木框插畫：一家四口與貓咪', 'photo'],
    ['art-pop-family-hd', '普普風全家福：爸爸、媽媽和寶寶揮手打招呼', 'photo'],
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
      const items = (hidden) => set.map((src) => `<button class="w-item" data-full="${src}" ${hidden ? 'tabindex="-1" aria-hidden="true"' : 'aria-label="放大作品"'}><img src="${src}" alt="${hidden ? '' : 'Q 版家庭似顏繪插畫作品'}" loading="lazy"></button>`).join('');
      out += `<div class="works-row marquee ${r % 2 ? 'reverse' : ''}"><div class="marquee-track" style="--dur:${60 + r * 8}s">${items(false)}${items(true)}</div></div>`;
    }
    worksWall.innerHTML = out;
  }

  // 第一屏的內容直接顯示、不做淡入：換頁時才不會先閃一下、空白再慢慢浮現
  const firstScreen = innerHeight;
  $$('.reveal, .squiggle').forEach((el) => {
    if (el.getBoundingClientRect().top < firstScreen) el.classList.add('is-in', 'no-anim');
  });
  document.documentElement.classList.remove('no-js');
  requestAnimationFrame(() => {
    document.body.classList.add('is-loaded');
    requestAnimationFrame(() => $$('.no-anim').forEach((el) => el.classList.remove('no-anim')));
  });

  /* ---------- Reveal on scroll ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, .squiggle').forEach((el) => { if (!el.classList.contains('is-in')) revealIO.observe(el); });

  /* ---------- Header: shrink, hide on scroll down, scrollspy ---------- */
  const header = $('.site-header');
  const toTop = $('.to-top');
  let lastY = scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    const menuOpen = document.body.classList.contains('menu-open');
    // 往下滑收起、往上滑出現（只在累積位移超過 6px 才切換，避免慢慢滑時忽隱忽現）
    const hideAfter = innerWidth <= 960 ? 120 : 600;
    const dy = y - lastY;
    if (menuOpen || y < hideAfter) header.classList.remove('is-hidden');
    else if (dy > 6) header.classList.add('is-hidden');
    else if (dy < -6) header.classList.remove('is-hidden');
    toTop.classList.toggle('is-show', y > 900);
    if (Math.abs(dy) > 6 || y < hideAfter) lastY = y;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  const navLinks = $$('.main-nav a[href^="#"]');
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
  if (stage) {
  stage.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) { go(current + (dx < 0 ? 1 : -1)); play(); }
    sx = null;
  });
  document.addEventListener('visibilitychange', () => (document.hidden ? clearInterval(timer) : play()));
  play();
  }

  /* ---------- Hero mouse parallax ---------- */
  const shell = $('.hero-shell');
  if (shell && !reduceMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
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
  if (lb) {
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
    // family cards are pre-rounded artwork: match their corner radius so no white shows
    lb.classList.toggle('is-family', list.length > 0 && list[0].includes('assets/family/'));
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
  }

  /* ---------- PLAN B 周邊分頁（零錢包／帆布包／T 恤） ---------- */
  const pbTabs = $('.pb-tabs');
  if (pbTabs) {
    const tabs = $$('[role="tab"]', pbTabs);
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        $('#' + t.getAttribute('aria-controls')).hidden = !on;
      });
      $$('[data-pb-for]').forEach((el) => { el.hidden = el.dataset.pbFor !== tab.getAttribute('aria-controls'); });
      if (focus) tab.focus();
    };
    pbTabs.addEventListener('click', (e) => { const t = e.target.closest('[role="tab"]'); if (t) select(t); });
    pbTabs.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); }
      if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
      if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
    });
    // 連到 #packages 或 #pb-tee 時自動切到 T 恤分頁
    const openFromHash = () => { if (/^#(packages|pb-tee)$/.test(location.hash)) select($('#pb-tab-tee')); };
    openFromHash(); window.addEventListener('hashchange', openFromHash);
  }

  /* ---------- T-shirt calculator ----------
     價格改這裡：單件價寫在 index.html 的 data-price；套組折扣規則在 dealFor() */
  const calc = $('#calc');
  if (calc) {
    const DOUBLE = 40, SHIP = 60, FREE_SHIP_MIN = 5, FREE_SHIP_TEE = 6, RUSH_RATE = 0.2; // 雙面 +$40／件；零錢包・帆布包・相框合計 5 件以上免運，T 恤 6 件以上免運
    const money = (n) => '$' + n.toLocaleString('en-US');
    const rows = $$('.calc-row[data-price]', calc);
    // PLAN A 彩色：1 人 $600、2 人 $1,200、3 人 $1,500、第 4 人起每位（人物或毛孩）+$400
    // PLAN A 單色線稿：1 人 $500、2 人 $1,000、3 人 $1,200、第 4 人起每位 +$400；特殊場景 +$800 起
    const PRICE = { color: { one: 600, three: 1500, extra: 400 }, mono: { one: 500, three: 1200, extra: 400 } };
    const designFor = (p, t) => (p <= 0 ? 0 : p === 1 ? t.one : p === 2 ? t.one * 2 : t.three + t.extra * (p - 3));
    const BG = 800;
    const dealFor = (n) => {
      if (n >= 10) return { name: '大家族價（每件 −$40＋免運）', off: 40 * n, freeShip: true };
      if (n >= 4) return { name: '四人以上暖心價（每件 −$20）', off: 20 * n };
      if (n === 3) return { name: '小家庭三人幸福價', off: 80 };
      if (n === 2) return { name: '情侶雙人套組', off: 60 };
      return { name: '套組優惠', off: 0 };
    };
    let state = null;
    let quoteBlob = null;
    const quoteBox = $('#calc-quote'), quoteImg = $('#calc-quote-img');
    const dlBtn = $('#calc-download-btn'), errBox = $('#calc-error');
    const resetQuote = () => {
      if (!quoteBlob) return;
      quoteBlob = null;
      if (quoteImg.src) URL.revokeObjectURL(quoteImg.src);
      quoteImg.removeAttribute('src');
      quoteBox.hidden = true; dlBtn.hidden = true;
    };
    // goods.html 用 data-mode="goods"：沒有 T 恤套組優惠；運費 $60／筆，免運規則同上
    const goodsMode = calc.dataset.mode === 'goods';
    const update = () => {
      let n = 0, teeN = 0, sub = 0, teeSub = 0;
      const items = rows.map((r) => ({ name: r.dataset.name || '', price: +r.dataset.price, qty: +$('output', r).value, tee: r.hasAttribute('data-tee') }));
      items.forEach((it) => { n += it.qty; sub += it.qty * it.price; if (it.tee) { teeN += it.qty; teeSub += it.qty * it.price; } });
      const double = $('#calc-double').checked;
      if (double) { sub += DOUBLE * teeN; teeSub += DOUBLE * teeN; }
      const deal = goodsMode ? { name: '', off: 0 } : dealFor(teeN); // 套組優惠只算 T 恤件數
      const freeShip = (n - teeN) >= FREE_SHIP_MIN || teeN >= FREE_SHIP_TEE || deal.freeShip;
      const ship = n === 0 || freeShip ? 0 : SHIP;
      // 衣服印刷急件：T 恤印製費（扣掉套組優惠後）+20%
      const rush = !!($('#calc-rush') && $('#calc-rush').checked && teeN);
      const rushFee = rush ? Math.round((teeSub - deal.off) * RUSH_RATE) : 0;
      if ($('#calc-rush-row')) { $('#calc-rush-row').hidden = !rush; $('#calc-rush-fee').textContent = '+' + money(rushFee); }
      $('#calc-sub').textContent = money(sub);
      if ($('#calc-deal')) { $('#calc-deal-name').textContent = deal.name; $('#calc-deal').textContent = '−' + money(deal.off); }
      $('#calc-ship').textContent = n && freeShip ? '免運' : money(ship);
      const people = +$('#calc-people output').value, pets = +$('#calc-pets output').value, bg = $('#calc-bg').checked;
      const t = $('#calc-mono').checked ? PRICE.mono : PRICE.color;
      $('#calc-people-note').textContent = `1 人 ${money(t.one)}・3 人 ${money(t.three)}`;
      $('#calc-pets-note').textContent = `+${money(t.extra)}／隻`;
      const design = designFor(people, t) + t.extra * pets + (bg ? BG : 0);
      $('#calc-design').textContent = money(design) + (bg ? ' 起' : '');
      $('#calc-total').textContent = money(design + sub - deal.off + rushFee + ship) + (bg ? ' 起' : '');
      state = { people, pets, pets_unit: t.extra, mono: $('#calc-mono').checked, bg, items,
        double, teeN, n, sub, deal, ship, rush, rushFee, freeShip: n > 0 && freeShip, designPeople: designFor(people, t), design,
        total: design + sub - deal.off + rushFee + ship };
      resetQuote();
    };
    calc.addEventListener('click', (e) => {
      const b = e.target.closest('[data-step]');
      if (!b) return;
      const out = $('output', b.parentElement);
      out.value = Math.min(30, Math.max(0, +out.value + +b.dataset.step));
      update();
    });
    $('#calc-double').addEventListener('change', update);
    if ($('#calc-rush')) $('#calc-rush').addEventListener('change', update);
    $('#calc-bg').addEventListener('change', update);
    $('#calc-mono').addEventListener('change', update);
    update();

    /* ---------- 試算結果 → 帶入預填表單 ---------- */
    const fillBtn = $('#calc-fill-btn');
    if (fillBtn) fillBtn.addEventListener('click', () => {
      const f = $('#orderForm');
      if (!f || !state) return;
      f.elements.people.value = state.people || '';
      f.elements.pets.value = state.pets || '';
      $$('input[name="style"]', f).forEach((r) => { r.checked = r.value === (state.mono ? '單色線稿' : '彩色'); });
      const map = { '防水零錢包': ['防水零錢包', 'q_purse'], '側背帆布小包': ['側背帆布小包', 'q_tote'], '實木相框（含印刷）': ['實木相框', 'q_frame'] };
      const picked = new Set();
      const teeTypes = new Set();
      ['q_purse', 'q_tote', 'q_frame'].forEach((k) => { f.elements[k].value = 0; });
      state.items.forEach((it) => {
        if (!it.qty) return;
        if (it.tee) { picked.add('紀念 T 恤'); teeTypes.add(it.name); return; }
        const [label, field] = map[it.name] || [it.name];
        picked.add(label);
        if (field) f.elements[field].value = it.qty;
      });
      if (state.double && state.teeN) teeTypes.add('雙面印製');
      if (!state.n) picked.add('只要插畫電子檔');
      $$('input[name="goods"]', f).forEach((c) => { c.checked = picked.has(c.value); });
      $$('input[name="tee_type"]', f).forEach((c) => { c.checked = teeTypes.has(c.value); });
      f.elements.qty.value = state.teeN ? `T 恤共 ${state.teeN} 件（成人／兒童件數請在上方選，尺寸私訊告知）${state.rush ? '，需衣服急件' : ''}` : '';
      f.dispatchEvent(new Event('change'));
      if (state.bg && !f.elements.note.value.includes('特殊場景')) f.elements.note.value = ('想加特殊場景／背景。' + f.elements.note.value).trim();
      if ($('#orderBox')) $('#orderBox').open = true;
      $('#order-form').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });

    /* ---------- Quote sheet (JPG) ----------
       「製作報價單」把目前的選擇畫成一張報價單圖片；「下載報價」存成 JPG */
    const QUOTE_NOTES = [
      ['', '基本授權為個人與家庭紀念使用。若要用於商品販售、廣告等商業用途，請先告知用途，授權範圍與費用另議噢'],
      ['提供檔案', '彩色高解析 JPG、透明高解析背景 PNG，符合印製需求。'],
      ['修改次數', '含初稿2回合小修、印製前2回合視覺微調，超過另計 $300／次；插畫 1.5 週內，加值客製商品 2 週內'],
      ['原始檔及使用授權', '可編輯 AI／PSD 原始檔加購 $500；商業用途與授權另議。'],
      ['費用付款', '設計啟動前先付款項，即可進行！'],
    ];
    const pad2 = (v) => String(v).padStart(2, '0');
    const loadImg = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
    const wrap = (ctx, text, maxW) => {
      const lines = []; let line = '';
      for (const ch of text) {
        if (ctx.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch.trim() ? ch : ''; }
        else line += ch;
      }
      if (line) lines.push(line);
      return lines;
    };
    const drawQuote = async () => {
      const q = state, now = new Date();
      const date = `${now.getFullYear()}/${pad2(now.getMonth() + 1)}/${pad2(now.getDate())}`;
      const no = `LM-${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}-${pad2(now.getHours())}${pad2(now.getMinutes())}`;
      const TC = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
      const EN = '"Montserrat", "Noto Sans TC", sans-serif';
      try { await Promise.all([`400 20px ${TC}`, `700 20px ${TC}`, `900 20px ${TC}`, `800 20px ${EN}`, `700 20px ${EN}`].map((f) => document.fonts.load(f, '報價$0'))); } catch (e) {}
      const logo = await loadImg('assets/logo.webp');

      // rows to print
      const A = [], B = [];
      if (q.people || q.pets || q.bg) {
        A.push([q.mono ? '版本：單色線稿' : '版本：彩色版本', '', '']);
        if (q.people) A.push([`人物 ${q.people} 位`, q.people >= 3 ? '3 人合畫優惠' + (q.people > 3 ? `＋${q.people - 3} 位` : '') : '', money(q.designPeople)]);
        if (q.pets) A.push([`毛孩 ${q.pets} 隻`, `${money(q.pets_unit)} × ${q.pets}`, money(q.pets_unit * q.pets)]);
        if (q.bg) A.push(['特殊場景（需討論）', '依複雜度另議', '+$800 起']);
      }
      if (q.n) {
        q.items.forEach((it) => { if (it.qty) B.push([`${it.name} ${it.qty} 件`, `${money(it.price)} × ${it.qty}`, money(it.price * it.qty)]); });
        if (q.double && q.teeN) B.push([`${goodsMode ? 'T 恤' : ''}升級雙面印製 ${q.teeN} 件`, `${money(DOUBLE)} × ${q.teeN}`, money(DOUBLE * q.teeN)]);
        if (q.deal.off) B.push([q.deal.name, '套組優惠', '−' + money(q.deal.off)]);
        if (q.rush) B.push(['衣服印刷急件費', '+20%，加急件減 3 個工作天', '+' + money(q.rushFee)]);
        B.push(['店到店運費', q.freeShip ? (q.deal.freeShip ? '大家族價免運' : q.teeN >= FREE_SHIP_TEE ? 'T 恤 6 件以上免運' : '周邊 5 件以上免運') : '本島一般超商店到店', q.freeShip ? '免運' : money(q.ship)]);
      }

      const W = 1080, P = 72, CW = W - P * 2;
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      // measure notes height first
      ctx.font = `400 26px ${TC}`;
      const noteBlocks = QUOTE_NOTES.map(([t, body], i) => {
        const head = `${i + 1}. ${t ? t : ''}`;
        const lines = wrap(ctx, body, CW - 40);
        return { head, lines, h: (t ? 40 : 0) + lines.length * 40 + 18 };
      });
      const rowH = 64;
      let H = 250 + 40;
      if (A.length) H += 70 + A.length * rowH + 74;
      if (B.length) H += 70 + B.length * rowH + 74;
      H += 150 + 60 + 60 + noteBlocks.reduce((a, b) => a + b.h, 0) + 170;
      const S = 1.5; // render at 1.5x for a crisp JPG
      c.width = W * S; c.height = H * S; ctx.scale(S, S);

      const NAVY = '#2d4970', INK = '#2b2b2b', INK2 = '#555555', BEIGE = '#faf5ef', LIME = '#cde36f', LINE = '#e7e1da';
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
      // header band
      ctx.fillStyle = BEIGE; ctx.fillRect(0, 0, W, 250);
      if (logo) ctx.drawImage(logo, P, 56, 214, 77);
      ctx.fillStyle = NAVY; ctx.font = `700 34px ${TC}`; ctx.textBaseline = 'alphabetic';
      ctx.fillText('檸檬手繪家', P + 228, 112);
      ctx.font = `900 30px ${TC}`; ctx.fillStyle = INK2;
      ctx.fillText('家庭插畫客製・紀念 T 恤', P, 196);
      ctx.textAlign = 'right';
      ctx.fillStyle = NAVY; ctx.font = `900 64px ${TC}`; ctx.fillText('報價單', W - P, 116);
      ctx.font = `400 24px ${TC}`; ctx.fillStyle = INK2;
      ctx.fillText(`報價日期　${date}`, W - P, 166);
      ctx.fillText(`報價編號　${no}`, W - P, 202);
      ctx.textAlign = 'left';

      let y = 250 + 40;
      const section = (title, rowsArr, subtotalLabel, subtotal) => {
        ctx.fillStyle = LIME; ctx.beginPath(); ctx.roundRect(P, y + 6, 10, 40, 5); ctx.fill();
        ctx.fillStyle = NAVY; ctx.font = `900 32px ${TC}`; ctx.fillText(title, P + 26, y + 38);
        y += 70;
        ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(P, y - 8); ctx.lineTo(W - P, y - 8); ctx.stroke();
        rowsArr.forEach(([label, note, amt]) => {
          ctx.fillStyle = INK; ctx.font = `700 27px ${TC}`; ctx.fillText(label, P, y + 40);
          if (note) { ctx.fillStyle = INK2; ctx.font = `400 22px ${TC}`; ctx.fillText(note, P + 360, y + 40); }
          if (amt) { ctx.textAlign = 'right'; ctx.fillStyle = INK; ctx.font = `700 28px ${EN}`; ctx.fillText(amt, W - P, y + 40); ctx.textAlign = 'left'; }
          ctx.strokeStyle = LINE; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(P, y + rowH - 2); ctx.lineTo(W - P, y + rowH - 2); ctx.stroke();
          y += rowH;
        });
        ctx.textAlign = 'right';
        ctx.fillStyle = INK2; ctx.font = `700 24px ${TC}`; ctx.fillText(subtotalLabel, W - P - 200, y + 46);
        ctx.fillStyle = NAVY; ctx.font = `800 32px ${EN}`; ctx.fillText(subtotal, W - P, y + 46);
        ctx.textAlign = 'left';
        y += 74;
      };
      if (A.length) section('PLAN A 插畫設計', A, '插畫設計費', money(q.design) + (q.bg ? ' 起' : ''));
      if (B.length) section(calc.dataset.planB || 'PLAN B T-Shirt 印製', B, calc.dataset.subLabel || 'T 恤小計', money(q.sub - q.deal.off + q.rushFee + q.ship));

      // total box
      ctx.fillStyle = '#ffe04b'; ctx.beginPath(); ctx.roundRect(P, y, CW, 120, 28); ctx.fill();
      ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = NAVY; ctx.font = `900 34px ${TC}`; ctx.fillText('預估總計', P + 40, y + 74);
      ctx.textAlign = 'right'; ctx.font = `800 58px ${EN}`;
      ctx.fillText(money(q.total) + (q.bg ? ' 起' : ''), W - P - 40, y + 82); ctx.textAlign = 'left';
      y += 150;

      // notes
      ctx.fillStyle = NAVY; ctx.font = `900 30px ${TC}`; ctx.fillText('注意事項', P, y + 30);
      y += 60;
      noteBlocks.forEach(({ head, lines }, i) => {
        const hasTitle = !!QUOTE_NOTES[i][0];
        ctx.fillStyle = INK; ctx.font = `700 26px ${TC}`;
        if (hasTitle) { ctx.fillText(head, P, y + 28); y += 40; }
        ctx.font = `400 26px ${TC}`; ctx.fillStyle = INK2;
        lines.forEach((ln, k) => {
          if (!hasTitle && k === 0) { ctx.fillStyle = INK; ctx.font = `700 26px ${TC}`; ctx.fillText('1.', P, y + 28); ctx.font = `400 26px ${TC}`; ctx.fillStyle = INK2; }
          ctx.fillText(ln, P + 40, y + 28); y += 40;
        });
        y += 18;
      });

      // footer
      y += 30;
      ctx.fillStyle = BEIGE; ctx.fillRect(0, y, W, H - y);
      ctx.fillStyle = '#c0563b'; ctx.font = `700 24px ${TC}`;
      ctx.fillText('＊此為網站線上試算，實際金額以私訊確認的報價為準。', P, y + 52);
      ctx.fillStyle = NAVY; ctx.font = `700 26px ${TC}`;
      ctx.fillText('LINE ID：komo2102　｜　IG：@ball_ball_cute', P, y + 100);

      return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.92));
    };
    $('#calc-quote-btn').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      if (!state || (!state.people && !state.pets && !state.n)) { errBox.hidden = false; return; }
      errBox.hidden = true;
      btn.disabled = true; btn.textContent = '製作中…';
      try {
        const blob = await drawQuote();
        if (quoteImg.src) URL.revokeObjectURL(quoteImg.src);
        quoteBlob = blob;
        quoteImg.src = URL.createObjectURL(blob);
        quoteBox.hidden = false; dlBtn.hidden = false;
        quoteBox.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
      } finally { btn.disabled = false; btn.textContent = '製作報價單'; }
    });
    dlBtn.addEventListener('click', () => {
      if (!quoteBlob) return;
      const now = new Date();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(quoteBlob);
      a.download = `檸檬手繪家報價單-${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}.jpg`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    });
    calc.addEventListener('click', (e) => { if (e.target.closest('[data-step]')) errBox.hidden = true; });
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
      $$('button', dots).forEach((b, i) => { b.classList.toggle('is-active', i === best); b.setAttribute('aria-current', String(i === best)); });
    };
    grid.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    window.addEventListener('resize', sync);
    sync();
  };
  swipeDots($('.plans'), '.plan', '方案');

  /* ---------- Info dialogs (印刷工法介紹): open via [data-open-dialog], close via × / backdrop / Esc ---------- */
  $$('[data-open-dialog]').forEach((btn) => {
    const dlg = document.getElementById(btn.dataset.openDialog);
    if (!dlg || typeof dlg.showModal !== 'function') return;
    btn.addEventListener('click', () => dlg.showModal());
    $$('[data-close-dialog]', dlg).forEach((x) => x.addEventListener('click', () => dlg.close()));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  });

  /* ---------- Goods detail photo sliders: dots + gentle autoplay ---------- */
  $$('.gp-slider').forEach((fig) => {
    const track = $('.gp-slides', fig);
    const slides = $$('img', track);
    if (slides.length < 2) return;
    const dots = document.createElement('div');
    dots.className = 'gp-dots';
    dots.setAttribute('aria-label', '照片切換');
    let cur = 0, timer = null;
    const go = (i) => track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
    const stop = () => { clearInterval(timer); timer = null; };
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', '第 ' + (i + 1) + ' 張照片');
      b.addEventListener('click', () => { stop(); go(i); });
      dots.appendChild(b);
    });
    fig.after(dots);
    if (fig.hasAttribute('data-arrows')) {
      [['prev', '上一張', -1], ['next', '下一張', 1]].forEach(([cls, label, step]) => {
        const a = document.createElement('button');
        a.type = 'button';
        a.className = 'gp-arrow gp-' + cls;
        a.setAttribute('aria-label', label);
        a.addEventListener('click', () => { stop(); go((cur + step + slides.length) % slides.length); });
        fig.appendChild(a);
      });
    }
    const sync = () => {
      cur = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      $$('button', dots).forEach((b, i) => { b.classList.toggle('is-active', i === cur); b.setAttribute('aria-current', String(i === cur)); });
    };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) timer = setInterval(() => go((cur + 1) % slides.length), 4500);
    ['pointerdown', 'touchstart', 'wheel'].forEach((ev) => track.addEventListener(ev, stop, { passive: true }));
    track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    window.addEventListener('resize', () => { track.scrollLeft = cur * track.clientWidth; });
    sync();
  });
  swipeDots($('.pack-grid'), ':scope > .pack, :scope > .pack-stack', '套組');
  swipeDots($('.gd-grid'), '.gd-card', '商品');

  /* ---------- Goods page: gallery thumbnails swap the main image ---------- */
  $$('.g-gallery').forEach((g) => {
    const main = $('.g-main img', g);
    const thumbs = $$('.g-thumbs button', g);
    thumbs.forEach((t) => t.addEventListener('click', () => {
      main.src = t.dataset.src;
      main.alt = t.getAttribute('aria-label') || '';
      thumbs.forEach((b) => b.classList.toggle('is-active', b === t));
    }));
  });

  /* ---------- Image protection: no right-click / drag on illustrations ---------- */
  const isProtected = (t) => t instanceof Element && !t.closest('.calc-quote') && (t.tagName === 'IMG' || t.closest('.w-item, .f-card, .hero-stage, .lightbox figure'));
  document.addEventListener('contextmenu', (e) => { if (isProtected(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart', (e) => { if (isProtected(e.target)) e.preventDefault(); });
  $$('img').forEach((img) => img.setAttribute('draggable', 'false'));

  /* ---------- Tab Bar：點目前所在的分頁 → 捲回頂端（iOS 慣例） ---------- */
  $$('.tab-bar a[aria-current="page"]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }));
  /* Tab Bar：頁面載完後，先把其他分頁的 HTML 抓進瀏覽器快取，點下面分頁時換頁更快（省流量模式不抓） */
  addEventListener('load', () => setTimeout(() => {
    if (navigator.connection && navigator.connection.saveData) return;
    $$('.tab-bar a:not([aria-current])').forEach((a) => { fetch(a.href, { credentials: 'same-origin' }).catch(() => {}); });
  }, 2000));
  /* ---------- 送禮截止日提醒 ----------
     每個節日：想收到的日期 receive，以及各品項「最晚付款日」。過了最後一個日期就自動換下一個節日；全部過了就隱藏。
     估算方式：插畫 1.5 週 ＋ 周邊 7 個工作天／T 恤 10～13 個工作天 ＋ 超商運送約 3 天 */
  const GIFT_DEADLINES = [
    { name: '聖誕節', receive: '2026-12-24', rows: [
      ['插畫電子檔', '2026-12-11'],
      ['零錢包・帆布包・相框', '2026-11-28'],
      ['紀念 T 恤', '2026-11-26', '需加衣服急件'],
    ] },
    { name: '農曆春節', receive: '2027-02-02', rows: [
      ['插畫電子檔', '2027-01-22'],
      ['零錢包・帆布包・相框', '2027-01-08'],
      ['紀念 T 恤', '2026-12-31'],
    ] },
    { name: '母親節', receive: '2027-05-07', rows: [
      ['插畫電子檔', '2027-04-23'],
      ['零錢包・帆布包・相框', '2027-04-09'],
      ['紀念 T 恤', '2027-03-31'],
    ] },
  ];
  // 在預填表單「希望收到的日期」下方列出最近節日的最晚付款日
  const deadlineNote = $('#orderDeadline');
  if (deadlineNote) {
    const day = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
    const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const md = (iso) => { const d = day(iso); return `${d.getMonth() + 1}/${d.getDate()}`; };
    const ev = GIFT_DEADLINES.find((e) => e.rows.some((r) => day(r[1]) >= today));
    if (ev) {
      const items = ev.rows.map(([label, iso, extra]) => (day(iso) < today
        ? `<li class="is-over">${label}：已截止，可私訊詢問能否加急</li>`
        : `<li>${label}：<b>${md(iso)}</b> 前確認</li>`)).join('');
      deadlineNote.innerHTML = `⏰ <b>${ev.name}送禮提醒</b>｜想在 ${md(ev.receive)} 前收到商品，請在以下日期前確認品項！商品出貨才來得及喔！<ul>${items}</ul>`;
      deadlineNote.hidden = false;
    }
  }

  /* ---------- 預填表單 ----------
     endpoint 留空：送出後整理成文字，讓客人複製到 LINE。
     之後接上 Email（例如 Google Apps Script 網址）時，填入 endpoint 即可，表單會以 POST 送出。 */
  const ORDER_FORM = { endpoint: 'https://script.google.com/macros/s/AKfycbycd2OLN9A-EY6F1kFbeO4iqCaT-I46WhcZJl9vAHBmWfGuSVuILEVrKalEiudz3m1jcw/exec' };
  // 點「填寫預填表單」連結時自動展開表單
  document.addEventListener('click', (e) => { if (e.target.closest('a[href="#order-form"]') && $('#orderBox')) $('#orderBox').open = true; }, true);
  const orderForm = $('#orderForm');
  if (orderForm) {
    const err = $('#orderError'), done = $('#orderDone'), summary = $('#orderSummary');
    const syncDetails = () => {
      const on = new Set($$('input[name="goods"]:checked', orderForm).map((c) => c.value));
      $$('.of-detail', orderForm).forEach((d) => {
        const show = on.has(d.dataset.for);
        if (show && d.hidden) { const first = $('input[type="number"]', d); if (first && !d.classList.contains('of-tee') && +first.value === 0) first.value = 1; }
        d.hidden = !show;
      });
      const total = $$('input[name^="tee_"][type="number"]', orderForm).reduce((s, i) => s + (parseInt(i.value, 10) || 0), 0);
      $('#teeTotal').textContent = `T 恤合計 ${total} 件`;
    };
    orderForm.addEventListener('change', syncDetails);
    orderForm.addEventListener('input', syncDetails);
    orderForm.addEventListener('click', (e) => {
      const b = e.target.closest('.of-step [data-d]');
      if (!b) return;
      const input = $('input', b.parentElement);
      input.value = Math.min(99, Math.max(0, (parseInt(input.value, 10) || 0) + +b.dataset.d));
      syncDetails();
    });
    syncDetails();
    const showErr = (msg) => { err.textContent = msg; err.hidden = false; };
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.hidden = true;
      const f = orderForm.elements;
      const v = (k) => (f[k].value || '').trim();
      if (!v('name')) { showErr('請填寫稱呼。'); f.name.focus(); return; }
      if (!v('contact')) { showErr('請填寫 LINE ID 或 Email，我才能回覆你。'); f.contact.focus(); return; }
      if (!(+v('people') > 0) && !(+v('pets') > 0)) { showErr('請填寫要畫幾位人物或幾隻毛孩。'); f.people.focus(); return; }
      const goods = $$('input[name="goods"]:checked', orderForm).map((c) => c.value);
      const n = (k) => Math.max(0, parseInt(f[k] && f[k].value, 10) || 0);
      const qtyParts = [];
      if (goods.includes('防水零錢包') && n('q_purse')) qtyParts.push(`防水零錢包×${n('q_purse')}`);
      if (goods.includes('側背帆布小包') && n('q_tote')) qtyParts.push(`側背帆布小包×${n('q_tote')}`);
      if (goods.includes('實木相框') && n('q_frame')) qtyParts.push(`實木相框×${n('q_frame')}`);
      if (goods.includes('紀念 T 恤')) {
        const types = $$('input[name="tee_type"]:checked', orderForm).map((c) => c.value);
        const a = n('tee_adult'), k = n('tee_kid');
        const count = [a ? `成人×${a}` : '', k ? `兒童×${k}` : ''].filter(Boolean).join('、');
        const tee = [types.length ? types.join('／') : '', count || '件數未填', '尺寸私訊告知'].filter(Boolean).join('；');
        qtyParts.push(`T 恤（${tee}）`);
      }
      if (v('qty')) qtyParts.push(v('qty'));
      const data = {
        稱呼: v('name'), 聯絡方式: v('contact'), 用途: v('occasion'), 希望收到日期: v('due'),
        人物: v('people') || '0', 毛孩: v('pets') || '0', 風格: (orderForm.querySelector('input[name="style"]:checked') || {}).value || '',
        想做成: goods.join('、'), '數量／尺寸': qtyParts.join('\n'), 一句話: v('text'), 備註: v('note'),
      };
      const text = ['【檸檬手繪家 預填表單】', ...Object.entries(data).filter(([, val]) => val && val !== '0').map(([k, val]) => `${k}：${val}`)].join('\n');
      summary.textContent = text;
      if (ORDER_FORM.endpoint) {
        const submitBtn = $('button[type="submit"]', orderForm);
        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        $('#orderDoneMsg').textContent = '送出中…';
        try {
          const res = await fetch(ORDER_FORM.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...data, website: v('website') }) });
          const out = await res.json().catch(() => ({}));
          if (!res.ok || !out.ok) throw new Error(out.error || res.status);
          $('#orderDoneMsg').textContent = '已收到你的需求！我會盡快回覆。照片請透過 LINE 傳給我（每人至少 2 張）。';
        } catch (_) {
          $('#orderDoneMsg').textContent = '送出時發生問題，請按「複製內容」貼到 LINE 給我，不好意思！';
        }
        submitBtn.disabled = false;
      }
      done.hidden = false;
      done.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });
    $('#orderCopy').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      try { await navigator.clipboard.writeText(summary.textContent); btn.textContent = '已複製 ✓'; }
      catch (_) { const r = document.createRange(); r.selectNodeContents(summary); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); btn.textContent = '請長按選取文字複製'; }
      setTimeout(() => { btn.textContent = '複製內容'; }, 2500);
    });
  }
})();
