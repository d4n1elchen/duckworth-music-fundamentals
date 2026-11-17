/* ==========================================================================
   app.js — Shared Synth-Studio Shell, Live Oscilloscope HUD, Drawer & Tabs
   ========================================================================== */
(function () {
  'use strict';

  function initShell() {
    const pageId = document.body.dataset.page || 'home';
    const pages = window.CourseData.COURSE_PAGES;
    const currentIndex = pages.findIndex(p => p.id === pageId);
    const currentPage = pages[currentIndex] || pages[0];

    // 1. Skip Link & Polite Announcer
    const skip = document.createElement('a');
    skip.href = '#main-heading';
    skip.className = 'skip-link visually-hidden';
    skip.textContent = '跳至主要內容';
    document.body.prepend(skip);

    const announcer = document.createElement('div');
    announcer.id = 'sr-announcer';
    announcer.className = 'visually-hidden';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);

    // 2. Render Sticky Studio Header with Live Audio Oscilloscope HUD
    const header = document.getElementById('site-header');
    if (header) {
      header.className = 'site-header';
      header.innerHTML = `
        <div class="header-inner">
          <button type="button" class="btn mobile-drawer-btn" id="drawer-open" aria-label="開啟章節目錄" aria-expanded="false" aria-controls="chapter-drawer">
            <span aria-hidden="true">☰</span>
            <span class="hide-narrow">章節</span>
          </button>
          <a class="brand-link" href="index.html">
            <span class="brand-badge" aria-hidden="true">𝄞</span>
            <span>音樂實驗室<span class="hide-narrow"> · Duckworth 11e</span></span>
          </a>
          <div class="live-hud" title="即時音訊波形與發音監測">
            <canvas id="hud-scope" width="112" height="44" aria-hidden="true"></canvas>
            <span class="live-hud-note" id="hud-note">♪ 點擊試聽</span>
          </div>
          <div class="header-progress-wrap">
            <label for="global-course-progress" id="global-progress-label">進度</label>
            <progress id="global-course-progress" max="${pages.length}" value="0"></progress>
            <span id="global-progress-text" style="font-family:var(--font-mono);">0%</span>
          </div>
          <div class="header-actions">
            <button type="button" class="btn btn-amber" id="open-piano-modal" aria-label="開啟隨身鋼琴">
              <span aria-hidden="true">🎹</span>
              <span class="hide-narrow">鋼琴</span>
            </button>
            <button type="button" class="btn" id="open-settings-modal" aria-label="外觀與主題設定">
              <span aria-hidden="true">⚙</span>
            </button>
          </div>
        </div>
      `;
    }

    initLiveHud();

    // 3. Build Navigation Tree
    function buildNavTreeHtml() {
      const prog = window.CourseData.getProgress();
      const groups = new Map();
      pages.forEach(p => {
        if (!groups.has(p.group)) groups.set(p.group, []);
        groups.get(p.group).push(p);
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
                <span class="nav-num">${item.num}</span>
                <span>${item.title.replace(/^第 \d+ 章：/, '')}</span>
                ${isDone ? '<span class="nav-done-mark" aria-label="已完成">✓</span>' : ''}
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
      sidebar.innerHTML = `<nav aria-label="課程章節目錄">${buildNavTreeHtml()}</nav>`;
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
            <strong id="drawer-title" style="font-size:1rem;">🗺️ 全書 20 頁互動地圖</strong>
            <button type="button" class="btn btn-sm" id="drawer-close" aria-label="關閉目錄" autofocus>✕</button>
          </div>
          <nav aria-label="行動版章節目錄" id="drawer-nav-body">${buildNavTreeHtml()}</nav>
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
    pianoDialog.innerHTML = `
      <div class="modal-header">
        <h2 id="piano-modal-title">🎹 隨身合成鍵盤 (C3–C6)</h2>
        <form method="dialog"><button class="btn btn-sm" value="close" autofocus>✕ 關閉</button></form>
      </div>
      <div class="widget-controls" style="margin-block-start:0;">
        <label style="font-size:0.84rem;font-weight:700;">音色：
          <select id="global-timbre-select">
            <option value="piano">🎹 平台鋼琴</option>
            <option value="flute">🪈 長笛</option>
            <option value="clarinet">🎷 單簧管</option>
            <option value="violin">🎻 小提琴</option>
            <option value="guitar">🎸 木吉他</option>
            <option value="organ">⛪ 管風琴</option>
          </select>
        </label>
        <label style="font-size:0.84rem;font-weight:700;display:inline-flex;align-items:center;gap:0.35rem;">
          音量：<input type="range" id="global-vol-range" min="0" max="1" step="0.05" value="0.78" style="inline-size:95px;">
        </label>
        <span id="floating-last-note" class="visual-pill">電腦鍵盤 A–K / W–U 亦可彈奏</span>
      </div>
      <div id="floating-piano-mount"></div>
    `;
    document.body.appendChild(pianoDialog);

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

    document.getElementById('global-timbre-select')?.addEventListener('change', (e) => {
      window.AudioEngine.setTimbre(e.target.value);
    });
    document.getElementById('global-vol-range')?.addEventListener('input', (e) => {
      window.AudioEngine.setVolume(e.target.value);
    });

    const KEY_TO_MIDI = { a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72 };
    document.addEventListener('keydown', (e) => {
      if (!pianoDialog.open || e.repeat) return;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      const m = KEY_TO_MIDI[e.key.toLowerCase()];
      if (m && floatingPiano) floatingPiano.triggerKey(m);
    });

    // 6. Settings & Tri-State Color Scheme Modal (<dialog>)
    const settingsDialog = document.createElement('dialog');
    settingsDialog.className = 'modal-dialog';
    settingsDialog.style.maxInlineSize = '440px';
    settingsDialog.id = 'settings-dialog';
    settingsDialog.setAttribute('closedby', 'any');
    settingsDialog.setAttribute('aria-labelledby', 'settings-modal-title');
    settingsDialog.innerHTML = `
      <div class="modal-header">
        <h2 id="settings-modal-title">⚙ 主題外觀與進度設定</h2>
        <form method="dialog"><button class="btn btn-sm" value="close" autofocus>✕</button></form>
      </div>
      <fieldset style="border:1.5px solid var(--border-subtle);border-radius:var(--radius-md);padding:0.85rem;margin-block-end:0.9rem;">
        <legend style="font-weight:800;padding-inline:0.4rem;">色彩模式</legend>
        <div style="display:grid;gap:0.5rem;">
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-weight:600;">
            <input type="radio" name="theme-choice" value="system">
            <span id="system-theme-label">跟隨系統預設</span>
          </label>
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-weight:600;">
            <input type="radio" name="theme-choice" value="light">
            <span>☀️ 淺色工作室 (Daylight Studio)</span>
          </label>
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-weight:600;">
            <input type="radio" name="theme-choice" value="dark">
            <span>🌙 深色霓虹舞台 (Midnight Synth)</span>
          </label>
        </div>
      </fieldset>
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
        <span style="font-size:0.84rem;color:var(--text-secondary);">重置本機閱讀與闖關紀錄：</span>
        <button type="button" class="btn btn-sm" id="reset-all-progress-btn">↺ 清除紀錄</button>
      </div>
    `;
    document.body.appendChild(settingsDialog);

    wireColorSchemeSettings(settingsDialog);
    wireDialogLightDismissFallback([pianoDialog, settingsDialog]);

    document.getElementById('open-settings-modal')?.addEventListener('click', () => settingsDialog.showModal());
    document.getElementById('reset-all-progress-btn')?.addEventListener('click', () => {
      try { localStorage.removeItem('duckworth11e_progress_v1'); } catch {}
      window.dispatchEvent(new CustomEvent('course-progress-updated'));
      settingsDialog.close();
    });

    // 7. Bottom Prev/Next Navigation
    const mainEl = document.querySelector('main.lesson-main');
    if (mainEl && currentIndex >= 0) {
      const prev = currentIndex > 0 ? pages[currentIndex - 1] : null;
      const next = currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

      const footerNav = document.createElement('nav');
      footerNav.className = 'chapter-footer-nav';
      footerNav.setAttribute('aria-label', '章節前後頁導覽');

      const prevHtml = prev
        ? `<a class="btn" href="${prev.file}">← ${prev.num} ${prev.title.replace(/^第 \d+ 章：/, '')}</a>`
        : `<span></span>`;
      const nextHtml = next
        ? `<a class="btn btn-primary" href="${next.file}">${next.num} ${next.title.replace(/^第 \d+ 章：/, '')} →</a>`
        : `<a class="btn btn-primary" href="index.html">回到互動總覽 →</a>`;

      const doneBtnHtml = pageId !== 'home'
        ? `<button type="button" class="btn" id="toggle-page-done-btn" aria-pressed="false">○ 標記完成本章</button>`
        : '';

      footerNav.innerHTML = `${prevHtml}${doneBtnHtml}${nextHtml}`;
      mainEl.appendChild(footerNav);

      const doneBtn = document.getElementById('toggle-page-done-btn');
      if (doneBtn) {
        const syncDoneBtn = () => {
          const isDone = !!window.CourseData.getProgress().completedPages[pageId];
          doneBtn.setAttribute('aria-pressed', isDone ? 'true' : 'false');
          doneBtn.textContent = isDone ? '✓ 已通關本章' : '○ 標記完成本章';
        };
        syncDoneBtn();
        doneBtn.addEventListener('click', () => {
          const cur = !!window.CourseData.getProgress().completedPages[pageId];
          window.CourseData.markPageCompleted(pageId, !cur);
          if (!cur) window.AudioEngine.playChord(['C5', 'E5', 'G5', 'C6'], 0.45);
          syncDoneBtn();
        });
        window.addEventListener('course-progress-updated', syncDoneBtn);
      }
    }

    // 8. Footer
    const siteFooter = document.getElementById('site-footer');
    if (siteFooter) {
      siteFooter.className = 'site-footer';
      siteFooter.innerHTML = `<p>🎹 Duckworth《<cite lang="en">A Creative Approach to Music Fundamentals</cite>》(11e) 互動音樂實驗室 · <strong>${currentPage.num} ${currentPage.title}</strong></p>`;
    }

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
      if (sidebar) sidebar.innerHTML = `<nav aria-label="課程章節目錄">${buildNavTreeHtml()}</nav>`;
      const dBody = document.getElementById('drawer-nav-body');
      if (dBody) dBody.innerHTML = buildNavTreeHtml();
    }

    refreshProgressUI();
    window.addEventListener('course-progress-updated', refreshProgressUI);

    // 10. Tabs
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

      // Gentle breathing idle wave
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

  function wireColorSchemeSettings(dialog) {
    const meta = document.querySelector('meta[name="color-scheme"]');
    const radios = dialog.querySelectorAll('input[name="theme-choice"]');
    const sysLabel = dialog.querySelector('#system-theme-label');
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    function updateSysLabel() {
      if (sysLabel) sysLabel.textContent = `跟隨系統預設（目前為${mql.matches ? '深色' : '淺色'}）`;
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
