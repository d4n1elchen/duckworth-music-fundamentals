/* ==========================================================================
   audio-engine.js — Web Audio API Studio Synthesizer, Analyser & Sequencer
   Includes Real-Time AnalyserNode for Live Waveform/Spectrum Visualizers
   ========================================================================== */
(function () {
  'use strict';

  let ctx = null;
  let masterGain = null;
  let analyser = null;
  let currentTimbre = 'piano';
  let masterVolume = 0.78;
  let activeTimers = [];
  let activeNodes = new Set();

  // 12-Tone Chromatic Synesthesia Palette (Chrome Music Lab inspired)
  const PITCH_COLORS = [
    '#ef4444', // C  - Red
    '#f97316', // C# - Orange-Red
    '#f59e0b', // D  - Amber
    '#eab308', // D# - Gold
    '#84cc16', // E  - Lime
    '#10b981', // F  - Emerald
    '#06b6d4', // F# - Cyan
    '#3b82f6', // G  - Royal Blue
    '#6366f1', // G# - Indigo
    '#8b5cf6', // A  - Violet
    '#d946ef', // A# - Fuchsia
    '#ec4899'  // B  - Rose
  ];

  function pitchColor(pitchOrMidiOrFreq) {
    const f = resolveFreq(pitchOrMidiOrFreq);
    const midi = Math.round(69 + 12 * Math.log2(Math.max(20, f) / 440));
    const pc = ((midi % 12) + 12) % 12;
    return PITCH_COLORS[pc];
  }

  function ensureContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.value = masterVolume;

      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.82;

      masterGain.connect(analyser);
      analyser.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function getAnalyser() {
    return analyser;
  }

  function emitActivity(detail) {
    window.dispatchEvent(new CustomEvent('audio-activity', { detail }));
  }

  function setVolume(val) {
    masterVolume = Math.max(0, Math.min(1, Number(val)));
    if (masterGain && ctx) {
      masterGain.gain.setTargetAtTime(masterVolume, ctx.currentTime, 0.02);
    }
  }

  function setTimbre(timbre) {
    currentTimbre = timbre || 'piano';
  }

  function getTimbre() {
    return currentTimbre;
  }

  function stopAll() {
    for (const id of activeTimers) {
      clearTimeout(id);
      clearInterval(id);
    }
    activeTimers = [];
    for (const node of activeNodes) {
      try { node.stop(); } catch {}
    }
    activeNodes.clear();
  }

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function resolveFreq(pitchOrMidiOrFreq) {
    if (typeof pitchOrMidiOrFreq === 'number') {
      return pitchOrMidiOrFreq > 130 ? pitchOrMidiOrFreq : midiToFreq(pitchOrMidiOrFreq);
    }
    if (typeof pitchOrMidiOrFreq === 'object' && pitchOrMidiOrFreq !== null) {
      if (pitchOrMidiOrFreq.freq) return pitchOrMidiOrFreq.freq;
      if (pitchOrMidiOrFreq.midi !== undefined) return midiToFreq(pitchOrMidiOrFreq.midi);
    }
    if (window.CourseData) {
      const p = window.CourseData.parsePitch(String(pitchOrMidiOrFreq));
      if (p) return p.freq;
    }
    return 440;
  }

  function resolveLabel(pitchOrMidiOrFreq) {
    if (typeof pitchOrMidiOrFreq === 'string') return pitchOrMidiOrFreq.replace('#', '♯').replace(/([A-G])b/, '$1♭');
    if (typeof pitchOrMidiOrFreq === 'object' && pitchOrMidiOrFreq !== null) {
      return pitchOrMidiOrFreq.label || pitchOrMidiOrFreq.name || '♪';
    }
    if (typeof pitchOrMidiOrFreq === 'number') {
      if (pitchOrMidiOrFreq <= 130 && window.CourseData) {
        return window.CourseData.midiToCleanPitch(pitchOrMidiOrFreq).label;
      }
      return `${Math.round(pitchOrMidiOrFreq)} Hz`;
    }
    return '♪';
  }

  /* Synthesize a musical note with selectable instrumental timbre & optional pitch bend */
  function playNote(pitch, durationSec = 0.65, whenOffset = 0, opts = {}) {
    const audio = ensureContext();
    if (!audio) return;

    const freq = resolveFreq(pitch);
    const timbre = opts.timbre || currentTimbre;
    const velocity = opts.velocity !== undefined ? opts.velocity : 0.72;
    const t0 = audio.currentTime + Math.max(0, whenOffset);
    const dur = Math.max(0.06, durationSec);
    const color = pitchColor(freq);

    if (whenOffset <= 0.02 && !opts.silentHud) {
      emitActivity({ label: resolveLabel(pitch), freq, color, kind: 'note' });
    }

    const voiceGain = audio.createGain();
    voiceGain.connect(masterGain);

    const partials = {
      piano:    [{ mul: 1, amp: 0.68, type: 'triangle' }, { mul: 2, amp: 0.22, type: 'sine' }, { mul: 3, amp: 0.08, type: 'sine' }, { mul: 4, amp: 0.03, type: 'sine' }],
      flute:    [{ mul: 1, amp: 0.80, type: 'sine' }, { mul: 2, amp: 0.14, type: 'sine' }, { mul: 3, amp: 0.04, type: 'sine' }],
      clarinet: [{ mul: 1, amp: 0.62, type: 'sine' }, { mul: 3, amp: 0.28, type: 'sine' }, { mul: 5, amp: 0.12, type: 'sine' }],
      violin:   [{ mul: 1, amp: 0.45, type: 'sawtooth' }, { mul: 2, amp: 0.18, type: 'sine' }],
      guitar:   [{ mul: 1, amp: 0.55, type: 'triangle' }, { mul: 2, amp: 0.28, type: 'sine' }, { mul: 3, amp: 0.14, type: 'sine' }],
      organ:    [{ mul: 1, amp: 0.50, type: 'sine' }, { mul: 2, amp: 0.30, type: 'sine' }, { mul: 3, amp: 0.15, type: 'sine' }, { mul: 4, amp: 0.10, type: 'sine' }]
    }[timbre] || [{ mul: 1, amp: 0.75, type: 'triangle' }];

    const attack = opts.attack !== undefined ? opts.attack : (timbre === 'violin' ? 0.07 : timbre === 'flute' ? 0.045 : 0.01);
    const release = opts.release !== undefined ? opts.release : (timbre === 'organ' ? 0.08 : 0.18);
    const peak = 0.28 * velocity;

    voiceGain.gain.setValueAtTime(0.0001, t0);
    voiceGain.gain.linearRampToValueAtTime(peak, t0 + attack);

    if (timbre === 'piano' || timbre === 'guitar') {
      voiceGain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak * 0.32), t0 + dur);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
    } else {
      voiceGain.gain.setValueAtTime(peak * 0.85, t0 + Math.max(attack, dur - 0.03));
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
    }

    let filter = voiceGain;
    if (timbre === 'violin') {
      const lp = audio.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(Math.min(4200, freq * 5.5), t0);
      lp.connect(voiceGain);
      filter = lp;
    }

    const bendRatio = opts.bendSemitones ? Math.pow(2, opts.bendSemitones / 12) : 1;

    for (const p of partials) {
      if (freq * p.mul > 14000) continue;
      const osc = audio.createOscillator();
      const pGain = audio.createGain();
      osc.type = p.type;
      if (bendRatio !== 1) {
        osc.frequency.setValueAtTime(freq * p.mul * bendRatio, t0);
        osc.frequency.exponentialRampToValueAtTime(freq * p.mul, t0 + Math.min(0.22, dur * 0.5));
      } else {
        osc.frequency.setValueAtTime(freq * p.mul, t0);
      }
      pGain.gain.setValueAtTime(p.amp, t0);
      osc.connect(pGain);
      pGain.connect(filter);
      osc.start(t0);
      osc.stop(t0 + dur + release + 0.05);
      activeNodes.add(osc);
      osc.onended = () => activeNodes.delete(osc);
    }
  }

  function playChord(pitches, durationSec = 1.0, whenOffset = 0, opts = {}) {
    if (!Array.isArray(pitches) || !pitches.length) return;
    const strumGap = opts.strum ? 0.038 : 0;
    const vel = (opts.velocity !== undefined ? opts.velocity : 0.72) / Math.sqrt(Math.max(1, pitches.length * 0.6));
    const names = pitches.map(p => resolveLabel(p)).slice(0, 4).join('·');
    emitActivity({ label: names, freq: resolveFreq(pitches[0]), color: pitchColor(pitches[0]), kind: 'chord' });
    pitches.forEach((p, idx) => {
      playNote(p, durationSec, whenOffset + idx * strumGap, { ...opts, velocity: vel, silentHud: true });
    });
  }

  /* Percussion & Metronome Voices */
  function playPercussion(kind = 'click', accent = false, whenOffset = 0) {
    const audio = ensureContext();
    if (!audio) return;
    const t0 = audio.currentTime + Math.max(0, whenOffset);
    const g = audio.createGain();
    g.connect(masterGain);

    emitActivity({
      label: accent ? '⚡ 重拍' : '● 節拍',
      freq: accent ? 880 : 440,
      color: accent ? '#f59e0b' : '#38bdf8',
      kind: 'perc'
    });

    if (kind === 'kick') {
      const osc = audio.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(accent ? 155 : 125, t0);
      osc.frequency.exponentialRampToValueAtTime(42, t0 + 0.14);
      g.gain.setValueAtTime(accent ? 0.58 : 0.40, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.19);
      osc.connect(g);
      osc.start(t0);
      osc.stop(t0 + 0.21);
      return;
    }

    if (kind === 'snare' || kind === 'hihat') {
      const bufSize = Math.floor(audio.sampleRate * (kind === 'snare' ? 0.14 : 0.06));
      const buf = audio.createBuffer(1, bufSize, audio.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = audio.createBufferSource();
      noise.buffer = buf;
      const filter = audio.createBiquadFilter();
      filter.type = kind === 'snare' ? 'bandpass' : 'highpass';
      filter.frequency.setValueAtTime(kind === 'snare' ? 1800 : 6500, t0);
      g.gain.setValueAtTime(accent ? 0.36 : 0.22, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + (kind === 'snare' ? 0.14 : 0.06));
      noise.connect(filter);
      filter.connect(g);
      noise.start(t0);
      return;
    }

    const osc = audio.createOscillator();
    osc.type = 'triangle';
    const baseF = kind === 'clave' ? (accent ? 1450 : 1180) : (accent ? 1050 : 760);
    osc.frequency.setValueAtTime(baseF, t0);
    g.gain.setValueAtTime(accent ? 0.40 : 0.24, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.065);
    osc.connect(g);
    osc.start(t0);
    osc.stop(t0 + 0.08);
  }

  /* Additive Harmonic Series Player (Appendix I & J) */
  function playHarmonicPartials(fundamentalHz, partialWeights, durationSec = 1.6) {
    const audio = ensureContext();
    if (!audio) return;
    const t0 = audio.currentTime;
    const g = audio.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.28, t0 + 0.04);
    g.gain.setValueAtTime(0.24, t0 + durationSec - 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + durationSec);
    g.connect(masterGain);

    emitActivity({ label: `泛音合成 ${Math.round(fundamentalHz)}Hz`, freq: fundamentalHz, color: '#a855f7', kind: 'harmonic' });

    partialWeights.forEach((amp, idx) => {
      if (amp <= 0.001) return;
      const n = idx + 1;
      const f = fundamentalHz * n;
      if (f > 16000) return;
      const osc = audio.createOscillator();
      const pg = audio.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t0);
      pg.gain.setValueAtTime(amp / Math.max(1, partialWeights.reduce((a, b) => a + b, 0)), t0);
      osc.connect(pg);
      pg.connect(g);
      osc.start(t0);
      osc.stop(t0 + durationSec + 0.05);
      activeNodes.add(osc);
      osc.onended = () => activeNodes.delete(osc);
    });
  }

  function playSequence(events, bpm = 100, callbacks = {}) {
    stopAll();
    ensureContext();
    const secPerBeat = 60 / Math.max(30, bpm);
    let cursorBeats = 0;

    events.forEach((ev, idx) => {
      const startMs = cursorBeats * secPerBeat * 1000;
      const durSec = (ev.beats || 1) * secPerBeat;
      const timerId = setTimeout(() => {
        if (callbacks.onStep) callbacks.onStep(ev, idx);
        if (!ev.rest) {
          if (ev.perc) {
            playPercussion(ev.perc, !!ev.accent, 0);
          } else if (Array.isArray(ev.notes)) {
            playChord(ev.notes, durSec * 0.92, 0, ev.opts || {});
          } else if (ev.pitch || ev.notes) {
            playNote(ev.pitch || ev.notes, durSec * 0.92, 0, ev.opts || {});
          }
        }
      }, startMs);
      activeTimers.push(timerId);
      if (!ev.simultaneous) {
        cursorBeats += (ev.beats || 1);
      }
    });

    const endId = setTimeout(() => {
      if (callbacks.onDone) callbacks.onDone();
    }, cursorBeats * secPerBeat * 1000 + 80);
    activeTimers.push(endId);
  }

  window.AudioEngine = {
    PITCH_COLORS,
    pitchColor,
    ensureContext,
    getAnalyser,
    setVolume,
    setTimbre,
    getTimbre,
    stopAll,
    playNote,
    playChord,
    playPercussion,
    playHarmonicPartials,
    playSequence,
    resolveFreq
  };
})();
