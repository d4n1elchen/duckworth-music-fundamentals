/* ==========================================================================
   widgets.js — Interactive Music Fundamentals Studio Widgets
   Virtual Piano, Rhythm Sequencer, Conductor, Circle of Fifths, Guitar & Quiz
   ========================================================================== */
(function () {
  'use strict';

  const WHITE_PCS = new Set([0, 2, 4, 5, 7, 9, 11]);
  const PC_NAMES_SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const PC_NAMES_DUAL = ['C', 'C♯\nD♭', 'D', 'D♯\nE♭', 'E', 'F', 'F♯\nG♭', 'G', 'G♯\nA♭', 'A', 'A♯\nB♭', 'B'];

  function announcePolite(msg) {
    const el = document.getElementById('sr-announcer');
    if (el) el.textContent = msg;
  }

  /* 1. Interactive Virtual Piano Keyboard */
  function createPiano(container, opts = {}) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return null;
    container.innerHTML = '';

    const startMidi = opts.startMidi ?? 48; // C3
    const endMidi = opts.endMidi ?? 72;     // C5
    const showLandmarks = opts.showLandmarks ?? false;
    const showDualBlack = opts.showDualBlack ?? true;
    const showOctaveNum = opts.showOctaveNum ?? true;

    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'piano-scroll';
    const kb = document.createElement('div');
    kb.className = 'piano-keyboard';
    kb.setAttribute('role', 'group');
    kb.setAttribute('aria-label', opts.ariaLabel || '互動式鋼琴鍵盤');

    const keyElements = new Map();
    const whiteWidth = opts.whiteWidth || 46;
    let whiteCount = 0;

    for (let midi = startMidi; midi <= endMidi; midi++) {
      const pc = ((midi % 12) + 12) % 12;
      const octave = Math.floor(midi / 12) - 1;
      const isWhite = WHITE_PCS.has(pc);

      if (isWhite) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'piano-key-white';
        btn.style.inlineSize = whiteWidth + 'px';
        if (showLandmarks && (pc === 0 || pc === 5)) {
          btn.classList.add('is-landmark');
        }
        const noteName = PC_NAMES_SHARP[pc] + (showOctaveNum ? octave : '');
        btn.setAttribute('aria-label', `琴鍵 ${PC_NAMES_SHARP[pc]}${octave}`);
        btn.dataset.midi = String(midi);

        const badge = document.createElement('span');
        badge.className = 'piano-finger-badge';
        badge.style.fontSize = '0.68rem';
        badge.style.color = '#b45309';
        badge.style.marginBlockEnd = '2px';

        const lbl = document.createElement('span');
        lbl.textContent = (pc === 0 && midi === 60) ? 'C4(中央C)' : noteName;
        if (midi === 60) lbl.style.fontSize = '0.62rem';

        btn.append(badge, lbl);
        btn.addEventListener('pointerdown', () => triggerKey(midi));
        btn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerKey(midi);
          }
        });
        kb.appendChild(btn);
        keyElements.set(midi, { btn, badge, lbl });
        whiteCount++;
      } else {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'piano-key-black';
        const leftPx = whiteCount * whiteWidth - 15;
        btn.style.insetInlineStart = leftPx + 'px';
        btn.setAttribute('aria-label', `黑鍵 ${PC_NAMES_DUAL[pc].replace('\n', ' 或 ')}${octave}`);
        btn.dataset.midi = String(midi);

        const badge = document.createElement('span');
        badge.className = 'piano-finger-badge';
        badge.style.fontSize = '0.64rem';
        badge.style.color = '#fde047';

        const lbl = document.createElement('span');
        lbl.style.whiteSpace = 'pre-line';
        lbl.style.textAlign = 'center';
        lbl.textContent = showDualBlack ? PC_NAMES_DUAL[pc] : PC_NAMES_SHARP[pc];

        btn.append(badge, lbl);
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          triggerKey(midi);
        });
        btn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerKey(midi);
          }
        });
        kb.appendChild(btn);
        keyElements.set(midi, { btn, badge, lbl });
      }
    }

    kb.style.inlineSize = (whiteCount * whiteWidth) + 'px';
    scrollWrap.appendChild(kb);
    container.appendChild(scrollWrap);

    function triggerKey(midi, dur = 0.7) {
      window.AudioEngine.playNote(midi, dur);
      flashKey(midi, 320);
      if (opts.onNote) opts.onNote(midi);
    }

    function flashKey(midi, ms = 300) {
      const item = keyElements.get(midi);
      if (!item) return;
      item.btn.classList.add('is-active');
      setTimeout(() => item.btn.classList.remove('is-active'), ms);
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

  /* 2. Tempo Term Helper (Chapter 3) */
  function tempoItalianTerm(bpm) {
    if (bpm < 52) return 'Largo（廣板，極慢）';
    if (bpm < 66) return 'Lento / Adagio（慢板 / 柔板）';
    if (bpm < 88) return 'Andante（行板，緩步速度）';
    if (bpm < 114) return 'Moderato（中板，舒適步行）';
    if (bpm < 144) return 'Allegro（快板）';
    if (bpm < 172) return 'Vivace（活潑的快板）';
    return 'Presto（急板，極快）';
  }

  /* 3. Interactive Multi-Track Rhythm Sequencer (Chapters 1, 3, 4 & Appendices A–B) */
  function createRhythmSequencer(container, opts = {}) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return null;
    container.innerHTML = '';

    let bpm = opts.bpm || 92;
    let isPlaying = false;
    let timer = null;
    let stepIdx = 0;

    // presets: [{ name, meterLabel, stepSecFactor, counts: [...], tracks: [{ name, voice, pattern: [0/1/2] }] }]
    const presets = opts.presets || [
      {
        name: '單拍子 4/4（1 e & a 十六分音符細分）',
        stepFactor: 0.25, // 16th note per step
        beatEvery: 4,
        counts: ['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a'],
        tracks: [
          { name: '節奏旋律線', voice: 'clave', pattern: [2, 0, 1, 0, 1, 0, 1, 1, 2, 0, 0, 1, 1, 0, 1, 0] },
          { name: '穩定基本拍', voice: 'kick',  pattern: [2, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] }
        ]
      }
    ];

    let activePreset = JSON.parse(JSON.stringify(presets[0]));

    const controls = document.createElement('div');
    controls.className = 'widget-controls';

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'btn btn-primary';
    playBtn.textContent = '▶ 開始循環節拍';

    const presetSel = document.createElement('select');
    presetSel.setAttribute('aria-label', '選擇節奏型態預設');
    presets.forEach((p, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = p.name;
      presetSel.appendChild(opt);
    });

    const bpmLabel = document.createElement('label');
    bpmLabel.style.display = 'inline-flex';
    bpmLabel.style.alignItems = 'center';
    bpmLabel.style.gap = '0.4rem';
    bpmLabel.style.fontSize = '0.88rem';
    const bpmText = document.createElement('span');
    const bpmRange = document.createElement('input');
    bpmRange.type = 'range';
    bpmRange.min = '44';
    bpmRange.max = '184';
    bpmRange.value = String(bpm);

    function updateBpmText() {
      bpmText.textContent = `速度 ♩=${bpm} · ${tempoItalianTerm(bpm)}`;
    }
    updateBpmText();
    bpmLabel.append(bpmText, bpmRange);

    if (presets.length > 1) controls.append(playBtn, presetSel, bpmLabel);
    else controls.append(playBtn, bpmLabel);

    const gridWrap = document.createElement('div');
    gridWrap.className = 'rhythm-grid';

    container.append(controls, gridWrap);

    let stepButtons = [];

    function renderGrid() {
      gridWrap.innerHTML = '';
      stepButtons = [];

      activePreset.tracks.forEach((track, tIdx) => {
        const row = document.createElement('div');
        row.className = 'rhythm-track';
        const label = document.createElement('div');
        label.style.fontWeight = '700';
        label.style.fontSize = '0.86rem';
        label.textContent = track.name;

        const stepsDiv = document.createElement('div');
        stepsDiv.className = 'rhythm-steps';
        const rowBtns = [];

        track.pattern.forEach((val, sIdx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'rhythm-step' + (sIdx % (activePreset.beatEvery || 4) === 0 ? ' is-beat-start' : '');
          btn.setAttribute('aria-pressed', val > 0 ? 'true' : 'false');
          const countStr = activePreset.counts[sIdx] || String(sIdx + 1);
          btn.setAttribute('aria-label', `${track.name} 拍點 ${countStr}`);
          btn.innerHTML = `<span>${countStr}</span><span style="font-size:0.7rem">${val === 2 ? '>' : (val === 1 ? '●' : '·')}</span>`;

          btn.addEventListener('click', () => {
            // Cycle 0 (rest) -> 1 (hit) -> 2 (accent >) -> 0
            track.pattern[sIdx] = (track.pattern[sIdx] + 1) % 3;
            const nv = track.pattern[sIdx];
            btn.setAttribute('aria-pressed', nv > 0 ? 'true' : 'false');
            btn.innerHTML = `<span>${countStr}</span><span style="font-size:0.7rem">${nv === 2 ? '>' : (nv === 1 ? '●' : '·')}</span>`;
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

    function stopLoop() {
      isPlaying = false;
      if (timer) clearTimeout(timer);
      timer = null;
      playBtn.textContent = '▶ 開始循環節拍';
      stepButtons.flat().forEach(b => b.classList.remove('is-current'));
    }

    function tick() {
      if (!isPlaying) return;
      const len = activePreset.counts.length;
      const cur = stepIdx % len;

      stepButtons.forEach((rowBtns, tIdx) => {
        rowBtns.forEach((b, i) => b.classList.toggle('is-current', i === cur));
        const v = activePreset.tracks[tIdx].pattern[cur];
        if (v > 0) {
          window.AudioEngine.playPercussion(activePreset.tracks[tIdx].voice, v === 2);
        }
      });

      stepIdx++;
      const stepMs = (60 / bpm) * (activePreset.stepFactor || 0.5) * 1000;
      timer = setTimeout(tick, stepMs);
    }

    playBtn.addEventListener('click', () => {
      if (isPlaying) {
        stopLoop();
      } else {
        window.AudioEngine.stopAll();
        isPlaying = true;
        stepIdx = 0;
        playBtn.textContent = '■ 停止節拍';
        tick();
      }
    });

    presetSel.addEventListener('change', () => {
      const wasPlaying = isPlaying;
      stopLoop();
      activePreset = JSON.parse(JSON.stringify(presets[Number(presetSel.value)] || presets[0]));
      renderGrid();
      if (wasPlaying) playBtn.click();
    });

    bpmRange.addEventListener('input', () => {
      bpm = Number(bpmRange.value);
      updateBpmText();
    });

    renderGrid();
    return { stopLoop };
  }

  /* 4. Animated Conducting Baton Pattern Trainer (Chapters 3 & 4) */
  function createConductor(container, opts = {}) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return null;
    container.innerHTML = '';

    let beats = opts.beats || 4;
    let isCompound = !!opts.compound;
    let running = false;
    let timer = null;

    const PATTERNS = {
      2: {
        label: '二拍子指揮圖示 (Duple: 2/4, 2/2, 6/8)',
        points: [
          { x: 140, y: 35,  name: '預備位置 (頂點)' },
          { x: 145, y: 175, name: '第 1 拍 Downbeat（向下反彈）' },
          { x: 185, y: 55,  name: '第 2 拍 Upbeat（向外向上挑起）' }
        ],
        pathD: 'M 140 35 L 145 175 Q 190 155, 185 55 Q 155 25, 140 35'
      },
      3: {
        label: '三拍子指揮圖示 (Triple: 3/4, 3/8, 9/8)',
        points: [
          { x: 130, y: 35,  name: '預備位置' },
          { x: 130, y: 175, name: '第 1 拍 Downbeat（正下方）' },
          { x: 225, y: 145, name: '第 2 拍（右手向外側）' },
          { x: 130, y: 40,  name: '第 3 拍 Upbeat（向上收回）' }
        ],
        pathD: 'M 130 35 L 130 175 Q 175 180, 225 145 Q 190 85, 130 40'
      },
      4: {
        label: '四拍子指揮圖示 (Quadruple: 4/4, C, 12/8)',
        points: [
          { x: 150, y: 32,  name: '預備位置' },
          { x: 150, y: 178, name: '第 1 拍 Downbeat（正下方強拍）' },
          { x: 68,  y: 135, name: '第 2 拍（向身體內側/左側）' },
          { x: 238, y: 135, name: '第 3 拍（跨越向外側/右側次強拍）' },
          { x: 150, y: 36,  name: '第 4 拍 Upbeat（向上回到預備點）' }
        ],
        pathD: 'M 150 32 L 150 178 Q 105 165, 68 135 Q 150 112, 238 135 Q 205 78, 150 36'
      }
    };

    const bar = document.createElement('div');
    bar.className = 'widget-controls';

    const b2 = makeBtn('2 拍子 (Duple)', beats === 2);
    const b3 = makeBtn('3 拍子 (Triple)', beats === 3);
    const b4 = makeBtn('4 拍子 (Quadruple)', beats === 4);
    const subBtn = makeBtn(isCompound ? '複拍子三等分 (1-la-le)' : '單拍子二等分 (1-&)', isCompound);
    const runBtn = document.createElement('button');
    runBtn.type = 'button';
    runBtn.className = 'btn btn-primary';
    runBtn.textContent = '▶ 啟動指揮與預備拍';

    function makeBtn(txt, active) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-sm';
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
      b.textContent = txt;
      return b;
    }

    bar.append(b2, b3, b4, subBtn, runBtn);

    const status = document.createElement('p');
    status.style.fontWeight = '700';
    status.style.marginBlock = '0.5rem';
    status.textContent = '提示：指揮永遠使用右手（即使左撇子亦然），中心高度齊胸，並先給前一拍作為無聲預備拍 (Preparatory Beat)。';

    const svgWrap = document.createElement('div');
    svgWrap.style.maxInlineSize = '340px';
    svgWrap.style.marginInline = 'auto';

    container.append(bar, status, svgWrap);

    let batonDot = null;

    function drawPattern() {
      const pat = PATTERNS[beats];
      svgWrap.innerHTML = `
        <svg viewBox="0 0 300 210" role="img" aria-label="${pat.label}" style="background:var(--bg-score);border:1px solid var(--border-subtle);border-radius:12px;">
          <path d="${pat.pathD}" fill="none" stroke="var(--border-strong)" stroke-width="3" stroke-dasharray="6 4"/>
          ${pat.points.slice(1).map((pt, i) => `
            <circle cx="${pt.x}" cy="${pt.y}" r="13" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/>
            <text x="${pt.x}" y="${pt.y + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--brand)">${i + 1}</text>
          `).join('')}
          <circle id="baton-tip" cx="${pat.points[0].x}" cy="${pat.points[0].y}" r="9" fill="var(--accent-amber)"/>
        </svg>
      `;
      batonDot = svgWrap.querySelector('#baton-tip');
    }

    function stop() {
      running = false;
      if (timer) clearTimeout(timer);
      runBtn.textContent = '▶ 啟動指揮與預備拍';
    }

    function start() {
      stop();
      running = true;
      runBtn.textContent = '■ 停止指揮';
      const pat = PATTERNS[beats];
      const subdiv = isCompound ? 3 : 2;
      let step = -subdiv; // Start with silent preparatory upbeat!

      function stepLoop() {
        if (!running) return;
        if (step < 0) {
          const upPt = pat.points[beats];
          batonDot.setAttribute('cx', String(upPt.x));
          batonDot.setAttribute('cy', String(upPt.y));
          status.textContent = `預備拍 (Preparatory Upbeat — 無聲吸氣準備)...`;
          if (step === -subdiv) window.AudioEngine.playPercussion('hihat', false);
        } else {
          const beatNum = Math.floor(step / subdiv) % beats; // 0..beats-1
          const subNum = step % subdiv;
          const pt = pat.points[beatNum + 1];
          const nextPt = pat.points[((beatNum + 1) % beats) + 1];
          const ratio = subNum / subdiv;
          const cx = pt.x + (nextPt.x - pt.x) * ratio * 0.65;
          const cy = pt.y + (nextPt.y - pt.y) * ratio * 0.65;
          batonDot.setAttribute('cx', String(cx));
          batonDot.setAttribute('cy', String(cy));

          const syl = isCompound
            ? [String(beatNum + 1), 'la', 'le'][subNum]
            : [String(beatNum + 1), '&'][subNum];
          status.textContent = `目前拍點：${pt.name} · 數拍：「${syl}」`;

          if (subNum === 0) {
            window.AudioEngine.playPercussion('clave', beatNum === 0);
          } else {
            window.AudioEngine.playPercussion('hihat', false);
          }
        }
        step++;
        timer = setTimeout(stepLoop, isCompound ? 260 : 360);
      }
      stepLoop();
    }

    [ [b2, 2], [b3, 3], [b4, 4] ].forEach(([btn, n]) => {
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
      subBtn.textContent = isCompound ? '複拍子三等分 (1-la-le)' : '單拍子二等分 (1-&)';
      if (running) start();
    });

    runBtn.addEventListener('click', () => running ? stop() : start());
    drawPattern();
    return { stop };
  }

  /* 5. Interactive Dual-Ring Circle of Fifths (Chapters 7 & 9) */
  function createCircleOfFifths(container, opts = {}) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return null;
    container.innerHTML = '';

    const data = window.CourseData.CIRCLE_OF_FIFTHS;
    const showMinor = opts.showMinor !== false;
    let selectedPos = 0;
    let useEnharmonic = false;

    const wrap = document.createElement('div');
    wrap.className = 'circle-fifths-wrap';

    const svgHolder = document.createElement('div');
    const detailHolder = document.createElement('div');
    wrap.append(svgHolder, detailHolder);
    container.appendChild(wrap);

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

    function renderWheel() {
      const cx = 190, cy = 190;
      let slicesHtml = '';
      data.forEach((item, idx) => {
        const a0 = idx * 30 - 15;
        const a1 = idx * 30 + 15;
        const isSel = idx === selectedPos;
        const pMaj = polar(cx, cy, 146, idx * 30);
        const pMin = polar(cx, cy, 94, idx * 30);

        slicesHtml += `
          <g class="circle-slice" data-pos="${idx}" tabindex="0" role="button" aria-label="${item.labelMaj} 大調，關係小調 ${item.labelMin}">
            <path d="${wedgePath(cx, cy, showMinor ? 118 : 74, 176, a0, a1)}"
              fill="${isSel ? 'var(--brand)' : 'var(--bg-elevated)'}"
              stroke="var(--border-strong)" stroke-width="1.5"/>
            <text x="${pMaj.x.toFixed(1)}" y="${(pMaj.y + 4).toFixed(1)}" text-anchor="middle"
              font-size="13" font-weight="700" fill="${isSel ? 'var(--brand-on)' : 'var(--text-primary)'}">${item.labelMaj}</text>
            ${showMinor ? `
              <path d="${wedgePath(cx, cy, 68, 118, a0, a1)}"
                fill="${isSel ? 'var(--accent-amber-soft)' : 'var(--bg-subtle)'}"
                stroke="var(--border-strong)" stroke-width="1.2"/>
              <text x="${pMin.x.toFixed(1)}" y="${(pMin.y + 4).toFixed(1)}" text-anchor="middle"
                font-size="12" font-weight="700" fill="${isSel ? 'var(--accent-amber)' : 'var(--text-secondary)'}">${item.labelMin}</text>
            ` : ''}
          </g>
        `;
      });

      svgHolder.innerHTML = `
        <svg viewBox="0 0 380 380" role="img" aria-label="互動式五度圈圖表">
          ${slicesHtml}
          <circle cx="${cx}" cy="${cy}" r="66" fill="var(--bg-surface)" stroke="var(--border-strong)"/>
          <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--text-primary)">五度圈</text>
          <text x="${cx}" y="${cy + 13}" text-anchor="middle" font-size="10.5" fill="var(--text-muted)">順時針 +♯ · 逆時針 +♭</text>
        </svg>
      `;

      svgHolder.querySelectorAll('.circle-slice').forEach(g => {
        const pos = Number(g.dataset.pos);
        g.addEventListener('click', () => {
          selectedPos = pos;
          useEnharmonic = false;
          renderWheel();
          renderDetail();
        });
        g.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectedPos = pos;
            useEnharmonic = false;
            renderWheel();
            renderDetail();
          }
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
        ? '0 個升降記號（全白鍵）'
        : (['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'].includes(activeKey)
          ? `${{ F: 1, Bb: 2, Eb: 3, Ab: 4, Db: 5, Gb: 6, Cb: 7 }[activeKey]} 個降記號 (♭)`
          : `${{ G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7 }[activeKey]} 個升記號 (♯)`);

      detailHolder.innerHTML = `
        <div class="concept-card">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
            <h3 style="margin:0;">${activeKey.replace('#', '♯').replace('b', '♭')} 大調 ${showMinor ? `／ 關係小調 ${activeMin.replace('#', '♯').replace('b', '♭')} 小調` : ''}</h3>
            <span class="badge">${accDesc}</span>
          </div>
          <p><strong>大調音階音列：</strong> ${majScale.notes.map(n => n.name).join(' – ')}</p>
          ${showMinor ? `<p><strong>關係自然小調音列：</strong> ${minScale.notes.map(n => n.name).join(' – ')}（與大調共享完全相同調號，主音位於大調第 6 級／下行小三度）</p>` : ''}
          <div id="cof-staff-preview"></div>
          <div class="widget-controls">
            <button type="button" class="btn btn-sm btn-primary" id="cof-play-maj">▶ 播放 ${activeKey.replace('#', '♯').replace('b', '♭')} 大調音階</button>
            ${showMinor ? `<button type="button" class="btn btn-sm" id="cof-play-min">▶ 播放關係小調音階</button>` : ''}
            ${item.enhMaj ? `<button type="button" class="btn btn-sm btn-amber" id="cof-toggle-enh">⇄ 切換等音調 (${useEnharmonic ? item.sigKey : item.enhMaj})</button>` : ''}
          </div>
        </div>
      `;

      window.MusicNotation.render(detailHolder.querySelector('#cof-staff-preview'), {
        grand: true,
        key: activeKey,
        playable: false,
        minWidth: 420,
        spacing: 42,
        notes: majScale.notes.map(n => ({ pitch: n.ascii, dur: 'q', hideAccidental: true, label: n.name })),
        bassNotes: showMinor ? minScale.notes.map(n => ({ pitch: n.letter + (n.alter === 1 ? '#' : n.alter === -1 ? 'b' : '') + '3', dur: 'q', hideAccidental: true })) : []
      });

      detailHolder.querySelector('#cof-play-maj')?.addEventListener('click', () => {
        window.AudioEngine.playSequence(majScale.notes.map(n => ({ pitch: n, beats: 0.55 })), 108);
      });
      detailHolder.querySelector('#cof-play-min')?.addEventListener('click', () => {
        window.AudioEngine.playSequence(minScale.notes.map(n => ({ pitch: n, beats: 0.55 })), 108);
      });
      detailHolder.querySelector('#cof-toggle-enh')?.addEventListener('click', () => {
        useEnharmonic = !useEnharmonic;
        renderDetail();
      });
    }

    renderWheel();
    renderDetail();
  }

  /* 6. Guitar Tablature / Chord Box Renderer (Chapter 13 & Appendix K) */
  function createGuitarChord(container, spec) {
    // spec: { name: 'C', subtitle: 'I in C Major', frets: [-1, 3, 2, 0, 1, 0], pitches: ['C3','E3','G3','C4','E4'] }
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

    card.innerHTML = `
      <div style="font-weight:700;font-size:1.05rem;">${spec.name}</div>
      ${spec.subtitle ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-block-end:0.35rem;">${spec.subtitle}</div>` : ''}
      <svg viewBox="0 0 124 130" role="img" aria-label="吉他和弦指法圖 ${spec.name}" style="margin-inline:auto;max-inline-size:124px;">
        <line x1="22" y1="28" x2="102" y2="28" stroke="currentColor" stroke-width="4"/>
        ${fretY.slice(1).map(y => `<line x1="22" y1="${y}" x2="102" y2="${y}" stroke="var(--border-strong)" stroke-width="1.4"/>`).join('')}
        ${strX.map(x => `<line x1="${x}" y1="28" x2="${x}" y2="116" stroke="currentColor" stroke-width="1.3"/>`).join('')}
        ${markers}
      </svg>
      <button type="button" class="btn btn-sm" style="margin-block-start:0.4rem;inline-size:100%;">🎸 刷奏試聽</button>
    `;

    card.querySelector('button').addEventListener('click', () => {
      window.AudioEngine.playChord(spec.pitches, 1.35, 0, { strum: true, timbre: 'guitar' });
    });

    container.appendChild(card);
  }

  /* 7. Practice & Focus on Skills Quiz Engine */
  function createQuiz(container, quizId, pageId, questions) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;
    container.innerHTML = '';

    const state = new Array(questions.length).fill(null);

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.flexWrap = 'wrap';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.gap = '0.75rem';
    header.style.marginBlockEnd = '1rem';

    const scoreBadge = document.createElement('div');
    scoreBadge.className = 'badge';
    scoreBadge.style.fontSize = '0.88rem';
    scoreBadge.textContent = `目前作答進度：0 / ${questions.length}`;

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn btn-sm';
    resetBtn.textContent = '↺ 重新練習本組題目';

    header.append(scoreBadge, resetBtn);

    const list = document.createElement('div');
    list.className = 'quiz-list';

    function renderQuestions() {
      list.innerHTML = '';
      questions.forEach((q, qIdx) => {
        const card = document.createElement('div');
        card.className = 'quiz-card';

        const qTitle = document.createElement('div');
        qTitle.className = 'quiz-q';
        qTitle.innerHTML = `<span class="badge">Q${qIdx + 1}</span> <span>${q.prompt}</span>`;
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
          audioBtn.style.marginBlockEnd = '0.75rem';
          audioBtn.textContent = q.audioLabel || '🔊 播放聽音題目音訊';
          audioBtn.addEventListener('click', () => q.audioFn());
          card.appendChild(audioBtn);
        }

        const optsWrap = document.createElement('div');
        optsWrap.className = 'quiz-options';

        const fb = document.createElement('div');
        fb.className = 'quiz-feedback';
        fb.hidden = true;

        q.options.forEach((optText, oIdx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn quiz-opt';
          btn.textContent = optText;

          btn.addEventListener('click', () => {
            if (state[qIdx] !== null) return;
            const isOk = oIdx === q.answer;
            state[qIdx] = isOk;

            optsWrap.querySelectorAll('button').forEach((b, bi) => {
              if (bi === q.answer) b.classList.add('is-correct');
              else if (bi === oIdx && !isOk) b.classList.add('is-wrong');
            });

            fb.hidden = false;
            fb.className = 'quiz-feedback ' + (isOk ? 'ok' : 'err');
            fb.innerHTML = `<strong>${isOk ? '✓ 答對了！' : '✕ 再想一下：'}</strong> ${q.explanation || ''}`;

            if (isOk) {
              window.AudioEngine.playChord(['C5', 'E5', 'G5'], 0.35);
            } else {
              window.AudioEngine.playNote('F#3', 0.28);
            }

            updateTally();
          });

          optsWrap.appendChild(btn);
        });

        card.append(optsWrap, fb);
        list.appendChild(card);
      });
    }

    function updateTally() {
      const answered = state.filter(v => v !== null).length;
      const correct = state.filter(v => v === true).length;
      scoreBadge.textContent = `得分：${correct} / ${questions.length}（已作答 ${answered} 題）`;
      announcePolite(`目前已答對 ${correct} 題，共 ${questions.length} 題`);
      if (answered === questions.length) {
        window.CourseData.recordQuizScore(quizId, pageId, correct, questions.length);
      }
    }

    resetBtn.addEventListener('click', () => {
      state.fill(null);
      scoreBadge.textContent = `目前作答進度：0 / ${questions.length}`;
      renderQuestions();
    });

    container.append(header, list);
    renderQuestions();
  }

  window.Widgets = {
    createPiano,
    createRhythmSequencer,
    createConductor,
    createCircleOfFifths,
    createGuitarChord,
    createQuiz,
    tempoItalianTerm
  };
})();
