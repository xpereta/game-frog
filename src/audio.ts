const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0];

export class Sound {
  private ctx: AudioContext | null = null;

  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) this.ctx = new Ctor();
    }
    this.ctx?.resume();
  }

  playCatch() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    const root = 2 ** Math.round(Math.random());
    const notes = 4 + Math.floor(Math.random() * 3);
    const start = ctx.currentTime + 0.02;
    for (let i = 0; i < notes; i++) {
      const freq = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)] * root;
      this.pluck(freq, start + i * 0.09, 0.16);
    }
    this.pluck(PENTATONIC[4] * root, start + notes * 0.09, 0.4);
  }

  playMiss() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
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
