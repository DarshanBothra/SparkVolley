const STORAGE_KEY = "sparkVolley.settings";

export const MUSIC_MAX = 10;
export const SFX_MAX = 10;
export const PADDLE_MIN = 1;
export const PADDLE_MAX = 5;

const BASE_ACCEL = 3400;
const BASE_MAX_SPEED = 800;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function asInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return clamp(Math.round(n), min, max);
}

/** Level 3 = current feel (accel 3400, max 800). 1 = 0.55x, 5 = 1.45x. */
export function paddleSpeedScale(level: number): number {
  const lv = clamp(Math.round(level), PADDLE_MIN, PADDLE_MAX);
  return 0.55 + (lv - 1) * 0.225;
}

export function paddleAccel(level: number): number {
  return BASE_ACCEL * paddleSpeedScale(level);
}

export function paddleMaxSpeed(level: number): number {
  return BASE_MAX_SPEED * paddleSpeedScale(level);
}

export class GameSettings {
  music = 4;
  sfx = 10;
  paddle = 3;
  private lastMusic = 4;

  constructor() {
    this.load();
  }

  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data: unknown = JSON.parse(raw);
      if (!data || typeof data !== "object") return;
      const obj = data as Record<string, unknown>;
      this.music = asInt(obj.music, this.music, 0, MUSIC_MAX);
      this.sfx = asInt(obj.sfx, this.sfx, 0, SFX_MAX);
      this.paddle = asInt(obj.paddle, this.paddle, PADDLE_MIN, PADDLE_MAX);
      this.lastMusic = this.music > 0 ? this.music : 4;
    } catch {
      // private mode / blocked storage / bad JSON
    }
  }

  save(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ music: this.music, sfx: this.sfx, paddle: this.paddle }),
      );
    } catch {
      // private mode / blocked storage
    }
  }

  toggleMusicMute(): void {
    if (this.music > 0) {
      this.lastMusic = this.music;
      this.music = 0;
    } else {
      this.music = this.lastMusic > 0 ? this.lastMusic : 4;
    }
    this.save();
  }

  setMusic(value: number): void {
    this.music = clamp(Math.round(value), 0, MUSIC_MAX);
    if (this.music > 0) this.lastMusic = this.music;
    this.save();
  }

  setSfx(value: number): void {
    this.sfx = clamp(Math.round(value), 0, SFX_MAX);
    this.save();
  }

  setPaddle(value: number): void {
    this.paddle = clamp(Math.round(value), PADDLE_MIN, PADDLE_MAX);
    this.save();
  }

  nudge(row: 0 | 1 | 2, delta: number): void {
    if (row === 0) this.setMusic(this.music + delta);
    else if (row === 1) this.setSfx(this.sfx + delta);
    else this.setPaddle(this.paddle + delta);
  }
}
