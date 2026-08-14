function titleCaseWords(value: string): string {
  return value
    .split(" ")
    .map((word) => (word ? word[0]!.toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export function parseTrackFilename(
  file: string,
): { song: string; artist: string } | null {
  const base = file.replace(/\.(mp3|ogg|wav)$/i, "");
  const idx = base.indexOf("_");
  if (idx <= 0 || idx >= base.length - 1) return null;
  const song = titleCaseWords(base.slice(0, idx).replace(/-/g, " "));
  const artist = titleCaseWords(base.slice(idx + 1).replace(/-/g, " "));
  if (!song || !artist) return null;
  return { song, artist };
}

export class AudioEngine {
  nowPlaying: string | null = null;
  private musicLevel = 4;
  private sfxLevel = 10;

  get muted(): boolean {
    return this.musicLevel <= 0;
  }

  get soundtrackReady(): boolean {
    return this.started && this.nowPlaying !== null;
  }

  private ctx: AudioContext | null = null;
  private music: HTMLAudioElement | null = null;
  private tracks: string[] = [];
  private order: number[] = [];
  private index = 0;
  private musicHeld = false;
  private catalogLoaded = false;
  private started = false;

  applyVolumes(music: number, sfx: number): void {
    this.musicLevel = music;
    this.sfxLevel = sfx;
    this.syncMusicVolume();
  }

  unlock(): void {
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    void this.startMusic();
  }

  pauseMusic(): void {
    if (this.musicHeld) return;
    this.musicHeld = true;
    this.music?.pause();
  }

  resumeMusic(): void {
    if (!this.musicHeld) return;
    this.musicHeld = false;
    if (!this.music) return;
    this.syncMusicVolume();
    void this.music.play().catch(() => {
      // autoplay may still be blocked until a gesture
    });
  }

  skip(): void {
    if (this.tracks.length === 0) return;
    this.next();
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

  pickup(): void {
    this.tone({ freq: 740, dur: 0.1, type: "sine", vol: 0.07, slide: 260 });
    this.tone({ freq: 980, dur: 0.08, type: "triangle", vol: 0.04, slide: 80, delay: 0.04 });
  }

  private async startMusic(): Promise<void> {
    if (this.started) return;
    this.started = true;
    await this.loadCatalog();
    if (this.tracks.length === 0) {
      this.nowPlaying = null;
      return;
    }
    this.shuffleOrder();
    this.playAt(0);
  }

  private async loadCatalog(): Promise<void> {
    if (this.catalogLoaded) return;
    this.catalogLoaded = true;
    const url = `${import.meta.env.BASE_URL}music/tracks.json`;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data: unknown = await res.json();
      if (!Array.isArray(data)) return;
      this.tracks = data.filter((item): item is string => typeof item === "string");
    } catch {
      this.tracks = [];
    }
  }

  private shuffleOrder(): void {
    this.order = this.tracks.map((_, i) => i);
    for (let i = this.order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = this.order[i]!;
      this.order[i] = this.order[j]!;
      this.order[j] = tmp;
    }
  }

  private next(): void {
    if (this.tracks.length === 0) return;
    if (this.order.length === 0) this.shuffleOrder();
    let nextIndex = this.index + 1;
    this.playAt(nextIndex);
  }

  private playAt(orderIndex: number): void {
    this.index = orderIndex;
    const file = this.tracks[this.order[this.index]!];
    if (!file) {
      this.nowPlaying = null;
      return;
    }
    this.music?.pause();
    if (this.music) {
      this.music.src = "";
      this.music.remove();
    }
    const src = `${import.meta.env.BASE_URL}music/${encodeURIComponent(file)}`;
    const el = new Audio(src);
    el.volume = this.musicLevel / 10;
    el.addEventListener("ended", () => this.next());
    this.music = el;
    const parsed = parseTrackFilename(file);
    this.nowPlaying = parsed ? `${parsed.song} — ${parsed.artist}` : file;
    if (!this.musicHeld) {
      void el.play().catch(() => {
        // wait for the next gesture
      });
    }
  }

  private tone(opts: {
    freq: number;
    dur: number;
    type: OscillatorType;
    vol: number;
    slide?: number;
    delay?: number;
  }): void {
    if (this.sfxLevel <= 0 || !this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const vol = opts.vol * (this.sfxLevel / 10);
    osc.type = opts.type;
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.slide) {
      osc.frequency.linearRampToValueAtTime(opts.freq + opts.slide, t0 + opts.dur);
    }
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + opts.dur + 0.02);
  }

  private syncMusicVolume(): void {
    if (this.music) this.music.volume = this.musicLevel / 10;
  }
}
