/* lofi.js - mood presets, a browser-generated ambient bed, and the quick-jump palette.
   Nothing here fetches a file, tracks a visitor, or prints a contact address in the page.
   Audio starts muted; the AudioContext is only created on an explicit play gesture. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------ mood presets */
  const moodButtons = [...document.querySelectorAll('[data-mood-set]')];
  const setMood = (name) => {
    if (!['rain', 'twilight', 'slate'].includes(name)) return;
    root.dataset.mood = name;
    moodButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.moodSet === name)));
  };
  moodButtons.forEach((b) => b.addEventListener('click', () => setMood(b.dataset.moodSet)));

  const trigger = document.getElementById('mood-trigger');
  const panel = document.getElementById('mood-panel');
  const closePanel = () => { if (panel && !panel.hidden) { panel.hidden = true; trigger?.setAttribute('aria-expanded', 'false'); } };
  trigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = panel.hidden;
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) quickDialog?.close();
  });
  document.addEventListener('click', (e) => {
    if (panel && !panel.hidden && !e.target.closest('.mood-control')) closePanel();
  });

  /* ------------------------------------------------------------ ambient audio */
  // A looping filtered noise bed (rain) plus a very quiet, still chord. Both are
  // generated in memory; there is no audio request and nothing plays on load.
  const audioBtn = document.getElementById('audio-toggle');
  const volume = document.getElementById('audio-volume');
  let audio = null;

  function buildAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0;
    // one analyser feeds the desk-signal drawing in the contact section; audio passes through it
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = .84;
    master.connect(analyser);
    analyser.connect(ctx.destination);

    // two seconds of noise, looped; lowpass + highpass gives a soft rain hiss
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf; noise.loop = true;
    const high = ctx.createBiquadFilter(); high.type = 'highpass'; high.frequency.value = 220;
    const low = ctx.createBiquadFilter(); low.type = 'lowpass'; low.frequency.value = 950;
    const rainGain = ctx.createGain(); rainGain.gain.value = 0.5;
    noise.connect(high).connect(low).connect(rainGain).connect(master);
    noise.start();

    // a still, low chord: no rhythm, no beat, nothing that pulls focus
    const padGain = ctx.createGain(); padGain.gain.value = 0.055;
    padGain.connect(master);
    const oscs = [110, 164.81, 220].map((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      o.detune.value = i === 1 ? 3 : 0;
      o.connect(padGain); o.start(); return o;
    });
    return { ctx, master, analyser, data: new Uint8Array(analyser.frequencyBinCount), oscs, playing: false };
  }

  const gainFor = () => (Number(volume?.value ?? 35) / 100) * 0.28;
  const fade = (to) => {
    if (!audio) return;
    audio.master.gain.cancelScheduledValues(audio.ctx.currentTime);
    audio.master.gain.setTargetAtTime(to, audio.ctx.currentTime, 0.12);
  };
  const labelAudio = () => {
    const on = !!audio?.playing;
    if (audioBtn) {
      audioBtn.setAttribute('aria-pressed', String(on));
      audioBtn.setAttribute('aria-label', on ? 'Pause ambient sound' : 'Play ambient sound');
      audioBtn.innerHTML = `${on ? 'Pause ambient' : 'Play ambient'}<span aria-hidden="true">${on ? '&#10074;&#10074;' : '&#9654;'}</span>`;
    }
    document.dispatchEvent(new CustomEvent('lofi:audio-state', {
      detail: { playing: on, analyser: audio?.analyser || null, data: audio?.data || null }
    }));
  };
  const toggleAudio = async () => {
    try {
      if (!audio) audio = buildAudio();
      if (!audio) {
        if (audioBtn) { audioBtn.disabled = true; audioBtn.textContent = 'Audio unavailable'; }
        return;
      }
      audio.playing = !audio.playing;
      fade(audio.playing ? gainFor() : 0);
      labelAudio();
      if (audio.ctx.state === 'suspended') await audio.ctx.resume();
    } catch (e) {
      if (audioBtn) { audioBtn.disabled = true; audioBtn.textContent = 'Audio unavailable'; }
    }
  };
  audioBtn?.addEventListener('click', toggleAudio);
  // the contact widget drives the same single audio bed; two engines never run at once
  document.addEventListener('lofi:audio-toggle', toggleAudio);
  document.addEventListener('lofi:volume', (e) => {
    if (volume) volume.value = String(Math.max(0, Math.min(100, Number(e.detail?.value) || 0)));
    if (audio?.playing) fade(gainFor());
  });
  volume?.addEventListener('input', () => { if (audio?.playing) fade(gainFor()); });

  /* ------------------------------------------------------------ diagram notes */
  // Every note restates what the card already says about that component; no new
  // numbers, results, or claims are introduced here.
  const NOTES = [
    {
      task: 'The pipeline starts from one multi-step request.',
      agent: 'The agent owns the run: it plans the steps, calls a tool for each one, and checks the result.',
      plan: 'The work is laid out as an ordered set of steps.',
      tools: 'A tool is called for each step of the plan.',
      check: 'The result is checked before the answer is returned.'
    },
    {
      'asset-feed': 'Asset updates arrive over REST and WebSockets.',
      spring: 'Java 11 and Spring Boot services take in the updates.',
      store: 'The updates are written to PostgreSQL.',
      push: 'Changed rows are sent to React over a WebSocket.',
      rows: 'Only the rows that changed are re-rendered.'
    },
    {
      events: 'Analytics events arrive from multiple tenants.',
      gateway: 'A Go and Node.js gateway receives and batches the events.',
      batch: 'Batched writes land in MongoDB.',
      cache: 'Redis holds the aggregates for repeat reads.',
      serve: 'React and Tailwind CSS present the aggregates.'
    }
  ];
  const diagrams = [...document.querySelectorAll('#work .dg[data-diagram]')];
  const layerOf = (dg) => dg.querySelector('.dg-nodes');
  const clearDiagram = (dg) => {
    dg.classList.remove('is-picked');
    dg.querySelectorAll('.dg-node.is-picked-node').forEach((n) => n.classList.remove('is-picked-node'));
    const note = dg.parentElement?.querySelector('.dg-note');
    if (note) { note.hidden = true; note.textContent = ''; }
    const layer = layerOf(dg);
    if (layer) layer.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
  };
  const pickNode = (node, dg) => {
    const already = node.classList.contains('is-picked-node');
    diagrams.forEach(clearDiagram);
    if (already) return;
    const index = diagrams.indexOf(dg);
    const note = dg.parentElement?.querySelector('.dg-note');
    if (note) {
      note.textContent = NOTES[index]?.[node.dataset.id] || '';
      note.hidden = !note.textContent;
    }
    dg.classList.add('is-picked');
    node.classList.add('is-picked-node');
    // Reuse the diagram kit's own path highlight so the connected flow lights up.
    node.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
  };
  const wired = new WeakSet();
  const bindDiagramNodes = () => {
    diagrams.forEach((dg) => {
      dg.querySelectorAll('.dg-node').forEach((node) => {
        if (wired.has(node)) return;
        wired.add(node);
        node.setAttribute('tabindex', '0');
        node.setAttribute('aria-label', `${node.textContent.trim().replace(/\s+/g, ' ')}: show how this connects`);
        const fire = () => pickNode(node, dg);
        node.addEventListener('click', (e) => { e.stopPropagation(); fire(); });
        node.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); }
        });
      });
    });
  };
  bindDiagramNodes();
  // the diagram kit draws (and can redraw) its nodes after this module's first pass
  const watch = new MutationObserver(bindDiagramNodes);
  diagrams.forEach((dg) => watch.observe(dg, { childList: true, subtree: true }));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#work .dg')) diagrams.forEach(clearDiagram);
  });

  /* ------------------------------------------------------------ quick palette */
  const quickDialog = document.getElementById('quick-palette');
  const quickTrigger = document.getElementById('quick-trigger');
  const quickClose = document.getElementById('quick-close');
  const openQuick = () => { closePanel(); if (!quickDialog.open) quickDialog.showModal(); };
  quickTrigger?.addEventListener('click', () => { quickDialog.open ? quickDialog.close() : openQuick(); });
  quickClose?.addEventListener('click', () => quickDialog.close());
  quickDialog?.addEventListener('click', (e) => { if (e.target === quickDialog) quickDialog.close(); });

  document.addEventListener('keydown', (e) => {
    const typing = e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]');
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault(); quickDialog.open ? quickDialog.close() : openQuick(); return;
    }
    if (e.key === '/' && !typing && !quickDialog.open && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault(); openQuick();
    }
  });

  quickDialog?.querySelectorAll('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', () => quickDialog.close()));

  quickDialog?.querySelectorAll('[data-mood-set]').forEach((b) =>
    b.addEventListener('click', () => quickDialog.close()));

  const copyBtn = quickDialog?.querySelector('[data-copy-email]');
  copyBtn?.addEventListener('click', async () => {
    const href = document.querySelector('a[href^="mailto:"]')?.getAttribute('href') || '';
    const address = href.replace(/^mailto:/, '');
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      const original = copyBtn.firstChild.textContent;
      copyBtn.firstChild.textContent = 'Copied to clipboard';
      setTimeout(() => { copyBtn.firstChild.textContent = original; }, 1600);
    } catch (e) {
      copyBtn.firstChild.textContent = 'Copy unavailable here';
    }
  });

  quickDialog?.querySelectorAll('[data-diagram-jump]').forEach((b) =>
    b.addEventListener('click', () => {
      quickDialog.close();
      const dg = diagrams[Number(b.dataset.diagramJump)];
      if (!dg) return;
      dg.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'center' });
      const node = dg.querySelector('.dg-node--core') || dg.querySelector('.dg-node');
      if (node) setTimeout(() => pickNode(node, dg), reduce.matches ? 0 : 450);
    }));
})();
