// lib/serenityAudio.ts
// Synthesized ambient soundscapes for the Serenity player (Web Audio API).
// IMPORTANT: call play() directly inside a click handler so browsers allow audio.

export type TrackId = 't-1' | 't-2' | 't-3' | 't-4' | 't-5';

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

export class SerenityEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null; // user volume
  private bus: GainNode | null = null; // per-track fade in/out
  private nodes: AudioNode[] = [];
  private timers: number[] = [];
  private session = 0;
  private volume: number;

  constructor(initialVolume = 0.7) {
    this.volume = initialVolume;
  }

  // ---------- public API ----------

  /** Must be called synchronously from a click/tap handler. */
  async play(id: TrackId) {
    const ctx = this.ensureContext(); // created inside the user gesture
    if (!ctx || !this.master) return;

    this.stop();
    const token = this.session;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    if (token !== this.session) return; // user paused/changed track while resuming

    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, ctx.currentTime);
    bus.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.5);
    bus.connect(this.master);
    this.bus = bus;

    switch (id) {
      case 't-1':
        this.wind();
        break;
      case 't-2':
        this.stream();
        break;
      case 't-3':
        this.pad();
        break;
      case 't-4':
        this.piano();
        break;
      case 't-5':
        this.rain();
        break;
    }
  }

  stop() {
    this.session++;
    this.timers.forEach((t) => window.clearInterval(t));
    this.timers = [];

    const ctx = this.ctx;
    const bus = this.bus;
    const nodes = this.nodes;
    this.bus = null;
    this.nodes = [];

    const cleanup = () => {
      nodes.forEach((n) => {
        try {
          (n as AudioScheduledSourceNode).stop?.();
        } catch {
          /* already stopped */
        }
        try {
          n.disconnect();
        } catch {
          /* ignore */
        }
      });
      try {
        bus?.disconnect();
      } catch {
        /* ignore */
      }
    };

    if (!ctx || !bus) {
      cleanup();
      return;
    }
    // short fade-out to avoid a pop
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
    window.setTimeout(cleanup, 300);
  }

  /** v is 0..1 */
  setVolume(v: number) {
    this.volume = v;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    }
  }

  dispose() {
    this.stop();
    const ctx = this.ctx;
    this.ctx = null;
    this.master = null;
    if (ctx) {
      window.setTimeout(() => {
        ctx.close().catch(() => {});
      }, 350);
    }
  }

  // ---------- helpers ----------

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private keep<T extends AudioNode>(n: T): T {
    this.nodes.push(n);
    return n;
  }

  private noise(kind: 'white' | 'pink') {
    const ctx = this.ctx!;
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let peak = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'white') {
        d[i] = w;
      } else {
        b0 = 0.99765 * b0 + w * 0.099046;
        b1 = 0.963 * b1 + w * 0.2965164;
        b2 = 0.57 * b2 + w * 1.0526913;
        d[i] = b0 + b1 + b2 + w * 0.1848;
      }
      peak = Math.max(peak, Math.abs(d[i]));
    }
    for (let i = 0; i < len; i++) d[i] = (d[i] / peak) * 0.6; // normalize

    const src = this.keep(ctx.createBufferSource());
    src.buffer = buf;
    src.loop = true;
    src.start();
    return src;
  }

  private lfo(freq: number, depth: number, target: AudioParam) {
    const ctx = this.ctx!;
    const o = this.keep(ctx.createOscillator());
    const g = this.keep(ctx.createGain());
    o.frequency.value = freq;
    g.gain.value = depth;
    o.connect(g);
    g.connect(target);
    o.start();
  }

  /** src -> fx... -> bus */
  private chain(src: AudioNode, ...fx: AudioNode[]) {
    let last = src;
    fx.forEach((n) => {
      this.keep(n);
      last.connect(n);
      last = n;
    });
    last.connect(this.bus!);
  }

  /** One-shot note with a soft attack and exponential decay. */
  private tone(
    freq: number,
    dur: number,
    peak: number,
    type: OscillatorType = 'sine',
    dest?: AudioNode
  ) {
    const ctx = this.ctx;
    const target = dest ?? this.bus;
    if (!ctx || !target) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(target);
    o.start(t);
    o.stop(t + dur + 0.1);
  }

  /** Soft echo to fake reverb. Returns the input node. */
  private echo() {
    const ctx = this.ctx!;
    const input = this.keep(ctx.createGain());
    const delay = this.keep(ctx.createDelay(1));
    delay.delayTime.value = 0.28;
    const fb = this.keep(ctx.createGain());
    fb.gain.value = 0.4;
    const lp = this.keep(ctx.createBiquadFilter());
    lp.type = 'lowpass';
    lp.frequency.value = 2500;

    input.connect(this.bus!);
    input.connect(delay);
    delay.connect(lp);
    lp.connect(fb);
    fb.connect(delay);
    lp.connect(this.bus!);
    return input;
  }

  // ---------- tracks ----------

  // t-1 Harmonious Wind: warm swept pink noise + low chord
  private wind() {
    const ctx = this.ctx!;
    const n = this.noise('pink');
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    const g = ctx.createGain();
    g.gain.value = 0.9;
    this.chain(n, lp, g);
    this.lfo(0.08, 250, lp.frequency);

    [45, 52, 57, 64].forEach((m) => {
      const o = this.keep(ctx.createOscillator());
      o.type = 'sine';
      o.frequency.value = midi(m);
      const og = this.keep(ctx.createGain());
      og.gain.value = 0.08;
      o.connect(og);
      og.connect(this.bus!);
      o.start();
    });
  }

  // t-2 Silent Streams: babbling water + pentatonic chimes
  private stream() {
    const ctx = this.ctx!;
    const n = this.noise('pink');
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1100;
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.value = 1.1;
    this.chain(n, bp, g);
    this.lfo(3.1, 350, bp.frequency);
    this.lfo(0.7, 0.25, g.gain);

    const scale = [72, 74, 76, 79, 81]; // C major pentatonic
    const rev = this.echo();
    this.timers.push(
      window.setInterval(() => {
        this.tone(midi(scale[Math.floor(Math.random() * scale.length)]), 2.5, 0.12, 'sine', rev);
      }, 2200)
    );
  }

  // t-3 Celestial Calm: lush pad progression + shimmer
  private pad() {
    const ctx = this.ctx!;
    const lp = this.keep(ctx.createBiquadFilter());
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    lp.connect(this.bus!);

    const chords = [
      [57, 60, 64], // Am
      [53, 57, 60], // F
      [55, 59, 62], // G
      [52, 55, 59], // Em
    ];
    let i = 0;
    const playChord = () => {
      const t = ctx.currentTime;
      chords[i++ % chords.length].forEach((m) => {
        [-6, 6].forEach((det) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'triangle';
          o.frequency.value = midi(m);
          o.detune.value = det;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.06, t + 3);
          g.gain.linearRampToValueAtTime(0.0001, t + 8);
          o.connect(g);
          g.connect(lp);
          o.start(t);
          o.stop(t + 8.2);
        });
      });
      this.tone(midi(93 + Math.floor(Math.random() * 3)), 4, 0.03); // shimmer
    };
    playChord();
    this.timers.push(window.setInterval(playChord, 6000));
  }

  // t-4 Piano Instrument: gentle lullaby melody
  private piano() {
    const rev = this.echo();
    const melody = [72, 76, 79, 76, 74, 77, 81, 77, 71, 74, 79, 74, 72, 76, 79, 84];
    let i = 0;
    const next = () => {
      const m = melody[i++ % melody.length];
      this.tone(midi(m), 2.2, 0.22, 'triangle', rev);
      this.tone(midi(m) * 2, 1.2, 0.05, 'sine', rev);
      if (i % 4 === 1) this.tone(midi(m - 24), 3, 0.18, 'sine', rev); // bass note
    };
    next();
    this.timers.push(window.setInterval(next, 900));
  }

  // t-5 Peaceful Rain: patter + low warm drone
  private rain() {
    const ctx = this.ctx!;
    const n = this.noise('white');
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.value = 0.55;
    this.chain(n, hp, lp, g);

    const drone = this.keep(ctx.createOscillator());
    drone.type = 'sine';
    drone.frequency.value = 55;
    const dg = this.keep(ctx.createGain());
    dg.gain.value = 0.07;
    drone.connect(dg);
    dg.connect(this.bus!);
    drone.start();

    this.timers.push(
      window.setInterval(() => {
        if (Math.random() > 0.6) this.tone(1500 + Math.random() * 2500, 0.08, 0.05, 'sine');
      }, 180)
    );
  }
}