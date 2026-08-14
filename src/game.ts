import { AudioEngine } from "./audio.ts";
import { Halo } from "./entities/halo.ts";
import { Paddle } from "./entities/paddle.ts";
import { Spark } from "./entities/spark.ts";
import {
  COLORS,
  comboColor,
  drawGlowCircle,
  drawGrid,
  Shake,
  Trail,
} from "./fx/glow.ts";
import { Particles } from "./fx/particles.ts";
import type { Input } from "./input.ts";
import { ScoreKeeper } from "./score.ts";
import {
  drawGameOver,
  drawHud,
  drawPause,
  drawTitle,
  drawVignette,
} from "./ui.ts";

export type GameState = "title" | "playing" | "paused" | "gameover";

export const WORLD_W = 1280;
export const WORLD_H = 800;

export class Game {
  state: GameState = "title";
  readonly paddle: Paddle;
  readonly spark: Spark;
  readonly halos: Halo[] = [];
  readonly score = new ScoreKeeper();
  readonly audio = new AudioEngine();
  readonly particles = new Particles();
  readonly trail = new Trail();
  readonly shake = new Shake();

  private playTime = 0;
  private clock = 0;
  private paddleHits = 0;
  private gridPulse = 0;
  private copyFlash = 0;
  private missArmed = false;

  constructor() {
    this.paddle = new Paddle(WORLD_W, WORLD_H);
    this.spark = new Spark(this.paddle.x, this.paddle.top - 14);
    this.syncHaloCount(true);
  }

  get speedMul(): number {
    return 1 + Math.floor(this.paddleHits / 4) * 0.08;
  }

  get targetHaloCount(): number {
    return Math.min(4, 2 + Math.floor(this.paddleHits / 6));
  }

  update(dt: number, input: Input): void {
    const capped = Math.min(dt, 1 / 20);
    this.clock += capped;
    this.copyFlash = Math.max(0, this.copyFlash - capped);
    this.shake.update(capped);
    this.gridPulse = Math.max(0, this.gridPulse - capped * 1.8);
    this.particles.update(capped);
    this.trail.update(capped);

    if (input.consumeMute()) {
      this.audio.unlock();
      this.audio.toggleMute();
    }

    if (this.state === "title") {
      this.idleTitle(capped);
      for (const halo of this.halos) halo.update(capped, WORLD_W, WORLD_H);
      if (input.consumeSpace()) {
        this.audio.unlock();
        this.audio.ui();
        this.beginRound();
      }
      input.consumePause();
      input.consumeCopy();
      return;
    }

    if (this.state === "gameover") {
      if (input.consumeCopy()) this.copyScore();
      if (input.consumeSpace()) {
        this.audio.unlock();
        this.audio.ui();
        this.beginRound();
      }
      input.consumePause();
      return;
    }

    if (input.consumePause()) {
      this.audio.unlock();
      if (this.state === "playing") {
        this.state = "paused";
        this.audio.ui();
      } else if (this.state === "paused") {
        this.state = "playing";
        this.audio.ui();
      }
    }

    if (this.state === "paused") {
      input.consumeSpace();
      input.consumeCopy();
      return;
    }

    this.playTime += capped;
    this.paddle.update(capped, input.left, input.right, WORLD_W);

    if (this.spark.held) {
      this.spark.x = this.paddle.x;
      this.spark.y = this.paddle.top - this.spark.r - 3;
      this.trail.clear();
      if (input.consumeSpace()) {
        this.audio.unlock();
        this.playTime = 0;
        this.spark.serve(540 * this.speedMul);
        this.audio.paddle(true);
        this.gridPulse = 1;
      }
    } else {
      input.consumeSpace();
    }

    this.syncHaloCount(false);
    for (const halo of this.halos) halo.update(capped, WORLD_W, WORLD_H);

    const wall = this.spark.update(capped, WORLD_W, this.speedMul);
    if (wall) {
      this.gridPulse = Math.max(this.gridPulse, 0.55);
      const nx = wall === "left" ? 1 : wall === "right" ? -1 : 0;
      const ny = wall === "top" ? 1 : 0;
      this.particles.wallSpark(this.spark.x, this.spark.y, nx, ny);
    }

    if (!this.spark.held && !this.spark.fading) {
      this.trail.push(this.spark.x, this.spark.y);
      this.tryPaddleHit();
      this.tryHaloScores();
      if (this.spark.pastPaddle(this.paddle.bottom)) this.triggerMiss();
    } else if (this.spark.fading) {
      this.trail.push(this.spark.x, this.spark.y);
      if (!this.spark.alive && this.missArmed) {
        this.missArmed = false;
        this.score.save();
        this.state = "gameover";
      }
    }

    input.consumeCopy();
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    this.shake.apply(ctx);

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    drawGrid(ctx, WORLD_W, WORLD_H, this.gridPulse);

    const accent = comboColor(this.score.combo);
    for (const halo of this.halos) halo.draw(ctx, this.score.combo);

    this.paddle.draw(ctx, accent);

    if (this.state !== "title") {
      this.trail.draw(ctx, accent, this.spark.r);
      const intensity = this.spark.fading ? this.spark.fade : 1;
      if (intensity > 0.02) {
        drawGlowCircle(
          ctx,
          this.spark.x,
          this.spark.y,
          this.spark.r,
          accent,
          intensity,
        );
      }
    } else {
      const ox = WORLD_W / 2 + Math.cos(this.clock * 1.3) * 210;
      const oy = WORLD_H * 0.52 + Math.sin(this.clock * 1.1) * 70;
      drawGlowCircle(ctx, ox, oy, 12, COLORS.cyan, 1);
    }

    this.particles.draw(ctx);
    drawVignette(ctx, WORLD_W, WORLD_H);

    if (this.state === "title") {
      drawTitle(ctx, WORLD_W, WORLD_H, this.clock);
    } else if (this.state === "gameover") {
      drawHud(
        ctx,
        WORLD_W,
        this.score.score,
        this.score.best,
        this.score.combo,
        this.audio.muted,
        0,
        false,
      );
      drawGameOver(
        ctx,
        WORLD_W,
        WORLD_H,
        this.score.score,
        this.score.best,
        this.score.maxCombo,
        this.copyFlash,
        this.clock,
      );
    } else {
      const hintAlpha = this.spark.held
        ? 1
        : Math.max(0, 1 - Math.max(0, this.playTime - 3) / 0.6);
      drawHud(
        ctx,
        WORLD_W,
        this.score.score,
        this.score.best,
        this.score.combo,
        this.audio.muted,
        hintAlpha,
        this.spark.held,
      );
      if (this.state === "paused") drawPause(ctx, WORLD_W, WORLD_H);
    }

    ctx.restore();
  }

  private idleTitle(dt: number): void {
    this.paddle.update(dt, false, false, WORLD_W);
  }

  private beginRound(): void {
    this.state = "playing";
    this.playTime = 0;
    this.paddleHits = 0;
    this.missArmed = false;
    this.gridPulse = 0.4;
    this.score.reset();
    this.particles.clear();
    this.trail.clear();
    this.paddle.reset(WORLD_W);
    this.spark.reset(this.paddle.x, this.paddle.top - this.spark.r - 3);
    this.halos.length = 0;
    this.syncHaloCount(true);
  }

  private syncHaloCount(force: boolean): void {
    const n = this.state === "title" ? 3 : this.targetHaloCount;
    while (this.halos.length < n) {
      const halo = new Halo();
      halo.spawn(WORLD_W, WORLD_H, this.speedMul, this.avoidList());
      this.halos.push(halo);
    }
    if (force) {
      for (const halo of this.halos) {
        halo.spawn(WORLD_W, WORLD_H, this.speedMul, this.avoidList(halo));
      }
    }
    while (this.halos.length > n) this.halos.pop();
  }

  private avoidList(except?: Halo): { x: number; y: number; r: number }[] {
    const list: { x: number; y: number; r: number }[] = [
      { x: this.spark.x, y: this.spark.y, r: 90 },
    ];
    for (const h of this.halos) {
      if (h === except) continue;
      list.push({ x: h.x, y: h.y, r: h.outerR });
    }
    return list;
  }

  private tryPaddleHit(): void {
    if (this.spark.vy <= 0) return;
    const { spark, paddle } = this;
    const crossed =
      spark.prevY + spark.r <= paddle.top + 6 && spark.y + spark.r >= paddle.top;
    const overlapping =
      spark.y + spark.r >= paddle.top && spark.y <= paddle.bottom;
    if (!crossed && !overlapping) return;
    if (spark.x < paddle.left - spark.r || spark.x > paddle.right + spark.r) return;

    const offset = (spark.x - paddle.x) / (paddle.width / 2);
    const clamped = Math.max(-1, Math.min(1, offset));
    const angle = clamped * Math.PI * 0.42;
    let speed = Math.hypot(spark.vx, spark.vy);
    speed = Math.max(500 * this.speedMul, speed * 1.02);
    const sweet = Math.abs(clamped) < 0.22;
    if (sweet) speed *= 1.09;
    spark.vx = Math.sin(angle) * speed + paddle.vx * 0.18;
    spark.vy = -Math.abs(Math.cos(angle) * speed);
    spark.y = paddle.top - spark.r - 0.5;

    this.paddleHits += 1;
    paddle.hit(sweet);
    this.gridPulse = 1;
    this.audio.paddle(sweet);
    this.particles.burst(
      spark.x,
      paddle.top,
      sweet ? COLORS.gold : comboColor(this.score.combo),
      sweet ? 18 : 10,
      sweet ? 280 : 180,
    );

    const { brokeCombo } = this.score.onPaddleHit();
    if (brokeCombo) this.audio.comboBreak();
  }

  private tryHaloScores(): void {
    for (const halo of this.halos) {
      if (!halo.contains(this.spark.x, this.spark.y)) continue;
      const { points, combo, milestone } = this.score.onHalo();
      const color = comboColor(combo);
      this.audio.halo(combo);
      this.particles.burst(halo.x, halo.y, color, 28, 320);
      this.particles.pop(halo.x, halo.y - halo.outerR, `+${points}`, color);
      if (milestone) {
        this.shake.add(combo >= 20 ? 14 : combo >= 10 ? 10 : 7);
        this.gridPulse = 1;
        this.particles.burst(halo.x, halo.y, COLORS.gold, 16, 380);
      }
      halo.spawn(WORLD_W, WORLD_H, this.speedMul, this.avoidList(halo));
    }
  }

  private triggerMiss(): void {
    if (this.missArmed || this.spark.fading) return;
    this.missArmed = true;
    this.spark.startMiss();
    this.audio.miss();
    this.particles.driftUp(
      this.spark.x,
      this.spark.y,
      comboColor(this.score.combo),
      36,
    );
    this.score.combo = 0;
  }

  private copyScore(): void {
    const line = this.score.copyLine();
    void navigator.clipboard?.writeText(line).then(
      () => {
        this.copyFlash = 1.6;
      },
      () => {
        this.copyFlash = 1.6;
      },
    );
    this.copyFlash = 1.6;
  }
}
