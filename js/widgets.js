/* ==========================================================================
   widgets.js — Bilingual (EN/ZH) Visual Music Playground Widgets
   Includes Auto-Scrolling Piano Playback, Live Language Switching & 16 Labs
   ========================================================================== */
(function () {
  'use strict';

  const WHITE_PCS = new Set([0, 2, 4, 5, 7, 9, 11]);
  const PC_NAMES_SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const PC_NAMES_DUAL = ['C', 'C♯\nD♭', 'D', 'D♯\nE♭', 'E', 'F', 'F♯\nG♭', 'G', 'G♯\nA♭', 'A', 'A♯\nB♭', 'B'];

  const t = (en, zh) => (window.I18n ? window.I18n.t(en, zh) : en);
  const pick = (v) => (window.I18n ? window.I18n.pick(v) : v);

  function bindLangRefresh(container, fn) {
    if (!container) return;
    if (container._widgetLangHandler) {
      window.removeEventListener('lang-changed', container._widgetLangHandler);
    }
    container._widgetLangHandler = () => {
      if (document.body.contains(container)) fn();
    };
    window.addEventListener('lang-changed', container._widgetLangHandler);
  }

  function getColor(pc) {
    return window.AudioEngine?.PITCH_COLORS?.[((pc % 12) + 12) % 12] || '#6366f1';
  }

  function announcePolite(msg) {
    const el = document.getElementById('sr-announcer');
    if (el) el.textContent = msg;
  }

  /* 1. Interactive Synth Piano Keyboard (Touch Glissando + Playback Auto-Scroll) */
  function createPiano(container, opts = {}) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return null;
    container.innerHTML = '';

    const startMidi = opts.startMidi ?? 48;
    const endMidi = opts.endMidi ?? 72;
    const showLandmarks = opts.showLandmarks ?? false;
    const showDualBlack = opts.showDualBlack ?? true;
    const showOctaveNum = opts.showOctaveNum ?? true;

    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'piano-scroll';
    const kb = document.createElement('div');
    kb.className = 'piano-keyboard';
    kb.setAttribute('role', 'group');
    kb.setAttribute('aria-label', pick(opts.ariaLabel) || t('Interactive Piano Keyboard', '互動式鋼琴鍵盤'));

    const keyElements = new Map();
    const keyOffsets = new Map();
    const whiteWidth = opts.whiteWidth || 44;
    let whiteCount = 0;
    let c4OffsetPx = 0;

    for (let midi = startMidi; midi <= endMidi; midi++) {
      const pc = ((midi % 12) + 12) % 12;
      const octave = Math.floor(midi / 12) - 1;
      const isWhite = WHITE_PCS.has(pc);
      const glow = getColor(pc);

      if (isWhite) {
        const curX = whiteCount * whiteWidth;
        if (midi === 60) c4OffsetPx = curX;
        keyOffsets.set(midi, curX + whiteWidth / 2);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'piano-key-white';
        btn.style.inlineSize = whiteWidth + 'px';
        btn.style.setProperty('--key-glow', glow);
        if (showLandmarks && (pc === 0 || pc === 5)) btn.classList.add('is-landmark');

        const noteName = PC_NAMES_SHARP[pc] + (showOctaveNum ? octave : '');
        btn.setAttribute('aria-label', `${PC_NAMES_SHARP[pc]}${octave}`);
        btn.dataset.midi = String(midi);

        const badge = document.createElement('span');
        badge.className = 'piano-finger-badge';
        badge.style.fontSize = '0.66rem';
        badge.style.color = '#d97706';
        badge.style.marginBlockEnd = '2px';

        const dot = document.createElement('span');
        dot.style.inlineSize = '8px';
        dot.style.blockSize = '8px';
        dot.style.borderRadius = '50%';
        dot.style.background = glow;
        dot.style.opacity = '0.75';
        dot.style.marginBlockEnd = '3px';

        const lbl = document.createElement('span');
        lbl.textContent = (pc === 0 && midi === 60) ? 'C4★' : noteName;

        btn.append(badge, dot, lbl);
        kb.appendChild(btn);
        keyElements.set(midi, { btn, badge, lbl });
        whiteCount++;
      } else {
        const leftPx = whiteCount * whiteWidth - 14;
        keyOffsets.set(midi, leftPx + 14);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'piano-key-black';
        btn.style.setProperty('--key-glow', glow);
        btn.style.insetInlineStart = leftPx + 'px';
        btn.setAttribute('aria-label', `${PC_NAMES_DUAL[pc].replace('\n', '/')}${octave}`);
        btn.dataset.midi = String(midi);

        const badge = document.createElement('span');
        badge.className = 'piano-finger-badge';
        badge.style.fontSize = '0.62rem';
        badge.style.color = '#fde047';

        const lbl = document.createElement('span');
        lbl.style.whiteSpace = 'pre-line';
        lbl.style.textAlign = 'center';
        lbl.textContent = showDualBlack ? PC_NAMES_DUAL[pc] : PC_NAMES_SHARP[pc];

        btn.append(badge, lbl);
        kb.appendChild(btn);
        keyElements.set(midi, { btn, badge, lbl });
      }
    }

    kb.style.inlineSize = (whiteCount * whiteWidth) + 'px';

    let isPointerDown = false;
    let lastDraggedMidi = null;

    kb.addEventListener('pointerdown', (e) => {
      const keyBtn = e.target.closest('[data-midi]');
      if (!keyBtn) return;
      isPointerDown = true;
      const m = Number(keyBtn.dataset.midi);
      lastDraggedMidi = m;
      triggerKey(m, 0.7, false);
    });

    kb.addEventListener('pointermove', (e) => {
      if (!isPointerDown) return;
      const elUnder = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-midi]');
      if (elUnder && kb.contains(elUnder)) {
        const m = Number(elUnder.dataset.midi);
        if (m !== lastDraggedMidi) {
          lastDraggedMidi = m;
          triggerKey(m, 0.45, false);
        }
      }
    });

    window.addEventListener('pointerup', () => {
      isPointerDown = false;
      lastDraggedMidi = null;
    });

    kb.addEventListener('keydown', (e) => {
      const keyBtn = e.target.closest('[data-midi]');
      if (!keyBtn) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerKey(Number(keyBtn.dataset.midi), 0.7, false);
      }
    });

    let toolbar = null;
    function renderToolbarText() {
      if (!toolbar) return;
      toolbar.querySelector('[data-role="tip"]').textContent = t('🎹 Tap or glide across keys', '🎹 點擊或滑動琴鍵滑奏');
      toolbar.querySelector('[data-pan="left"]').textContent = t('◀ Low', '◀ 低音');
      toolbar.querySelector('[data-pan="c4"]').textContent = t('★ Mid C', '★ 中央C');
      toolbar.querySelector('[data-pan="right"]').textContent = t('High ▶', '高音 ▶');
    }

    if (whiteCount > 10) {
      toolbar = document.createElement('div');
      toolbar.className = 'piano-toolbar';
      toolbar.innerHTML = `
        <span data-role="tip"></span>
        <span style="display:inline-flex;gap:0.3rem;">
          <button type="button" class="btn btn-sm" data-pan="left"></button>
          <button type="button" class="btn btn-sm" data-pan="c4"></button>
          <button type="button" class="btn btn-sm" data-pan="right"></button>
        </span>
      `;
      renderToolbarText();
      toolbar.querySelector('[data-pan="left"]').addEventListener('click', () => {
        scrollWrap.scrollBy({ left: -180, behavior: 'smooth' });
      });
      toolbar.querySelector('[data-pan="right"]').addEventListener('click', () => {
        scrollWrap.scrollBy({ left: 180, behavior: 'smooth' });
      });
      toolbar.querySelector('[data-pan="c4"]').addEventListener('click', () => {
        scrollWrap.scrollTo({ left: Math.max(0, c4OffsetPx - scrollWrap.clientWidth / 2 + 22), behavior: 'smooth' });
      });
      container.appendChild(toolbar);
      bindLangRefresh(toolbar, renderToolbarText);
    }

    scrollWrap.appendChild(kb);
    container.appendChild(scrollWrap);

    requestAnimationFrame(() => {
      if (scrollWrap.scrollWidth > scrollWrap.clientWidth + 20 && c4OffsetPx > 0) {
        scrollWrap.scrollLeft = Math.max(0, c4OffsetPx - scrollWrap.clientWidth / 2 + 44);
      }
    });

    function triggerKey(midi, dur = 0.7, autoScroll = false) {
      window.AudioEngine.playNote(midi, dur);
      flashKey(midi, 300, autoScroll);
      if (opts.onNote) opts.onNote(midi);
    }

    function flashKey(midi, ms = 280, autoScroll = true) {
      const item = keyElements.get(midi);
      if (!item) return;
      item.btn.classList.add('is-active');
      setTimeout(() => item.btn.classList.remove('is-active'), ms);

      if (autoScroll && scrollWrap.scrollWidth > scrollWrap.clientWidth + 12) {
        const kx = keyOffsets.get(midi);
        if (kx !== undefined) {
          const leftBound = scrollWrap.scrollLeft + 36;
          const rightBound = scrollWrap.scrollLeft + scrollWrap.clientWidth - 36;
          if (kx < leftBound || kx > rightBound) {
            scrollWrap.scrollTo({
              left: Math.max(0, Math.min(scrollWrap.scrollWidth - scrollWrap.clientWidth, kx - scrollWrap.clientWidth * 0.42)),
              behavior: 'smooth'
            });
          }
        }
      }
    }

    function highlightMidi(midiList = [], tonicMidi = null, badgeMap = {}) {
      for (const [m, { btn, badge }] of keyElements.entries()) {
        btn.classList.remove('is-scale-member', 'is-tonic');
        badge.textContent = badgeMap[m] ? String(badgeMap[m]) : '';
      }
      const set = new Set(midiList);
      for (const m of set) {
        const entry = keyElements.get(m);
        if (!entry) continue;
        if (m === tonicMidi) entry.btn.classList.add('is-tonic');
        else entry.btn.classList.add('is-scale-member');
      }
    }

    return { triggerKey, flashKey, highlightMidi, keyElements };
  }

  /* 2. Tempo Term Helper */
  function tempoItalianTerm(bpm) {
    if (bpm < 52) return t('Largo (very slow)', 'Largo 廣板');
    if (bpm < 66) return t('Adagio (slow)', 'Adagio 柔板');
    if (bpm < 88) return t('Andante (walking)', 'Andante 行板');
    if (bpm < 114) return t('Moderato (moderate)', 'Moderato 中板');
    if (bpm < 144) return t('Allegro (fast)', 'Allegro 快板');
    if (bpm < 172) return t('Vivace (lively)', 'Vivace 活潑快板');
    return t('Presto (very fast)', 'Presto 急板');
  }

  /* 3. Responsive MPC Drum Pad Rhythm Matrix */
  function createRhythmSequencer(container, opts = {}) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return null;

    let bpm = opts.bpm || 92;
    let isPlaying = false;
    let timer = null;
    let stepIdx = 0;
    let curPresetIdx = 0;

    const presets = opts.presets || [
      {
        name: { en: '4/4 Sixteenth Groove (1 e & a)', zh: '4/4 十六分律動 (1 e & a)' },
        stepFactor: 0.25,
        beatEvery: 4,
        counts: ['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a'],
        tracks: [
          { name: { en: '🥁 Clave', zh: '🥁 節奏擊拍' }, voice: 'clave', pattern: [2, 0, 1, 0, 1, 0, 1, 1, 2, 0, 0, 1, 1, 0, 1, 0] },
          { name: { en: '🔊 Pulse Kick', zh: '🔊 穩定大鼓' }, voice: 'kick',  pattern: [2, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] }
        ]
      }
    ];

    let activePreset = JSON.parse(JSON.stringify(presets[0]));
    let stepButtons = [];

    function stopLoop() {
      isPlaying = false;
      if (timer) clearTimeout(timer);
      timer = null;
      const pb = container.querySelector('[data-role="play"]');
      if (pb) pb.textContent = t('▶ Play Loop', '▶ 啟動鼓機');
      stepButtons.flat().forEach(b => b.classList.remove('is-current'));
    }

    function mount() {
      stopLoop();
      container.innerHTML = '';

      const controls = document.createElement('div');
      controls.className = 'widget-controls';

      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.dataset.role = 'play';
      playBtn.className = 'btn btn-primary';
      playBtn.textContent = t('▶ Play Loop', '▶ 啟動鼓機');

      const randBtn = document.createElement('button');
      randBtn.type = 'button';
      randBtn.className = 'btn btn-sm btn-amber';
      randBtn.textContent = t('🎲 Randomize', '🎲 隨機靈感');

      const presetSel = document.createElement('select');
      presetSel.setAttribute('aria-label', t('Rhythm preset', '選擇節奏型態'));
      presets.forEach((p, idx) => {
        const opt = document.createElement('option');
        opt.value = String(idx);
        opt.textContent = pick(p.name);
        if (idx === curPresetIdx) opt.selected = true;
        presetSel.appendChild(opt);
      });

      const bpmLabel = document.createElement('label');
      bpmLabel.style.display = 'inline-flex';
      bpmLabel.style.flexWrap = 'wrap';
      bpmLabel.style.alignItems = 'center';
      bpmLabel.style.gap = '0.35rem';
      bpmLabel.style.fontSize = '0.82rem';
      bpmLabel.style.fontWeight = '700';
      const bpmText = document.createElement('span');
      const bpmRange = document.createElement('input');
      bpmRange.type = 'range';
      bpmRange.min = '44';
      bpmRange.max = '184';
      bpmRange.value = String(bpm);
      bpmRange.style.inlineSize = '105px';

      function updateBpmText() {
        bpmText.textContent = `♩=${bpm} · ${tempoItalianTerm(bpm)}`;
      }
      updateBpmText();
      bpmLabel.append(bpmText, bpmRange);

      if (presets.length > 1) controls.append(playBtn, randBtn, presetSel, bpmLabel);
      else controls.append(playBtn, randBtn, bpmLabel);

      const gridWrap = document.createElement('div');
      gridWrap.className = 'rhythm-grid';
      container.append(controls, gridWrap);

      function renderGrid() {
        gridWrap.innerHTML = '';
        stepButtons = [];
        const total = activePreset.counts.length;
        const beatEv = activePreset.beatEvery || 4;
        const subdivAttr = (beatEv === 3 || total % 3 === 0) ? (total >= 6 ? '6' : '3') : '4';

        activePreset.tracks.forEach((track) => {
          const row = document.createElement('div');
          row.className = 'rhythm-track';
          const label = document.createElement('div');
          label.style.fontWeight = '800';
          label.style.fontSize = '0.84rem';
          label.textContent = pick(track.name);

          const stepsDiv = document.createElement('div');
          stepsDiv.className = 'rhythm-steps';
          stepsDiv.dataset.subdiv = subdivAttr;
          stepsDiv.dataset.total = String(total);
          const rowBtns = [];

          track.pattern.forEach((val, sIdx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'rhythm-step' + (sIdx % beatEv === 0 ? ' is-beat-start' : '');
            btn.setAttribute('aria-pressed', val > 0 ? 'true' : 'false');
            btn.dataset.level = String(val);
            const countStr = activePreset.counts[sIdx] || String(sIdx + 1);
            btn.setAttribute('aria-label', `${pick(track.name)} ${countStr}`);
            btn.innerHTML = `<span>${countStr}</span><span style="font-size:0.72rem">${val === 2 ? '⚡' : (val === 1 ? '●' : '·')}</span>`;

            btn.addEventListener('click', () => {
              track.pattern[sIdx] = (track.pattern[sIdx] + 1) % 3;
              const nv = track.pattern[sIdx];
              btn.setAttribute('aria-pressed', nv > 0 ? 'true' : 'false');
              btn.dataset.level = String(nv);
              btn.innerHTML = `<span>${countStr}</span><span style="font-size:0.72rem">${nv === 2 ? '⚡' : (nv === 1 ? '●' : '·')}</span>`;
              if (nv > 0) window.AudioEngine.playPercussion(track.voice, nv === 2);
            });

            stepsDiv.appendChild(btn);
            rowBtns.push(btn);
          });

          stepButtons.push(rowBtns);
          row.append(label, stepsDiv);
          gridWrap.appendChild(row);
        });
      }

      function tick() {
        if (!isPlaying) return;
        const len = activePreset.counts.length;
        const cur = stepIdx % len;

        stepButtons.forEach((rowBtns, tIdx) => {
          rowBtns.forEach((b, i) => b.classList.toggle('is-current', i === cur));
          const v = activePreset.tracks[tIdx].pattern[cur];
          if (v > 0) window.AudioEngine.playPercussion(activePreset.tracks[tIdx].voice, v === 2);
        });

        stepIdx++;
        const stepMs = (60 / bpm) * (activePreset.stepFactor || 0.5) * 1000;
        timer = setTimeout(tick, stepMs);
      }

      playBtn.addEventListener('click', () => {
        if (isPlaying) stopLoop();
        else {
          window.AudioEngine.stopAll();
          isPlaying = true;
          stepIdx = 0;
          playBtn.textContent = t('■ Stop', '■ 停止');
          tick();
        }
      });

      randBtn.addEventListener('click', () => {
        const beatEv = activePreset.beatEvery || 4;
        activePreset.tracks[0].pattern = activePreset.tracks[0].pattern.map((_, i) =>
          i === 0 ? 2 : (i % beatEv === 0 ? (Math.random() > 0.25 ? 1 : 2) : (Math.random() > 0.52 ? 1 : 0))
        );
        renderGrid();
        if (!isPlaying) playBtn.click();
      });

      presetSel.addEventListener('change', () => {
        const wasPlaying = isPlaying;
        stopLoop();
        curPresetIdx = Number(presetSel.value);
        activePreset = JSON.parse(JSON.stringify(presets[curPresetIdx] || presets[0]));
        renderGrid();
        if (wasPlaying) playBtn.click();
      });

      bpmRange.addEventListener('input', () => {
        bpm = Number(bpmRange.value);
        updateBpmText();
      });

      renderGrid();
    }

    mount();
    bindLangRefresh(container, mount);
    return { stopLoop };
  }

  /* 4. Interactive Touch-Conducting Baton Canvas */
  function createConductor(container, opts = {}) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return null;

    let beats = opts.beats || 4;
    let isCompound = !!opts.compound;
    let running = false;
    let timer = null;

    function stop() {
      running = false;
      if (timer) clearTimeout(timer);
      const rb = container.querySelector('[data-role="run"]');
      if (rb) rb.textContent = t('▶ Auto-Conduct', '▶ 自動揮拍');
    }

    function mount() {
      stop();
      container.innerHTML = '';

      const PATTERNS = {
        2: {
          label: t('Duple (2/4, 2/2, 6/8)', '二拍子 (2/4, 2/2, 6/8)'),
          points: [
            { x: 150, y: 34,  name: t('Prep', '預備頂點') },
            { x: 150, y: 174, name: t('Beat 1 Down ↓', '1 強拍 ↓') },
            { x: 196, y: 52,  name: t('Beat 2 Up ↗', '2 弱拍 ↗') }
          ],
          pathD: 'M 150 34 L 150 174 Q 204 152, 196 52 Q 165 24, 150 34'
        },
        3: {
          label: t('Triple (3/4, 3/8, 9/8)', '三拍子 (3/4, 3/8, 9/8)'),
          points: [
            { x: 132, y: 34,  name: t('Prep', '預備頂點') },
            { x: 132, y: 174, name: t('Beat 1 Down ↓', '1 強拍 ↓') },
            { x: 230, y: 144, name: t('Beat 2 Out →', '2 外拍 →') },
            { x: 132, y: 38,  name: t('Beat 3 Up ↖', '3 上拍 ↖') }
          ],
          pathD: 'M 132 34 L 132 174 Q 180 180, 230 144 Q 192 82, 132 38'
        },
        4: {
          label: t('Quadruple (4/4, C, 12/8)', '四拍子 (4/4, C, 12/8)'),
          points: [
            { x: 150, y: 32,  name: t('Prep', '預備頂點') },
            { x: 150, y: 176, name: t('Beat 1 Down ↓', '1 強拍 ↓') },
            { x: 66,  y: 134, name: t('Beat 2 In ←', '2 內拍 ←') },
            { x: 236, y: 134, name: t('Beat 3 Out →', '3 次強 →') },
            { x: 150, y: 36,  name: t('Beat 4 Up ↑', '4 上拍 ↑') }
          ],
          pathD: 'M 150 32 L 150 176 Q 104 164, 66 134 Q 150 108, 236 134 Q 204 76, 150 36'
        }
      };

      const bar = document.createElement('div');
      bar.className = 'widget-controls';

      function makeBtn(txt, active) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn-sm';
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
        b.textContent = txt;
        return b;
      }

      const b2 = makeBtn(t('2-Beat', '2 拍'), beats === 2);
      const b3 = makeBtn(t('3-Beat', '3 拍'), beats === 3);
      const b4 = makeBtn(t('4-Beat', '4 拍'), beats === 4);
      const subBtn = makeBtn(isCompound ? t('Compound (1-la-le)', '複拍 (1-la-le)') : t('Simple (1-&)', '單拍 (1-&)'), isCompound);
      const runBtn = document.createElement('button');
      runBtn.type = 'button';
      runBtn.dataset.role = 'run';
      runBtn.className = 'btn btn-primary btn-sm';
      runBtn.textContent = t('▶ Auto-Conduct', '▶ 自動揮拍');

      bar.append(b2, b3, b4, subBtn, runBtn);

      const status = document.createElement('div');
      status.className = 'visual-pill';
      status.style.marginBlock = '0.4rem';
      status.textContent = t('👆 Drag across beats 1·2·3·4 with your finger, or press Auto-Conduct!', '👆 可直接滑過拍點 1·2·3·4 親手指揮，或按「自動揮拍」');

      const svgWrap = document.createElement('div');
      svgWrap.style.maxInlineSize = '340px';
      svgWrap.style.marginInline = 'auto';

      container.append(bar, status, svgWrap);

      let batonDot = null;
      let pulseRing = null;

      function flashRing(x, y) {
        if (!pulseRing) return;
        pulseRing.setAttribute('cx', String(x));
        pulseRing.setAttribute('cy', String(y));
        pulseRing.animate?.([{ r: 10, opacity: 0.95 }, { r: 28, opacity: 0 }], { duration: 320, easing: 'ease-out' });
      }

      function drawPattern() {
        const pat = PATTERNS[beats];
        svgWrap.innerHTML = `
          <svg viewBox="0 0 300 208" role="img" aria-label="${pat.label}" style="background:#0b1020;border:1.5px solid var(--border-strong);border-radius:16px;touch-action:none;cursor:pointer;">
            <path d="${pat.pathD}" fill="none" stroke="#475569" stroke-width="3.5" stroke-dasharray="6 5"/>
            ${pat.points.slice(1).map((pt, i) => `
              <g class="beat-node" data-beat="${i + 1}">
                <circle cx="${pt.x}" cy="${pt.y}" r="18" fill="${i === 0 ? '#ef444433' : '#6366f133'}" stroke="${i === 0 ? '#f87171' : '#818cf8'}" stroke-width="2.5"/>
                <text x="${pt.x}" y="${pt.y + 5}" text-anchor="middle" font-size="14" font-weight="800" fill="#f8fafc">${i + 1}</text>
              </g>
            `).join('')}
            <circle id="baton-ring" cx="${pat.points[0].x}" cy="${pat.points[0].y}" r="16" fill="none" stroke="#fbbf24" stroke-width="2" opacity="0"/>
            <circle id="baton-tip" cx="${pat.points[0].x}" cy="${pat.points[0].y}" r="10" fill="#fbbf24" style="filter:drop-shadow(0 0 8px #fbbf24)"/>
          </svg>
        `;
        batonDot = svgWrap.querySelector('#baton-tip');
        pulseRing = svgWrap.querySelector('#baton-ring');

        const svgEl = svgWrap.querySelector('svg');
        let lastHitBeat = -1;
        function handlePointer(e) {
          const rect = svgEl.getBoundingClientRect();
          const sx = ((e.clientX - rect.left) / rect.width) * 300;
          const sy = ((e.clientY - rect.top) / rect.height) * 208;
          batonDot.setAttribute('cx', sx.toFixed(1));
          batonDot.setAttribute('cy', sy.toFixed(1));
          pat.points.slice(1).forEach((pt, idx) => {
            const dist = Math.hypot(sx - pt.x, sy - pt.y);
            if (dist < 24 && lastHitBeat !== idx) {
              lastHitBeat = idx;
              window.AudioEngine.playPercussion('clave', idx === 0);
              flashRing(pt.x, pt.y);
              status.textContent = `✨ ${pt.name}`;
            }
          });
        }
        let dragging = false;
        svgEl.addEventListener('pointerdown', (e) => { stop(); dragging = true; lastHitBeat = -1; handlePointer(e); });
        svgEl.addEventListener('pointermove', (e) => { if (dragging) handlePointer(e); });
        window.addEventListener('pointerup', () => { dragging = false; lastHitBeat = -1; });
      }

      function start() {
        stop();
        running = true;
        runBtn.textContent = t('■ Stop', '■ 停止');
        const pat = PATTERNS[beats];
        const subdiv = isCompound ? 3 : 2;
        let step = -subdiv;

        function stepLoop() {
          if (!running) return;
          if (step < 0) {
            const upPt = pat.points[beats];
            batonDot.setAttribute('cx', String(upPt.x));
            batonDot.setAttribute('cy', String(upPt.y));
            status.textContent = t('🌬️ Silent Preparatory Beat (breathe in)...', '🌬️ 無聲預備拍 (吸氣準備)...');
            if (step === -subdiv) window.AudioEngine.playPercussion('hihat', false);
          } else {
            const beatNum = Math.floor(step / subdiv) % beats;
            const subNum = step % subdiv;
            const pt = pat.points[beatNum + 1];
            const nextPt = pat.points[((beatNum + 1) % beats) + 1];
            const ratio = subNum / subdiv;
            batonDot.setAttribute('cx', String(pt.x + (nextPt.x - pt.x) * ratio * 0.65));
            batonDot.setAttribute('cy', String(pt.y + (nextPt.y - pt.y) * ratio * 0.65));

            const syl = isCompound ? [String(beatNum + 1), 'la', 'le'][subNum] : [String(beatNum + 1), '&'][subNum];
            status.textContent = `🎯 ${pt.name} · "${syl}"`;

            if (subNum === 0) {
              window.AudioEngine.playPercussion('clave', beatNum === 0);
              flashRing(pt.x, pt.y);
            } else {
              window.AudioEngine.playPercussion('hihat', false);
            }
          }
          step++;
          timer = setTimeout(stepLoop, isCompound ? 250 : 350);
        }
        stepLoop();
      }

      [[b2, 2], [b3, 3], [b4, 4]].forEach(([btn, n]) => {
        btn.addEventListener('click', () => {
          beats = n;
          [b2, b3, b4].forEach(x => x.setAttribute('aria-pressed', x === btn ? 'true' : 'false'));
          drawPattern();
          if (running) start();
        });
      });

      subBtn.addEventListener('click', () => {
        isCompound = !isCompound;
        subBtn.setAttribute('aria-pressed', isCompound ? 'true' : 'false');
        subBtn.textContent = isCompound ? t('Compound (1-la-le)', '複拍 (1-la-le)') : t('Simple (1-&)', '單拍 (1-&)');
        if (running) start();
      });

      runBtn.addEventListener('click', () => running ? stop() : start());
      drawPattern();
    }

    mount();
    bindLangRefresh(container, mount);
    return { stop };
  }

  /* 5. Chromatic Interactive Dual-Ring Circle of Fifths */
  function createCircleOfFifths(container, opts = {}) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return null;

    const data = window.CourseData.CIRCLE_OF_FIFTHS;
    const showMinor = opts.showMinor !== false;
    let selectedPos = 0;
    let useEnharmonic = false;

    function polar(cx, cy, r, deg) {
      const rad = (deg - 90) * Math.PI / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }

    function wedgePath(cx, cy, rIn, rOut, a0, a1) {
      const p1 = polar(cx, cy, rOut, a0);
      const p2 = polar(cx, cy, rOut, a1);
      const p3 = polar(cx, cy, rIn, a1);
      const p4 = polar(cx, cy, rIn, a0);
      return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${rOut} ${rOut} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} L ${p3.x.toFixed(1)} ${p3.y.toFixed(1)} A ${rIn} ${rIn} 0 0 0 ${p4.x.toFixed(1)} ${p4.y.toFixed(1)} Z`;
    }

    function mount() {
      container.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'circle-fifths-wrap';

      const svgHolder = document.createElement('div');
      svgHolder.style.maxInlineSize = '340px';
      svgHolder.style.inlineSize = '100%';
      svgHolder.style.marginInline = 'auto';
      const detailHolder = document.createElement('div');
      wrap.append(svgHolder, detailHolder);
      container.appendChild(wrap);

      function renderWheel() {
        const cx = 190, cy = 190;
        const ivPos = (selectedPos + 11) % 12;
        const vPos = (selectedPos + 1) % 12;
        let slicesHtml = '';

        data.forEach((item, idx) => {
          const a0 = idx * 30 - 15;
          const a1 = idx * 30 + 15;
          const isSel = idx === selectedPos;
          const isNeighbor = idx === ivPos || idx === vPos;
          const pMaj = polar(cx, cy, 146, idx * 30);
          const pMin = polar(cx, cy, 94, idx * 30);
          const hueColor = getColor((idx * 7) % 12);

          slicesHtml += `
            <g class="circle-slice" data-pos="${idx}" tabindex="0" role="button" aria-label="${item.labelMaj}">
              <path d="${wedgePath(cx, cy, showMinor ? 118 : 74, 176, a0, a1)}"
                fill="${isSel ? hueColor : (isNeighbor ? 'var(--brand-soft)' : 'var(--bg-elevated)')}"
                stroke="${isSel ? '#fff' : 'var(--border-strong)'}" stroke-width="${isSel ? 2.5 : 1.3}"/>
              <text x="${pMaj.x.toFixed(1)}" y="${(pMaj.y + 4).toFixed(1)}" text-anchor="middle"
                font-size="12.5" font-weight="800" fill="${isSel ? '#ffffff' : 'var(--text-primary)'}">${item.labelMaj}</text>
              ${showMinor ? `
                <path d="${wedgePath(cx, cy, 68, 118, a0, a1)}"
                  fill="${isSel ? 'var(--accent-amber-soft)' : 'var(--bg-subtle)'}"
                  stroke="var(--border-strong)" stroke-width="1.2"/>
                <text x="${pMin.x.toFixed(1)}" y="${(pMin.y + 4).toFixed(1)}" text-anchor="middle"
                  font-size="11.5" font-weight="700" fill="${isSel ? 'var(--accent-amber)' : 'var(--text-secondary)'}">${item.labelMin}</text>
              ` : ''}
            </g>
          `;
        });

        svgHolder.innerHTML = `
          <svg viewBox="0 0 380 380" role="img" aria-label="${t('Circle of Fifths', '互動五度圈')}">
            ${slicesHtml}
            <circle cx="${cx}" cy="${cy}" r="66" fill="var(--bg-surface)" stroke="var(--border-strong)" stroke-width="1.5"/>
            <text x="${cx}" y="${cy - 5}" text-anchor="middle" font-size="13" font-weight="800" fill="var(--brand)">${data[selectedPos].labelMaj}</text>
            <text x="${cx}" y="${cy + 13}" text-anchor="middle" font-size="10" font-weight="700" fill="var(--text-muted)">${t('Tap a wedge', '點擊扇區試聽')}</text>
          </svg>
        `;

        svgHolder.querySelectorAll('.circle-slice').forEach(g => {
          const pos = Number(g.dataset.pos);
          const activate = () => {
            selectedPos = pos;
            useEnharmonic = false;
            renderWheel();
            renderDetail();
            const k = data[pos].sigKey;
            const chord = window.CourseData.buildScale(k + '4', 'major').notes;
            window.AudioEngine.playChord([chord[0], chord[2], chord[4]], 0.7);
          };
          g.addEventListener('click', activate);
          g.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
          });
        });
      }

      function renderDetail() {
        const item = data[selectedPos];
        const activeKey = (useEnharmonic && item.enhMaj) ? item.enhMaj : item.sigKey;
        const activeMin = (useEnharmonic && item.enhMin) ? item.enhMin : item.minor;
        const majScale = window.CourseData.buildScale(activeKey + '4', 'major');
        const minScale = window.CourseData.buildScale(activeMin.toUpperCase() + '4', 'naturalMinor');

        const accDesc = activeKey === 'C'
          ? t('0 sharps/flats', '0 升降')
          : (['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'].includes(activeKey)
            ? `${{ F: 1, Bb: 2, Eb: 3, Ab: 4, Db: 5, Gb: 6, Cb: 7 }[activeKey]} ♭`
            : `${{ G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7 }[activeKey]} ♯`);

        const ivName = data[(selectedPos + 11) % 12].labelMaj;
        const vName = data[(selectedPos + 1) % 12].labelMaj;
        const dispMaj = activeKey.replace('#', '♯').replace('b', '♭');
        const dispMin = activeMin.replace('#', '♯').replace('b', '♭');

        detailHolder.innerHTML = `
          <div class="concept-card">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;">
              <h3 style="margin:0;">${dispMaj} ${t('Major', '大調')} ${showMinor ? `/ ${dispMin} ${t('minor', '小調')}` : ''}</h3>
              <span class="badge">${accDesc}</span>
            </div>
            <div class="pill-row">
              <span class="visual-pill">IV: <strong>${ivName}</strong></span>
              <span class="visual-pill">I: <strong>${dispMaj}</strong></span>
              <span class="visual-pill">V: <strong>${vName}</strong></span>
            </div>
            <div id="cof-staff-preview"></div>
            <div class="widget-controls">
              <button type="button" class="btn btn-sm btn-primary" id="cof-play-maj">▶ ${t('Major Scale', '大調音階')}</button>
              ${showMinor ? `<button type="button" class="btn btn-sm" id="cof-play-min">▶ ${t('Relative Minor', '關係小調')}</button>` : ''}
              ${item.enhMaj ? `<button type="button" class="btn btn-sm btn-amber" id="cof-toggle-enh">⇄ ${t('Enharmonic', '等音調')} (${useEnharmonic ? item.sigKey : item.enhMaj})</button>` : ''}
            </div>
          </div>
        `;

        const scoreApi = window.MusicNotation.render(detailHolder.querySelector('#cof-staff-preview'), {
          grand: showMinor,
          clef: 'treble',
          key: activeKey,
          playable: false,
          minWidth: 280,
          spacing: 38,
          notes: majScale.notes.map(n => ({ pitch: n.ascii, dur: 'q', hideAccidental: true, label: n.name })),
          bassNotes: showMinor ? minScale.notes.map(n => ({ pitch: n.letter + (n.alter === 1 ? '#' : n.alter === -1 ? 'b' : '') + '3', dur: 'q', hideAccidental: true })) : []
        });

        detailHolder.querySelector('#cof-play-maj')?.addEventListener('click', () => {
          window.AudioEngine.playSequence(majScale.notes.map((n, idx) => ({ pitch: n, beats: 0.45, idx })), 108, {
            onStep: (ev) => scoreApi?.highlightNote(ev.idx),
            onDone: () => scoreApi?.resetHighlight()
          });
        });
        detailHolder.querySelector('#cof-play-min')?.addEventListener('click', () => {
          window.AudioEngine.playSequence(minScale.notes.map((n, idx) => ({ pitch: n, beats: 0.45, idx })), 108, {
            onStep: (ev) => scoreApi?.highlightNote(ev.idx),
            onDone: () => scoreApi?.resetHighlight()
          });
        });
        detailHolder.querySelector('#cof-toggle-enh')?.addEventListener('click', () => {
          useEnharmonic = !useEnharmonic;
          renderDetail();
        });
      }

      renderWheel();
      renderDetail();
    }

    mount();
    bindLangRefresh(container, mount);
  }

  /* 6. Guitar Chord Box */
  function createGuitarChord(container, spec) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;
    const card = document.createElement('div');
    card.className = 'guitar-card';

    const strX = [22, 38, 54, 70, 86, 102];
    const fretY = [28, 50, 72, 94, 116];

    let markers = '';
    spec.frets.forEach((f, sIdx) => {
      const x = strX[sIdx];
      if (f === -1) {
        markers += `<text x="${x}" y="19" text-anchor="middle" font-size="12" font-weight="700" fill="var(--danger)">✕</text>`;
      } else if (f === 0) {
        markers += `<circle cx="${x}" cy="15" r="4.5" fill="none" stroke="var(--success)" stroke-width="1.8"/>`;
      } else {
        const y = fretY[f - 1] + 11;
        markers += `<circle cx="${x}" cy="${y}" r="6.2" fill="var(--brand)"/>`;
      }
    });

    function renderCard() {
      const sub = pick(spec.subtitle);
      card.innerHTML = `
        <div style="font-weight:800;font-size:1rem;">${spec.name}</div>
        ${sub ? `<div style="font-size:0.74rem;color:var(--text-muted);margin-block-end:0.3rem;">${sub}</div>` : ''}
        <svg viewBox="0 0 124 128" role="img" aria-label="Guitar ${spec.name}" style="margin-inline:auto;max-inline-size:116px;">
          <line x1="22" y1="28" x2="102" y2="28" stroke="currentColor" stroke-width="4"/>
          ${fretY.slice(1).map(y => `<line x1="22" y1="${y}" x2="102" y2="${y}" stroke="var(--border-strong)" stroke-width="1.4"/>`).join('')}
          ${strX.map(x => `<line x1="${x}" y1="28" x2="${x}" y2="116" stroke="currentColor" stroke-width="1.3"/>`).join('')}
          ${markers}
        </svg>
        <button type="button" class="btn btn-sm" style="margin-block-start:0.35rem;inline-size:100%;">🎸 ${t('Strum', '刷弦')}</button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        window.AudioEngine.playChord(spec.pitches, 1.35, 0, { strum: true, timbre: 'guitar' });
      });
    }

    renderCard();
    bindLangRefresh(card, renderCard);
    container.appendChild(card);
  }

  /* 7. Practice & Focus on Skills Quiz Engine (Bilingual) */
  function createQuiz(container, quizId, pageId, questions) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;

    const state = new Array(questions.length).fill(null);
    const chosenIdx = new Array(questions.length).fill(null);

    function mount() {
      container.innerHTML = '';
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.flexWrap = 'wrap';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.gap = '0.5rem';
      header.style.marginBlockEnd = '0.75rem';

      const scoreBadge = document.createElement('div');
      scoreBadge.className = 'visual-pill';

      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'btn btn-sm';
      resetBtn.textContent = t('↺ Retry', '↺ 重練');

      header.append(scoreBadge, resetBtn);

      const list = document.createElement('div');
      list.className = 'quiz-list';

      function updateBadgeText() {
        const answered = state.filter(v => v !== null).length;
        const correct = state.filter(v => v === true).length;
        scoreBadge.innerHTML = answered === 0
          ? t(`🎯 Progress: <strong>0 / ${questions.length}</strong>`, `🎯 進度：<strong>0 / ${questions.length}</strong>`)
          : t(`🏆 Score: <strong>${correct} / ${questions.length}</strong>`, `🏆 得分：<strong>${correct} / ${questions.length}</strong>`);
      }

      function renderQuestions() {
        list.innerHTML = '';
        questions.forEach((q, qIdx) => {
          const card = document.createElement('div');
          card.className = 'quiz-card';

          const qTitle = document.createElement('div');
          qTitle.className = 'quiz-q';
          qTitle.innerHTML = `<span class="badge">Q${qIdx + 1}</span> <span>${pick(q.prompt)}</span>`;
          card.appendChild(qTitle);

          if (q.scoreSpec) {
            const scoreDiv = document.createElement('div');
            card.appendChild(scoreDiv);
            window.MusicNotation.render(scoreDiv, q.scoreSpec);
          }

          if (q.audioFn) {
            const audioBtn = document.createElement('button');
            audioBtn.type = 'button';
            audioBtn.className = 'btn btn-sm btn-amber';
            audioBtn.style.marginBlockEnd = '0.6rem';
            audioBtn.textContent = pick(q.audioLabel) || t('🔊 Play Audio Prompt', '🔊 播放題目音訊');
            audioBtn.addEventListener('click', () => q.audioFn());
            card.appendChild(audioBtn);
          }

          const optsWrap = document.createElement('div');
          optsWrap.className = 'quiz-options';

          const fb = document.createElement('div');
          fb.className = 'quiz-feedback';
          fb.hidden = state[qIdx] === null;

          const resolvedOpts = Array.isArray(q.options) ? q.options.map(o => pick(o)) : pick(q.options);

          resolvedOpts.forEach((optText, oIdx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn quiz-opt';
            btn.textContent = optText;

            if (state[qIdx] !== null) {
              if (oIdx === q.answer) btn.classList.add('is-correct');
              else if (oIdx === chosenIdx[qIdx] && !state[qIdx]) btn.classList.add('is-wrong');
            }

            btn.addEventListener('click', () => {
              if (state[qIdx] !== null) return;
              const isOk = oIdx === q.answer;
              state[qIdx] = isOk;
              chosenIdx[qIdx] = oIdx;

              optsWrap.querySelectorAll('button').forEach((b, bi) => {
                if (bi === q.answer) b.classList.add('is-correct');
                else if (bi === oIdx && !isOk) b.classList.add('is-wrong');
              });

              fb.hidden = false;
              fb.className = 'quiz-feedback ' + (isOk ? 'ok' : 'err');
              fb.innerHTML = `<strong>${isOk ? t('✓ Correct!', '✓ 正確！') : t('✕ Hint:', '✕ 提示：')}</strong> ${pick(q.explanation) || ''}`;

              if (isOk) window.AudioEngine.playChord(['C5', 'E5', 'G5'], 0.35);
              else window.AudioEngine.playNote('F#3', 0.25);

              updateBadgeText();
              const answered = state.filter(v => v !== null).length;
              const correct = state.filter(v => v === true).length;
              announcePolite(t(`Score ${correct} of ${questions.length}`, `目前已答對 ${correct} 題，共 ${questions.length} 題`));
              if (answered === questions.length) {
                window.CourseData.recordQuizScore(quizId, pageId, correct, questions.length);
              }
            });

            optsWrap.appendChild(btn);
          });

          if (state[qIdx] !== null) {
            fb.className = 'quiz-feedback ' + (state[qIdx] ? 'ok' : 'err');
            fb.innerHTML = `<strong>${state[qIdx] ? t('✓ Correct!', '✓ 正確！') : t('✕ Hint:', '✕ 提示：')}</strong> ${pick(q.explanation) || ''}`;
          }

          card.append(optsWrap, fb);
          list.appendChild(card);
        });
      }

      resetBtn.addEventListener('click', () => {
        state.fill(null);
        chosenIdx.fill(null);
        updateBadgeText();
        renderQuestions();
      });

      updateBadgeText();
      container.append(header, list);
      renderQuestions();
    }

    mount();
    bindLangRefresh(container, mount);
  }

  /* 8. Interactive Sound Wave & ADSR Oscilloscope Lab */
  function createWaveLab(container) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;

    function mount() {
      container.innerHTML = `
        <canvas class="visual-canvas" width="680" height="220" aria-label="Live sound wave oscilloscope"></canvas>
        <div class="concept-grid" style="margin-block-start:0.65rem;">
          <label class="concept-card" style="padding:0.7rem;">
            <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:800;">
              <span>🎵 ${t('Pitch (Freq)', '音高頻率')}</span><span id="wl-f-val" style="color:var(--brand);">440 Hz (A4)</span>
            </div>
            <input type="range" id="wl-f" min="110" max="880" value="440" style="inline-size:100%;margin-block-start:0.35rem;">
          </label>
          <label class="concept-card" style="padding:0.7rem;">
            <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:800;">
              <span>📢 ${t('Volume (Amp)', '音量振幅')}</span><span id="wl-v-val" style="color:var(--accent-amber);">75% (f)</span>
            </div>
            <input type="range" id="wl-v" min="15" max="100" value="75" style="inline-size:100%;margin-block-start:0.35rem;">
          </label>
          <label class="concept-card" style="padding:0.7rem;">
            <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:800;">
              <span>⏱️ ${t('Duration', '延音時值')}</span><span id="wl-d-val" style="color:var(--success);">1.0s</span>
            </div>
            <input type="range" id="wl-d" min="0.2" max="2.2" step="0.1" value="1.0" style="inline-size:100%;margin-block-start:0.35rem;">
          </label>
          <div class="concept-card" style="padding:0.7rem;display:flex;flex-direction:column;justify-content:space-between;gap:0.35rem;">
            <div style="font-size:0.82rem;font-weight:800;">🎨 ${t('Timbre', '音色泛音')}</div>
            <select id="wl-t" style="inline-size:100%;">
              <option value="flute">${t('🪈 Flute (Pure Sine)', '🪈 長笛（純淨正弦波）')}</option>
              <option value="piano" selected>${t('🎹 Piano (Bright Hammer)', '🎹 鋼琴（清脆擊弦泛音）')}</option>
              <option value="clarinet">${t('🎷 Clarinet (Odd Harmonics)', '🎷 單簧管（奇次方波感）')}</option>
              <option value="violin">${t('🎻 Violin (Rich Sawtooth)', '🎻 小提琴（豐富鋸齒泛音）')}</option>
              <option value="guitar">${t('🎸 Guitar (Plucked Decay)', '🎸 吉他（撥弦快速衰減）')}</option>
            </select>
          </div>
        </div>
        <div class="widget-controls">
          <button type="button" class="btn btn-primary" id="wl-play">🔊 ${t('Play & Excite Wave', '發聲並激發聲波')}</button>
          <span class="visual-pill">${t('Drag sliders to watch wavelength, amplitude & harmonic ripples!', '拖動滑桿立即觀察波長疏密、振幅高低與泛音鋸齒！')}</span>
        </div>
      `;

      const cvs = container.querySelector('canvas');
      const c = cvs.getContext('2d');
      const fIn = container.querySelector('#wl-f');
      const vIn = container.querySelector('#wl-v');
      const dIn = container.querySelector('#wl-d');
      const tIn = container.querySelector('#wl-t');
      let phase = 0;
      let energy = 0.55;

      function timbreSample(type, th) {
        if (type === 'flute') return Math.sin(th) * 0.9 + Math.sin(2 * th) * 0.1;
        if (type === 'clarinet') return Math.sin(th) * 0.65 + Math.sin(3 * th) * 0.28 + Math.sin(5 * th) * 0.12;
        if (type === 'violin') return (Math.sin(th) + 0.5 * Math.sin(2 * th) + 0.33 * Math.sin(3 * th) + 0.25 * Math.sin(4 * th)) * 0.58;
        if (type === 'guitar') return Math.sin(th) * 0.6 + Math.sin(2 * th) * 0.32 + Math.sin(3 * th) * 0.16;
        return Math.sin(th) * 0.72 + Math.sin(2 * th) * 0.22 + Math.sin(3 * th) * 0.08;
      }

      function updateText() {
        const hz = Number(fIn.value);
        const vol = Number(vIn.value);
        const dur = Number(dIn.value);
        const dyn = vol < 30 ? 'pp' : vol < 52 ? 'p' : vol < 72 ? 'mf' : vol < 88 ? 'f' : 'ff';
        container.querySelector('#wl-f-val').textContent = `${hz} Hz`;
        container.querySelector('#wl-v-val').textContent = `${vol}% (${dyn})`;
        container.querySelector('#wl-d-val').textContent = `${dur.toFixed(1)}s`;
      }

      function draw() {
        if (!document.body.contains(cvs)) return;
        const w = cvs.width, h = cvs.height;
        c.clearRect(0, 0, w, h);
        c.strokeStyle = 'rgba(148,163,184,0.14)';
        c.lineWidth = 1;
        c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();

        const hz = Number(fIn.value);
        const amp = (Number(vIn.value) / 100) * (h * 0.4) * (0.45 + energy * 0.55);
        const cycles = (hz / 110) * 1.65;
        const timbre = tIn.value;
        const durRatio = Number(dIn.value) / 2.2;
        const hue = window.AudioEngine.pitchColor(hz);

        c.fillStyle = hue + '1f';
        c.beginPath();
        c.moveTo(0, h / 2);
        for (let x = 0; x <= w; x += 4) {
          const u = x / w;
          const env = u < 0.06 ? (u / 0.06) : Math.exp(-(u - 0.06) * (2.6 - durRatio * 1.8));
          c.lineTo(x, h / 2 - amp * env);
        }
        for (let x = w; x >= 0; x -= 4) {
          const u = x / w;
          const env = u < 0.06 ? (u / 0.06) : Math.exp(-(u - 0.06) * (2.6 - durRatio * 1.8));
          c.lineTo(x, h / 2 + amp * env);
        }
        c.closePath();
        c.fill();

        c.strokeStyle = hue;
        c.lineWidth = 3;
        c.shadowColor = hue;
        c.shadowBlur = 10;
        c.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const u = x / w;
          const env = u < 0.05 ? (u / 0.05) : Math.exp(-(u - 0.05) * (1.8 - durRatio * 1.2));
          const th = u * cycles * Math.PI * 2 - phase;
          const y = h / 2 - timbreSample(timbre, th) * amp * env;
          if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
        c.shadowBlur = 0;

        phase += 0.09 * (hz / 220);
        energy = Math.max(0.35, energy * 0.985);
        requestAnimationFrame(draw);
      }

      function triggerPlay() {
        energy = 1;
        window.AudioEngine.playNote(Number(fIn.value), Number(dIn.value), 0, {
          timbre: tIn.value,
          velocity: Number(vIn.value) / 100
        });
      }

      [fIn, vIn, dIn].forEach(el => el.addEventListener('input', updateText));
      [fIn, tIn].forEach(el => el.addEventListener('change', triggerPlay));
      container.querySelector('#wl-play').addEventListener('click', triggerPlay);
      updateText();
      requestAnimationFrame(draw);
    }

    mount();
    bindLangRefresh(container, mount);
  }

  /* 9. Animated Musical Texture Ribbon Visualizer */
  function createTextureCanvas(container) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;
    let mode = 'mono';
    let animStart = performance.now();

    function mount() {
      container.innerHTML = `
        <div class="widget-controls" style="margin-block-start:0;">
          <button type="button" class="btn ${mode === 'mono' ? 'btn-primary' : ''}" data-tex="mono">${t('① Monophonic (Solo Line)', '① 單音 Monophonic（單線旋律）')}</button>
          <button type="button" class="btn ${mode === 'homo' ? 'btn-primary' : ''}" data-tex="homo">${t('② Homophonic (Melody + Chords)', '② 主音 Homophonic（旋律＋和弦柱）')}</button>
          <button type="button" class="btn ${mode === 'poly' ? 'btn-primary' : ''}" data-tex="poly">${t('③ Polyphonic (Canon Weave)', '③ 複音 Polyphonic（雙聲部卡農交織）')}</button>
        </div>
        <canvas class="visual-canvas" width="680" height="190" aria-label="Musical texture canvas"></canvas>
      `;

      const cvs = container.querySelector('canvas');
      const c = cvs.getContext('2d');
      const btns = container.querySelectorAll('[data-tex]');
      const MELODY_STEPS = [0, 1, 2, 0, 2, 3, 4, 4];

      function playMode(m) {
        mode = m;
        animStart = performance.now();
        btns.forEach(b => b.classList.toggle('btn-primary', b.dataset.tex === m));
        if (m === 'mono') {
          window.AudioEngine.playSequence([
            { pitch: 'C4', beats: 1 }, { pitch: 'D4', beats: 1 }, { pitch: 'E4', beats: 1 }, { pitch: 'C4', beats: 1 },
            { pitch: 'E4', beats: 1 }, { pitch: 'F4', beats: 1 }, { pitch: 'G4', beats: 2 }
          ], 120);
        } else if (m === 'homo') {
          window.AudioEngine.playSequence([
            { notes: ['C3', 'E3', 'G3', 'C4'], beats: 1 }, { notes: ['G2', 'F3', 'G3', 'D4'], beats: 1 },
            { notes: ['C3', 'E3', 'G3', 'E4'], beats: 1 }, { notes: ['C3', 'E3', 'G3', 'C4'], beats: 1 },
            { notes: ['C3', 'G3', 'C4', 'E4'], beats: 1 }, { notes: ['F3', 'A3', 'C4', 'F4'], beats: 1 },
            { notes: ['G3', 'B3', 'D4', 'G4'], beats: 2 }
          ], 120);
        } else {
          window.AudioEngine.playSequence([
            { pitch: 'C4', beats: 1 }, { pitch: 'D4', beats: 1 }, { pitch: 'E4', beats: 1 }, { pitch: 'C4', beats: 1 },
            { notes: ['C4', 'E4'], beats: 1 }, { notes: ['D4', 'F4'], beats: 1 }, { notes: ['E4', 'G4'], beats: 1 }, { notes: ['C4', 'G4'], beats: 1 },
            { notes: ['E4', 'G4'], beats: 0.5 }, { pitch: 'A4', beats: 0.5 }, { notes: ['F4', 'G4'], beats: 0.5 }, { pitch: 'F4', beats: 0.5 },
            { notes: ['G4', 'E4'], beats: 1 }, { notes: ['C4', 'C5'], beats: 1 }
          ], 120);
        }
      }

      btns.forEach(b => b.addEventListener('click', () => playMode(b.dataset.tex)));

      function renderFrame(now) {
        if (!document.body.contains(cvs)) return;
        const w = cvs.width, h = cvs.height;
        c.clearRect(0, 0, w, h);
        const prog = ((now - animStart) / 4000) % 1;
        const playX = 40 + prog * (w - 80);

        if (mode === 'homo') {
          for (let i = 0; i < 8; i++) {
            const bx = 40 + (i / 8) * (w - 80);
            const bw = (w - 80) / 8 - 6;
            const active = Math.abs(playX - (bx + bw / 2)) < bw * 0.7;
            c.fillStyle = active ? 'rgba(251, 191, 36, 0.36)' : 'rgba(99, 102, 241, 0.16)';
            c.strokeStyle = active ? '#fbbf24' : '#4f46e5';
            c.lineWidth = 1.5;
            c.fillRect(bx, h * 0.52, bw, h * 0.38);
            c.strokeRect(bx, h * 0.52, bw, h * 0.38);
          }
        }

        c.strokeStyle = '#22d3ee';
        c.lineWidth = 5;
        c.lineCap = 'round';
        c.beginPath();
        MELODY_STEPS.forEach((st, i) => {
          const x = 55 + (i / 7) * (w - 110);
          const y = (mode === 'homo' ? h * 0.42 : h * 0.62) - st * 18;
          if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
        });
        c.stroke();

        if (mode === 'poly') {
          c.strokeStyle = '#f43f5e';
          c.lineWidth = 4.5;
          c.beginPath();
          MELODY_STEPS.forEach((st, i) => {
            const x = 155 + (i / 7) * (w - 190);
            const y = h * 0.78 - st * 16;
            if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
          });
          c.stroke();
        }

        c.strokeStyle = 'rgba(255,255,255,0.45)';
        c.lineWidth = 2;
        c.beginPath(); c.moveTo(playX, 12); c.lineTo(playX, h - 12); c.stroke();
        requestAnimationFrame(renderFrame);
      }
      requestAnimationFrame(renderFrame);
    }

    mount();
    bindLangRefresh(container, mount);
  }

  /* 10. Proportional Rhythm Brick Wall */
  function createFractionTree(container) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;

    function mount() {
      const rows = [
        { count: 1,  label: t('𝅝 Whole (4 beats)', '𝅝 全音符 (4 拍)'), pitch: 'C4', beats: 4, color: '#ef4444' },
        { count: 2,  label: t('𝅗𝅥 Half (2)', '𝅗𝅥 二分 (2 拍)'),         pitch: 'E4', beats: 2, color: '#f59e0b' },
        { count: 4,  label: t('♩ Quarter', '♩ 四分'),                 pitch: 'G4', beats: 1, color: '#10b981' },
        { count: 8,  label: '♪',                                      pitch: 'C5', beats: 0.5, color: '#3b82f6' },
        { count: 16, label: '♬',                                      pitch: 'E5', beats: 0.25, color: '#8b5cf6' }
      ];

      const wall = document.createElement('div');
      wall.className = 'brick-wall';

      rows.forEach(r => {
        const rowEl = document.createElement('div');
        rowEl.className = 'brick-row';
        rowEl.style.gridTemplateColumns = `repeat(${r.count}, minmax(0, 1fr))`;

        for (let i = 0; i < r.count; i++) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'brick-cell';
          btn.style.borderColor = r.color;
          btn.textContent = r.count <= 8 ? r.label : (i % 4 === 0 ? `${i / 4 + 1}` : '·');
          btn.setAttribute('aria-label', `${r.label} ${i + 1}`);
          btn.addEventListener('click', () => {
            btn.classList.add('is-active');
            btn.style.background = r.color;
            btn.style.color = '#fff';
            const durSec = r.beats * 0.52;
            window.AudioEngine.playNote(r.pitch, durSec);
            setTimeout(() => {
              btn.classList.remove('is-active');
              btn.style.background = '';
              btn.style.color = '';
            }, Math.max(180, durSec * 900));
          });
          rowEl.appendChild(btn);
        }
        wall.appendChild(rowEl);
      });

      const playAll = document.createElement('button');
      playAll.type = 'button';
      playAll.className = 'btn btn-sm btn-primary';
      playAll.textContent = t('▶ Hear 1 → 2 → 4 → 8 → 16 Subdivision', '▶ 聽見 1 → 2 → 4 → 8 → 16 倍速分裂');
      playAll.addEventListener('click', () => {
        const seq = [
          { pitch: 'C4', beats: 2 },
          { pitch: 'E4', beats: 1 }, { pitch: 'E4', beats: 1 },
          { pitch: 'G4', beats: 0.5 }, { pitch: 'G4', beats: 0.5 }, { pitch: 'G4', beats: 0.5 }, { pitch: 'G4', beats: 0.5 },
          ...Array(8).fill({ pitch: 'C5', beats: 0.25 })
        ];
        window.AudioEngine.playSequence(seq, 88);
      });

      const ctrl = document.createElement('div');
      ctrl.className = 'widget-controls';
      const tip = document.createElement('span');
      tip.className = 'visual-pill';
      tip.textContent = t('Tap any brick — brick width equals exact time duration!', '點擊任意積木聽時值長短（寬度＝時間比例）');
      ctrl.append(playAll, tip);

      container.innerHTML = '';
      container.append(ctrl, wall);
    }

    mount();
    bindLangRefresh(container, mount);
  }

  /* 11. Arcade Sight-Reading Reflex Mini-Game */
  function createNoteReflexGame(container, opts = {}) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;

    const clefs = opts.clefs || ['treble', 'bass'];
    let activeClef = clefs[0];
    let streak = 0;
    let totalCorrect = 0;
    let targetPitch = 'G4';

    const POOLS = {
      treble: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'],
      bass:   ['F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'],
      alto:   ['F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4'],
      tenor:  ['D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4']
    };

    function mount() {
      container.innerHTML = `
        <div class="widget-controls" style="justify-content:space-between;margin-block-start:0;">
          <div style="display:flex;flex-wrap:wrap;gap:0.35rem;" id="nr-clefs"></div>
          <div class="pill-row" style="margin:0;">
            <span class="visual-pill">🔥 ${t('Streak', '連勝')}: <strong id="nr-streak">${streak}</strong></span>
            <span class="visual-pill">⭐ ${t('Score', '答對')}: <strong id="nr-score">${totalCorrect}</strong></span>
          </div>
        </div>
        <div id="nr-staff"></div>
        <div class="jam-pad-grid" id="nr-btns" style="grid-template-columns:repeat(7, minmax(0, 1fr));gap:0.35rem;"></div>
        <div id="nr-msg" class="visual-pill" style="margin-block-start:0.35rem;">${t('⚡ Spot the note on the staff and tap its letter!', '⚡ 看五線譜位置，秒按下方對應音名！')}</div>
      `;

      const clefBar = container.querySelector('#nr-clefs');
      const CLEF_NAMES = {
        treble: t('𝄞 Treble', '𝄞 高音譜號'),
        bass: t('𝄢 Bass', '𝄢 低音譜號'),
        alto: t('𝄡 Alto', '𝄡 中音譜號'),
        tenor: t('𝄡 Tenor', '𝄡 次中音譜號')
      };
      clefs.forEach(cl => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn-sm';
        b.setAttribute('aria-pressed', cl === activeClef ? 'true' : 'false');
        b.textContent = CLEF_NAMES[cl] || cl;
        b.addEventListener('click', () => {
          activeClef = cl;
          clefBar.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
          nextQuestion();
        });
        clefBar.appendChild(b);
      });

      const btnGrid = container.querySelector('#nr-btns');
      ['C', 'D', 'E', 'F', 'G', 'A', 'B'].forEach((ltr, idx) => {
        const pc = [0, 2, 4, 5, 7, 9, 11][idx];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'jam-pad';
        b.style.minBlockSize = '54px';
        b.style.setProperty('--pad-color', getColor(pc));
        b.innerHTML = `<span style="font-size:1.05rem;">${ltr}</span>`;
        b.addEventListener('click', () => checkAnswer(ltr));
        btnGrid.appendChild(b);
      });

      function renderStaff() {
        window.MusicNotation.render(container.querySelector('#nr-staff'), {
          clef: activeClef,
          playable: false,
          minWidth: 220,
          spacing: 64,
          notes: [{ pitch: targetPitch, dur: 'w' }]
        });
      }

      function nextQuestion() {
        const pool = POOLS[activeClef] || POOLS.treble;
        let pickNote = pool[Math.floor(Math.random() * pool.length)];
        if (pickNote === targetPitch && pool.length > 1) pickNote = pool[(pool.indexOf(pickNote) + 3) % pool.length];
        targetPitch = pickNote;
        renderStaff();
      }

      function checkAnswer(letter) {
        const ans = targetPitch[0];
        const msg = container.querySelector('#nr-msg');
        if (letter === ans) {
          streak++;
          totalCorrect++;
          window.AudioEngine.playNote(targetPitch, 0.55);
          msg.innerHTML = t(`✅ Hit! That's <strong>${targetPitch}</strong> — Streak +1!`, `✅ 命中！這是 <strong>${targetPitch}</strong> — 連勝 +1！`);
          container.querySelector('#nr-streak').textContent = String(streak);
          container.querySelector('#nr-score').textContent = String(totalCorrect);
          setTimeout(nextQuestion, 380);
        } else {
          streak = 0;
          window.AudioEngine.playNote('F#2', 0.22);
          msg.innerHTML = t(`❌ Not ${letter} — check the line/space again!`, `❌ 差一點！剛才不是 ${letter}，再看一次線間位置！`);
          container.querySelector('#nr-streak').textContent = '0';
        }
      }

      renderStaff();
    }

    mount();
    bindLangRefresh(container, mount);
  }

  /* 12. Scale Step Staircase Visualizer */
  function createStepStaircase(container, opts = {}) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;

    function renderScale(tonicStr, scaleType) {
      const built = window.CourseData.buildScale(tonicStr, scaleType);
      const notes = built.notes;
      const intervals = [];
      for (let i = 1; i < notes.length; i++) {
        const diff = notes[i].midi - notes[i - 1].midi;
        intervals.push(diff === 1 ? 'H' : diff === 2 ? 'W' : 'A2(+3)');
      }

      container.innerHTML = '';
      const stairs = document.createElement('div');
      stairs.className = 'step-staircase';

      const colEls = [];
      notes.forEach((n, idx) => {
        const col = document.createElement('div');
        col.className = 'stair-col';
        const hPx = 28 + (n.midi - notes[0].midi) * 7.5;
        const bar = document.createElement('div');
        bar.className = 'stair-bar';
        bar.style.blockSize = hPx + 'px';
        bar.style.setProperty('--stair-color', getColor(n.pitchClass));
        bar.textContent = idx > 0 ? intervals[idx - 1] : '1̂';

        const nameEl = document.createElement('span');
        nameEl.style.fontSize = '0.76rem';
        nameEl.style.fontWeight = '800';
        nameEl.textContent = n.name;

        col.append(bar, nameEl);
        col.addEventListener('click', () => {
          window.AudioEngine.playNote(n, 0.55);
          col.classList.add('is-playing');
          setTimeout(() => col.classList.remove('is-playing'), 320);
        });
        stairs.appendChild(col);
        colEls.push(col);
      });

      container.appendChild(stairs);
      return { notes, colEls };
    }

    const api = { renderScale };
    if (opts.tonic) renderScale(opts.tonic, opts.type || 'major');
    return api;
  }

  /* 13. Spinning Geometric Polyrhythm Radar */
  function createPolyrhythmRadar(container, opts = {}) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;

    const presets = opts.presets || [
      {
        name: { en: '3/4 (3×2 Triangle) vs 6/8 (2×3 Axis)', zh: '3/4 (3×2 正三角) vs 6/8 (2×3 雙軸)' },
        totalSteps: 6,
        bpm: 135,
        rings: [
          { label: { en: '3/4 (3 beats)', zh: '3/4 三強拍' }, hits: [0, 2, 4], color: '#22d3ee', voice: 'clave' },
          { label: { en: '6/8 (2 beats)', zh: '6/8 二大拍' }, hits: [0, 3],    color: '#fbbf24', voice: 'kick' }
        ]
      },
      {
        name: { en: '2 : 3 Cross-Rhythm (Duplet vs Triplet)', zh: '二對三複節奏 (2 : 3 Cross-Rhythm)' },
        totalSteps: 6,
        bpm: 130,
        rings: [
          { label: { en: '3-Pulse Triangle', zh: '3 等分三角' }, hits: [0, 2, 4], color: '#a855f7', voice: 'clave' },
          { label: { en: '2-Pulse Axis', zh: '2 等分直線' },     hits: [0, 3],    color: '#10b981', voice: 'kick' }
        ]
      },
      {
        name: { en: 'Asymmetric 7/8: 2+2+3 vs 3+2+2', zh: '不對稱 7/8：2+2+3 vs 3+2+2' },
        totalSteps: 7,
        bpm: 165,
        rings: [
          { label: { en: '2+2+3 Accents', zh: '2+2+3 重音' }, hits: [0, 2, 4], color: '#f43f5e', voice: 'clave' },
          { label: { en: '3+2+2 Accents', zh: '3+2+2 重音' }, hits: [0, 3, 5], color: '#38bdf8', voice: 'kick' }
        ]
      }
    ];

    let curIdx = 0;
    let playing = false;
    let step = 0;
    let timer = null;

    function stop() {
      playing = false;
      if (timer) clearTimeout(timer);
    }

    function mount() {
      stop();
      container.innerHTML = `
        <div class="widget-controls" style="margin-block-start:0;">
          <button type="button" class="btn btn-primary" id="pr-play">▶ ${t('Start Geometry Radar', '啟動幾何節奏雷達')}</button>
          <select id="pr-sel" aria-label="${t('Polyrhythm preset', '選擇幾何節奏模型')}"></select>
        </div>
        <canvas class="visual-canvas" width="520" height="240" style="max-block-size:250px;" aria-label="Polyrhythm geometry radar"></canvas>
      `;

      const sel = container.querySelector('#pr-sel');
      presets.forEach((p, i) => {
        const o = document.createElement('option');
        o.value = String(i);
        o.textContent = pick(p.name);
        if (i === curIdx) o.selected = true;
        sel.appendChild(o);
      });

      const cvs = container.querySelector('canvas');
      const c = cvs.getContext('2d');
      const playBtn = container.querySelector('#pr-play');

      function drawRadar(activeStep = -1) {
        const p = presets[curIdx];
        const w = cvs.width, h = cvs.height;
        const cx = w / 2, cy = h / 2;
        c.clearRect(0, 0, w, h);

        c.strokeStyle = 'rgba(148,163,184,0.22)';
        c.lineWidth = 1.5;
        c.beginPath(); c.arc(cx, cy, 88, 0, Math.PI * 2); c.stroke();

        for (let i = 0; i < p.totalSteps; i++) {
          const ang = (i / p.totalSteps) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(ang) * 88;
          const y = cy + Math.sin(ang) * 88;
          c.fillStyle = i === activeStep ? '#fff' : 'rgba(148,163,184,0.45)';
          c.beginPath(); c.arc(x, y, i === activeStep ? 5 : 3, 0, Math.PI * 2); c.fill();
        }

        p.rings.forEach((ring, rIdx) => {
          const rad = 88 - rIdx * 24;
          c.strokeStyle = ring.color;
          c.fillStyle = ring.color + '22';
          c.lineWidth = 2.6;
          c.beginPath();
          ring.hits.forEach((hStep, hi) => {
            const ang = (hStep / p.totalSteps) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(ang) * rad;
            const y = cy + Math.sin(ang) * rad;
            if (hi === 0) c.moveTo(x, y); else c.lineTo(x, y);
          });
          c.closePath(); c.fill(); c.stroke();

          ring.hits.forEach(hStep => {
            const ang = (hStep / p.totalSteps) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(ang) * rad;
            const y = cy + Math.sin(ang) * rad;
            const hitNow = hStep === activeStep;
            c.fillStyle = hitNow ? '#ffffff' : ring.color;
            c.beginPath(); c.arc(x, y, hitNow ? 9 : 6, 0, Math.PI * 2); c.fill();
          });

          c.fillStyle = ring.color;
          c.font = 'bold 12px sans-serif';
          c.fillText(`● ${pick(ring.label)}`, 16, 26 + rIdx * 20);
        });

        if (activeStep >= 0) {
          const ang = (activeStep / p.totalSteps) * Math.PI * 2 - Math.PI / 2;
          c.strokeStyle = '#ffffff';
          c.lineWidth = 2;
          c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(ang) * 92, cy + Math.sin(ang) * 92); c.stroke();
        }
      }

      function tick() {
        if (!playing) return;
        const p = presets[curIdx];
        const cur = step % p.totalSteps;
        drawRadar(cur);
        p.rings.forEach(r => { if (r.hits.includes(cur)) window.AudioEngine.playPercussion(r.voice, cur === 0); });
        if (!p.rings.some(r => r.hits.includes(cur))) window.AudioEngine.playPercussion('hihat', false);
        step++;
        timer = setTimeout(tick, (60 / p.bpm) * 1000);
      }

      playBtn.addEventListener('click', () => {
        if (playing) {
          stop();
          playBtn.textContent = `▶ ${t('Start Geometry Radar', '啟動幾何節奏雷達')}`;
          drawRadar(-1);
        } else {
          playing = true;
          step = 0;
          playBtn.textContent = `■ ${t('Stop', '停止')}`;
          tick();
        }
      });

      sel.addEventListener('change', () => {
        const was = playing;
        stop();
        curIdx = Number(sel.value);
        drawRadar(-1);
        if (was) playBtn.click();
      });

      drawRadar(-1);
    }

    mount();
    bindLangRefresh(container, mount);
  }

  /* 14. Lissajous Interval Consonance/Dissonance Scope */
  function createLissajousInterval(container) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;

    let activeIdx = 5;

    function mount() {
      const INTERVALS = [
        { code: 'P1', name: t('Unison (1:1)', '完全一度 (1:1)'), semi: 0, ratio: [1, 1], mood: t('Pure consonance · Straight line', '極完全協和 · 直線共振'), color: '#10b981' },
        { code: 'm2', name: t('Minor 2nd (16:15)', '小二度 (16:15)'), semi: 1, ratio: [16, 15], mood: t('Sharp dissonance · Rapid beating', '尖銳不協和 · 緊密摩擦'), color: '#f43f5e' },
        { code: 'M3', name: t('Major 3rd (5:4)', '大三度 (5:4)'), semi: 4, ratio: [5, 4], mood: t('Warm, bright consonance', '溫暖明亮協和'), color: '#f59e0b' },
        { code: 'P4', name: t('Perfect 4th (4:3)', '完全四度 (4:3)'), semi: 5, ratio: [4, 3], mood: t('Open consonance', '開闊純淨協和'), color: '#06b6d4' },
        { code: 'A4', name: t('Tritone (45:32)', '三全音 (45:32)'), semi: 6, ratio: [7, 5], mood: t('Restless tension · Craves resolution!', '極度張力 · 渴望解決'), color: '#ec4899' },
        { code: 'P5', name: t('Perfect 5th (3:2)', '完全五度 (3:2)'), semi: 7, ratio: [3, 2], mood: t('Rock-solid consonance', '穩定清澈協和'), color: '#3b82f6' },
        { code: 'P8', name: t('Octave (2:1)', '完全八度 (2:1)'), semi: 12, ratio: [2, 1], mood: t('Perfect fusion · Figure-8 loop', '完美融合協和 (8字環)'), color: '#8b5cf6' }
      ];

      let active = INTERVALS[activeIdx];
      let animT = 0;

      container.innerHTML = `
        <div class="widget-controls" id="lis-btns" style="margin-block-start:0;"></div>
        <canvas class="visual-canvas" width="560" height="210" aria-label="Lissajous harmony scope"></canvas>
        <div class="visual-pill" id="lis-desc" style="margin-block-start:0.45rem;"></div>
      `;

      const btnWrap = container.querySelector('#lis-btns');
      const desc = container.querySelector('#lis-desc');
      const cvs = container.querySelector('canvas');
      const c = cvs.getContext('2d');

      function updateUI() {
        desc.innerHTML = `🔬 <strong>${active.code} — ${active.name}</strong> (${active.semi} ${t('semitones', '半音')}): ${active.mood}`;
      }

      INTERVALS.forEach((iv, idx) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn-sm';
        b.setAttribute('aria-pressed', idx === activeIdx ? 'true' : 'false');
        b.textContent = `${iv.code} ${iv.name.split(' ')[0]}`;
        b.addEventListener('click', () => {
          activeIdx = idx;
          active = iv;
          btnWrap.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
          updateUI();
          window.AudioEngine.playChord([60, 60 + iv.semi], 1.15, 0, { timbre: 'flute' });
        });
        btnWrap.appendChild(b);
      });

      function animate() {
        if (!document.body.contains(cvs)) return;
        const w = cvs.width, h = cvs.height;
        c.clearRect(0, 0, w, h);

        const lcx = w * 0.25, lcy = h * 0.5, rad = Math.min(w * 0.18, h * 0.38);
        c.strokeStyle = active.color;
        c.lineWidth = 2.8;
        c.shadowColor = active.color;
        c.shadowBlur = 8;
        c.beginPath();
        const [rx, ry] = active.ratio;
        for (let i = 0; i <= 260; i++) {
          const u = (i / 260) * Math.PI * 2;
          const x = lcx + Math.sin(rx * u + animT) * rad;
          const y = lcy + Math.sin(ry * u) * rad;
          if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();

        const wx0 = w * 0.50, ww = w * 0.46;
        c.shadowBlur = 0;
        c.strokeStyle = 'rgba(148,163,184,0.35)';
        c.lineWidth = 1.4;
        c.beginPath();
        for (let x = 0; x <= ww; x += 2) {
          const u = (x / ww) * Math.PI * 4;
          const y = lcy - Math.sin(u - animT * 2) * (rad * 0.42);
          if (x === 0) c.moveTo(wx0 + x, y); else c.lineTo(wx0 + x, y);
        }
        c.stroke();

        const semiRatio = Math.pow(2, active.semi / 12);
        c.strokeStyle = active.color;
        c.lineWidth = 2.4;
        c.beginPath();
        for (let x = 0; x <= ww; x += 2) {
          const u = (x / ww) * Math.PI * 4;
          const y = lcy - (Math.sin(u - animT * 2) + Math.sin(u * semiRatio - animT * 2)) * (rad * 0.38);
          if (x === 0) c.moveTo(wx0 + x, y); else c.lineTo(wx0 + x, y);
        }
        c.stroke();

        animT += 0.025;
        requestAnimationFrame(animate);
      }

      updateUI();
      requestAnimationFrame(animate);
    }

    mount();
    bindLangRefresh(container, mount);
  }

  /* 15. Pentatonic & Blues Improv Touch Launchpad */
  function createJamPad(container, opts = {}) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;

    let mode = opts.defaultMode || 'blues';
    let backingOn = false;
    let loopTimer = null;
    let step = 0;

    function stopGroove() {
      backingOn = false;
      if (loopTimer) clearTimeout(loopTimer);
    }

    function mount() {
      stopGroove();
      const MODES = {
        pentMaj: {
          pads: [
            { note: 'C4', label: 'C4 (1)', sub: 'Do' },
            { note: 'D4', label: 'D4 (2)', sub: 'Re' },
            { note: 'E4', label: 'E4 (3)', sub: 'Mi' },
            { note: 'G4', label: 'G4 (5)', sub: 'Sol' },
            { note: 'A4', label: 'A4 (6)', sub: 'La' },
            { note: 'C5', label: 'C5 (8)', sub: t('High Do', '高音Do') }
          ]
        },
        sakura: {
          pads: [
            { note: 'A4', label: 'A4', sub: t('Center', '主音') },
            { note: 'B4', label: 'B4', sub: 'M2' },
            { note: 'C5', label: 'C5', sub: t('Half step!', '小二度!') },
            { note: 'E5', label: 'E5', sub: 'M3' },
            { note: 'F5', label: 'F5', sub: t('Half step!', '小二度!') },
            { note: 'A5', label: 'A5', sub: t('Octave', '高八度') }
          ]
        },
        blues: {
          pads: [
            { note: 'C4',  label: 'C4 (1)',   sub: t('Tonic', '主音') },
            { note: 'Eb4', label: 'E♭4 (♭3)', sub: t('Blue Note', '藍調音'), bend: -0.35 },
            { note: 'F4',  label: 'F4 (4)',   sub: t('Subdom.', '下屬音') },
            { note: 'Gb4', label: 'G♭4 (♭5)', sub: t('🔥 Bend Blue!', '🔥 推弦藍調音'), bend: -0.5 },
            { note: 'G4',  label: 'G4 (5)',   sub: t('Dominant', '屬音') },
            { note: 'Bb4', label: 'B♭4 (♭7)', sub: t('Blue 7th', '藍調七音'), bend: -0.25 },
            { note: 'C5',  label: 'C5 (8)',   sub: t('High C', '高音主音') }
          ]
        }
      };

      container.innerHTML = `
        <div class="widget-controls" style="margin-block-start:0;">
          <button type="button" class="btn btn-primary" id="jp-groove">🥁 ${t('Start Backing Groove', '開啟伴奏律動')}</button>
          <select id="jp-mode" aria-label="Scale pad mode">
            <option value="blues">${t('🎷 C Blues Pitch-Bend Pads', '🎷 C 藍調推弦即興盤')}</option>
            <option value="pentMaj">${t('☀️ C Major Pentatonic Pads', '☀️ C 大調五聲即興盤')}</option>
            <option value="sakura">${t('🌸 Japanese "Sakura" Pads', '🌸 日本都節五聲即興盤')}</option>
          </select>
        </div>
        <div class="jam-pad-grid" id="jp-pads"></div>
      `;

      const sel = container.querySelector('#jp-mode');
      sel.value = mode;
      const padGrid = container.querySelector('#jp-pads');
      const grooveBtn = container.querySelector('#jp-groove');

      function renderPads() {
        padGrid.innerHTML = '';
        const cfg = MODES[mode] || MODES.blues;
        cfg.pads.forEach(p => {
          const parsed = window.CourseData.parsePitch(p.note);
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'jam-pad';
          btn.style.setProperty('--pad-color', getColor(parsed.pitchClass));
          btn.innerHTML = `<span style="font-size:1.05rem;">${p.label}</span><span style="font-size:0.72rem;opacity:0.85;">${p.sub}</span>`;
          btn.addEventListener('pointerdown', () => {
            btn.classList.add('is-active');
            window.AudioEngine.playNote(parsed, 0.55, 0, {
              timbre: mode === 'sakura' ? 'guitar' : 'piano',
              bendSemitones: p.bend || 0
            });
            setTimeout(() => btn.classList.remove('is-active'), 200);
          });
          padGrid.appendChild(btn);
        });
      }

      function tickGroove() {
        if (!backingOn) return;
        const bassLine = mode === 'sakura' ? ['A2', 'E3', 'A2', 'F2'] : ['C2', 'G2', 'A2', 'G2', 'F2', 'C3', 'G2', 'Bb2'];
        const bNote = bassLine[step % bassLine.length];
        window.AudioEngine.playPercussion(step % 2 === 0 ? 'kick' : 'snare', step % 4 === 0);
        window.AudioEngine.playNote(bNote, 0.36, 0, { timbre: 'guitar', velocity: 0.45, silentHud: true });
        step++;
        loopTimer = setTimeout(tickGroove, 440);
      }

      grooveBtn.addEventListener('click', () => {
        if (backingOn) {
          stopGroove();
          grooveBtn.textContent = `🥁 ${t('Start Backing Groove', '開啟伴奏律動')}`;
        } else {
          backingOn = true;
          step = 0;
          grooveBtn.textContent = `■ ${t('Stop Groove', '停止伴奏')}`;
          tickGroove();
        }
      });

      sel.addEventListener('change', () => {
        mode = sel.value;
        renderPads();
      });

      renderPads();
    }

    mount();
    bindLangRefresh(container, mount);
  }

  /* 16. Chrome-Music-Lab 8x8 Song Maker + Chord Strip */
  function createSongGrid(container) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;

    const PITCH_ROWS = ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'];
    const CHORD_CHOICES = {
      I:  { name: 'I (C)',   notes: ['C3', 'E3', 'G3'] },
      IV: { name: 'IV (F)',  notes: ['F2', 'C3', 'A3'] },
      V7: { name: 'V7 (G7)', notes: ['G2', 'B2', 'F3'] },
      vi: { name: 'vi (Am)', notes: ['A2', 'E3', 'C4'] }
    };

    let melodyCols = [7, 5, 3, 5, 4, 2, 3, 0];
    let barChords = ['I', 'vi', 'IV', 'V7'];
    let playing = false;
    let timer = null;
    let step = 0;

    function stop() {
      playing = false;
      if (timer) clearTimeout(timer);
    }

    function mount() {
      stop();
      container.innerHTML = `
        <div class="widget-controls" style="margin-block-start:0;">
          <button type="button" class="btn btn-primary" id="sg-play">▶ ${t('Play Your Loop', '循環播放你的創作')}</button>
          <button type="button" class="btn btn-sm btn-amber" id="sg-rand">✨ ${t('Inspire Me', '隨機好聽靈感')}</button>
          <button type="button" class="btn btn-sm" id="sg-clear">✕ ${t('Clear', '清空旋律')}</button>
        </div>
        <div class="song-maker-grid" id="sg-matrix"></div>
        <div style="display:grid;grid-template-columns:44px repeat(4, minmax(0, 1fr));gap:4px;margin-block-start:6px;align-items:center;" id="sg-chords"></div>
      `;

      const matrix = container.querySelector('#sg-matrix');
      const chordBar = container.querySelector('#sg-chords');
      const playBtn = container.querySelector('#sg-play');
      let cellGrid = [];

      function syncCells(playCol = -1) {
        cellGrid.forEach((row, rIdx) => {
          row.forEach((btn, cIdx) => {
            btn.setAttribute('aria-pressed', melodyCols[cIdx] === rIdx ? 'true' : 'false');
            btn.classList.toggle('is-playhead', cIdx === playCol);
          });
        });
      }

      function buildMatrix() {
        matrix.innerHTML = '';
        cellGrid = [];
        PITCH_ROWS.forEach((pStr, rIdx) => {
          const parsed = window.CourseData.parsePitch(pStr);
          const colColor = getColor(parsed.pitchClass);
          const lbl = document.createElement('div');
          lbl.style.fontFamily = 'var(--font-mono)';
          lbl.style.fontSize = '0.74rem';
          lbl.style.fontWeight = '800';
          lbl.style.display = 'flex';
          lbl.style.alignItems = 'center';
          lbl.style.color = colColor;
          lbl.textContent = pStr;
          matrix.appendChild(lbl);

          const rowCells = [];
          for (let cIdx = 0; cIdx < 8; cIdx++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'song-cell';
            btn.style.setProperty('--cell-color', colColor);
            btn.setAttribute('aria-pressed', melodyCols[cIdx] === rIdx ? 'true' : 'false');
            btn.setAttribute('aria-label', `Step ${cIdx + 1} ${pStr}`);
            btn.addEventListener('click', () => {
              melodyCols[cIdx] = (melodyCols[cIdx] === rIdx) ? -1 : rIdx;
              syncCells();
              if (melodyCols[cIdx] === rIdx) window.AudioEngine.playNote(pStr, 0.35);
            });
            matrix.appendChild(btn);
            rowCells.push(btn);
          }
          cellGrid.push(rowCells);
        });

        chordBar.innerHTML = `<span style="font-size:0.7rem;font-weight:800;color:var(--text-muted);">${t('Chords', '和弦')}</span>`;
        barChords.forEach((chKey, bIdx) => {
          const sel = document.createElement('select');
          sel.style.paddingInline = '0.25rem';
          sel.style.fontSize = '0.76rem';
          sel.setAttribute('aria-label', `Chord ${bIdx + 1}`);
          Object.entries(CHORD_CHOICES).forEach(([k, v]) => {
            const o = document.createElement('option');
            o.value = k; o.textContent = v.name;
            if (k === chKey) o.selected = true;
            sel.appendChild(o);
          });
          sel.addEventListener('change', () => {
            barChords[bIdx] = sel.value;
            window.AudioEngine.playChord(CHORD_CHOICES[sel.value].notes, 0.6);
          });
          chordBar.appendChild(sel);
        });
      }

      function tick() {
        if (!playing) return;
        const col = step % 8;
        syncCells(col);
        if (col % 2 === 0) {
          const ch = CHORD_CHOICES[barChords[Math.floor(col / 2)]];
          if (ch) window.AudioEngine.playChord(ch.notes, 0.65, 0, { velocity: 0.48, silentHud: true });
        }
        const rIdx = melodyCols[col];
        if (rIdx >= 0) window.AudioEngine.playNote(PITCH_ROWS[rIdx], 0.34);
        step++;
        timer = setTimeout(tick, 340);
      }

      playBtn.addEventListener('click', () => {
        if (playing) {
          stop();
          playBtn.textContent = `▶ ${t('Play Your Loop', '循環播放你的創作')}`;
          syncCells(-1);
        } else {
          playing = true;
          step = 0;
          playBtn.textContent = `■ ${t('Stop', '停止播放')}`;
          tick();
        }
      });

      container.querySelector('#sg-rand').addEventListener('click', () => {
        const pentRows = [0, 2, 3, 5, 6, 7];
        melodyCols = Array.from({ length: 8 }, (_, i) => i === 7 ? 0 : pentRows[Math.floor(Math.random() * pentRows.length)]);
        const progs = [['I', 'V7', 'vi', 'IV'], ['I', 'IV', 'V7', 'I'], ['vi', 'IV', 'I', 'V7']];
        barChords = progs[Math.floor(Math.random() * progs.length)];
        buildMatrix();
        if (!playing) playBtn.click();
      });

      container.querySelector('#sg-clear').addEventListener('click', () => {
        melodyCols.fill(-1);
        syncCells(-1);
      });

      buildMatrix();
    }

    mount();
    bindLangRefresh(container, mount);
  }

  window.Widgets = {
    createPiano,
    createRhythmSequencer,
    createConductor,
    createCircleOfFifths,
    createGuitarChord,
    createQuiz,
    tempoItalianTerm,
    createWaveLab,
    createTextureCanvas,
    createFractionTree,
    createNoteReflexGame,
    createStepStaircase,
    createPolyrhythmRadar,
    createLissajousInterval,
    createJamPad,
    createSongGrid
  };
})();
