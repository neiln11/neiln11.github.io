/* interactions.js - scroll focus, quiet atmospheric depth and a warm desktop light trail.
   No analytics, no storage, no network. Every effect is skipped under prefers-reduced-motion;
   depth and the trail are skipped on touch and narrow viewports. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const wide = matchMedia('(min-width: 1024px)');

  /* ------------------------------------------------------- how I work: the row crossing centre */
  const rows = [...document.querySelectorAll('.craft-row')];
  if (rows.length && !reduce.matches && 'IntersectionObserver' in window) {
    const focus = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-focus', entry.isIntersecting));
    }, { rootMargin: '-38% 0px -48% 0px', threshold: 0 });
    rows.forEach((row) => focus.observe(row));
  }

  /* ------------------------------------------------------- atmospheric depth: a few pixels */
  const depthAllowed = () => !reduce.matches && fine.matches && wide.matches;
  let queued = false;
  const drawDepth = () => {
    queued = false;
    const hero = document.querySelector('.hero');
    const h = hero?.offsetHeight || window.innerHeight;
    const amount = Math.min(18, Math.max(0, window.scrollY) * 0.035) * Math.max(0, 1 - window.scrollY / (h * 1.6));
    root.style.setProperty('--depth', amount.toFixed(2));
  };
  const onScroll = () => {
    if (!depthAllowed()) return;
    if (!queued) { queued = true; requestAnimationFrame(drawDepth); }
  };
  const setDepth = () => {
    const on = depthAllowed();
    root.classList.toggle('has-depth', on);
    if (on) onScroll(); else root.style.setProperty('--depth', '0');
  };
  setDepth();
  addEventListener('scroll', onScroll, { passive: true });
  [reduce, fine, wide].forEach((q) => q.addEventListener?.('change', setDepth));
  reduce.addEventListener?.('change', () => {
    if (reduce.matches) rows.forEach((row) => row.classList.remove('is-focus'));
  });

  /* ------------------------------------------------------- desktop warm light trail */
  if (depthAllowed()) {
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    trail.setAttribute('aria-hidden', 'true');
    const hot = 'a, button, summary, input, label, [role="button"], [role="tab"]';
    const sizes = [12, 10, 8, 7, 6, 5, 4];
    const tints = ['rgba(242,180,106,.62)', 'rgba(185,199,255,.5)', 'rgba(242,180,106,.48)',
      'rgba(232,143,160,.42)', 'rgba(185,199,255,.4)', 'rgba(242,180,106,.34)', 'rgba(185,199,255,.3)'];
    const core = document.createElement('span');
    core.className = 'cursor-trail__node cursor-trail__node--core';
    trail.appendChild(core);
    const sparks = sizes.map((size, i) => {
      const node = document.createElement('span');
      node.className = 'cursor-trail__node cursor-trail__node--spark';
      node.style.setProperty('--size', `${size}px`);
      node.style.setProperty('--tint', tints[i]);
      trail.appendChild(node);
      return node;
    });
    document.body.appendChild(trail);

    const points = [{ x: 0, y: 0 }, ...sparks.map(() => ({ x: 0, y: 0 }))];
    const ease = [1, .32, .27, .23, .19, .16, .13, .1];
    let tx = 0, ty = 0, started = false, raf = 0;

    const tick = () => {
      points.forEach((p, i) => {
        const lead = i === 0 ? { x: tx, y: ty } : points[i - 1];
        p.x += (lead.x - p.x) * ease[i];
        p.y += (lead.y - p.y) * ease[i];
        (i === 0 ? core : sparks[i - 1]).style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || !depthAllowed()) return;
      tx = e.clientX; ty = e.clientY;
      if (!started) {
        points.forEach((p) => { p.x = tx; p.y = ty; });
        started = true;
      }
      trail.classList.add('is-on');
      const target = e.target instanceof Element ? e.target : null;
      trail.classList.toggle('is-hot', Boolean(target?.closest(hot)));
    }, { passive: true });
    const hide = () => trail.classList.remove('is-on', 'is-hot');
    addEventListener('pointerleave', hide);
    addEventListener('blur', hide);
    document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
    reduce.addEventListener?.('change', () => { if (reduce.matches) hide(); });
    wide.addEventListener?.('change', () => { if (!wide.matches) hide(); });
    fine.addEventListener?.('change', () => { if (!fine.matches) hide(); });
  }
})();
