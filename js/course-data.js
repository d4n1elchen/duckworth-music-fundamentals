/* ==========================================================================
   course-data.js — Full Textbook Syllabus & Enharmonic Music Theory Engine
   Based on William Duckworth, A Creative Approach to Music Fundamentals, 11e
   ========================================================================== */
(function () {
  'use strict';

  const COURSE_PAGES = [
    { id: 'home', num: '總覽', file: 'index.html', group: '導讀與基礎', title: '課程總覽與學習儀表板', en: 'Course Hub & Progress' },
    { id: 'intro', num: 'Intro', file: 'intro.html', group: '導讀與基礎', title: '導論：音樂的本質與練習之道', en: 'Introduction: Sound, Elements & Practice' },
    { id: 'ch01', num: 'Ch 1', file: 'ch01-basics.html', group: '導讀與基礎', title: '第 1 章：音樂基礎（節奏與五線譜）', en: 'The Basics of Music' },
    { id: 'ch02', num: 'Ch 2', file: 'ch02-keyboard.html', group: '導讀與基礎', title: '第 2 章：鍵盤基礎 ＋ 技能檢定 1', en: 'The Keyboard & Focus on Skills 1' },

    { id: 'ch03', num: 'Ch 3', file: 'ch03-simple-meter.html', group: '節奏與音高系統', title: '第 3 章：節奏（一）單拍子', en: 'Rhythm I: Simple Meter' },
    { id: 'ch04', num: 'Ch 4', file: 'ch04-compound-meter.html', group: '節奏與音高系統', title: '第 4 章：節奏（二）複拍子 ＋ 檢定 2', en: 'Rhythm II: Compound Meter & Focus 2' },
    { id: 'ch05', num: 'Ch 5', file: 'ch05-pitch.html', group: '節奏與音高系統', title: '第 5 章：音高進階與樂譜地圖 ＋ 檢定 3', en: 'Pitch, Dynamics, Musical Map & Focus 3' },

    { id: 'ch06', num: 'Ch 6', file: 'ch06-major-scales.html', group: '大調、調號與音程', title: '第 6 章：大調音階與視唱練耳', en: 'Major Scales, Scale Degrees & Ear Training' },
    { id: 'ch07', num: 'Ch 7', file: 'ch07-major-keys.html', group: '大調、調號與音程', title: '第 7 章：大調調號與五度圈 ＋ 檢定 4', en: 'Major Key Signatures & Focus 4' },
    { id: 'ch08', num: 'Ch 8', file: 'ch08-intervals.html', group: '大調、調號與音程', title: '第 8 章：音程識別與轉位 ＋ 檢定 5', en: 'Intervals, Compound & Inversion & Focus 5' },

    { id: 'ch09', num: 'Ch 9', file: 'ch09-minor-keys.html', group: '小調、五聲與藍調', title: '第 9 章：小調調號（關係調與平行調）', en: 'Minor Key Signatures' },
    { id: 'ch10', num: 'Ch 10', file: 'ch10-minor-scales.html', group: '小調、五聲與藍調', title: '第 10 章：小調音階的三種形式', en: 'Minor Scales (Natural, Harmonic, Melodic)' },
    { id: 'ch11', num: 'Ch 11', file: 'ch11-pentatonic-blues.html', group: '小調、五聲與藍調', title: '第 11 章：五聲音階與藍調音階 ＋ 檢定 6', en: 'Pentatonic & Blues Scales & Focus 6' },

    { id: 'ch12', num: 'Ch 12', file: 'ch12-triads.html', group: '和弦、進行與歌曲創作', title: '第 12 章：三和弦結構與轉位', en: 'Triads, Positions & Inversions' },
    { id: 'ch13', num: 'Ch 13', file: 'ch13-triads-context.html', group: '和弦、進行與歌曲創作', title: '第 13 章：音樂脈絡中的和弦與七和弦', en: 'Triads in Context, Tablature & V7' },
    { id: 'ch14', num: 'Ch 14', file: 'ch14-progressions.html', group: '和弦、進行與歌曲創作', title: '第 14 章：和弦進行、終止式與藍調 ＋ 檢定 7', en: 'Chord Progressions, Cadences & Focus 7' },
    { id: 'ch15', num: 'Ch 15', file: 'ch15-songwriting.html', group: '和弦、進行與歌曲創作', title: '第 15 章：歌曲創作、配和聲與四大曲式', en: 'Writing a Song, Harmonizing & Form' },

    { id: 'app-ae', num: 'App A–E', file: 'appendices-rhythm-melody.html', group: '附錄實練室與總辭典', title: '附錄 A–E：節奏合奏、視唱與鍵盤指法', en: 'Appendices A–E: Rhythms, Solfège & Fingerings' },
    { id: 'app-fk', num: 'App F–K', file: 'appendices-modes-timbre.html', group: '附錄實練室與總辭典', title: '附錄 F–K：C 譜號、調式、泛音聲學與吉他', en: 'Appendices F–K: C Clef, Modes, Acoustics & Guitar' },
    { id: 'glossary', num: '辭典', file: 'glossary.html', group: '附錄實練室與總辭典', title: '音樂術語總辭典與經典曲目索引', en: 'Glossary & Index to Musical Examples' }
  ];

  /* Enharmonic-exact Music Theory Engine */
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
    else alter = 0;
    const explicitNatural = (acc === 'n' || acc === '♮');
    const diatonicStep = octave * 7 + LETTERS.indexOf(letter); // C4 = 28
    const midi = (octave + 1) * 12 + BASE_SEMITONES[letter] + alter; // C4 = 60
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    return {
      letter,
      alter,
      explicitNatural,
      octave,
      diatonicStep,
      midi,
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
      label: '大調音階 (Major)',
      steps: [
        [0, 0], [1, 2], [2, 4], [3, 5], [4, 7], [5, 9], [6, 11], [7, 12]
      ],
      formula: 'W - W - H - W - W - W - H',
      solfege: ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti', 'do']
    },
    naturalMinor: {
      label: '自然小調 (Natural Minor)',
      steps: [
        [0, 0], [1, 2], [2, 3], [3, 5], [4, 7], [5, 8], [6, 10], [7, 12]
      ],
      formula: 'W - H - W - W - H - W - W',
      solfege: ['do', 're', 'me', 'fa', 'sol', 'le', 'te', 'do']
    },
    harmonicMinor: {
      label: '和聲小調 (Harmonic Minor)',
      steps: [
        [0, 0], [1, 2], [2, 3], [3, 5], [4, 7], [5, 8], [6, 11], [7, 12]
      ],
      formula: 'W - H - W - W - H - A2(3半音) - H',
      solfege: ['do', 're', 'me', 'fa', 'sol', 'le', 'ti', 'do']
    },
    melodicMinorAsc: {
      label: '旋律小調上行 (Melodic Minor Ascending)',
      steps: [
        [0, 0], [1, 2], [2, 3], [3, 5], [4, 7], [5, 9], [6, 11], [7, 12]
      ],
      formula: 'W - H - W - W - W - W - H（下行還原為自然小調）',
      solfege: ['do', 're', 'me', 'fa', 'sol', 'la', 'ti', 'do']
    },
    majorPentatonic: {
      label: '大調五聲音階 (Major Pentatonic 1-2-3-5-6)',
      steps: [
        [0, 0], [1, 2], [2, 4], [4, 7], [5, 9], [7, 12]
      ],
      formula: 'W - W - m3 - W - m3（無半音）',
      solfege: ['do', 're', 'mi', 'sol', 'la', 'do']
    },
    majorPentatonicAlt: {
      label: '大調五聲音階第二型 (1-2-4-5-6)',
      steps: [
        [0, 0], [1, 2], [3, 5], [4, 7], [5, 9], [7, 12]
      ],
      formula: 'W - m3 - W - W - m3（無半音）',
      solfege: ['do', 're', 'fa', 'sol', 'la', 'do']
    },
    minorPentatonic: {
      label: '小調五聲音階 (Minor Pentatonic 1-♭3-4-5-♭7)',
      steps: [
        [0, 0], [2, 3], [3, 5], [4, 7], [6, 10], [7, 12]
      ],
      formula: 'm3 - W - W - m3 - W（無半音）',
      solfege: ['do', 'me', 'fa', 'sol', 'te', 'do']
    },
    japanesePentatonic: {
      label: '含半音小調五聲音階（日本都節《櫻花》型 1-2-♭3-5-♭6）',
      steps: [
        [0, 0], [1, 2], [2, 3], [4, 7], [5, 8], [7, 12]
      ],
      formula: 'W - H - M3 - H - M3（含兩個半音與兩個大三度）',
      solfege: ['do', 're', 'me', 'sol', 'le', 'do']
    },
    blues: {
      label: '六音藍調音階 (6-Note Blues Scale)',
      steps: [
        [0, 0], [2, 3], [3, 5], [4, 6], [4, 7], [6, 10], [7, 12]
      ],
      formula: '1 - ♭3 - 4 - ♭5 - 5 - ♭7 - (1)',
      solfege: ['1', '♭3', '4', '♭5', '5', '♭7', '1']
    },
    dorian: {
      label: '多利安調式 (Dorian Mode)',
      steps: [[0, 0], [1, 2], [2, 3], [3, 5], [4, 7], [5, 9], [6, 10], [7, 12]],
      formula: 'W - H - W - W - W - H - W（自然小調升第 6 級）',
      solfege: ['do', 're', 'me', 'fa', 'sol', 'la', 'te', 'do']
    },
    phrygian: {
      label: '弗里吉安調式 (Phrygian Mode)',
      steps: [[0, 0], [1, 1], [2, 3], [3, 5], [4, 7], [5, 8], [6, 10], [7, 12]],
      formula: 'H - W - W - W - H - W - W（自然小調降第 2 級）',
      solfege: ['do', 'ra', 'me', 'fa', 'sol', 'le', 'te', 'do']
    },
    lydian: {
      label: '利底亞調式 (Lydian Mode)',
      steps: [[0, 0], [1, 2], [2, 4], [3, 6], [4, 7], [5, 9], [6, 11], [7, 12]],
      formula: 'W - W - W - H - W - W - H（大調升第 4 級）',
      solfege: ['do', 're', 'mi', 'fi', 'sol', 'la', 'ti', 'do']
    },
    mixolydian: {
      label: '混合利底亞調式 (Mixolydian Mode)',
      steps: [[0, 0], [1, 2], [2, 4], [3, 5], [4, 7], [5, 9], [6, 10], [7, 12]],
      formula: 'W - W - H - W - W - H - W（大調降第 7 級）',
      solfege: ['do', 're', 'mi', 'fa', 'sol', 'la', 'te', 'do']
    },
    locrian: {
      label: '洛克里安調式 (Locrian Mode)',
      steps: [[0, 0], [1, 1], [2, 3], [3, 5], [4, 6], [5, 8], [6, 10], [7, 12]],
      formula: 'H - W - W - H - W - W - W（半音於 1–2 與 4–5）',
      solfege: ['do', 'ra', 'me', 'fa', 'se', 'le', 'te', 'do']
    }
  };

  function buildScale(tonicStr, type) {
    const root = parsePitch(tonicStr.match(/\d/) ? tonicStr : tonicStr + '4');
    if (type === 'wholeTone') {
      const notes = [root];
      for (let i = 1; i <= 6; i++) {
        const midi = root.midi + i * 2;
        const step = i === 6 ? 7 : i;
        notes.push(i === 6 ? stepPitch(root, 7, 12) : midiToCleanPitch(midi));
      }
      return {
        label: '全音音階 (Whole-Tone Scale)',
        formula: 'W - W - W - W - W - W（六音皆相差全音，無完全四/五度）',
        solfege: ['do', 're', 'mi', 'fi', 'si', 'li', 'do'],
        notes
      };
    }
    if (type === 'octatonic') {
      const semis = [0, 2, 3, 5, 6, 8, 9, 11, 12];
      const notes = semis.map((s, idx) => idx === 8 ? stepPitch(root, 7, 12) : midiToCleanPitch(root.midi + s));
      return {
        label: '八音音階 / 減音階 (Octatonic / Diminished Scale)',
        formula: 'W - H - W - H - W - H - W - H（全音與半音交替）',
        solfege: ['1', '2', '♭3', '4', '♭5', '♭6', '6', '7', '8'],
        notes
      };
    }
    const pat = SCALE_PATTERNS[type] || SCALE_PATTERNS.major;
    const notes = pat.steps.map(([dStep, semi]) => stepPitch(root, dStep, semi));
    return {
      label: pat.label,
      formula: pat.formula,
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

  /* Interval Calculation & Construction */
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
    let qualityZh = '重增/重減';
    if (PERFECT_CLASSES.has(simpleSize)) {
      if (delta === 0) { quality = 'P'; qualityZh = '完全 (Perfect)'; }
      else if (delta === 1) { quality = 'A'; qualityZh = '增 (Augmented)'; }
      else if (delta === -1 && size > 1) { quality = 'd'; qualityZh = '減 (Diminished)'; }
      else if (delta > 1) { quality = 'AA'; qualityZh = '倍增'; }
      else { quality = 'dd'; qualityZh = '倍減'; }
    } else {
      if (delta === 0) { quality = 'M'; qualityZh = '大 (Major)'; }
      else if (delta === -1) { quality = 'm'; qualityZh = '小 (Minor)'; }
      else if (delta === 1) { quality = 'A'; qualityZh = '增 (Augmented)'; }
      else if (delta === -2) { quality = 'd'; qualityZh = '減 (Diminished)'; }
    }
    const invertedSize = simpleSize <= 8 ? 9 - simpleSize : null;
    const invQualMap = { P: 'P', M: 'm', m: 'M', A: 'd', d: 'A' };
    const invertedCode = invertedSize ? (invQualMap[quality] || '?') + invertedSize : null;
    return {
      low,
      high,
      size,
      simpleSize,
      isCompound,
      semitones: high.midi - low.midi,
      quality,
      qualityZh,
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
    let r = root;
    let t = stepPitch(root, 2, thirdSemi);
    let f = stepPitch(root, 4, fifthSemi);
    let notes = [r, t, f];
    if (inversion === 1) {
      notes = [t, f, stepPitch(r, 7, 12)];
    } else if (inversion === 2) {
      notes = [f, stepPitch(r, 7, 12), stepPitch(t, 7, 12)];
    }
    if (openPos) {
      // Open position skips one chord tone between adjacent voices
      notes = [notes[0], notes[2], stepPitch(notes[1], 7, 12)];
    }
    return notes;
  }

  function buildSeventh(rootStr, type, inversion) {
    const root = typeof rootStr === 'string' ? parsePitch(rootStr) : rootStr;
    const map = {
      Mm7: [4, 7, 10], // Dominant 7th
      MM7: [4, 7, 11], // Major 7th
      mm7: [3, 7, 10], // Minor 7th
      hd7: [3, 6, 10], // Half-diminished ø7
      dd7: [3, 6, 9]   // Fully diminished o7
    };
    const [s3, s5, s7] = map[type] || map.Mm7;
    const r = root;
    const t = stepPitch(root, 2, s3);
    const f = stepPitch(root, 4, s5);
    const sev = stepPitch(root, 6, s7);
    let notes = [r, t, f, sev];
    for (let i = 0; i < (inversion || 0); i++) {
      const lowest = notes.shift();
      notes.push(stepPitch(lowest, 7, 12));
    }
    return notes;
  }

  /* Circle of Fifths Data (12 clock positions, including Enharmonic equivalents at 5, 6, 7 o'clock) */
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

  /* Progress Persistence Manager */
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
