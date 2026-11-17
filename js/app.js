/* ==========================================================================
   app.js — Shared Course Shell, Navigation Drawer, Dialogs, Tabs & Progress
   Follows Modern Web Guidance for dark-mode-toggle, dialog, tabs & drawer
   ========================================================================== */
(function () {
  'use strict';

  function initShell() {
    const pageId = document.body.dataset.page || 'home';
    const pages = window.CourseData.COURSE_PAGES;
    const currentIndex = pages.findIndex(p => p.id === pageId);
    const currentPage = pages[currentIndex] || pages[0];

    // 1. Inject Skip Link & Polite Screen Reader Announcer
    const skip = document.createElement('a');
    skip.href = '#main-heading';
    skip.className = 'skip-link visually-hidden';
    skip.textContent = '跳至主要教學內容';
    document.body.prepend(skip);

    const announcer = document.createElement('div');
    announcer.id = 'sr-announcer';
    announcer.className = 'visually-hidden';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);

    // 2. Render Site Header
    const header = document.getElementById('site-header');
    if (header) {
      header.className = 'site-header';
      header.innerHTML = `
        <div class="header-inner">
          <button type="button" class="btn mobile-drawer-btn" id="drawer-open" aria-label="章節目錄" aria-expanded="false" aria-controls="chapter-drawer">
            <span aria-hidden="true">☰</span>
            <span class="hide-narrow">章節</span><span>目錄</span>
          </button>
          <a class="brand-link" href="index.html">
            <span class="brand-badge" aria-hidden="true">𝄞</span>
            <span>創意音樂基礎<span class="hide-narrow"> 11e</span></span>
          </a>
          <div class="header-progress-wrap">
            <label for="global-course-progress" id="global-progress-label">學習進度</label>
            <progress id="global-course-progress" max="${pages.length}" value="0"></progress>
            <span id="global-progress-text" style="font-family:var(--font-mono);font-weight:700;">0%</span>
          </div>
          <div class="header-actions">
            <button type="button" class="btn btn-amber" id="open-piano-modal" aria-label="隨身鋼琴">
              <span aria-hidden="true">🎹</span>
              <span class="hide-narrow">隨身</span><span>鋼琴</span>
            </button>
            <button type="button" class="btn" id="open-settings-modal" aria-label="外觀與設定">
              <span aria-hidden="true">⚙</span>
              <span class="hide-narrow">設定</span>
            </button>
          </div>
        </div>
      `;
    }

    // 3. Build Navigation Tree HTML helper
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

    // 4. Populate Desktop Sidebar
    const sidebar = document.getElementById('course-sidebar');
    if (sidebar) {
      sidebar.innerHTML = `<nav aria-label="課程章節目錄">${buildNavTreeHtml()}</nav>`;
    }

    // 5. Create Mobile Scroll-Snap Navigation Drawer (<dialog>) per modern-web-guidance
    const drawer = document.createElement('dialog');
    drawer.className = 'Drawer';
    drawer.id = 'chapter-drawer';
    drawer.setAttribute('aria-labelledby', 'drawer-title');
    drawer.innerHTML = `
      <div class="Drawer-scroller">
        <div class="Drawer-sheet">
          <div class="Drawer-header">
            <strong id="drawer-title" style="font-family:var(--font-serif);font-size:1.05rem;">全書章節目錄</strong>
            <button type="button" class="btn btn-sm" id="drawer-close" aria-label="關閉目錄選單" autofocus>✕ 關閉</button>
          </div>
          <nav aria-label="行動版章節目錄" id="drawer-nav-body">${buildNavTreeHtml()}</nav>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);

    wireScrollSnapDrawer(drawer);

    // 6. Create Floating Studio Piano Modal (<dialog>)
    const pianoDialog = document.createElement('dialog');
    pianoDialog.className = 'modal-dialog';
    pianoDialog.id = 'studio-piano-dialog';
    pianoDialog.setAttribute('closedby', 'any');
    pianoDialog.setAttribute('aria-labelledby', 'piano-modal-title');
    pianoDialog.innerHTML = `
      <div class="modal-header">
        <h2 id="piano-modal-title">🎹 隨身互動鍵盤與音色試聽室</h2>
        <form method="dialog"><button class="btn btn-sm" value="close" autofocus>✕ 關閉 (Esc)</button></form>
      </div>
      <p style="margin-block-start:0;font-size:0.9rem;color:var(--text-secondary);">
        Duckworth 強調：無論主修何種樂器，在鋼琴鍵盤上「同時看見並聽見」半音、全音、音階與三和弦，是掌握樂理最快的方式。可使用滑鼠點擊或電腦鍵盤 <code>A S D F G H J K</code>（白鍵）、<code>W E T Y U</code>（黑鍵）彈奏 C4–C5。
      </p>
      <div class="widget-controls">
        <label style="font-size:0.88rem;font-weight:600;">音色選擇：
          <select id="global-timbre-select">
            <option value="piano">平台鋼琴 (Piano)</option>
            <option value="flute">長笛 (Flute)</option>
            <option value="clarinet">單簧管 (Clarinet)</option>
            <option value="violin">小提琴 (Violin)</option>
            <option value="guitar">木吉他 (Acoustic Guitar)</option>
            <option value="organ">管風琴 (Organ)</option>
          </select>
        </label>
        <label style="font-size:0.88rem;font-weight:600;display:inline-flex;align-items:center;gap:0.4rem;">
          主音量：
          <input type="range" id="global-vol-range" min="0" max="1" step="0.05" value="0.75">
        </label>
        <span id="floating-last-note" class="badge">點擊任意琴鍵試聽</span>
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
            if (badge) badge.textContent = `目前發音：${p.label} · ${p.freq.toFixed(1)} Hz (MIDI ${midi})`;
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

    // Computer keyboard shortcuts when studio piano dialog is open
    const KEY_TO_MIDI = {
      a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72
    };
    document.addEventListener('keydown', (e) => {
      if (!pianoDialog.open || e.repeat) return;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      const m = KEY_TO_MIDI[e.key.toLowerCase()];
      if (m && floatingPiano) floatingPiano.triggerKey(m);
    });

    // 7. Create Settings & Tri-State Color Scheme Modal (<dialog>) per dark-mode-toggle guide
    const settingsDialog = document.createElement('dialog');
    settingsDialog.className = 'modal-dialog';
    settingsDialog.style.maxInlineSize = '480px';
    settingsDialog.id = 'settings-dialog';
    settingsDialog.setAttribute('closedby', 'any');
    settingsDialog.setAttribute('aria-labelledby', 'settings-modal-title');
    settingsDialog.innerHTML = `
      <div class="modal-header">
        <h2 id="settings-modal-title">⚙ 顯示主題與學習設定</h2>
        <form method="dialog"><button class="btn btn-sm" value="close" autofocus>✕ 關閉</button></form>
      </div>
      <fieldset style="border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:1rem;margin-block-end:1rem;">
        <legend style="font-weight:700;padding-inline:0.4rem;">色彩外觀模式 (Color Scheme)</legend>
        <div style="display:grid;gap:0.55rem;margin-block-start:0.35rem;">
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
            <input type="radio" name="theme-choice" value="system">
            <span id="system-theme-label">跟隨系統預設 (System)</span>
          </label>
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
            <input type="radio" name="theme-choice" value="light">
            <span>淺色手稿模式 (Light Manuscript)</span>
          </label>
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
            <input type="radio" name="theme-choice" value="dark">
            <span>深色音樂廳模式 (Dark Recital Hall)</span>
          </label>
        </div>
      </fieldset>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:0.75rem;">
        <span style="font-size:0.88rem;color:var(--text-secondary);">重置所有章節完成紀錄與測驗成績：</span>
        <button type="button" class="btn btn-sm" id="reset-all-progress-btn">清除學習紀錄</button>
      </div>
    `;
    document.body.appendChild(settingsDialog);

    wireColorSchemeSettings(settingsDialog);
    wireDialogLightDismissFallback([pianoDialog, settingsDialog]);

    document.getElementById('open-settings-modal')?.addEventListener('click', () => {
      settingsDialog.showModal();
    });

    document.getElementById('reset-all-progress-btn')?.addEventListener('click', () => {
      try { localStorage.removeItem('duckworth11e_progress_v1'); } catch {}
      window.dispatchEvent(new CustomEvent('course-progress-updated'));
      settingsDialog.close();
    });

    // 8. Inject Bottom Chapter Prev/Next & Mark Completed Controls
    const mainEl = document.querySelector('main.lesson-main');
    if (mainEl && currentIndex >= 0) {
      const prev = currentIndex > 0 ? pages[currentIndex - 1] : null;
      const next = currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

      const footerNav = document.createElement('nav');
      footerNav.className = 'chapter-footer-nav';
      footerNav.setAttribute('aria-label', '章節前後頁導覽');

      const prevHtml = prev
        ? `<a class="btn" href="${prev.file}">← 上一頁：${prev.num} ${prev.title.replace(/^第 \d+ 章：/, '')}</a>`
        : `<span></span>`;
      const nextHtml = next
        ? `<a class="btn btn-primary" href="${next.file}">下一頁：${next.num} ${next.title.replace(/^第 \d+ 章：/, '')} →</a>`
        : `<a class="btn btn-primary" href="index.html">回到課程總覽儀表板 →</a>`;

      const doneBtnHtml = pageId !== 'home'
        ? `<button type="button" class="btn" id="toggle-page-done-btn" aria-pressed="false">✓ 標記本章節為已讀完</button>`
        : '';

      footerNav.innerHTML = `${prevHtml}${doneBtnHtml}${nextHtml}`;
      mainEl.appendChild(footerNav);

      const doneBtn = document.getElementById('toggle-page-done-btn');
      if (doneBtn) {
        const syncDoneBtn = () => {
          const isDone = !!window.CourseData.getProgress().completedPages[pageId];
          doneBtn.setAttribute('aria-pressed', isDone ? 'true' : 'false');
          doneBtn.textContent = isDone ? '✓ 本章節已完成（點擊取消）' : '○ 標記本章節為已完成';
        };
        syncDoneBtn();
        doneBtn.addEventListener('click', () => {
          const cur = !!window.CourseData.getProgress().completedPages[pageId];
          window.CourseData.markPageCompleted(pageId, !cur);
          syncDoneBtn();
        });
        window.addEventListener('course-progress-updated', syncDoneBtn);
      }
    }

    // 9. Render Site Footer
    const siteFooter = document.getElementById('site-footer');
    if (siteFooter) {
      siteFooter.className = 'site-footer';
      siteFooter.innerHTML = `
        <p>
          依據 William Duckworth《<cite lang="en">A Creative Approach to Music Fundamentals</cite>》(11th Edition) 全書章節架構編寫之互動式樂理教學網站 ·
          當前頁面：<strong>${currentPage.num} — ${currentPage.title}</strong>
        </p>
      `;
    }

    // 10. Sync Global Progress Bar & Sidebar checkmarks
    function refreshProgressUI() {
      const prog = window.CourseData.getProgress();
      const learnablePages = pages.filter(p => p.id !== 'home');
      const doneCount = learnablePages.filter(p => prog.completedPages[p.id]).length;
      const pct = Math.round((doneCount / learnablePages.length) * 100);
      const bar = document.getElementById('global-course-progress');
      const txt = document.getElementById('global-progress-text');
      if (bar) {
        bar.max = learnablePages.length;
        bar.value = doneCount;
      }
      if (txt) txt.textContent = `${pct}% (${doneCount}/${learnablePages.length})`;
      if (sidebar) sidebar.innerHTML = `<nav aria-label="課程章節目錄">${buildNavTreeHtml()}</nav>`;
      const dBody = document.getElementById('drawer-nav-body');
      if (dBody) dBody.innerHTML = buildNavTreeHtml();
    }

    refreshProgressUI();
    window.addEventListener('course-progress-updated', refreshProgressUI);

    // 11. Wire Accessible Tabs (selection follows focus + hidden="until-found" beforematch sync)
    wireTabs();
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
      scroller.scrollTo({ left: scroller.offsetWidth, behavior: 'auto' });
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
  }

  function wireColorSchemeSettings(dialog) {
    const meta = document.querySelector('meta[name="color-scheme"]');
    const radios = dialog.querySelectorAll('input[name="theme-choice"]');
    const sysLabel = dialog.querySelector('#system-theme-label');
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    function updateSysLabel() {
      if (sysLabel) {
        sysLabel.textContent = `跟隨系統預設（目前系統為${mql.matches ? '深色' : '淺色'}）`;
      }
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

  /* Fallback for <dialog closedby="any"> where closedBy is not supported */
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

  /* Accessible Tabbed Interfaces with focusgroup + arrow-key fallback + hidden="until-found" sync */
  function wireTabs() {
    document.querySelectorAll('.tabs').forEach(tabsRoot => {
      const tablist = tabsRoot.querySelector('.tablist');
      const tabs = Array.from(tablist ? tablist.querySelectorAll('button') : []);
      const panels = Array.from(tabsRoot.querySelectorAll('[role="tabpanel"]'));
      if (!tabs.length || !panels.length) return;

      if (!Object.hasOwn(HTMLElement.prototype, 'focusGroup')) {
        tablist.setAttribute('role', 'tablist');
        tabs.forEach((t, i) => {
          t.setAttribute('role', 'tab');
          t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
        });
      }

      function selectTab(targetTab, moveFocus = false) {
        tabs.forEach((tab, idx) => {
          const active = tab === targetTab;
          tab.setAttribute('aria-selected', active ? 'true' : 'false');
          tab.toggleAttribute('focusgroupstart', active);
          if (!Object.hasOwn(HTMLElement.prototype, 'focusGroup')) {
            tab.tabIndex = active ? 0 : -1;
          }
          const panel = panels[idx];
          if (panel) {
            if (active) {
              panel.hidden = false;
            } else {
              panel.setAttribute('hidden', 'until-found');
            }
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
