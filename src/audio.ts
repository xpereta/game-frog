import type { BugSpecies } from "./bugs";

const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0];

const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

interface SpeciesJingle {
  roots: number[];
  notes: [number, number];
}

const SPECIES_JINGLE: Record<BugSpecies, SpeciesJingle> = {
  fly: { roots: [1, 2], notes: [4, 6] },
  ladybug: { roots: [1], notes: [3, 4] },
  bee: { roots: [2, 3], notes: [5, 7] },
};

export class Sound {
  private ctx: AudioContext | null = null;
  private silentLoop: HTMLAudioElement | null = null;

  private createCtx(): AudioContext | null {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    ctx.onstatechange = () => {
      if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    };
    return ctx;
  }

  private ensureCtx(): AudioContext | null {
    if (!this.ctx) this.ctx = this.createCtx();
    return this.ctx;
  }

  /** Called from a user gesture. Returns a context that can play, recreating it
   *  if iOS left the previous one stuck (state stays "suspended" or the non-
   *  standard "interrupted" after `resume()`, an iOS 18+ quirk). */
  private ensureRunning(): AudioContext | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    if (ctx.state === "running") {
      this.prime(ctx);
      return ctx;
    }
    void ctx.resume().catch(() => {});
    this.prime(ctx);
    if (ctx.state === "interrupted") {
      this.recreate(ctx);
    } else {
      window.setTimeout(() => {
        if (this.ctx === ctx && ctx.state !== "running") this.recreate(ctx);
      }, 150);
    }
    return ctx;
  }

  /** Discard a context iOS has left stuck; a fresh one is created and resumed
   *  on the next user gesture. */
  private recreate(stale: AudioContext) {
    if (this.ctx !== stale) return;
    this.ctx = null;
    try {
      void stale.close().catch(() => {});
    } catch {
      /* ignore */
    }
    console.debug("[audio] recreated stuck context");
  }

  /** Call from a user gesture. Resumes and primes the context (required on iOS). */
  unlock() {
    const ctx = this.ensureRunning();
    if (!ctx) return;
    console.debug("[audio] unlock state:", ctx.state);
    this.enableIOSSession();
  }

  /** iOS ringer/mute switch silences WebAudio. Request a playback media session
   *  (Safari iOS 17+) and loop a silent <audio> element to keep the session alive. */
  private enableIOSSession() {
    try {
      const audioSession = (navigator as unknown as { audioSession?: { type?: string } }).audioSession;
      if (audioSession) audioSession.type = "playback";
    } catch {
      /* ignore */
    }
    if (this.silentLoop) return;
    try {
      const loop = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=");
      loop.loop = true;
      void loop.play().catch(() => {});
      this.silentLoop = loop;
    } catch {
      /* ignore */
    }
  }

  /** iOS keeps a fresh context "suspended" until audio actually plays in the gesture.
   *  A silent one-sample buffer forces the output to start. */
  private prime(ctx: AudioContext) {
    try {
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch {
      /* ignore — some browsers don't allow priming */
    }
  }

  playLunge() {
    const ctx = this.ensureRunning();
    if (!ctx) return;
    const t = ctx.currentTime + 0.01;

    const swoosh = ctx.createOscillator();
    const swooshGain = ctx.createGain();
    swoosh.type = "triangle";
    swoosh.frequency.setValueAtTime(200, t);
    swoosh.frequency.exponentialRampToValueAtTime(1000, t + 0.5);
    swooshGain.gain.setValueAtTime(0.0001, t);
    swooshGain.gain.exponentialRampToValueAtTime(0.26, t + 0.04);
    swooshGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.98);
    swoosh.connect(swooshGain).connect(ctx.destination);
    swoosh.start(t);
    swoosh.stop(t + 1.0);

    const pop = ctx.createOscillator();
    const popGain = ctx.createGain();
    pop.type = "sine";
    pop.frequency.setValueAtTime(150, t);
    pop.frequency.exponentialRampToValueAtTime(80, t + 0.12);
    popGain.gain.setValueAtTime(0.0001, t);
    popGain.gain.exponentialRampToValueAtTime(0.2, t + 0.005);
    popGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    pop.connect(popGain).connect(ctx.destination);
    pop.start(t);
    pop.stop(t + 0.2);
  }

  playCatchFor(species: BugSpecies) {
    const ctx = this.ensureRunning();
    if (!ctx) return;
    console.debug("[audio] playCatchFor state:", ctx.state);
    const cfg = SPECIES_JINGLE[species];
    const root = 2 ** pick(cfg.roots);
    const [minNotes, maxNotes] = cfg.notes;
    const notes = minNotes + Math.floor(Math.random() * (maxNotes - minNotes + 1));
    const start = ctx.currentTime + 0.02;
    this.thump(start, 120 + 40 * (root > 1.5 ? 1 : 0));
    for (let i = 0; i < notes; i++) {
      const freq = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)] * root;
      this.pluck(freq, start + i * 0.09, 0.16, "triangle", 0.2);
    }
    this.pluck(PENTATONIC[4] * root, start + notes * 0.09, 0.4);
  }

  /** Bright rising "ping-up" sparkle layered on the jingle for high strikes. */
  playReach(alt: number) {
    const ctx = this.ensureRunning();
    if (!ctx) return;
    const t = ctx.currentTime + 0.02;
    const base = 520 + alt * 280;
    this.pluck(base, t, 0.12, "sine", 0.16);
    this.pluck(base * 1.5, t + 0.07, 0.16, "sine", 0.17);
    this.pluck(base * 2, t + 0.14, 0.26, "sine", 0.15);
  }

  /** Short tactile snatch when the tongue first touches a bug. */
  playGrab(species: BugSpecies) {
    const ctx = this.ensureRunning();
    if (!ctx) return;
    const t = ctx.currentTime + 0.02;
    switch (species) {
      case "fly":
        this.pluck(700, t, 0.06, "triangle", 0.18);
        this.pluck(1050, t + 0.05, 0.08, "triangle", 0.15);
        break;
      case "ladybug":
        this.pluck(311, t, 0.16, "sine", 0.22);
        break;
      case "bee":
        this.pluck(196, t, 0.2, "sawtooth", 0.14);
        this.pluck(198, t, 0.2, "sawtooth", 0.1);
        break;
    }
  }

  playMiss() {
    const ctx = this.ensureRunning();
    if (!ctx) return;
    console.debug("[audio] playMiss state:", ctx.state);
    const t = ctx.currentTime + 0.02;
    this.pluck(392, t, 0.14, "sine");
    this.pluck(311, t + 0.12, 0.18, "sine");
  }

  private pluck(freq: number, at: number, dur: number, type: OscillatorType = "triangle", peak = 0.28) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  /** Low percussive boom with a pitch drop for a thumping catch body. */
  private thump(at: number, freq = 130, dur = 0.32, peak = 0.4) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * 1.7, at);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, at + dur);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }
}
