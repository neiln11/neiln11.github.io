/* ambient.js - the contact section's desk-signal drawing.
   It draws into one canvas, reads the shared audio analyser when sound is playing, and draws a
   still wave when it is muted. Nothing runs under reduced motion, and nothing plays on load. */
(() => {
  const panel = document.getElementById('ambient');
  const sky = document.getElementById('ambient-sky');
  const canvas = document.getElementById('ambient-canvas');
  const play = document.getElementById('ambient-play');
  const label = panel?.querySelector('.ambient__play-label');
  const readout = document.getElementById('ambient-readout');
  const volume = document.getElementById('ambient-volume');
  if (!panel || !canvas) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const ctx = canvas.getContext('2d');
  let analyser = null, data = null, playing = false;
  let w = 0, h = 0, raf = 0;

  const labelState = () => {
    panel.classList.toggle('is-playing', playing);
    if (play) {
      play.setAttribute('aria-pressed', String(playing));
      play.setAttribute('aria-label', playing ? 'Pause ambient sound' : 'Play ambient sound');
    }
    if (label) label.textContent = playing ? 'Pause ambient' : 'Play ambient';
    const icon = play?.querySelector('svg path');
    if (icon) icon.setAttribute('d', playing ? 'M2 1.5h3v9H2zM7 1.5h3v9H7z' : 'M2 1.5 10 6 2 10.5Z');
    if (readout) readout.textContent = playing
      ? 'Playing. Rain and a low chord, drawn as they move.'
      : 'Muted. The room is still; play to bring it up.';
  };
  labelState();

  document.addEventListener('lofi:audio-state', (e) => {
    playing = !!e.detail?.playing;
    analyser = e.detail?.analyser || null;
    data = e.detail?.data || null;
    labelState();
    if (reduce.matches) draw(0);
  });
  play?.addEventListener('click', () => document.dispatchEvent(new CustomEvent('lofi:audio-toggle')));
  volume?.addEventListener('input', () => document.dispatchEvent(new CustomEvent('lofi:volume', {
    detail: { value: Number(volume.value) }
  })));

  /* a light parallax on the lantern, only for a real pointer and only when motion is welcome */
  sky?.addEventListener('pointermove', (e) => {
    if (!fine.matches || reduce.matches || e.pointerType !== 'mouse') return;
    const box = sky.getBoundingClientRect();
    const shift = ((e.clientX - box.left) / Math.max(1, box.width) - .5) * 44;
    sky.style.setProperty('--mx', `${shift.toFixed(1)}px`);
  }, { passive: true });

  const resize = () => {
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduce.matches) draw(0);
  };

  function draw(time) {
    if (!ctx || w < 2 || h < 2) return;
    ctx.clearRect(0, 0, w, h);
    let bins = null;
    if (playing && analyser && data) {
      analyser.getByteFrequencyData(data);
      bins = data;
    }
    const mid = h * .62;
    const span = Math.min(w, 520);
    const offset = (w - span) / 2;
    const layers = [
      { color: 'rgba(185,199,255,.52)', amp: 16, phase: 0, speed: .0007 },
      { color: 'rgba(242,180,106,.62)', amp: 11, phase: 1.7, speed: -.0011 },
      { color: 'rgba(232,143,160,.32)', amp: 7, phase: 3.4, speed: .0009 }
    ];
    layers.forEach((layer, li) => {
      const grad = ctx.createLinearGradient(offset, 0, offset + span, 0);
      grad.addColorStop(0, 'rgba(185,199,255,0)');
      grad.addColorStop(.18, layer.color);
      grad.addColorStop(.82, layer.color);
      grad.addColorStop(1, 'rgba(242,180,106,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = li === 1 ? 1.6 : 1;
      ctx.beginPath();
      for (let x = 0; x <= span; x += 4) {
        const p = x / span;
        let y = mid + Math.sin(p * Math.PI * 4 + layer.phase + time * layer.speed) * layer.amp;
        y += Math.sin(p * Math.PI * 9 + layer.phase * 2 - time * layer.speed * .6) * layer.amp * .28;
        if (bins) {
          const bin = bins[Math.floor(p * (bins.length - 1))] || 0;
          y -= (bin / 255) * (22 - li * 4) * Math.sin(p * Math.PI);
        }
        if (x === 0) ctx.moveTo(offset + x, y); else ctx.lineTo(offset + x, y);
      }
      ctx.stroke();
    });

    if (bins) {
      // a row of low, warm bars under the wave: the signal, not a music-player clone
      const bars = 26, gap = 3, bw = Math.min(5, (span - gap * (bars - 1)) / bars);
      ctx.fillStyle = 'rgba(242,180,106,.3)';
      for (let i = 0; i < bars; i++) {
        const bin = bins[Math.floor((i / bars) * (bins.length * .6))] || 0;
        const bh = 2 + (bin / 255) * 30;
        ctx.fillRect(offset + i * (bw + gap), mid + 22 - bh, bw, bh);
      }
    }
  }

  const tick = (t) => {
    if (!document.hidden) draw(t);
    raf = requestAnimationFrame(tick);
  };
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else addEventListener('resize', resize);
  resize();
  if (!reduce.matches) raf = requestAnimationFrame(tick);
  reduce.addEventListener?.('change', () => {
    cancelAnimationFrame(raf);
    if (reduce.matches) {
      sky?.style.removeProperty('--mx');
      draw(0);
    } else raf = requestAnimationFrame(tick);
  });
})();
