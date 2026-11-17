/* ==========================================================================
   course-data.js — Bilingual i18n Manager, Syllabus & Music Theory Engine
   Default Language: English ('en') · Persisted in localStorage ('duckworth11e_lang')
   ========================================================================== */
(function () {
  'use strict';

  /* 0. Bilingual i18n Manager (EN default, ZH toggle, localStorage persistence) */
  const LANG_KEY = 'duckworth11e_lang';

  function getLang() {
    try {
      const v = localStorage.getItem(LANG_KEY);
      return v === 'zh' ? 'zh' : 'en'; // Default is English!
    } catch {
      return document.documentElement.dataset.lang === 'zh' ? 'zh' : 'en';
    }
  }

  function isEn() {
    return getLang() === 'en';
  }

  function t(enVal, zhVal) {
    if (enVal && typeof enVal === 'object' && ('en' in enVal || 'zh' in enVal)) {
      return isEn() ? (enVal.en ?? enVal.zh) : (enVal.zh ?? enVal.en);
    }
    return isEn() ? enVal : (zhVal !== undefined ? zhVal : enVal);
  }

  function pick(val) {
    if (val && typeof val === 'object' && ('en' in val || 'zh' in val)) {
      return isEn() ? (val.en ?? val.zh) : (val.zh ?? val.en);
    }
    return val;
  }

  function applyDom(root = document) {
    const lang = getLang();
    const enMode = lang === 'en';
    document.documentElement.dataset.lang = lang;
    document.documentElement.lang = enMode ? 'en' : 'zh-Hant';

    if (document.body) {
      if (document.body._enTitle === undefined) {
        document.body._enTitle = document.title;
      }
      if (document.body.dataset.zhTitle) {
        document.title = enMode ? document.body._enTitle : document.body.dataset.zhTitle;
      }
    }

    root.querySelectorAll('[data-zh]').forEach(el => {
      if (el._enHtml === undefined) el._enHtml = el.innerHTML;
      el.innerHTML = enMode ? el._enHtml : el.dataset.zh;
    });

    root.querySelectorAll('[data-zh-placeholder]').forEach(el => {
      if (el._enPh === undefined) el._enPh = el.getAttribute('placeholder') || '';
      el.setAttribute('placeholder', enMode ? el._enPh : el.dataset.zhPlaceholder);
    });

    root.querySelectorAll('[data-zh-aria]').forEach(el => {
      if (el._enAria === undefined) el._enAria = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', enMode ? el._enAria : el.dataset.zhAria);
    });
  }

  function setLang(newLang) {
    const clean = newLang === 'zh' ? 'zh' : 'en';
    try { localStorage.setItem(LANG_KEY, clean); } catch {}
    applyDom(document);
    window.dispatchEvent(new CustomEvent('lang-changed', { detail: { lang: clean } }));
  }

  function toggleLang() {
    setLang(isEn() ? 'zh' : 'en');
  }

  window.addEventListener('storage', (e) => {
    if (e.key === LANG_KEY) {
      applyDom(document);
      window.dispatchEvent(new CustomEvent('lang-changed', { detail: { lang: getLang() } }));
    }
  });

  window.I18n = {
    LANG_KEY,
    getLang,
    isEn,
    t,
    pick,
    applyDom,
    setLang,
    toggleLang
  };

  /* 1. Full 20-Page Course Syllabus (Bilingual EN & ZH) */
  const COURSE_PAGES = [
    { id: 'home', num: 'Hub', numZh: '總覽', file: 'index.html', groupEn: 'Foundations', group: '導讀與基礎', en: 'Interactive Studio Hub', title: '課程總覽與學習儀表板' },
    { id: 'intro', num: 'Intro', numZh: '導論', file: 'intro.html', groupEn: 'Foundations', group: '導讀與基礎', en: 'Intro: Playing with Sound & Texture', title: '導論：玩轉聲音與織體' },
    { id: 'ch01', num: 'Ch 1', numZh: 'Ch 1', file: 'ch01-basics.html', groupEn: 'Foundations', group: '導讀與基礎', en: 'Ch 1: The Basics of Music', title: '第 1 章：節奏積木與五線譜' },
    { id: 'ch02', num: 'Ch 2', numZh: 'Ch 2', file: 'ch02-keyboard.html', groupEn: 'Foundations', group: '導讀與基礎', en: 'Ch 2: The Keyboard + Focus 1', title: '第 2 章：鍵盤跳躍儀 ＋ 檢定 1' },

    { id: 'ch03', num: 'Ch 3', numZh: 'Ch 3', file: 'ch03-simple-meter.html', groupEn: 'Rhythm & Pitch', group: '節奏與音高系統', en: 'Ch 3: Rhythm I — Simple Meter', title: '第 3 章：單拍子鼓機與指揮' },
    { id: 'ch04', num: 'Ch 4', numZh: 'Ch 4', file: 'ch04-compound-meter.html', groupEn: 'Rhythm & Pitch', group: '節奏與音高系統', en: 'Ch 4: Rhythm II — Compound Meter + Focus 2', title: '第 4 章：複拍子雷達 ＋ 檢定 2' },
    { id: 'ch05', num: 'Ch 5', numZh: 'Ch 5', file: 'ch05-pitch.html', groupEn: 'Rhythm & Pitch', group: '節奏與音高系統', en: 'Ch 5: Pitch, Dynamics & Map + Focus 3', title: '第 5 章：八度、力度與導航 ＋ 檢定 3' },

    { id: 'ch06', num: 'Ch 6', numZh: 'Ch 6', file: 'ch06-major-scales.html', groupEn: 'Major Keys & Intervals', group: '大調、調號與音程', en: 'Ch 6: Major Scales & Scale Degrees', title: '第 6 章：大調音階階梯與練耳' },
    { id: 'ch07', num: 'Ch 7', numZh: 'Ch 7', file: 'ch07-major-keys.html', groupEn: 'Major Keys & Intervals', group: '大調、調號與音程', en: 'Ch 7: Major Key Signatures + Focus 4', title: '第 7 章：大調調號與五度圈 ＋ 檢定 4' },
    { id: 'ch08', num: 'Ch 8', numZh: 'Ch 8', file: 'ch08-intervals.html', groupEn: 'Major Keys & Intervals', group: '大調、調號與音程', en: 'Ch 8: Intervals & Inversion + Focus 5', title: '第 8 章：音程共振與轉位 ＋ 檢定 5' },

    { id: 'ch09', num: 'Ch 9', numZh: 'Ch 9', file: 'ch09-minor-keys.html', groupEn: 'Minor, Pentatonic & Blues', group: '小調、五聲與藍調', en: 'Ch 9: Minor Key Signatures', title: '第 9 章：小調調號（關係與平行調）' },
    { id: 'ch10', num: 'Ch 10', numZh: 'Ch 10', file: 'ch10-minor-scales.html', groupEn: 'Minor, Pentatonic & Blues', group: '小調、五聲與藍調', en: 'Ch 10: Minor Scales (3 Forms)', title: '第 10 章：小調三態 DNA 階梯' },
    { id: 'ch11', num: 'Ch 11', numZh: 'Ch 11', file: 'ch11-pentatonic-blues.html', groupEn: 'Minor, Pentatonic & Blues', group: '小調、五聲與藍調', en: 'Ch 11: Pentatonic & Blues + Focus 6', title: '第 11 章：五聲與藍調即興 ＋ 檢定 6' },

    { id: 'ch12', num: 'Ch 12', numZh: 'Ch 12', file: 'ch12-triads.html', groupEn: 'Harmony & Songwriting', group: '和弦、進行與歌曲創作', en: 'Ch 12: Triads & Inversions', title: '第 12 章：三和弦積木與轉位' },
    { id: 'ch13', num: 'Ch 13', numZh: 'Ch 13', file: 'ch13-triads-context.html', groupEn: 'Harmony & Songwriting', group: '和弦、進行與歌曲創作', en: 'Ch 13: Triads in Context & V7', title: '第 13 章：和弦代號、吉他與 V7' },
    { id: 'ch14', num: 'Ch 14', numZh: 'Ch 14', file: 'ch14-progressions.html', groupEn: 'Harmony & Songwriting', group: '和弦、進行與歌曲創作', en: 'Ch 14: Progressions, Cadences & Blues + Focus 7', title: '第 14 章：終止式與 12 小節藍調 ＋ 檢定 7' },
    { id: 'ch15', num: 'Ch 15', numZh: 'Ch 15', file: 'ch15-songwriting.html', groupEn: 'Harmony & Songwriting', group: '和弦、進行與歌曲創作', en: 'Ch 15: Writing a Song & Form', title: '第 15 章：寫歌工作室與四大曲式' },

    { id: 'app-ae', num: 'App A–E', numZh: '附錄 A–E', file: 'appendices-rhythm-melody.html', groupEn: 'Appendices & Glossary', group: '附錄實練室與總辭典', en: 'Appendices A–E: Polyrhythms, Solfège & Fingerings', title: '附錄 A–E：世界複節奏、唱名與指法' },
    { id: 'app-fk', num: 'App F–K', numZh: '附錄 F–K', file: 'appendices-modes-timbre.html', groupEn: 'Appendices & Glossary', group: '附錄實練室與總辭典', en: 'Appendices F–K: C Clefs, Modes, Harmonics & Guitar', title: '附錄 F–K：C 譜號、調式、泛音與吉他' },
    { id: 'glossary', num: 'Glossary', numZh: '辭典', file: 'glossary.html', groupEn: 'Appendices & Glossary', group: '附錄實練室與總辭典', en: 'Glossary Flashcards & Examples Index', title: '術語翻卡與快查總辭典' }
  ];

  /* 2. Enharmonic-Exact Music Theory Engine */
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const BASE_SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function alterToSymbol(alter) {
    if (alter === 2) return '𝄪';
    if (alter === 1) return '♯';
    if (alter === -1) return '♭';
    if (alter === -2) return '𝄫';
    return '';
  }

  function alterToAscii(alter) {
    if (alter === 2) return '##';
    if (alter === 1) return '#';
    if (alter === -1) return 'b';
    if (alter === -2) return 'bb';
    return '';
  }

  function parsePitch(str) {
    if (!str) return null;
    const clean = String(str).trim();
    const m = clean.match(/^([A-Ga-g])(𝄪|𝄫|##|bb|x|#|♯|b|♭|n|♮)?(-?\d+)?$/);
    if (!m) return null;
    const letter = m[1].toUpperCase();
    const acc = m[2] || '';
    const octave = m[3] !== undefined ? parseInt(m[3], 10) : 4;
    let alter = 0;
    if (acc === '𝄪' || acc === '##' || acc === 'x') alter = 2;
    else if (acc === '#' || acc === '♯') alter = 1;
    else if (acc === 'b' || acc === '♭') alter = -1;
    else if (acc === '𝄫' || acc === 'bb') alter = -2;
    const explicitNatural = (acc === 'n' || acc === '♮');
    const diatonicStep = octave * 7 + LETTERS.indexOf(letter);
    const midi = (octave + 1) * 12 + BASE_SEMITONES[letter] + alter;
    const pitchClass = ((midi % 12) + 12) % 12;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    return {
      letter,
      alter,
      explicitNatural,
      octave,
      diatonicStep,
      midi,
      pitchClass,
      freq,
      name: letter + alterToSymbol(alter),
      ascii: letter + alterToAscii(alter) + octave,
      label: letter + alterToSymbol(alter) + octave
    };
  }

  function stepPitch(basePitch, letterSteps, targetSemitones) {
    const p = typeof basePitch === 'string' ? parsePitch(basePitch) : basePitch;
    const startIdx = LETTERS.indexOf(p.letter);
    const totalIdx = startIdx + letterSteps;
    const newLetterIdx = ((totalIdx % 7) + 7) % 7;
    const octaveShift = Math.floor(totalIdx / 7);
    const newOctave = p.octave + octaveShift;
    const newLetter = LETTERS[newLetterIdx];
    const naturalMidi = (newOctave + 1) * 12 + BASE_SEMITONES[newLetter];
    const desiredMidi = p.midi + targetSemitones;
    const alter = desiredMidi - naturalMidi;
    return parsePitch(newLetter + alterToAscii(alter) + newOctave);
  }

  const SCALE_PATTERNS = {
    major: {
      en: 'Major Scale', zh: '大調音階',
      steps: [[0, 0], [1, 2], [2, 4], [3, 5], [4, 7], [5, 9], [6, 11], [7, 12]],
      formulaEn: 'W - W - H - W - W - W - H', formulaZh: 'W - W - H - W - W - W - H',
      solfege: ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti', 'do']
    },
    naturalMinor: {
      en: 'Natural Minor Scale', zh: '自然小調',
      steps: [[0, 0], [1, 2], [2, 3], [3, 5], [4, 7], [5, 8], [6, 10], [7, 12]],
      formulaEn: 'W - H - W - W - H - W - W', formulaZh: 'W - H - W - W - H - W - W',
      solfege: ['do', 're', 'me', 'fa', 'sol', 'le', 'te', 'do']
    },
    harmonicMinor: {
      en: 'Harmonic Minor Scale', zh: '和聲小調',
      steps: [[0, 0], [1, 2], [2, 3], [3, 5], [4, 7], [5, 8], [6, 11], [7, 12]],
      formulaEn: 'W - H - W - W - H - A2(3) - H', formulaZh: 'W - H - W - W - H - A2(3半音) - H',
      solfege: ['do', 're', 'me', 'fa', 'sol', 'le', 'ti', 'do']
    },
    melodicMinorAsc: {
      en: 'Melodic Minor (Ascending)', zh: '旋律小調上行',
      steps: [[0, 0], [1, 2], [2, 3], [3, 5], [4, 7], [5, 9], [6, 11], [7, 12]],
      formulaEn: 'W - H - W - W - W - W - H (descends as natural minor)', formulaZh: 'W - H - W - W - W - W - H（下行還原自然小調）',
      solfege: ['do', 're', 'me', 'fa', 'sol', 'la', 'ti', 'do']
    },
    majorPentatonic: {
      en: 'Major Pentatonic (1-2-3-5-6)', zh: '大調五聲第一型 (1-2-3-5-6)',
      steps: [[0, 0], [1, 2], [2, 4], [4, 7], [5, 9], [7, 12]],
      formulaEn: 'W - W - m3 - W - m3 (no half steps)', formulaZh: 'W - W - m3 - W - m3（無半音）',
      solfege: ['do', 're', 'mi', 'sol', 'la', 'do']
    },
    majorPentatonicAlt: {
      en: 'Major Pentatonic II (1-2-4-5-6)', zh: '大調五聲第二型 (1-2-4-5-6)',
      steps: [[0, 0], [1, 2], [3, 5], [4, 7], [5, 9], [7, 12]],
      formulaEn: 'W - m3 - W - W - m3 (no half steps)', formulaZh: 'W - m3 - W - W - m3（無半音）',
      solfege: ['do', 're', 'fa', 'sol', 'la', 'do']
    },
    minorPentatonic: {
      en: 'Minor Pentatonic (1-♭3-4-5-♭7)', zh: '小調五聲無半音型',
      steps: [[0, 0], [2, 3], [3, 5], [4, 7], [6, 10], [7, 12]],
      formulaEn: 'm3 - W - W - m3 - W', formulaZh: 'm3 - W - W - m3 - W（無半音）',
      solfege: ['do', 'me', 'fa', 'sol', 'te', 'do']
    },
    japanesePentatonic: {
      en: 'Japanese Pentatonic ("Sakura" 1-2-♭3-5-♭6)', zh: '日本櫻花五聲音階 (含半音)',
      steps: [[0, 0], [1, 2], [2, 3], [4, 7], [5, 8], [7, 12]],
      formulaEn: 'W - H - M3 - H - M3 (2 half steps)', formulaZh: 'W - H - M3 - H - M3（含兩處半音）',
      solfege: ['do', 're', 'me', 'sol', 'le', 'do']
    },
    blues: {
      en: '6-Note Blues Scale', zh: '六音藍調音階',
      steps: [[0, 0], [2, 3], [3, 5], [4, 6], [4, 7], [6, 10], [7, 12]],
      formulaEn: '1 - ♭3 - 4 - ♭5 - 5 - ♭7 - (1)', formulaZh: '1 - ♭3 - 4 - ♭5 - 5 - ♭7 - (1)',
      solfege: ['1', '♭3', '4', '♭5', '5', '♭7', '1']
    },
    dorian: {
      en: 'Dorian Mode', zh: '多利安調式 (Dorian)',
      steps: [[0, 0], [1, 2], [2, 3], [3, 5], [4, 7], [5, 9], [6, 10], [7, 12]],
      formulaEn: 'W - H - W - W - W - H - W (natural minor ♯6)', formulaZh: 'W - H - W - W - W - H - W（小調 ♯6）',
      solfege: ['do', 're', 'me', 'fa', 'sol', 'la', 'te', 'do']
    },
    phrygian: {
      en: 'Phrygian Mode', zh: '弗里吉安調式 (Phrygian)',
      steps: [[0, 0], [1, 1], [2, 3], [3, 5], [4, 7], [5, 8], [6, 10], [7, 12]],
      formulaEn: 'H - W - W - W - H - W - W (natural minor ♭2)', formulaZh: 'H - W - W - W - H - W - W（小調 ♭2）',
      solfege: ['do', 'ra', 'me', 'fa', 'sol', 'le', 'te', 'do']
    },
    lydian: {
      en: 'Lydian Mode', zh: '利底亞調式 (Lydian)',
      steps: [[0, 0], [1, 2], [2, 4], [3, 6], [4, 7], [5, 9], [6, 11], [7, 12]],
      formulaEn: 'W - W - W - H - W - W - H (major ♯4)', formulaZh: 'W - W - W - H - W - W - H（大調 ♯4）',
      solfege: ['do', 're', 'mi', 'fi', 'sol', 'la', 'ti', 'do']
    },
    mixolydian: {
      en: 'Mixolydian Mode', zh: '混合利底亞調式 (Mixolydian)',
      steps: [[0, 0], [1, 2], [2, 4], [3, 5], [4, 7], [5, 9], [6, 10], [7, 12]],
      formulaEn: 'W - W - H - W - W - H - W (major ♭7)', formulaZh: 'W - W - H - W - W - H - W（大調 ♭7）',
      solfege: ['do', 're', 'mi', 'fa', 'sol', 'la', 'te', 'do']
    },
    locrian: {
      en: 'Locrian Mode', zh: '洛克里安調式 (Locrian)',
      steps: [[0, 0], [1, 1], [2, 3], [3, 5], [4, 6], [5, 8], [6, 10], [7, 12]],
      formulaEn: 'H - W - W - H - W - W - W (♭2, ♭5)', formulaZh: 'H - W - W - H - W - W - W（♭2, ♭5）',
      solfege: ['do', 'ra', 'me', 'fa', 'se', 'le', 'te', 'do']
    }
  };

  function buildScale(tonicStr, type) {
    const root = parsePitch(tonicStr.match(/\d/) ? tonicStr : tonicStr + '4');
    if (type === 'wholeTone') {
      const notes = [root];
      for (let i = 1; i <= 6; i++) {
        const midi = root.midi + i * 2;
        notes.push(i === 6 ? stepPitch(root, 7, 12) : midiToCleanPitch(midi));
      }
      return {
        label: t('Whole-Tone Scale', '全音音階'),
        formula: t('W - W - W - W - W - W (6 equal whole steps)', 'W - W - W - W - W - W（六音全為全音）'),
        solfege: ['do', 're', 'mi', 'fi', 'si', 'li', 'do'],
        notes
      };
    }
    if (type === 'octatonic') {
      const semis = [0, 2, 3, 5, 6, 8, 9, 11, 12];
      const notes = semis.map((s, idx) => idx === 8 ? stepPitch(root, 7, 12) : midiToCleanPitch(root.midi + s));
      return {
        label: t('Octatonic / Diminished Scale', '八音／減音階'),
        formula: t('W - H - W - H - W - H - W - H', 'W - H - W - H - W - H - W - H（全半交替）'),
        solfege: ['1', '2', '♭3', '4', '♭5', '♭6', '6', '7', '8'],
        notes
      };
    }
    const pat = SCALE_PATTERNS[type] || SCALE_PATTERNS.major;
    const notes = pat.steps.map(([dStep, semi]) => stepPitch(root, dStep, semi));
    return {
      label: t(pat.en, pat.zh),
      formula: t(pat.formulaEn, pat.formulaZh),
      solfege: pat.solfege,
      notes
    };
  }

  function midiToCleanPitch(midi, preferFlats) {
    const octave = Math.floor(midi / 12) - 1;
    const pc = ((midi % 12) + 12) % 12;
    const sharpNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    const name = (preferFlats ? flatNames : sharpNames)[pc];
    return parsePitch(name + octave);
  }

  const MAJOR_OR_PERFECT_SEMITONES = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 8: 12 };
  const PERFECT_CLASSES = new Set([1, 4, 5, 8]);

  function calcInterval(p1Str, p2Str) {
    const a = typeof p1Str === 'string' ? parsePitch(p1Str) : p1Str;
    const b = typeof p2Str === 'string' ? parsePitch(p2Str) : p2Str;
    const low = a.diatonicStep <= b.diatonicStep ? a : b;
    const high = a.diatonicStep <= b.diatonicStep ? b : a;
    const rawDiff = high.diatonicStep - low.diatonicStep;
    const size = rawDiff + 1;
    const isCompound = size > 8;
    const simpleSize = isCompound ? ((rawDiff % 7) + 1 === 1 ? 8 : (rawDiff % 7) + 1) : size;
    const octavesRemoved = isCompound ? Math.floor((size - 2) / 7) : 0;
    const semiDiff = (high.midi - low.midi) - octavesRemoved * 12;
    const refSemi = MAJOR_OR_PERFECT_SEMITONES[simpleSize];
    const delta = semiDiff - refSemi;
    let quality = '?';
    let qualityZh = t('Doubly altered', '重增/重減');
    if (PERFECT_CLASSES.has(simpleSize)) {
      if (delta === 0) { quality = 'P'; qualityZh = t('Perfect', '完全 (Perfect)'); }
      else if (delta === 1) { quality = 'A'; qualityZh = t('Augmented', '增 (Augmented)'); }
      else if (delta === -1 && size > 1) { quality = 'd'; qualityZh = t('Diminished', '減 (Diminished)'); }
      else if (delta > 1) { quality = 'AA'; }
      else { quality = 'dd'; }
    } else {
      if (delta === 0) { quality = 'M'; qualityZh = t('Major', '大 (Major)'); }
      else if (delta === -1) { quality = 'm'; qualityZh = t('Minor', '小 (Minor)'); }
      else if (delta === 1) { quality = 'A'; qualityZh = t('Augmented', '增 (Augmented)'); }
      else if (delta === -2) { quality = 'd'; qualityZh = t('Diminished', '減 (Diminished)'); }
    }
    const invertedSize = simpleSize <= 8 ? 9 - simpleSize : null;
    const invQualMap = { P: 'P', M: 'm', m: 'M', A: 'd', d: 'A' };
    const invertedCode = invertedSize ? (invQualMap[quality] || '?') + invertedSize : null;
    return {
      low, high, size, simpleSize, isCompound,
      semitones: high.midi - low.midi,
      quality, qualityZh,
      code: quality + size,
      simpleCode: quality + simpleSize,
      invertedCode
    };
  }

  function buildInterval(rootStr, size, quality) {
    const root = typeof rootStr === 'string' ? parsePitch(rootStr) : rootStr;
    const rawDiff = size - 1;
    const octaves = size > 8 ? Math.floor((size - 2) / 7) : 0;
    const simpleSize = size > 8 ? ((rawDiff % 7) + 1 === 1 ? 8 : (rawDiff % 7) + 1) : size;
    let semi = MAJOR_OR_PERFECT_SEMITONES[simpleSize] + octaves * 12;
    if (PERFECT_CLASSES.has(simpleSize)) {
      if (quality === 'A') semi += 1;
      else if (quality === 'd') semi -= 1;
    } else {
      if (quality === 'm') semi -= 1;
      else if (quality === 'A') semi += 1;
      else if (quality === 'd') semi -= 2;
    }
    return stepPitch(root, rawDiff, semi);
  }

  function buildTriad(rootStr, quality, inversion, openPos) {
    const root = typeof rootStr === 'string' ? parsePitch(rootStr) : rootStr;
    let thirdSemi = 4, fifthSemi = 7;
    if (quality === 'minor' || quality === 'm') { thirdSemi = 3; fifthSemi = 7; }
    else if (quality === 'augmented' || quality === 'A') { thirdSemi = 4; fifthSemi = 8; }
    else if (quality === 'diminished' || quality === 'd') { thirdSemi = 3; fifthSemi = 6; }
    const r = root;
    const trd = stepPitch(root, 2, thirdSemi);
    const f = stepPitch(root, 4, fifthSemi);
    let notes = [r, trd, f];
    if (inversion === 1) notes = [trd, f, stepPitch(r, 7, 12)];
    else if (inversion === 2) notes = [f, stepPitch(r, 7, 12), stepPitch(trd, 7, 12)];
    if (openPos) notes = [notes[0], notes[2], stepPitch(notes[1], 7, 12)];
    return notes;
  }

  function buildSeventh(rootStr, type, inversion) {
    const root = typeof rootStr === 'string' ? parsePitch(rootStr) : rootStr;
    const map = { Mm7: [4, 7, 10], MM7: [4, 7, 11], mm7: [3, 7, 10], hd7: [3, 6, 10], dd7: [3, 6, 9] };
    const [s3, s5, s7] = map[type] || map.Mm7;
    let notes = [root, stepPitch(root, 2, s3), stepPitch(root, 4, s5), stepPitch(root, 6, s7)];
    for (let i = 0; i < (inversion || 0); i++) {
      const lowest = notes.shift();
      notes.push(stepPitch(lowest, 7, 12));
    }
    return notes;
  }

  const CIRCLE_OF_FIFTHS = [
    { pos: 0, major: 'C', minor: 'a', accCount: 0, accType: 'none', labelMaj: 'C', labelMin: 'a', sigKey: 'C' },
    { pos: 1, major: 'G', minor: 'e', accCount: 1, accType: 'sharp', labelMaj: 'G', labelMin: 'e', sigKey: 'G' },
    { pos: 2, major: 'D', minor: 'b', accCount: 2, accType: 'sharp', labelMaj: 'D', labelMin: 'b', sigKey: 'D' },
    { pos: 3, major: 'A', minor: 'f#', accCount: 3, accType: 'sharp', labelMaj: 'A', labelMin: 'f♯', sigKey: 'A' },
    { pos: 4, major: 'E', minor: 'c#', accCount: 4, accType: 'sharp', labelMaj: 'E', labelMin: 'c♯', sigKey: 'E' },
    { pos: 5, major: 'B', minor: 'g#', accCount: 5, accType: 'sharp', labelMaj: 'B / C♭', labelMin: 'g♯ / a♭', sigKey: 'B', enhMaj: 'Cb', enhMin: 'ab', enhAcc: '7♭' },
    { pos: 6, major: 'F#', minor: 'd#', accCount: 6, accType: 'sharp', labelMaj: 'F♯ / G♭', labelMin: 'd♯ / e♭', sigKey: 'F#', enhMaj: 'Gb', enhMin: 'eb', enhAcc: '6♭' },
    { pos: 7, major: 'Db', minor: 'bb', accCount: 5, accType: 'flat', labelMaj: 'D♭ / C♯', labelMin: 'b♭ / a♯', sigKey: 'Db', enhMaj: 'C#', enhMin: 'a#', enhAcc: '7♯' },
    { pos: 8, major: 'Ab', minor: 'f', accCount: 4, accType: 'flat', labelMaj: 'A♭', labelMin: 'f', sigKey: 'Ab' },
    { pos: 9, major: 'Eb', minor: 'c', accCount: 3, accType: 'flat', labelMaj: 'E♭', labelMin: 'c', sigKey: 'Eb' },
    { pos: 10, major: 'Bb', minor: 'g', accCount: 2, accType: 'flat', labelMaj: 'B♭', labelMin: 'g', sigKey: 'Bb' },
    { pos: 11, major: 'F', minor: 'd', accCount: 1, accType: 'flat', labelMaj: 'F', labelMin: 'd', sigKey: 'F' }
  ];

  const STORAGE_KEY = 'duckworth11e_progress_v1';

  function getProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { completedPages: {}, quizScores: {} };
    } catch {
      return { completedPages: {}, quizScores: {} };
    }
  }

  function saveProgress(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('course-progress-updated', { detail: data }));
    } catch {}
  }

  function markPageCompleted(pageId, done) {
    const p = getProgress();
    if (done) p.completedPages[pageId] = true;
    else delete p.completedPages[pageId];
    saveProgress(p);
  }

  function recordQuizScore(quizId, pageId, correct, total) {
    const p = getProgress();
    p.quizScores[quizId] = { correct, total, updatedAt: Date.now() };
    if (pageId && correct >= Math.ceil(total * 0.7)) {
      p.completedPages[pageId] = true;
    }
    saveProgress(p);
  }

  window.CourseData = {
    COURSE_PAGES,
    CIRCLE_OF_FIFTHS,
    LETTERS,
    parsePitch,
    stepPitch,
    midiToCleanPitch,
    buildScale,
    calcInterval,
    buildInterval,
    buildTriad,
    buildSeventh,
    getProgress,
    markPageCompleted,
    recordQuizScore
  };
})();
