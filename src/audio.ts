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

  private ensureCtx(): AudioContext | null {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.ctx.onstatechange = () => {
        if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
      };
    }
    return this.ctx;
  }

  unlock() {
    const ctx = this.ensureCtx();
    ctx?.resume();
    console.debug("[audio] unlock state:", ctx?.state);
  }

  playCatch() {
    this.playCatchFor("fly");
  }

  playCatchFor(species: BugSpecies) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    ctx.resume();
    console.debug("[audio] playCatchFor state:", ctx.state);
    const cfg = SPECIES_JINGLE[species];
    const root = 2 ** pick(cfg.roots);
    const [minNotes, maxNotes] = cfg.notes;
    const notes = minNotes + Math.floor(Math.random() * (maxNotes - minNotes + 1));
    const start = ctx.currentTime + 0.02;
    for (let i = 0; i < notes; i++) {
      const freq = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)] * root;
      this.pluck(freq, start + i * 0.09, 0.16);
    }
    this.pluck(PENTATONIC[4] * root, start + notes * 0.09, 0.4);
  }

  playMiss() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    ctx.resume();
    console.debug("[audio] playMiss state:", ctx.state);
    const t = ctx.currentTime + 0.02;
    this.pluck(392, t, 0.14, "sine");
    this.pluck(311, t + 0.12, 0.18, "sine");
  }

  private pluck(freq: number, at: number, dur: number, type: OscillatorType = "triangle") {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.28, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }
}
