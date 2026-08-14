export class AudioEngine {
  muted = false;
  private ctx: AudioContext | null = null;

  unlock(): void {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  paddle(sweet: boolean): void {
    this.tone({
      freq: sweet ? 420 : 280,
      dur: sweet ? 0.09 : 0.07,
      type: "triangle",
      vol: 0.08,
      slide: sweet ? 180 : 80,
    });
  }

  halo(combo: number): void {
    const freq = 520 + Math.min(combo, 16) * 42;
    this.tone({ freq, dur: 0.14, type: "sine", vol: 0.09, slide: 220 });
    this.tone({
      freq: freq * 1.5,
      dur: 0.1,
      type: "triangle",
      vol: 0.04,
      slide: 80,
      delay: 0.03,
    });
  }

  miss(): void {
    this.tone({ freq: 240, dur: 0.45, type: "sawtooth", vol: 0.05, slide: -180 });
    this.tone({ freq: 160, dur: 0.5, type: "triangle", vol: 0.04, slide: -90, delay: 0.08 });
  }

  ui(): void {
    this.tone({ freq: 660, dur: 0.06, type: "sine", vol: 0.05, slide: 40 });
  }

  comboBreak(): void {
    this.tone({ freq: 200, dur: 0.12, type: "square", vol: 0.03, slide: -60 });
  }

  private tone(opts: {
    freq: number;
    dur: number;
    type: OscillatorType;
    vol: number;
    slide?: number;
    delay?: number;
  }): void {
    if (this.muted || !this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type;
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.slide) {
      osc.frequency.linearRampToValueAtTime(opts.freq + opts.slide, t0 + opts.dur);
    }
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(opts.vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + opts.dur + 0.02);
  }
}
