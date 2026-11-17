/* ==========================================================================
   app.js — Bilingual Synth-Studio Shell, Live Oscilloscope HUD, Drawer & Tabs
   Default Language: English ('en') · Toggle EN / 繁中 persisted in localStorage
   ========================================================================== */
(function () {
  'use strict';

  const _t = (en, zh) => (window.I18n ? window.I18n.t(en, zh) : en);
  const _isEn = () => (window.I18n ? window.I18n.isEn() : true);

  function cleanPageLabel(page) {
    if (!page) return '';
    if (_isEn()) {
      return (page.en || page.title).replace(/^(Ch \d+|Intro|Appendices [A-Z–-]+):\s*/, '');
    }
    return page.title.replace(/^(第 \d+ 章|導論|附錄 [A-Z–-]+)：/, '');
  }

  function pageBadgeNum(page) {
    if (!page) return '';
    return _isEn() ? page.num : (page.numZh || page.num);
  }

  function initShell() {
    // Apply saved or default ('en') language to static page DOM first
    window.I18n?.applyDom?.(document);

    const pageId = document.body.dataset.page || 'home';
    const pages = window.CourseData.COURSE_PAGES;
    const currentIndex = pages.findIndex(p => p.id === pageId);
    const currentPage = pages[currentIndex] || pages[0];

    // Prevent mobile Safari/Chrome double-tap smart-zoom during fast rhythmic/piano tapping
    document.addEventListener('dblclick', (e) => {
      e.preventDefault();
    }, { passive: false });

    // 1. Skip Link & Polite Announcer
    const skip = document.createElement('a');
    skip.href = '#main-heading';
    skip.className = 'skip-link visually-hidden';
    skip.textContent = _t('Skip to main content', '跳至主要內容');
    document.body.prepend(skip);

    const announcer = document.createElement('div');
    announcer.id = 'sr-announcer';
    announcer.className = 'visually-hidden';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);

    // 2. Render Sticky Studio Header with Live Audio Oscilloscope HUD + EN/繁 Toggle
    const header = document.getElementById('site-header');
    function langToggleInnerHtml() {
      const en = _isEn();
      return en
        ? `<span style="color:var(--brand);font-weight:900;">EN</span><span style="opacity:.45">/</span><span style="opacity:.78">繁</span>`
        : `<span style="opacity:.78">EN</span><span style="opacity:.45">/</span><span style="color:var(--brand);font-weight:900;">繁</span>`;
    }

    if (header) {
      header.className = 'site-header';
      header.innerHTML = `
        <div class="header-inner">
          <button type="button" class="btn mobile-drawer-btn" id="drawer-open" aria-label="${_t('Open chapter menu', '開啟章節目錄')}" aria-expanded="false" aria-controls="chapter-drawer">
            <span aria-hidden="true">☰</span>
            <span class="hide-narrow" id="drawer-open-label">${_t('Chapters', '章節')}</span>
          </button>
          <a class="brand-link" href="index.html">
            <span class="brand-badge" aria-hidden="true">𝄞</span>
            <span id="brand-title-text">${_t('Music Lab', '音樂實驗室')}<span class="hide-narrow"> · Duckworth 11e</span></span>
          </a>
          <div class="live-hud" id="live-hud-box" title="${_t('Live audio waveform & note monitor', '即時音訊波形與發音監測')}">
            <canvas id="hud-scope" width="112" height="44" aria-hidden="true"></canvas>
            <span class="live-hud-note" id="hud-note" data-idle="1">${_t('♪ Tap to play', '♪ 點擊試聽')}</span>
          </div>
          <div class="header-progress-wrap">
            <label for="global-course-progress" id="global-progress-label">${_t('Progress', '進度')}</label>
            <progress id="global-course-progress" max="${pages.length}" value="0"></progress>
            <span id="global-progress-text" style="font-family:var(--font-mono);">0%</span>
          </div>
          <div class="header-actions">
            <button type="button" class="btn lang-toggle-btn" id="lang-toggle-btn" aria-label="${_t('Switch language to Traditional Chinese', '切換語言為英文 (Switch to English)')}" title="${_t('Switch EN / 繁體中文', '切換 英文 / 繁體中文')}">
              ${langToggleInnerHtml()}
            </button>
            <button type="button" class="btn btn-amber" id="open-piano-modal" aria-label="${_t('Open floating synth keyboard', '開啟隨身鋼琴')}">
              <span aria-hidden="true">🎹</span>
              <span class="hide-narrow" id="open-piano-label">${_t('Piano', '鋼琴')}</span>
            </button>
            <button type="button" class="btn" id="open-settings-modal" aria-label="${_t('Theme, language & progress settings', '外觀、語言與進度設定')}">
              <span aria-hidden="true">⚙</span>
            </button>
          </div>
        </div>
      `;
    }

    document.getElementById('lang-toggle-btn')?.addEventListener('click', () => {
      window.I18n?.toggleLang?.();
    });

    initLiveHud();

    // 3. Build Navigation Tree
    function buildNavTreeHtml() {
      const prog = window.CourseData.getProgress();
      const groups = new Map();
      pages.forEach(p => {
        const gKey = _isEn() ? (p.groupEn || p.group) : p.group;
        if (!groups.has(gKey)) groups.set(gKey, []);
        groups.get(gKey).push(p);
      });

      let html = '';
      for (const [gName, items] of groups.entries()) {
        html += `<div class="sidebar-group-title">${gName}</div><ul class="nav-list" role="list">`;
        for (const item of items) {
          const isCur = item.id === pageId;
          const isDone = !!prog.completedPages[item.id];
          html += `
            <li>
              <a class="nav-link" href="${item.file}" ${isCur ? 'aria-current="page"' : ''}>
                <span class="nav-num">${pageBadgeNum(item)}</span>
                <span>${cleanPageLabel(item)}</span>
                ${isDone ? `<span class="nav-done-mark" aria-label="${_t('Completed', '已完成')}">✓</span>` : ''}
              </a>
            </li>
          `;
        }
        html += `</ul>`;
      }
      return html;
    }

    const sidebar = document.getElementById('course-sidebar');
    if (sidebar) {
      sidebar.innerHTML = `<nav aria-label="${_t('Course chapters', '課程章節目錄')}">${buildNavTreeHtml()}</nav>`;
    }

    // 4. Mobile Scroll-Snap Drawer (<dialog>)
    const drawer = document.createElement('dialog');
    drawer.className = 'Drawer';
    drawer.id = 'chapter-drawer';
    drawer.setAttribute('aria-labelledby', 'drawer-title');
    drawer.innerHTML = `
      <div class="Drawer-scroller">
        <div class="Drawer-sheet">
          <div class="Drawer-header">
            <strong id="drawer-title" style="font-size:1rem;">${_t('🗺️ 20-Page Interactive Map', '🗺️ 全書 20 頁互動地圖')}</strong>
            <button type="button" class="btn btn-sm" id="drawer-close" aria-label="${_t('Close menu', '關閉目錄')}" autofocus>✕</button>
          </div>
          <nav aria-label="${_t('Mobile chapter menu', '行動版章節目錄')}" id="drawer-nav-body">${buildNavTreeHtml()}</nav>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);
    wireScrollSnapDrawer(drawer);

    // 5. Floating Synth Piano Modal (<dialog>)
    const pianoDialog = document.createElement('dialog');
    pianoDialog.className = 'modal-dialog';
    pianoDialog.id = 'studio-piano-dialog';
    pianoDialog.setAttribute('closedby', 'any');
    pianoDialog.setAttribute('aria-labelledby', 'piano-modal-title');

    function renderPianoModalControls() {
      const curTimbre = document.getElementById('global-timbre-select')?.value || 'piano';
      const curVol = document.getElementById('global-vol-range')?.value || '0.78';
      const titleEl = pianoDialog.querySelector('#piano-modal-title');
      const closeBtn = pianoDialog.querySelector('#piano-modal-close');
      const ctrlWrap = pianoDialog.querySelector('#piano-modal-ctrl-wrap');
      if (titleEl) titleEl.textContent = _t('🎹 Pocket Synth Keyboard (C3–C6)', '🎹 隨身合成鍵盤 (C3–C6)');
      if (closeBtn) closeBtn.textContent = _t('✕ Close', '✕ 關閉');
      if (ctrlWrap) {
        ctrlWrap.innerHTML = `
          <label style="font-size:0.84rem;font-weight:700;">${_t('Timbre:', '音色：')}
            <select id="global-timbre-select">
              <option value="piano" ${curTimbre === 'piano' ? 'selected' : ''}>${_t('🎹 Grand Piano', '🎹 平台鋼琴')}</option>
              <option value="flute" ${curTimbre === 'flute' ? 'selected' : ''}>${_t('🪈 Flute', '🪈 長笛')}</option>
              <option value="clarinet" ${curTimbre === 'clarinet' ? 'selected' : ''}>${_t('🎷 Clarinet', '🎷 單簧管')}</option>
              <option value="violin" ${curTimbre === 'violin' ? 'selected' : ''}>${_t('🎻 Violin', '🎻 小提琴')}</option>
              <option value="guitar" ${curTimbre === 'guitar' ? 'selected' : ''}>${_t('🎸 Acoustic Guitar', '🎸 木吉他')}</option>
              <option value="organ" ${curTimbre === 'organ' ? 'selected' : ''}>${_t('⛪ Pipe Organ', '⛪ 管風琴')}</option>
            </select>
          </label>
          <label style="font-size:0.84rem;font-weight:700;display:inline-flex;align-items:center;gap:0.35rem;">
            ${_t('Vol:', '音量：')}<input type="range" id="global-vol-range" min="0" max="1" step="0.05" value="${curVol}" style="inline-size:95px;">
          </label>
          <span id="floating-last-note" class="visual-pill">${_t('Keys A–K / W–U also play notes', '電腦鍵盤 A–K / W–U 亦可彈奏')}</span>
        `;
        ctrlWrap.querySelector('#global-timbre-select')?.addEventListener('change', (e) => {
          window.AudioEngine.setTimbre(e.target.value);
        });
        ctrlWrap.querySelector('#global-vol-range')?.addEventListener('input', (e) => {
          window.AudioEngine.setVolume(e.target.value);
        });
      }
    }

    pianoDialog.innerHTML = `
      <div class="modal-header">
        <h2 id="piano-modal-title"></h2>
        <form method="dialog"><button class="btn btn-sm" id="piano-modal-close" value="close" autofocus></button></form>
      </div>
      <div class="widget-controls" id="piano-modal-ctrl-wrap" style="margin-block-start:0;"></div>
      <div id="floating-piano-mount"></div>
    `;
    document.body.appendChild(pianoDialog);
    renderPianoModalControls();

    let floatingPiano = null;
    document.getElementById('open-piano-modal')?.addEventListener('click', () => {
      pianoDialog.showModal();
      if (!floatingPiano) {
        floatingPiano = window.Widgets.createPiano('#floating-piano-mount', {
          startMidi: 48,
          endMidi: 84,
          showLandmarks: true,
          onNote: (midi) => {
            const p = window.CourseData.midiToCleanPitch(midi);
            const badge = document.getElementById('floating-last-note');
            if (badge) badge.innerHTML = `🎵 <strong>${p.label}</strong> · ${p.freq.toFixed(1)} Hz`;
          }
        });
      }
    });

    const KEY_TO_MIDI = { a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72 };
    document.addEventListener('keydown', (e) => {
      if (!pianoDialog.open || e.repeat) return;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      const m = KEY_TO_MIDI[e.key.toLowerCase()];
      if (m && floatingPiano) floatingPiano.triggerKey(m);
    });

    // 6. Settings: Language + Tri-State Color Scheme Modal (<dialog>)
    const settingsDialog = document.createElement('dialog');
    settingsDialog.className = 'modal-dialog';
    settingsDialog.style.maxInlineSize = '450px';
    settingsDialog.id = 'settings-dialog';
    settingsDialog.setAttribute('closedby', 'any');
    settingsDialog.setAttribute('aria-labelledby', 'settings-modal-title');
    settingsDialog.innerHTML = `
      <div class="modal-header">
        <h2 id="settings-modal-title"></h2>
        <form method="dialog"><button class="btn btn-sm" value="close" autofocus>✕</button></form>
      </div>
      <fieldset style="border:1.5px solid var(--border-subtle);border-radius:var(--radius-md);padding:0.85rem;margin-block-end:0.8rem;">
        <legend id="lang-legend" style="font-weight:800;padding-inline:0.4rem;"></legend>
        <div style="display:grid;gap:0.5rem;">
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-weight:600;">
            <input type="radio" name="lang-choice" value="en">
            <span id="lang-en-label">English (Default)</span>
          </label>
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-weight:600;">
            <input type="radio" name="lang-choice" value="zh">
            <span id="lang-zh-label">繁體中文 (Traditional Chinese)</span>
          </label>
        </div>
      </fieldset>
      <fieldset style="border:1.5px solid var(--border-subtle);border-radius:var(--radius-md);padding:0.85rem;margin-block-end:0.9rem;">
        <legend id="theme-legend" style="font-weight:800;padding-inline:0.4rem;"></legend>
        <div style="display:grid;gap:0.5rem;">
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-weight:600;">
            <input type="radio" name="theme-choice" value="system">
            <span id="system-theme-label"></span>
          </label>
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-weight:600;">
            <input type="radio" name="theme-choice" value="light">
            <span id="light-theme-label"></span>
          </label>
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-weight:600;">
            <input type="radio" name="theme-choice" value="dark">
            <span id="dark-theme-label"></span>
          </label>
        </div>
      </fieldset>
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
        <span id="reset-progress-desc" style="font-size:0.84rem;color:var(--text-secondary);"></span>
        <button type="button" class="btn btn-sm" id="reset-all-progress-btn"></button>
      </div>
    `;
    document.body.appendChild(settingsDialog);

    const updateSysThemeLabel = wireColorSchemeSettings(settingsDialog);
    wireLanguageSettings(settingsDialog);
    wireDialogLightDismissFallback([pianoDialog, settingsDialog]);

    function renderSettingsText() {
      const sTitle = settingsDialog.querySelector('#settings-modal-title');
      const langLeg = settingsDialog.querySelector('#lang-legend');
      const langEnL = settingsDialog.querySelector('#lang-en-label');
      const langZhL = settingsDialog.querySelector('#lang-zh-label');
      const thLeg = settingsDialog.querySelector('#theme-legend');
      const lThL = settingsDialog.querySelector('#light-theme-label');
      const dThL = settingsDialog.querySelector('#dark-theme-label');
      const rDesc = settingsDialog.querySelector('#reset-progress-desc');
      const rBtn = settingsDialog.querySelector('#reset-all-progress-btn');
      if (sTitle) sTitle.textContent = _t('⚙ Language, Theme & Progress', '⚙ 語言、外觀與進度設定');
      if (langLeg) langLeg.textContent = _t('🌐 Language / 介面語言', '🌐 介面語言 / Language');
      if (langEnL) langEnL.textContent = _t('English (Default · Remembered)', 'English (預設語言 · 自動記住設定)');
      if (langZhL) langZhL.textContent = _t('繁體中文 (Traditional Chinese)', '繁體中文 (自動記住設定)');
      if (thLeg) thLeg.textContent = _t('🎨 Color Theme', '🎨 色彩模式');
      if (lThL) lThL.textContent = _t('☀️ Daylight Studio (Light)', '☀️ 淺色工作室 (Daylight Studio)');
      if (dThL) dThL.textContent = _t('🌙 Midnight Synth (Dark)', '🌙 深色霓虹舞台 (Midnight Synth)');
      if (rDesc) rDesc.textContent = _t('Reset local chapter & quiz progress:', '重置本機閱讀與闖關紀錄：');
      if (rBtn) rBtn.textContent = _t('↺ Reset Progress', '↺ 清除紀錄');
      updateSysThemeLabel();
    }
    renderSettingsText();

    document.getElementById('open-settings-modal')?.addEventListener('click', () => settingsDialog.showModal());
    document.getElementById('reset-all-progress-btn')?.addEventListener('click', () => {
      try { localStorage.removeItem('duckworth11e_progress_v1'); } catch {}
      window.dispatchEvent(new CustomEvent('course-progress-updated'));
      settingsDialog.close();
    });

    // 7. Bottom Prev/Next Navigation
    const mainEl = document.querySelector('main.lesson-main');
    let footerNav = null;
    function renderFooterNav() {
      if (!mainEl || currentIndex < 0) return;
      if (!footerNav) {
        footerNav = document.createElement('nav');
        footerNav.className = 'chapter-footer-nav';
        mainEl.appendChild(footerNav);
      }
      footerNav.setAttribute('aria-label', _t('Previous and next chapter navigation', '章節前後頁導覽'));

      const prev = currentIndex > 0 ? pages[currentIndex - 1] : null;
      const next = currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

      const prevHtml = prev
        ? `<a class="btn" href="${prev.file}">← ${pageBadgeNum(prev)} ${cleanPageLabel(prev)}</a>`
        : `<span></span>`;
      const nextHtml = next
        ? `<a class="btn btn-primary" href="${next.file}">${pageBadgeNum(next)} ${cleanPageLabel(next)} →</a>`
        : `<a class="btn btn-primary" href="index.html">${_t('Back to Hub →', '回到互動總覽 →')}</a>`;

      const doneBtnHtml = pageId !== 'home'
        ? `<button type="button" class="btn" id="toggle-page-done-btn" aria-pressed="false"></button>`
        : '';

      footerNav.innerHTML = `${prevHtml}${doneBtnHtml}${nextHtml}`;

      const doneBtn = footerNav.querySelector('#toggle-page-done-btn');
      if (doneBtn) {
        const syncDoneBtn = () => {
          const isDone = !!window.CourseData.getProgress().completedPages[pageId];
          doneBtn.setAttribute('aria-pressed', isDone ? 'true' : 'false');
          doneBtn.textContent = isDone
            ? _t('✓ Chapter Completed', '✓ 已通關本章')
            : _t('○ Mark Chapter Complete', '○ 標記完成本章');
        };
        syncDoneBtn();
        doneBtn.addEventListener('click', () => {
          const cur = !!window.CourseData.getProgress().completedPages[pageId];
          window.CourseData.markPageCompleted(pageId, !cur);
          if (!cur) window.AudioEngine.playChord(['C5', 'E5', 'G5', 'C6'], 0.45);
          syncDoneBtn();
        });
      }
    }
    renderFooterNav();
    window.addEventListener('course-progress-updated', renderFooterNav);

    // 8. Footer
    const siteFooter = document.getElementById('site-footer');
    function renderSiteFooter() {
      if (!siteFooter) return;
      siteFooter.className = 'site-footer';
      const pageLabel = _isEn()
        ? `${currentPage.num} · ${currentPage.en || currentPage.title}`
        : `${currentPage.numZh || currentPage.num} · ${currentPage.title}`;
      siteFooter.innerHTML = _isEn()
        ? `<p>🎹 Duckworth’s <cite>A Creative Approach to Music Fundamentals</cite> (11e) Interactive Music Lab · <strong>${pageLabel}</strong></p>`
        : `<p>🎹 Duckworth《<cite lang="en">A Creative Approach to Music Fundamentals</cite>》(11e) 互動音樂實驗室 · <strong>${pageLabel}</strong></p>`;
    }
    renderSiteFooter();

    // 9. Progress Bar Sync
    function refreshProgressUI() {
      const prog = window.CourseData.getProgress();
      const learnablePages = pages.filter(p => p.id !== 'home');
      const doneCount = learnablePages.filter(p => prog.completedPages[p.id]).length;
      const pct = Math.round((doneCount / learnablePages.length) * 100);
      const bar = document.getElementById('global-course-progress');
      const txt = document.getElementById('global-progress-text');
      if (bar) { bar.max = learnablePages.length; bar.value = doneCount; }
      if (txt) txt.textContent = `${pct}%`;
      if (sidebar) sidebar.innerHTML = `<nav aria-label="${_t('Course chapters', '課程章節目錄')}">${buildNavTreeHtml()}</nav>`;
      const dBody = document.getElementById('drawer-nav-body');
      if (dBody) dBody.innerHTML = buildNavTreeHtml();
    }

    refreshProgressUI();
    window.addEventListener('course-progress-updated', refreshProgressUI);

    // 10. Live Language Switch Listener (updates entire shell without page reload)
    window.addEventListener('lang-changed', () => {
      skip.textContent = _t('Skip to main content', '跳至主要內容');
      const dOpen = document.getElementById('drawer-open');
      if (dOpen) dOpen.setAttribute('aria-label', _t('Open chapter menu', '開啟章節目錄'));
      const dOpenLbl = document.getElementById('drawer-open-label');
      if (dOpenLbl) dOpenLbl.textContent = _t('Chapters', '章節');
      const brandTxt = document.getElementById('brand-title-text');
      if (brandTxt) brandTxt.innerHTML = `${_t('Music Lab', '音樂實驗室')}<span class="hide-narrow"> · Duckworth 11e</span>`;
      const hudBox = document.getElementById('live-hud-box');
      if (hudBox) hudBox.title = _t('Live audio waveform & note monitor', '即時音訊波形與發音監測');
      const hudNote = document.getElementById('hud-note');
      if (hudNote && hudNote.dataset.idle === '1') {
        hudNote.textContent = _t('♪ Tap to play', '♪ 點擊試聽');
      }
      const pLbl = document.getElementById('global-progress-label');
      if (pLbl) pLbl.textContent = _t('Progress', '進度');
      const langBtn = document.getElementById('lang-toggle-btn');
      if (langBtn) {
        langBtn.innerHTML = langToggleInnerHtml();
        langBtn.setAttribute('aria-label', _t('Switch language to Traditional Chinese', '切換語言為英文 (Switch to English)'));
      }
      const oPiano = document.getElementById('open-piano-modal');
      if (oPiano) oPiano.setAttribute('aria-label', _t('Open floating synth keyboard', '開啟隨身鋼琴'));
      const oPianoLbl = document.getElementById('open-piano-label');
      if (oPianoLbl) oPianoLbl.textContent = _t('Piano', '鋼琴');
      const oSet = document.getElementById('open-settings-modal');
      if (oSet) oSet.setAttribute('aria-label', _t('Theme, language & progress settings', '外觀、語言與進度設定'));

      const dTitle = document.getElementById('drawer-title');
      if (dTitle) dTitle.textContent = _t('🗺️ 20-Page Interactive Map', '🗺️ 全書 20 頁互動地圖');
      const dClose = document.getElementById('drawer-close');
      if (dClose) dClose.setAttribute('aria-label', _t('Close menu', '關閉目錄'));
      const dNav = document.getElementById('drawer-nav-body');
      if (dNav) dNav.setAttribute('aria-label', _t('Mobile chapter menu', '行動版章節目錄'));

      renderPianoModalControls();
      renderSettingsText();
      refreshProgressUI();
      renderFooterNav();
      renderSiteFooter();
    });

    // 11. Tabs
    wireTabs();
  }

  /* Live Header Audio Oscilloscope */
  function initLiveHud() {
    const cvs = document.getElementById('hud-scope');
    const noteEl = document.getElementById('hud-note');
    if (!cvs) return;
    const c = cvs.getContext('2d');
    let activeColor = '#818cf8';
    let idlePhase = 0;
    const buf = new Uint8Array(128);

    window.addEventListener('audio-activity', (e) => {
      const d = e.detail || {};
      if (d.color) activeColor = d.color;
      if (noteEl && d.label) {
        noteEl.dataset.idle = '0';
        noteEl.textContent = d.label;
        noteEl.style.color = activeColor;
      }
    });

    function renderScope() {
      const w = cvs.width, h = cvs.height;
      c.clearRect(0, 0, w, h);
      const analyser = window.AudioEngine?.getAnalyser?.();

      c.strokeStyle = activeColor;
      c.lineWidth = 2.4;
      c.lineCap = 'round';
      c.beginPath();

      if (analyser) {
        analyser.getByteTimeDomainData(buf);
        let maxDev = 0;
        for (let i = 0; i < buf.length; i++) maxDev = Math.max(maxDev, Math.abs(buf[i] - 128));
        if (maxDev > 2) {
          for (let i = 0; i < buf.length; i++) {
            const x = (i / (buf.length - 1)) * w;
            const y = (buf[i] / 255) * h;
            if (i === 0) c.moveTo(x, y);
            else c.lineTo(x, y);
          }
          c.stroke();
          requestAnimationFrame(renderScope);
          return;
        }
      }

      idlePhase += 0.05;
      for (let x = 0; x <= w; x += 4) {
        const y = h / 2 + Math.sin(x * 0.12 + idlePhase) * 3;
        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.globalAlpha = 0.55;
      c.stroke();
      c.globalAlpha = 1;
      requestAnimationFrame(renderScope);
    }

    requestAnimationFrame(renderScope);
  }

  function wireScrollSnapDrawer(drawer) {
    const openBtn = document.getElementById('drawer-open');
    const closeBtn = drawer.querySelector('#drawer-close');
    const scroller = drawer.querySelector('.Drawer-scroller');
    const sheet = drawer.querySelector('.Drawer-sheet');
    if (!openBtn || !scroller || !sheet) return;

    async function openDrawer() {
      drawer.showModal();
      if (!CSS.supports('scroll-initial-target', 'nearest')) {
        scroller.scrollTo({ left: scroller.offsetWidth, behavior: 'instant' });
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      }
      scroller.scrollTo({ left: 0, behavior: 'auto' });
    }

    function closeDrawer() {
      const targetLeft = Math.max(sheet.offsetWidth, scroller.offsetWidth);
      scroller.scrollTo({ left: targetLeft, behavior: 'auto' });
      setTimeout(() => {
        if (drawer.open) {
          drawer.close();
          openBtn.setAttribute('aria-expanded', 'false');
        }
      }, 280);
    }

    const visibleThreshold = 1 / Math.max(320, window.innerWidth);
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.at(-1);
      if (!entry) return;
      if (entry.intersectionRatio < visibleThreshold && drawer.open) {
        drawer.close();
        openBtn.setAttribute('aria-expanded', 'false');
      } else if (entry.intersectionRatio === 1) {
        openBtn.setAttribute('aria-expanded', 'true');
      }
    }, { root: drawer, threshold: [visibleThreshold, 1] });
    observer.observe(sheet);

    if (!CSS.supports('animation-timeline: scroll()')) {
      scroller.addEventListener('scroll', () => {
        const ratio = Math.max(0, Math.min(1, 1 - scroller.scrollLeft / Math.max(1, sheet.offsetWidth)));
        drawer.style.setProperty('--drawer-backdrop', String(ratio));
      });
    }

    openBtn.addEventListener('click', openDrawer);
    closeBtn?.addEventListener('click', closeDrawer);
    drawer.addEventListener('click', (e) => {
      if (!sheet.contains(e.target)) closeDrawer();
    });
    drawer.addEventListener('cancel', (e) => {
      if (e.cancelable) {
        e.preventDefault();
        closeDrawer();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.open) {
        closeDrawer();
      }
    });
  }

  function wireLanguageSettings(dialog) {
    const radios = dialog.querySelectorAll('input[name="lang-choice"]');
    function syncLangRadios() {
      const cur = window.I18n ? window.I18n.getLang() : 'en';
      radios.forEach(r => { r.checked = (r.value === cur); });
    }
    syncLangRadios();
    radios.forEach(r => {
      r.addEventListener('change', () => {
        if (r.checked) window.I18n?.setLang?.(r.value);
      });
    });
    window.addEventListener('lang-changed', syncLangRadios);
  }

  function wireColorSchemeSettings(dialog) {
    const meta = document.querySelector('meta[name="color-scheme"]');
    const radios = dialog.querySelectorAll('input[name="theme-choice"]');
    const sysLabel = dialog.querySelector('#system-theme-label');
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    function updateSysLabel() {
      if (!sysLabel) return;
      sysLabel.textContent = _isEn()
        ? `Follow system default (currently ${mql.matches ? 'dark' : 'light'})`
        : `跟隨系統預設（目前為${mql.matches ? '深色' : '淺色'}）`;
    }
    updateSysLabel();
    mql.addEventListener('change', updateSysLabel);

    function syncRadiosFromStorage() {
      let stored = null;
      try { stored = localStorage.getItem('color-scheme'); } catch {}
      const val = (stored === 'light' || stored === 'dark') ? stored : 'system';
      radios.forEach(r => { r.checked = (r.value === val); });
      if (meta) meta.content = (stored === 'light' || stored === 'dark') ? stored : 'light dark';
    }
    syncRadiosFromStorage();

    radios.forEach(r => {
      r.addEventListener('change', () => {
        if (!r.checked) return;
        if (r.value === 'system') {
          try { localStorage.removeItem('color-scheme'); } catch {}
          if (meta) meta.content = 'light dark';
        } else {
          try { localStorage.setItem('color-scheme', r.value); } catch {}
          if (meta) meta.content = r.value;
        }
      });
    });

    window.addEventListener('storage', (e) => {
      if (e.key === 'color-scheme') syncRadiosFromStorage();
    });

    return updateSysLabel;
  }

  function wireDialogLightDismissFallback(dialogs) {
    if ('closedBy' in HTMLDialogElement.prototype) return;
    const outside = (e, d) => {
      const r = d.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    for (const d of dialogs) {
      let pressedOutside = false;
      d.addEventListener('pointerdown', (e) => { pressedOutside = outside(e, d); });
      d.addEventListener('pointerup', (e) => { if (pressedOutside && outside(e, d)) d.close(); });
    }
  }

  function wireTabs() {
    document.querySelectorAll('.tabs').forEach(tabsRoot => {
      const tablist = tabsRoot.querySelector('.tablist');
      const tabs = Array.from(tablist ? tablist.querySelectorAll('button') : []);
      const panels = Array.from(tabsRoot.querySelectorAll('[role="tabpanel"]'));
      if (!tabs.length || !panels.length) return;

      if (!Object.hasOwn(HTMLElement.prototype, 'focusGroup')) {
        tablist.setAttribute('role', 'tablist');
        tabs.forEach((t) => {
          t.setAttribute('role', 'tab');
          t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
        });
      }

      function selectTab(targetTab, moveFocus = false) {
        tabs.forEach((tab, idx) => {
          const active = tab === targetTab;
          tab.setAttribute('aria-selected', active ? 'true' : 'false');
          tab.toggleAttribute('focusgroupstart', active);
          if (!Object.hasOwn(HTMLElement.prototype, 'focusGroup')) tab.tabIndex = active ? 0 : -1;
          const panel = panels[idx];
          if (panel) {
            if (active) panel.hidden = false;
            else panel.setAttribute('hidden', 'until-found');
          }
        });
        if (moveFocus) targetTab.focus();
        targetTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }

      tabs.forEach((tab, idx) => {
        tab.addEventListener('click', () => selectTab(tab, false));
        tab.addEventListener('keydown', (e) => {
          if (Object.hasOwn(HTMLElement.prototype, 'focusGroup')) return;
          let nextIdx = null;
          if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
          else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
          else if (e.key === 'Home') nextIdx = 0;
          else if (e.key === 'End') nextIdx = tabs.length - 1;
          if (nextIdx !== null) {
            e.preventDefault();
            selectTab(tabs[nextIdx], true);
          }
        });
      });

      panels.forEach((panel, idx) => {
        panel.addEventListener('beforematch', () => {
          if (tabs[idx]) selectTab(tabs[idx], false);
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShell);
  } else {
    initShell();
  }
})();
