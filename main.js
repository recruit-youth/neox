/**
 * NEOX Recruit — Main JavaScript
 * Editorial Minimal / Scroll Animation
 */

'use strict';

/* ================================================
   Utilities
   ================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/** RAF-throttled scroll/resize */
function onScroll(fn) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { fn(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
}

/* ================================================
   1. Loader
   ================================================ */
function initLoader() {
  const loader = $('#loader');
  const site   = $('#site');
  if (!loader || !site) return;

  // ローダーが終わったらサイトを表示
  const LOADER_DURATION = 1800; // ms

  setTimeout(() => {
    loader.classList.add('is-hidden');
    site.classList.add('is-ready');

    // ロード完了後にヒーローアニメを起動
    setTimeout(() => triggerHeroAnim(), 200);
  }, LOADER_DURATION);
}

/* ================================================
   2. Hero Animation
   ================================================ */
function triggerHeroAnim() {
  // タイトルライン（js-title-line）
  $$('.js-title-line').forEach((el, i) => {
    const delay = parseInt(el.dataset.delay || 0, 10);
    setTimeout(() => el.classList.add('is-visible'), delay);
  });

  // フェードイン要素（js-fade-in）
  $$('.js-fade-in').forEach(el => {
    const delay = parseInt(el.dataset.delay || 0, 10);
    setTimeout(() => el.classList.add('is-visible'), delay);
  });
}

/* ================================================
   3. Navigation — scroll state
   ================================================ */
function initNav() {
  const nav = $('#nav');
  if (!nav) return;

  function update() {
    nav.classList.toggle('is-scrolled', window.scrollY > 60);
  }

  onScroll(update);
  update();
}

/* ================================================
   4. Intersection Observer — js-stagger / js-section
   ================================================ */
function initScrollReveal() {
  // stagger items
  const staggerEls = $$('.js-stagger');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseInt(el.dataset.delay || 0, 10);
      setTimeout(() => el.classList.add('is-visible'), delay);
      observer.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  staggerEls.forEach(el => observer.observe(el));

  // Section fade-in trigger (for section-level class changes)
  const sections = $$('.js-section');
  const secObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-active');
      }
    });
  }, { threshold: 0.1 });

  sections.forEach(s => secObserver.observe(s));
}

/* ================================================
   5. Count Up Animation
   ================================================ */
function initCountUp() {
  const counters = $$('.js-count');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target || 0, 10);
      animateCount(el, 0, target, 1800);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

function animateCount(el, from, to, duration) {
  const startTime = performance.now();

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuart(progress);
    el.textContent = Math.round(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/* ================================================
   6. Parallax — subtle on hero bg-text & scroll line
   ================================================ */
function initParallax() {
  const bgText  = $('.hero__bg-text');
  const heroSec = $('.hero');

  if (!bgText || !heroSec) return;

  onScroll(() => {
    const scrollY = window.scrollY;
    const heroH   = heroSec.offsetHeight;
    if (scrollY > heroH) return;

    const t = scrollY / heroH;
    bgText.style.transform = `translateY(${t * 40}px)`;
  });
}

/* ================================================
   7. Smooth section background shift
   ================================================ */
function initSectionBgShift() {
  // 各セクションのbgをnav scrolled状態と連動させる
  // すでにCSSとnavのis-scrolledで対応済み
}

/* ================================================
   8. Entry Form
   ================================================ */
function initForm() {
  const form    = $('#entryForm');
  const formDone = $('#formDone');
  if (!form || !formDone) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validation
    const name  = $('#f-name').value.trim();
    const email = $('#f-email').value.trim();
    const type  = $('#f-type').value;

    if (!name)  { markError('f-name',  'お名前を入力してください'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      markError('f-email', '正しいメールアドレスを入力してください');
      return;
    }
    if (!type)  { markError('f-type',  'ご希望を選択してください'); return; }

    // Loading state
    const btn = form.querySelector('.form__submit');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.querySelector('.form__submit-text').textContent = '送信中...';

    // Save to Table API
    try {
      await fetch('tables/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: $('#f-phone') ? $('#f-phone').value.trim() : '',
          contact_type: type,
          message: $('#f-msg').value.trim(),
          submitted_at: new Date().toISOString(),
        }),
      });
    } catch (err) {
      // サイレントフォールバック
      console.warn('Entry save error:', err);
    }

    // Show success
    setTimeout(() => {
      form.style.display = 'none';
      formDone.classList.add('is-visible');
      formDone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      btn.disabled = false;
      btn.innerHTML = orig;
    }, 600);
  });
}

function markError(id, msg) {
  const field = document.getElementById(id);
  if (!field) return;

  // 既存エラーを除去
  const prev = field.parentNode.querySelector('.field-err');
  if (prev) prev.remove();

  const err = document.createElement('span');
  err.className = 'field-err';
  err.style.cssText = 'display:block;font-size:11px;color:#C0392B;margin-top:4px;';
  err.textContent = msg;
  field.parentNode.appendChild(err);
  field.style.borderColor = '#C0392B';
  field.focus();

  field.addEventListener('input', () => {
    const e = field.parentNode.querySelector('.field-err');
    if (e) e.remove();
    field.style.borderColor = '';
  }, { once: true });
}

/* ================================================
   9. Smooth Scroll (anchor links)
   ================================================ */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ================================================
   10. Scroll-based reading progress line in nav
   ================================================ */
function initReadingProgress() {
  const bar = document.createElement('div');
  bar.setAttribute('aria-hidden', 'true');
  bar.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    height: 2px;
    background: linear-gradient(90deg, #C8A96E, #e8c98e);
    z-index: 9999;
    width: 0%;
    pointer-events: none;
    transition: width 0.12s linear;
  `;
  document.body.appendChild(bar);

  onScroll(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.width = pct + '%';
  });
}

/* ================================================
   11. Hover: entry options lift
   ================================================ */
function initOptionHover() {
  $$('.entry__option').forEach(opt => {
    opt.addEventListener('mouseenter', () => {
      opt.style.transform = 'translateY(-4px)';
      opt.style.transition = 'background 0.3s, transform 0.4s cubic-bezier(0.16,1,0.3,1)';
    });
    opt.addEventListener('mouseleave', () => {
      opt.style.transform = '';
    });
  });
}

/* ================================================
   12. Vision cards stagger on hover group
   ================================================ */
function initVisionCardHover() {
  const cards = $$('.vision__card');
  cards.forEach((card, i) => {
    card.addEventListener('mouseenter', () => {
      cards.forEach((c, j) => {
        const dist = Math.abs(i - j);
        c.style.opacity = dist === 0 ? '1' : dist === 1 ? '0.65' : '0.35';
        c.style.transition = 'opacity 0.35s, padding-left 0.4s cubic-bezier(0.16,1,0.3,1)';
      });
    });
    card.addEventListener('mouseleave', () => {
      cards.forEach(c => { c.style.opacity = '1'; });
    });
  });
}

/* ================================================
   INIT
   ================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initNav();
  initScrollReveal();
  initCountUp();
  initParallax();
  initForm();
  initSmoothScroll();
  initReadingProgress();
  initOptionHover();
  initVisionCardHover();
});
