const STORAGE_KEY = "spark-volley-best";

export class ScoreKeeper {
  score = 0;
  combo = 0;
  maxCombo = 0;
  best = 0;
  lastPoints = 0;
  threadedSincePaddle = false;

  constructor() {
    this.load();
  }

  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const n = raw ? Number.parseInt(raw, 10) : 0;
      this.best = Number.isFinite(n) && n > 0 ? n : 0;
    } catch {
      this.best = 0;
    }
  }

  save(): void {
    if (this.score <= this.best) return;
    this.best = this.score;
    try {
      localStorage.setItem(STORAGE_KEY, String(this.best));
    } catch {
      // private mode / blocked storage
    }
  }

  reset(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lastPoints = 0;
    this.threadedSincePaddle = false;
  }

  onHalo(): { points: number; combo: number; milestone: boolean } {
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.threadedSincePaddle = true;
    const points = 100 * this.combo;
    this.score += points;
    this.lastPoints = points;
    const milestone =
      this.combo === 5 ||
      this.combo === 10 ||
      this.combo === 20 ||
      (this.combo > 20 && this.combo % 10 === 0);
    return { points, combo: this.combo, milestone };
  }

  onPaddleHit(): { brokeCombo: boolean } {
    const broke = this.combo > 0 && !this.threadedSincePaddle;
    if (broke) this.combo = 0;
    this.threadedSincePaddle = false;
    return { brokeCombo: broke };
  }

  copyLine(): string {
    return `SPARK VOLLEY — ${this.score.toLocaleString()}  ×${this.maxCombo} combo`;
  }
}
