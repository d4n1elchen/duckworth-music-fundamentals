/* ==========================================================================
   notation.js — Precision SVG Music Notation & Playback Renderer
   Supports Treble, Bass, Alto, Tenor, Soprano, Rhythm & Braced Grand Staves
   ========================================================================== */
(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const LINE_GAP = 11; // px between staff lines (half-step diatonic = 5.5px)
  const HALF_GAP = LINE_GAP / 2;

  const CLEF_BOTTOM_STEP = {
    treble: 30,  // E4 (Middle line B4 = 34)
    bass: 18,    // G2
    alto: 24,    // F3 (Middle C on line 3)
    tenor: 22,   // D3 (Middle C on line 4)
    soprano: 28, // C4 (Middle C on line 1)
    rhythm: 30   // Single-line rhythm at middle line (step 34 = staffTopY + 2 * LINE_GAP)
  };

  const KEY_SIG_SHARPS = {
    treble: ['F5', 'C5', 'G5', 'D5', 'A4', 'E5', 'B4'],
    bass:   ['F3', 'C3', 'G3', 'D3', 'A2', 'E3', 'B2'],
    alto:   ['F4', 'C4', 'G4', 'D4', 'A3', 'E4', 'B3'],
    tenor:  ['F3', 'C4', 'G3', 'D4', 'A3', 'E4', 'B3']
  };

  const KEY_SIG_FLATS = {
    treble: ['B4', 'E5', 'A4', 'D5', 'G4', 'C5', 'F4'],
    bass:   ['B2', 'E3', 'A2', 'D3', 'G2', 'C3', 'F2'],
    alto:   ['B3', 'E4', 'A3', 'D4', 'G3', 'C4', 'F3'],
    tenor:  ['B3', 'E4', 'A3', 'D4', 'G3', 'C4', 'F3']
  };

  const KEY_SIG_MAP = {
    'C': { type: 'none', count: 0 }, 'a': { type: 'none', count: 0 },
    'G': { type: 'sharp', count: 1 }, 'e': { type: 'sharp', count: 1 },
    'D': { type: 'sharp', count: 2 }, 'b': { type: 'sharp', count: 2 },
    'A': { type: 'sharp', count: 3 }, 'f#': { type: 'sharp', count: 3 },
    'E': { type: 'sharp', count: 4 }, 'c#': { type: 'sharp', count: 4 },
    'B': { type: 'sharp', count: 5 }, 'g#': { type: 'sharp', count: 5 },
    'F#': { type: 'sharp', count: 6 }, 'd#': { type: 'sharp', count: 6 },
    'C#': { type: 'sharp', count: 7 }, 'a#': { type: 'sharp', count: 7 },
    'F': { type: 'flat', count: 1 }, 'd': { type: 'flat', count: 1 },
    'Bb': { type: 'flat', count: 2 }, 'g': { type: 'flat', count: 2 },
    'Eb': { type: 'flat', count: 3 }, 'c': { type: 'flat', count: 3 },
    'Ab': { type: 'flat', count: 4 }, 'f': { type: 'flat', count: 4 },
    'Db': { type: 'flat', count: 5 }, 'bb': { type: 'flat', count: 5 },
    'Gb': { type: 'flat', count: 6 }, 'eb': { type: 'flat', count: 6 },
    'Cb': { type: 'flat', count: 7 }, 'ab': { type: 'flat', count: 7 }
  };

  function el(tag, attrs = {}, text = null) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v !== undefined && v !== null) node.setAttribute(k, String(v));
    }
    if (text !== null) node.textContent = text;
    return node;
  }

  function durToQuarterBeats(dur, dotted, tuplet) {
    const base = { w: 4, h: 2, q: 1, '8': 0.5, '16': 0.25 }[dur || 'q'] || 1;
    let val = dotted ? base * 1.5 : base;
    if (tuplet === 3) val = val * (2 / 3);
    if (tuplet === 2) val = val * (3 / 2);
    return val;
  }

  function stepToY(diatonicStep, clef, staffTopY) {
    const bottomStep = CLEF_BOTTOM_STEP[clef] || 30;
    const bottomLineY = staffTopY + 4 * LINE_GAP;
    return bottomLineY - (diatonicStep - bottomStep) * HALF_GAP;
  }

  function drawClef(svg, clef, x, staffTopY) {
    if (clef === 'rhythm') {
      // Percussion / neutral double vertical bar clef
      svg.appendChild(el('rect', { x: x + 4, y: staffTopY + LINE_GAP * 1.2, width: 3, height: LINE_GAP * 1.6, fill: 'currentColor' }));
      svg.appendChild(el('rect', { x: x + 10, y: staffTopY + LINE_GAP * 1.2, width: 3, height: LINE_GAP * 1.6, fill: 'currentColor' }));
      return 24;
    }
    if (clef === 'treble') {
      const g = el('g', { transform: `translate(${x + 2}, ${staffTopY - 8})` });
      // Crisp vector Treble Clef encircling Line 2 (y = 3*LINE_GAP + 8 = 41)
      g.appendChild(el('path', {
        d: 'M 14 58 C 14 64, 7 65, 6 60 C 5 56, 10 54, 12 57 C 13 58, 13 61, 14 58 L 14 6 C 14 0, 22 2, 22 10 C 22 19, 8 26, 8 38 C 8 47, 16 51, 22 46 C 27 42, 26 33, 19 31 C 13 30, 10 35, 13 40 C 14 42, 16 43, 17 42',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2.3',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }));
      svg.appendChild(g);
      return 34;
    }
    if (clef === 'bass') {
      const g = el('g', { transform: `translate(${x + 2}, ${staffTopY})` });
      const line4Y = LINE_GAP; // second line from top = 4th line from bottom
      g.appendChild(el('circle', { cx: 7, cy: line4Y, r: 3.4, fill: 'currentColor' }));
      g.appendChild(el('path', {
        d: `M 7 ${line4Y} C 7 1, 21 1, 21 ${line4Y + 4} C 21 ${line4Y + 16}, 10 ${line4Y + 25}, 4 ${line4Y + 30}`,
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2.5',
        'stroke-linecap': 'round'
      }));
      g.appendChild(el('circle', { cx: 26, cy: line4Y - 4.5, r: 2.1, fill: 'currentColor' }));
      g.appendChild(el('circle', { cx: 26, cy: line4Y + 4.5, r: 2.1, fill: 'currentColor' }));
      svg.appendChild(g);
      return 34;
    }
    // Movable C Clef (alto, tenor, soprano)
    const cY = stepToY(28, clef, staffTopY);
    const topBar = cY - 2 * LINE_GAP;
    const h = 4 * LINE_GAP;
    const g = el('g', {});
    g.appendChild(el('rect', { x: x + 2, y: topBar, width: 3.5, height: h, fill: 'currentColor' }));
    g.appendChild(el('rect', { x: x + 8, y: topBar, width: 1.6, height: h, fill: 'currentColor' }));
    g.appendChild(el('path', {
      d: `M ${x + 9.5} ${cY} C ${x + 15} ${cY - 3}, ${x + 21} ${cY - 16}, ${x + 15} ${cY - 20} C ${x + 11} ${cY - 22}, ${x + 10} ${cY - 15}, ${x + 13} ${cY - 14} M ${x + 9.5} ${cY} C ${x + 15} ${cY + 3}, ${x + 21} ${cY + 16}, ${x + 15} ${cY + 20} C ${x + 11} ${cY + 22}, ${x + 10} ${cY + 15}, ${x + 13} ${cY + 14}`,
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2.1',
      'stroke-linecap': 'round'
    }));
    svg.appendChild(g);
    return 32;
  }

  function drawAccidentalGlyph(svg, accSymbol, x, y, scale = 1) {
    if (!accSymbol) return;
    const txt = el('text', {
      x,
      y: y + 5 * scale,
      'font-size': 16 * scale,
      'font-weight': '700',
      'font-family': '"Segoe UI Symbol", "Apple Symbols", "Noto Music", serif',
      fill: 'currentColor',
      'text-anchor': 'middle'
    }, accSymbol);
    svg.appendChild(txt);
  }

  function drawKeySignature(svg, keySig, clef, x, staffTopY) {
    if (!keySig || clef === 'rhythm') return 0;
    const info = KEY_SIG_MAP[keySig];
    if (!info || info.count === 0) return 0;
    const list = info.type === 'sharp'
      ? (KEY_SIG_SHARPS[clef] || KEY_SIG_SHARPS.treble)
      : (KEY_SIG_FLATS[clef] || KEY_SIG_FLATS.treble);
    const sym = info.type === 'sharp' ? '♯' : '♭';
    let curX = x + 6;
    for (let i = 0; i < info.count; i++) {
      const p = window.CourseData.parsePitch(list[i]);
      const y = stepToY(p.diatonicStep, clef, staffTopY);
      drawAccidentalGlyph(svg, sym, curX, y, 0.95);
      curX += 11;
    }
    return info.count * 11 + 6;
  }

  function drawTimeSignature(svg, timeSig, x, staffTopY, isSingleLine) {
    if (!timeSig) return 0;
    const midY = staffTopY + 2 * LINE_GAP;
    if (timeSig === 'C' || timeSig === 'cut') {
      svg.appendChild(el('text', {
        x: x + 10,
        y: midY + 7,
        'font-family': 'Georgia, serif',
        'font-size': '23',
        'font-weight': '700',
        fill: 'currentColor',
        'text-anchor': 'middle'
      }, 'C'));
      if (timeSig === 'cut') {
        svg.appendChild(el('line', {
          x1: x + 10, y1: midY - 13, x2: x + 10, y2: midY + 13,
          stroke: 'currentColor', 'stroke-width': '1.8'
        }));
      }
      return 24;
    }
    const parts = String(timeSig).split('/');
    if (parts.length === 2) {
      const yTop = isSingleLine ? midY - 4 : staffTopY + LINE_GAP * 1.65;
      const yBot = isSingleLine ? midY + 16 : staffTopY + LINE_GAP * 3.7;
      svg.appendChild(el('text', {
        x: x + 11, y: yTop,
        'font-family': 'Georgia, serif', 'font-size': '19', 'font-weight': '700',
        fill: 'currentColor', 'text-anchor': 'middle'
      }, parts[0]));
      svg.appendChild(el('text', {
        x: x + 11, y: yBot,
        'font-family': 'Georgia, serif', 'font-size': '19', 'font-weight': '700',
        fill: 'currentColor', 'text-anchor': 'middle'
      }, parts[1]));
      return 26;
    }
    return 0;
  }

  function drawStaffLines(svg, clef, xStart, xEnd, staffTopY) {
    if (clef === 'rhythm') {
      const y = staffTopY + 2 * LINE_GAP;
      svg.appendChild(el('line', { x1: xStart, y1: y, x2: xEnd, y2: y, class: 'staff-line' }));
      return;
    }
    for (let i = 0; i < 5; i++) {
      const y = staffTopY + i * LINE_GAP;
      svg.appendChild(el('line', { x1: xStart, y1: y, x2: xEnd, y2: y, class: 'staff-line' }));
    }
  }

  function drawBarLine(svg, barType, x, topY, bottomY) {
    if (barType === '|') {
      svg.appendChild(el('line', { x1: x, y1: topY, x2: x, y2: bottomY, class: 'bar-line' }));
    } else if (barType === '||') {
      svg.appendChild(el('line', { x1: x - 3, y1: topY, x2: x - 3, y2: bottomY, class: 'bar-line' }));
      svg.appendChild(el('line', { x1: x + 2, y1: topY, x2: x + 2, y2: bottomY, class: 'bar-line' }));
    } else if (barType === '|.') {
      svg.appendChild(el('line', { x1: x - 4, y1: topY, x2: x - 4, y2: bottomY, class: 'bar-line' }));
      svg.appendChild(el('line', { x1: x + 2, y1: topY, x2: x + 2, y2: bottomY, stroke: 'currentColor', 'stroke-width': '4' }));
    } else if (barType === '|:') {
      svg.appendChild(el('line', { x1: x - 3, y1: topY, x2: x - 3, y2: bottomY, stroke: 'currentColor', 'stroke-width': '3.5' }));
      svg.appendChild(el('line', { x1: x + 2, y1: topY, x2: x + 2, y2: bottomY, class: 'bar-line' }));
      const mid = (topY + bottomY) / 2;
      svg.appendChild(el('circle', { cx: x + 8, cy: mid - HALF_GAP, r: 2.2, fill: 'currentColor' }));
      svg.appendChild(el('circle', { cx: x + 8, cy: mid + HALF_GAP, r: 2.2, fill: 'currentColor' }));
    } else if (barType === ':|') {
      const mid = (topY + bottomY) / 2;
      svg.appendChild(el('circle', { cx: x - 9, cy: mid - HALF_GAP, r: 2.2, fill: 'currentColor' }));
      svg.appendChild(el('circle', { cx: x - 9, cy: mid + HALF_GAP, r: 2.2, fill: 'currentColor' }));
      svg.appendChild(el('line', { x1: x - 3, y1: topY, x2: x - 3, y2: bottomY, class: 'bar-line' }));
      svg.appendChild(el('line', { x1: x + 2, y1: topY, x2: x + 2, y2: bottomY, stroke: 'currentColor', 'stroke-width': '3.5' }));
    }
  }

  function drawLedgerLines(svg, diatonicStep, clef, cx, staffTopY) {
    if (clef === 'rhythm') return;
    const bottomStep = CLEF_BOTTOM_STEP[clef] || 30;
    const topStep = bottomStep + 8;
    // Never enclose a note in space with an extra outer ledger line (Duckworth Ch. 5 rule!)
    if (diatonicStep < bottomStep - 1) {
      for (let s = bottomStep - 2; s >= diatonicStep; s -= 2) {
        const y = stepToY(s, clef, staffTopY);
        svg.appendChild(el('line', {
          x1: cx - 11, y1: y, x2: cx + 11, y2: y,
          stroke: 'currentColor', 'stroke-width': '1.4'
        }));
      }
    } else if (diatonicStep > topStep + 1) {
      for (let s = topStep + 2; s <= diatonicStep; s += 2) {
        const y = stepToY(s, clef, staffTopY);
        svg.appendChild(el('line', {
          x1: cx - 11, y1: y, x2: cx + 11, y2: y,
          stroke: 'currentColor', 'stroke-width': '1.4'
        }));
      }
    }
  }

  function drawRest(svg, dur, dotted, cx, staffTopY) {
    const midY = staffTopY + 2 * LINE_GAP;
    const g = el('g', { class: 'note-el' });
    if (dur === 'w') {
      // Hangs below line 4
      const line4Y = staffTopY + LINE_GAP;
      g.appendChild(el('rect', { x: cx - 7, y: line4Y, width: 14, height: HALF_GAP + 0.5, fill: 'currentColor' }));
    } else if (dur === 'h') {
      // Sits on line 3 (like a hat)
      g.appendChild(el('rect', { x: cx - 7, y: midY - HALF_GAP - 0.5, width: 14, height: HALF_GAP + 0.5, fill: 'currentColor' }));
    } else if (dur === 'q') {
      g.appendChild(el('path', {
        d: `M ${cx - 3} ${midY - 12} L ${cx + 4} ${midY - 4} L ${cx - 3} ${midY + 2} L ${cx + 4} ${midY + 9} C ${cx - 1} ${midY + 8}, ${cx - 5} ${midY + 12}, ${cx - 1} ${midY + 15}`,
        fill: 'none', stroke: 'currentColor', 'stroke-width': '2.4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }));
    } else if (dur === '8') {
      g.appendChild(el('circle', { cx: cx - 2, cy: midY - 4, r: 2.8, fill: 'currentColor' }));
      g.appendChild(el('path', {
        d: `M ${cx - 2} ${midY - 4} Q ${cx + 3} ${midY - 4}, ${cx + 4} ${midY - 8} L ${cx - 2} ${midY + 10}`,
        fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round'
      }));
    } else if (dur === '16') {
      g.appendChild(el('circle', { cx: cx - 1, cy: midY - 6, r: 2.5, fill: 'currentColor' }));
      g.appendChild(el('circle', { cx: cx - 3, cy: midY + 2, r: 2.5, fill: 'currentColor' }));
      g.appendChild(el('path', {
        d: `M ${cx + 5} ${midY - 9} L ${cx - 3} ${midY + 13}`,
        fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round'
      }));
    }
    if (dotted) {
      g.appendChild(el('circle', { cx: cx + 11, cy: midY - HALF_GAP, r: 2.1, fill: 'currentColor' }));
    }
    svg.appendChild(g);
    return g;
  }

  /* Render a full score specification into container */
  function render(container, spec) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return null;
    container.innerHTML = '';

    const isGrand = !!spec.grand;
    const clefTop = spec.clef || 'treble';
    const clefBot = 'bass';
    const keySig = spec.key || null;
    const timeSig = spec.time || null;
    const items = spec.notes || [];
    const bassItems = spec.bassNotes || [];
    const bpm = spec.bpm || 96;

    // Optional top caption + Play button wrapper
    const card = document.createElement('div');
    card.className = 'score-card';

    if (spec.title || spec.playable !== false) {
      const cap = document.createElement('div');
      cap.className = 'score-caption';
      const titleSpan = document.createElement('span');
      titleSpan.innerHTML = spec.title ? `<strong>${spec.title}</strong>` : '';
      cap.appendChild(titleSpan);

      if (spec.playable !== false && items.some(it => !it.bar)) {
        const btnWrap = document.createElement('div');
        btnWrap.style.display = 'flex';
        btnWrap.style.gap = '0.4rem';
        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.className = 'btn btn-sm btn-primary';
        playBtn.textContent = '▶ 播放譜例';
        const stopBtn = document.createElement('button');
        stopBtn.type = 'button';
        stopBtn.className = 'btn btn-sm';
        stopBtn.textContent = '■ 停止';
        stopBtn.hidden = true;
        btnWrap.append(playBtn, stopBtn);
        cap.appendChild(btnWrap);

        playBtn.addEventListener('click', () => {
          stopBtn.hidden = false;
          playScore(spec, renderedElements, () => {
            stopBtn.hidden = true;
          });
        });
        stopBtn.addEventListener('click', () => {
          window.AudioEngine.stopAll();
          renderedElements.forEach(g => g && g.classList.remove('is-playing'));
          stopBtn.hidden = true;
        });
      }
      card.appendChild(cap);
    }

    const topPad = spec.topPad || 56;
    const staffGap = 66;
    const staffTopY1 = topPad;
    const staffTopY2 = isGrand ? staffTopY1 + 4 * LINE_GAP + staffGap : staffTopY1;
    const bottomPad = spec.bottomPad || 62;
    const totalHeight = (isGrand ? staffTopY2 + 4 * LINE_GAP : staffTopY1 + 4 * LINE_GAP) + bottomPad;

    // Calculate horizontal positions
    let cursorX = isGrand ? 22 : 12;
    const startStaffX = cursorX;

    // Reserve header space for clef + keySig + timeSig
    let headerW = 36;
    if (keySig && KEY_SIG_MAP[keySig]?.count) headerW += KEY_SIG_MAP[keySig].count * 11 + 8;
    if (timeSig) headerW += 28;

    const itemSpacing = spec.spacing || 52;
    const maxItems = Math.max(items.length, bassItems.length);
    const xPositions = [];
    let noteCursorX = startStaffX + headerW + 24;

    for (let i = 0; i < maxItems; i++) {
      const it = items[i] || bassItems[i] || {};
      if (it.bar) {
        xPositions.push(noteCursorX - 10);
        noteCursorX += it.timeSig ? 50 : 22;
      } else {
        xPositions.push(noteCursorX);
        const durFactor = it.dur === 'w' ? 1.35 : it.dur === 'h' ? 1.15 : it.dur === '16' ? 0.78 : 1;
        noteCursorX += Math.round(itemSpacing * durFactor);
      }
    }

    const endStaffX = Math.max(noteCursorX + 16, spec.minWidth || 240);
    const totalWidth = endStaffX + 14;
    const needsScroll = totalWidth > 440;
    const minSvgW = needsScroll ? Math.min(totalWidth, Math.max(360, Math.round(totalWidth * 0.74))) : 0;

    if (needsScroll) {
      const capEl = card.querySelector('.score-caption');
      if (capEl) {
        const hint = document.createElement('span');
        hint.className = 'score-scroll-hint';
        hint.textContent = '⇆ 可滑動看全譜 · 點擊音符發聲';
        capEl.appendChild(hint);
      }
    }

    const svg = el('svg', {
      viewBox: `0 0 ${totalWidth} ${totalHeight}`,
      class: 'music-svg',
      style: minSvgW > 0 ? `min-inline-size: ${minSvgW}px;` : 'min-inline-size: 0;',
      role: 'img',
      'aria-label': spec.ariaLabel || spec.title || '音樂五線譜範例'
    });

    // Draw Staff Lines
    drawStaffLines(svg, clefTop, startStaffX, endStaffX, staffTopY1);
    if (isGrand) {
      drawStaffLines(svg, clefBot, startStaffX, endStaffX, staffTopY2);
      // System left line + Grand Staff Brace
      svg.appendChild(el('line', {
        x1: startStaffX, y1: staffTopY1, x2: startStaffX, y2: staffTopY2 + 4 * LINE_GAP,
        stroke: 'currentColor', 'stroke-width': '1.8'
      }));
      const midBraceY = (staffTopY1 + staffTopY2 + 4 * LINE_GAP) / 2;
      svg.appendChild(el('path', {
        d: `M ${startStaffX - 2} ${staffTopY1} C ${startStaffX - 13} ${staffTopY1 + 18}, ${startStaffX - 4} ${midBraceY - 12}, ${startStaffX - 14} ${midBraceY} C ${startStaffX - 4} ${midBraceY + 12}, ${startStaffX - 13} ${staffTopY2 + 4 * LINE_GAP - 18}, ${startStaffX - 2} ${staffTopY2 + 4 * LINE_GAP}`,
        fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2'
      }));
    }

    // Draw Clef, Key Signature, Time Signature
    let hx = startStaffX + 4;
    const cw1 = drawClef(svg, clefTop, hx, staffTopY1);
    if (isGrand) drawClef(svg, clefBot, hx, staffTopY2);
    hx += cw1;

    const kw1 = drawKeySignature(svg, keySig, clefTop, hx, staffTopY1);
    if (isGrand) drawKeySignature(svg, keySig, clefBot, hx, staffTopY2);
    hx += kw1;

    drawTimeSignature(svg, timeSig, hx, staffTopY1, clefTop === 'rhythm');
    if (isGrand) drawTimeSignature(svg, timeSig, hx, staffTopY2, false);

    // Draw right closing bar line if last item isn't a bar
    const lastItem = items[items.length - 1];
    if (!lastItem || !lastItem.bar) {
      drawBarLine(svg, spec.endBar || '|.', endStaffX, staffTopY1, (isGrand ? staffTopY2 : staffTopY1) + 4 * LINE_GAP);
    }

    const renderedElements = [];

    function renderStaffNotes(noteList, clef, staffTopY, isBassStaff) {
      const beamBuckets = new Map();
      const noteMeta = [];

      noteList.forEach((item, idx) => {
        const cx = xPositions[idx];
        if (!item) return;

        if (item.bar) {
          const bTop = clef === 'rhythm' ? staffTopY + LINE_GAP : staffTopY;
          const bBot = clef === 'rhythm' ? staffTopY + 3 * LINE_GAP : (isGrand && !isBassStaff ? staffTopY2 + 4 * LINE_GAP : staffTopY + 4 * LINE_GAP);
          if (!isBassStaff) {
            drawBarLine(svg, item.bar, cx, bTop, bBot);
            if (item.timeSig) {
              drawTimeSignature(svg, item.timeSig, cx + 6, staffTopY, clef === 'rhythm');
              if (isGrand) drawTimeSignature(svg, item.timeSig, cx + 6, staffTopY2, false);
            }
          }
          if (item.ending && !isBassStaff) {
            svg.appendChild(el('path', {
              d: `M ${cx} ${staffTopY - 18} L ${cx} ${staffTopY - 28} L ${cx + 68} ${staffTopY - 28}`,
              fill: 'none', stroke: 'currentColor', 'stroke-width': '1.4'
            }));
            svg.appendChild(el('text', {
              x: cx + 6, y: staffTopY - 17, 'font-size': '11', 'font-weight': '700', fill: 'currentColor'
            }, item.ending));
          }
          return;
        }

        const dur = item.dur || 'q';
        if (item.rest) {
          const rg = drawRest(svg, dur, item.dotted, cx, staffTopY);
          if (!isBassStaff) renderedElements[idx] = rg;
          drawAnnotations(svg, item, cx, staffTopY, isBassStaff, null);
          return;
        }

        // Parse single pitch or chord array
        const rawPitches = Array.isArray(item.notes) ? item.notes : [item.pitch || item.note || 'B4'];
        const parsed = rawPitches.map(p => (clef === 'rhythm'
          ? { diatonicStep: 34, alter: 0, explicitNatural: false, midi: 69 }
          : (typeof p === 'string' ? window.CourseData.parsePitch(p) : p)
        )).filter(Boolean).sort((a, b) => a.diatonicStep - b.diatonicStep);

        if (!parsed.length) return;

        const g = el('g', { class: 'note-el ' + (item.className || '') });
        const midStep = (CLEF_BOTTOM_STEP[clef] || 30) + 4;
        const avgStep = (parsed[0].diatonicStep + parsed[parsed.length - 1].diatonicStep) / 2;
        const stemUp = item.stem ? item.stem === 'up' : (clef === 'rhythm' ? true : avgStep < midStep);

        // Draw ledger lines and noteheads (offset adjacent seconds!)
        let prevStep = -999;
        parsed.forEach((p, pIdx) => {
          drawLedgerLines(svg, p.diatonicStep, clef, cx, staffTopY);
          const ny = stepToY(p.diatonicStep, clef, staffTopY);
          let headX = cx;
          if (p.diatonicStep - prevStep === 1) {
            headX = stemUp ? cx + 10.5 : cx - 10.5;
          }
          prevStep = p.diatonicStep;

          const isOpenHead = (dur === 'w' || dur === 'h');
          const rx = dur === 'w' ? 7.2 : 6.2;
          const ry = 4.5;
          const nColor = (clef !== 'rhythm' && !item.highlight && spec.colorNotes !== false && window.AudioEngine?.PITCH_COLORS)
            ? window.AudioEngine.PITCH_COLORS[((p.midi % 12) + 12) % 12]
            : 'currentColor';
          const head = el('ellipse', {
            cx: headX, cy: ny, rx, ry,
            transform: dur === 'w' ? undefined : `rotate(-18 ${headX} ${ny})`,
            fill: isOpenHead ? 'var(--bg-score)' : nColor,
            stroke: nColor,
            'stroke-width': isOpenHead ? '2.3' : '1.1'
          });
          g.appendChild(head);

          // Accidentals (unless suppressed by hideAccidental when covered by keySig)
          if (!item.hideAccidental && (p.alter !== 0 || p.explicitNatural)) {
            const sym = p.explicitNatural ? '♮' : (p.alter === 2 ? '𝄪' : p.alter === 1 ? '♯' : p.alter === -1 ? '♭' : '𝄫');
            const accOffset = 16 + (pIdx % 2) * 14;
            drawAccidentalGlyph(g, sym, cx - accOffset, ny, 0.92);
          }

          if (item.dotted) {
            const dotY = (p.diatonicStep - (CLEF_BOTTOM_STEP[clef] || 30)) % 2 === 0 ? ny - 3 : ny;
            g.appendChild(el('circle', { cx: headX + 11.5, cy: dotY, r: 2.1, fill: 'currentColor' }));
          }
        });

        const lowY = stepToY(parsed[0].diatonicStep, clef, staffTopY);
        const highY = stepToY(parsed[parsed.length - 1].diatonicStep, clef, staffTopY);
        const stemX = stemUp ? cx + 5.6 : cx - 5.6;
        const stemStartY = stemUp ? lowY : highY;
        const stemEndY = stemUp ? highY - 33 : lowY + 33;

        if (dur !== 'w') {
          if (item.beam !== undefined && item.beam !== null) {
            if (!beamBuckets.has(item.beam)) beamBuckets.set(item.beam, []);
            beamBuckets.get(item.beam).push({ idx, g, cx, stemX, stemStartY, stemEndY, stemUp, dur });
          } else {
            g.appendChild(el('line', {
              x1: stemX, y1: stemStartY, x2: stemX, y2: stemEndY,
              stroke: 'currentColor', 'stroke-width': '1.6'
            }));
            // Individual flags always point to the RIGHT (Duckworth Ch. 1 rule!)
            if (dur === '8' || dur === '16') {
              const dir = stemUp ? 1 : -1;
              g.appendChild(el('path', {
                d: `M ${stemX} ${stemEndY} C ${stemX + 8} ${stemEndY + 7 * dir}, ${stemX + 10} ${stemEndY + 14 * dir}, ${stemX + 5} ${stemEndY + 21 * dir}`,
                fill: 'none', stroke: 'currentColor', 'stroke-width': '2.1', 'stroke-linecap': 'round'
              }));
              if (dur === '16') {
                const y2 = stemEndY + 7 * dir;
                g.appendChild(el('path', {
                  d: `M ${stemX} ${y2} C ${stemX + 8} ${y2 + 7 * dir}, ${stemX + 10} ${y2 + 14 * dir}, ${stemX + 5} ${y2 + 20 * dir}`,
                  fill: 'none', stroke: 'currentColor', 'stroke-width': '2.1', 'stroke-linecap': 'round'
                }));
              }
            }
          }
        }

        let topMostY = dur !== 'w' && stemUp ? stemEndY : highY - 6;
        let botMostY = dur !== 'w' && !stemUp ? Math.max(lowY, stemEndY - 8) : lowY + 6;

        // Accent >
        if (item.accent) {
          const ay = stemUp ? lowY + 13 : highY - 13;
          g.appendChild(el('path', {
            d: `M ${cx - 5} ${ay - 3} L ${cx + 5} ${ay} L ${cx - 5} ${ay + 3}`,
            fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round'
          }));
          if (stemUp) botMostY = Math.max(botMostY, ay + 4);
          else topMostY = Math.min(topMostY, ay - 5);
        }

        // Fermata
        if (item.fermata) {
          const fy = Math.min(staffTopY - 8, topMostY - 6);
          g.appendChild(el('path', {
            d: `M ${cx - 8} ${fy} A 8 7 0 0 1 ${cx + 8} ${fy}`,
            fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8'
          }));
          g.appendChild(el('circle', { cx, cy: fy - 1.5, r: 1.8, fill: 'currentColor' }));
          topMostY = Math.min(topMostY, fy - 10);
        }

        // Interactive click to hear individual note or chord
        g.addEventListener('click', () => {
          if (clef === 'rhythm') {
            window.AudioEngine.playPercussion('clave', !!item.accent);
          } else {
            window.AudioEngine.playChord(parsed, 0.75);
          }
        });

        svg.appendChild(g);
        if (!isBassStaff) renderedElements[idx] = g;
        noteMeta[idx] = { cx, lowY, highY, stemUp, tie: item.tie, tupletLabel: item.tupletLabel };
        drawAnnotations(svg, item, cx, staffTopY, isBassStaff, { topMostY, botMostY, lowY });
      });

      // Draw connected Beat Beams
      for (const group of beamBuckets.values()) {
        if (group.length === 0) continue;
        if (group.length === 1) {
          const n = group[0];
          n.g.appendChild(el('line', {
            x1: n.stemX, y1: n.stemStartY, x2: n.stemX, y2: n.stemEndY,
            stroke: 'currentColor', 'stroke-width': '1.6'
          }));
          continue;
        }
        const up = group[0].stemUp;
        const targetY = up
          ? Math.min(...group.map(n => n.stemEndY))
          : Math.max(...group.map(n => n.stemEndY));

        group.forEach(n => {
          n.g.appendChild(el('line', {
            x1: n.stemX, y1: n.stemStartY, x2: n.stemX, y2: targetY,
            stroke: 'currentColor', 'stroke-width': '1.6'
          }));
        });

        const firstX = group[0].stemX;
        const lastX = group[group.length - 1].stemX;
        // Primary eighth-note beam
        svg.appendChild(el('line', {
          x1: firstX - 0.8, y1: targetY, x2: lastX + 0.8, y2: targetY,
          stroke: 'currentColor', 'stroke-width': '3.8'
        }));

        // Secondary sixteenth-note beams or partial stubs (e.g. dotted 8th + 16th!)
        const secY = up ? targetY + 6.2 : targetY - 6.2;
        for (let i = 0; i < group.length; i++) {
          if (group[i].dur === '16') {
            if (i + 1 < group.length && group[i + 1].dur === '16') {
              svg.appendChild(el('line', {
                x1: group[i].stemX - 0.8, y1: secY, x2: group[i + 1].stemX + 0.8, y2: secY,
                stroke: 'currentColor', 'stroke-width': '3.6'
              }));
            } else if (i === 0 || group[i - 1].dur !== '16') {
              // Partial stub beam inside the beat!
              const stubX = i > 0 ? group[i].stemX - 10 : group[i].stemX + 10;
              svg.appendChild(el('line', {
                x1: Math.min(group[i].stemX, stubX), y1: secY,
                x2: Math.max(group[i].stemX, stubX), y2: secY,
                stroke: 'currentColor', 'stroke-width': '3.6'
              }));
            }
          }
        }
      }

      // Draw Ties
      for (let i = 0; i < noteMeta.length; i++) {
        const cur = noteMeta[i];
        if (!cur || !cur.tie) continue;
        let next = null;
        for (let j = i + 1; j < noteMeta.length; j++) {
          if (noteMeta[j]) { next = noteMeta[j]; break; }
        }
        if (next) {
          const under = cur.stemUp;
          const y1 = under ? cur.lowY + 7 : cur.highY - 7;
          const y2 = under ? next.lowY + 7 : next.highY - 7;
          const ctrlY = under ? Math.max(y1, y2) + 10 : Math.min(y1, y2) - 10;
          svg.appendChild(el('path', {
            d: `M ${cur.cx + 4} ${y1} Q ${(cur.cx + next.cx) / 2} ${ctrlY}, ${next.cx - 4} ${y2}`,
            fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8'
          }));
        }
      }
    }

    function drawAnnotations(svg, item, cx, staffTopY, isBassStaff, bounds) {
      const topRef = bounds ? Math.min(staffTopY - 13, bounds.topMostY - 8) : staffTopY - 13;
      if (item.chordSymbol || item.topText) {
        svg.appendChild(el('text', {
          x: cx, y: Math.max(13, topRef),
          'font-size': '12', 'font-weight': '700',
          fill: 'var(--brand)', 'text-anchor': 'middle'
        }, item.chordSymbol || item.topText));
      }
      if (item.tupletText) {
        svg.appendChild(el('text', {
          x: cx, y: Math.max(13, topRef),
          'font-size': '12', 'font-style': 'italic', 'font-weight': '700',
          fill: 'currentColor', 'text-anchor': 'middle'
        }, item.tupletText));
      }
      const staffBottomY = clefTop === 'rhythm' ? staffTopY + 3 * LINE_GAP + 6 : staffTopY + 4 * LINE_GAP;
      const lowClearY = bounds ? Math.max(staffBottomY + 18, bounds.lowY + 20) : staffBottomY + 18;
      if (item.lyric || item.label) {
        svg.appendChild(el('text', {
          x: cx, y: lowClearY,
          'font-size': '11.5', 'font-weight': '600',
          fill: 'currentColor', 'text-anchor': 'middle'
        }, item.lyric || item.label));
      }
      if (item.solfege || item.count || item.roman) {
        svg.appendChild(el('text', {
          x: cx, y: lowClearY + (item.lyric || item.label ? 15 : 1),
          'font-size': '11.5',
          'font-family': item.count ? 'var(--font-mono)' : 'var(--font-serif)',
          'font-weight': '700',
          fill: 'var(--accent-amber)',
          'text-anchor': 'middle'
        }, item.solfege || item.count || item.roman));
      }
    }

    renderStaffNotes(items, clefTop, staffTopY1, false);
    if (isGrand && bassItems.length) {
      renderStaffNotes(bassItems, clefBot, staffTopY2, true);
    }

    // Optional 8va / 8vb bracket across range
    if (spec.octaveBracket) {
      const { startIdx, endIdx, type } = spec.octaveBracket;
      const x1 = xPositions[startIdx] - 6;
      const x2 = xPositions[endIdx] + 10;
      const isUp = type !== '8vb';
      const by = isUp ? staffTopY1 - 18 : staffTopY1 + 4 * LINE_GAP + 24;
      svg.appendChild(el('text', {
        x: x1, y: by + 4, 'font-size': '12', 'font-style': 'italic', 'font-weight': '700', fill: 'currentColor'
      }, isUp ? '8va' : '8va bassa'));
      svg.appendChild(el('line', {
        x1: x1 + (isUp ? 26 : 58), y1: by, x2, y2: by,
        stroke: 'currentColor', 'stroke-width': '1.4', 'stroke-dasharray': '4 3'
      }));
      svg.appendChild(el('line', {
        x1: x2, y1: by, x2, y2: by + (isUp ? 8 : -8),
        stroke: 'currentColor', 'stroke-width': '1.4'
      }));
    }

    card.appendChild(svg);
    container.appendChild(card);
    return { svg, card };
  }

  function playScore(spec, renderedElements, onDone) {
    const items = spec.notes || [];
    const bassItems = spec.bassNotes || [];
    const clef = spec.clef || 'treble';
    const bpm = spec.bpm || 96;
    const events = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it || it.bar) continue;
      const bIt = bassItems[i];
      const beats = durToQuarterBeats(it.dur, it.dotted, it.tuplet);

      // Handle tied continuation: merge duration into previous event if previous had tie: true
      if (events.length > 0 && events[events.length - 1]._tieNext) {
        events[events.length - 1].beats += beats;
        events[events.length - 1]._tieNext = !!it.tie;
        continue;
      }

      if (it.rest && (!bIt || bIt.rest)) {
        events.push({ rest: true, beats, elIdx: i });
      } else if (clef === 'rhythm') {
        events.push({ perc: 'clave', accent: !!it.accent, beats, elIdx: i, _tieNext: !!it.tie });
      } else {
        const pitches = [];
        if (!it.rest) {
          const topP = Array.isArray(it.notes) ? it.notes : [it.pitch || it.note];
          pitches.push(...topP.filter(Boolean));
        }
        if (bIt && !bIt.rest && !bIt.bar) {
          const botP = Array.isArray(bIt.notes) ? bIt.notes : [bIt.pitch || bIt.note];
          pitches.push(...botP.filter(Boolean));
        }
        events.push({ notes: pitches, beats, elIdx: i, _tieNext: !!it.tie });
      }
    }

    window.AudioEngine.playSequence(events, bpm, {
      onStep: (ev) => {
        renderedElements.forEach(g => g && g.classList.remove('is-playing'));
        const target = renderedElements[ev.elIdx];
        if (target) target.classList.add('is-playing');
      },
      onDone: () => {
        renderedElements.forEach(g => g && g.classList.remove('is-playing'));
        if (onDone) onDone();
      }
    });
  }

  window.MusicNotation = {
    render,
    playScore
  };
})();
