/* ============================================================
   SWITCH — interactions: nav, tabs, slides, reveals, counters
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Mobile nav ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const drawer = document.querySelector('.nav-drawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      const open = drawer.hasAttribute('hidden');
      if (open) { drawer.removeAttribute('hidden'); }
      else { drawer.setAttribute('hidden', ''); }
      toggle.setAttribute('aria-expanded', String(open));
      toggle.classList.toggle('is-open', open);
    });
    drawer.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        drawer.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ---------- Tabs (workstreams) ---------- */
  document.querySelectorAll('[data-tabs]').forEach((group) => {
    const tabs = Array.from(group.querySelectorAll('[role="tab"]'));
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));

    function select(i) {
      tabs.forEach((t, j) => {
        const on = i === j;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (panels[j]) panels[j].hidden = !on;
      });
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        let n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (n !== null) { e.preventDefault(); tabs[n].focus(); select(n); }
      });
    });
  });

  /* ---------- Disclosure toggles ---------- */
  document.querySelectorAll('[data-disclosure]').forEach((btn) => {
    const target = document.getElementById(btn.getAttribute('data-disclosure'));
    if (!target) return;
    btn.addEventListener('click', () => {
      const open = target.hasAttribute('hidden');
      if (open) target.removeAttribute('hidden'); else target.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Finding switch (branded vs generic) ---------- */
  document.querySelectorAll('[data-switch]').forEach((sw) => {
    const btns = Array.from(sw.querySelectorAll('.switch-head button'));
    const bodies = Array.from(sw.querySelectorAll('.switch-body'));
    btns.forEach((b) => {
      b.addEventListener('click', () => {
        const key = b.getAttribute('data-key');
        btns.forEach((x) => x.setAttribute('aria-selected', String(x === b)));
        bodies.forEach((body) => {
          if (body.getAttribute('data-key') === key) body.removeAttribute('hidden');
          else body.setAttribute('hidden', '');
        });
      });
    });
  });

  /* ---------- Slide deck (CPRD) ---------- */
  document.querySelectorAll('[data-deck]').forEach((deck) => {
    const slides = Array.from(deck.querySelectorAll('.slide'));
    const dotsWrap = deck.querySelector('[data-dots]');
    const prev = deck.querySelector('[data-prev]');
    const next = deck.querySelector('[data-next]');
    const current = deck.querySelector('[data-current]');
    const total = deck.querySelector('[data-total]');
    let i = 0;

    if (total) total.textContent = String(slides.length);

    const dots = slides.map((_, idx) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('aria-label', 'Go to slide ' + (idx + 1));
      d.addEventListener('click', () => go(idx));
      dotsWrap.appendChild(d);
      return d;
    });

    function go(n) {
      n = Math.max(0, Math.min(slides.length - 1, n));
      slides.forEach((s, idx) => {
        s.classList.remove('is-active', 'exit-left');
        if (idx === n) s.classList.add('is-active');
        else if (idx < n) s.classList.add('exit-left');
      });
      dots.forEach((d, idx) => d.setAttribute('aria-current', String(idx === n)));
      if (current) current.textContent = String(n + 1);
      if (prev) prev.disabled = n === 0;
      if (next) next.disabled = n === slides.length - 1;
      i = n;
    }

    if (prev) prev.addEventListener('click', () => go(i - 1));
    if (next) next.addEventListener('click', () => go(i + 1));

    deck.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
    });
    deck.setAttribute('tabindex', '0');

    // Touch swipe
    let x0 = null;
    deck.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    deck.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) go(dx < 0 ? i + 1 : i - 1);
      x0 = null;
    }, { passive: true });

    go(0);
  });

  /* ---------- Scroll reveals ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Count-up stats ---------- */
  function countUp(el) {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const dur = 1400;
    const start = performance.now();
    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  const nums = document.querySelectorAll('.stat-num[data-count]');
  if ('IntersectionObserver' in window) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { countUp(e.target); io2.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach((n) => io2.observe(n));
  } else {
    nums.forEach((n) => { n.textContent = n.getAttribute('data-count'); });
  }

  /* ---------- Progress bar fill ---------- */
  const fills = document.querySelectorAll('.progress-fill[data-fill]');
  if ('IntersectionObserver' in window) {
    const io3 = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.style.width = e.target.getAttribute('data-fill') + '%';
          io3.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    fills.forEach((f) => io3.observe(f));
  } else {
    fills.forEach((f) => { f.style.width = f.getAttribute('data-fill') + '%'; });
  }
})();
