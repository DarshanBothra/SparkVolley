import { AudioEngine } from "./audio.ts";
import { isNonComputer } from "./device.ts";
import { Halo } from "./entities/halo.ts";
import { Paddle } from "./entities/paddle.ts";
import { PowerupDrop, POWERUP_META, rollPowerupKind } from "./entities/powerup.ts";
import { Spark } from "./entities/spark.ts";
import {
  Afterimage,
  COLORS,
  comboColor,
  drawCourt,
  drawGlowCircle,
  drawGrid,
  Motes,
  Shake,
  Trail,
} from "./fx/glow.ts";
import { Particles } from "./fx/particles.ts";
import type { Input } from "./input.ts";
import { ScoreKeeper } from "./score.ts";
import { Effects } from "./systems/effects.ts";
import {
  drawGameOver,
  drawHud,
  drawNowPlaying,
  drawPause,
  drawBlocked,
  drawRules,
  drawTitle,
  drawVignette,
} from "./ui.ts";

export type GameState = "blocked" | "rules" | "title" | "playing" | "paused" | "gameover";

export const WORLD_W = 1280;
export const WORLD_H = 800;

const RULES_KEY = "sparkVolley.rulesSeen";

function hasSeenRules(): boolean {
  try {
    return localStorage.getItem(RULES_KEY) === "1";
  } catch {
    return false;
  }
}

function markRulesSeen(): void {
  try {
    localStorage.setItem(RULES_KEY, "1");
  } catch {
    // private mode / blocked storage
  }
}

export class Game {
  state: GameState = isNonComputer() ? "blocked" : hasSeenRules() ? "title" : "rules";
  readonly paddle: Paddle;
  readonly sparks: Spark[] = [];
  readonly trails: Trail[] = [];
  readonly halos: Halo[] = [];
  readonly drops: PowerupDrop[] = [];
  readonly score = new ScoreKeeper();
  readonly audio = new AudioEngine();
  readonly particles = new Particles();
  readonly shake = new Shake();
  readonly effects = new Effects();
  readonly afterimage = new Afterimage();
  readonly motes = new Motes(WORLD_W, WORLD_H);

  private playTime = 0;
  private clock = 0;
  private paddleHits = 0;
  private gridPulse = 0;
  private copyFlash = 0;
  private railFlash = { left: 0, right: 0, top: 0 };

  constructor() {
    this.paddle = new Paddle(WORLD_W, WORLD_H);
    this.resetSparks();
    this.syncHaloCount(true);
  }

  get speedMul(): number {
    return (1 + Math.floor(this.paddleHits / 8) * 0.05) * this.effects.speedScale;
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
    this.afterimage.update(capped);
    this.motes.update(capped, WORLD_W, WORLD_H);
    this.railFlash.left = Math.max(0, this.railFlash.left - capped * 3.2);
    this.railFlash.right = Math.max(0, this.railFlash.right - capped * 3.2);
    this.railFlash.top = Math.max(0, this.railFlash.top - capped * 3.2);
    for (const trail of this.trails) trail.update(capped);

    if (input.consumeMute()) {
      this.audio.unlock();
      this.audio.toggleMute();
    }
    if (input.consumeSkip()) {
      this.audio.unlock();
      this.audio.skip();
    }

    if (this.state === "paused") this.audio.pauseMusic();
    else this.audio.resumeMusic();

    if (this.state === "blocked") {
      this.idleTitle(capped);
      for (const halo of this.halos) halo.update(capped, WORLD_W, WORLD_H, false);
      if (
        input.consumeTap() ||
        input.consumeSpace() ||
        input.consumePause()
      ) {
        this.audio.unlock();
      }
      input.consumeCopy();
      return;
    }

    input.consumeTap();

    if (this.state === "rules") {
      this.idleTitle(capped);
      for (const halo of this.halos) halo.update(capped, WORLD_W, WORLD_H, false);
      if (input.consumeSpace() || input.consumePause()) {
        markRulesSeen();
        this.audio.unlock();
        this.audio.ui();
        this.state = "title";
      }
      input.consumeCopy();
      return;
    }

    if (this.state === "title") {
      this.idleTitle(capped);
      for (const halo of this.halos) halo.update(capped, WORLD_W, WORLD_H, false);
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
        this.audio.pauseMusic();
      } else if (this.state === "paused") {
        this.state = "playing";
        this.audio.ui();
        this.audio.resumeMusic();
      }
    }

    if (this.state === "paused") {
      if (input.consumeSpace()) {
        this.state = "playing";
        this.audio.unlock();
        this.audio.ui();
        this.audio.resumeMusic();
      }
      input.consumeCopy();
      return;
    }

    this.playTime += capped;
    this.effects.update(capped);
    this.paddle.update(capped, input.left, input.right, WORLD_W);

    const held = this.sparks.find((s) => s.held && s.alive);
    if (held) {
      held.x = this.paddle.x;
      held.y = this.paddle.top - held.r - 3;
      this.trails[0]?.clear();
      if (input.consumeSpace()) {
        this.audio.unlock();
        this.playTime = 0;
        held.serve(400 * this.speedMul);
        this.audio.paddle(true);
        this.gridPulse = 1;
      }
    } else {
      input.consumeSpace();
    }

    this.syncHaloCount(false);
    for (const halo of this.halos) {
      halo.update(capped, WORLD_W, WORLD_H, this.effects.frozen);
    }

    for (let i = 0; i < this.sparks.length; i++) {
      const spark = this.sparks[i]!;
      const wall = spark.update(
        capped,
        WORLD_W,
        WORLD_H,
        this.speedMul,
        this.effects.gravityMul,
        this.effects.hasAegis,
      );
      if (wall) {
        this.gridPulse = Math.max(this.gridPulse, 0.55);
        if (wall === "left") this.railFlash.left = 1;
        if (wall === "right") this.railFlash.right = 1;
        if (wall === "top") this.railFlash.top = 1;
        const nx = wall === "left" ? 1 : wall === "right" ? -1 : 0;
        const ny = wall === "top" ? 1 : wall === "floor" ? -1 : 0;
        const color =
          wall === "floor" || wall === "top" ? COLORS.orange : COLORS.cyan;
        this.particles.wallSpark(spark.x, spark.y, nx, ny, color);
      }

      const trail = this.trails[i];
      if (!spark.held && spark.alive) trail?.push(spark.x, spark.y);

      if (!spark.held && !spark.fading && spark.alive) {
        this.tryPaddleHit(spark);
        this.tryHaloScores(spark);
        if (!this.effects.hasAegis && spark.pastPaddle(this.paddle.bottom)) {
          this.triggerMiss(spark);
        }
      }
    }

    this.updateDrops(capped);

    if (this.sparks.every((s) => !s.alive)) {
      this.score.save();
      this.state = "gameover";
    }

    input.consumeCopy();
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    this.shake.apply(ctx);

    drawCourt(
      ctx,
      WORLD_W,
      WORLD_H,
      this.gridPulse,
      this.railFlash,
      this.effects.hasAegis && this.state !== "title" && this.state !== "rules" && this.state !== "blocked",
    );
    this.motes.draw(ctx);
    drawGrid(ctx, WORLD_W, WORLD_H, this.gridPulse);

    const accent = comboColor(this.score.combo);
    for (const halo of this.halos) halo.draw(ctx);
    for (const drop of this.drops) drop.draw(ctx);

    this.paddle.draw(ctx, accent);

    if (this.state !== "title" && this.state !== "rules" && this.state !== "blocked") {
      this.afterimage.draw(ctx);
      for (let i = 0; i < this.sparks.length; i++) {
        const spark = this.sparks[i]!;
        if (!spark.alive && spark.fade <= 0) continue;
        this.trails[i]?.draw(ctx, accent, spark.r);
        const intensity = spark.fading ? spark.fade : 1;
        if (intensity > 0.02) {
          drawGlowCircle(ctx, spark.x, spark.y, spark.r, accent, intensity);
        }
      }
    } else {
      const ox = WORLD_W / 2 + Math.cos(this.clock * 1.3) * 210;
      const oy = WORLD_H * 0.52 + Math.sin(this.clock * 1.1) * 70;
      drawGlowCircle(ctx, ox, oy, 12, COLORS.cyan, 1);
      drawGlowCircle(
        ctx,
        ox + Math.cos(this.clock * 0.7) * 40,
        oy + 12,
        6,
        COLORS.orange,
        0.7,
      );
    }

    this.particles.draw(ctx);
    drawVignette(ctx, WORLD_W, WORLD_H);

    if (this.state === "blocked") {
      drawBlocked(ctx, WORLD_W, WORLD_H, this.clock, this.audio.soundtrackReady);
    } else if (this.state === "rules") {
      drawRules(ctx, WORLD_W, WORLD_H, this.clock);
    } else if (this.state === "title") {
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
        this.hudEffects(),
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
      const waiting = this.sparks.some((s) => s.held && s.alive);
      const hintAlpha = waiting
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
        waiting,
        this.hudEffects(),
      );
      if (this.state === "paused") drawPause(ctx, WORLD_W, WORLD_H);
    }

    drawNowPlaying(ctx, WORLD_W, WORLD_H, this.audio.nowPlaying, this.audio.muted);
    ctx.restore();
  }

  syncDevice(): void {
    const mobile = isNonComputer();
    if (mobile) {
      this.state = "blocked";
      return;
    }
    if (this.state === "blocked") {
      this.state = hasSeenRules() ? "title" : "rules";
    }
  }

  private idleTitle(dt: number): void {
    this.paddle.update(dt, false, false, WORLD_W);
  }

  private resetSparks(): void {
    this.sparks.length = 0;
    this.trails.length = 0;
    const spark = new Spark(this.paddle.x, this.paddle.top - 14);
    this.sparks.push(spark);
    this.trails.push(new Trail());
  }

  private beginRound(): void {
    this.state = "playing";
    this.playTime = 0;
    this.paddleHits = 0;
    this.gridPulse = 0.4;
    this.score.reset();
    this.effects.reset();
    this.particles.clear();
    this.afterimage.clear();
    this.drops.length = 0;
    this.paddle.reset(WORLD_W);
    this.resetSparks();
    this.halos.length = 0;
    this.syncHaloCount(true);
  }

  private liveSparkCount(): number {
    return this.sparks.filter((s) => s.alive && !s.fading).length;
  }

  private hudEffects() {
    const list = this.effects.hud();
    if (this.liveSparkCount() >= 2) {
      list.unshift({
        name: POWERUP_META.twin.name,
        color: POWERUP_META.twin.color,
        remaining: -1,
      });
    }
    return list;
  }

  private syncHaloCount(force: boolean): void {
    const n =
      this.state === "title" || this.state === "rules" || this.state === "blocked"
        ? 3
        : this.targetHaloCount;
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
    const list: { x: number; y: number; r: number }[] = [];
    for (const spark of this.sparks) {
      if (!spark.alive) continue;
      list.push({ x: spark.x, y: spark.y, r: 90 });
    }
    for (const h of this.halos) {
      if (h === except) continue;
      list.push({ x: h.x, y: h.y, r: h.outerR });
    }
    return list;
  }

  private tryPaddleHit(spark: Spark): void {
    if (spark.vy <= 0) return;
    const { paddle } = this;
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
    speed = Math.max(380 * this.speedMul, speed * 1.008);
    const sweet = Math.abs(clamped) < 0.22;
    if (sweet) speed *= 1.04;
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
    if (sweet) this.afterimage.spawn(spark.x, spark.y, spark.r);

    const { brokeCombo } = this.score.onPaddleHit();
    if (brokeCombo) this.audio.comboBreak();
  }

  private tryHaloScores(spark: Spark): void {
    for (const halo of this.halos) {
      if (!halo.contains(spark.x, spark.y)) continue;
      const { points, combo, milestone } = this.score.onHalo();
      const color = halo.accent;
      this.audio.halo(combo);
      this.particles.burst(halo.x, halo.y, color, 28, 320);
      this.particles.pop(halo.x, halo.y - halo.outerR, `+${points}`, color);
      if (milestone) {
        this.shake.add(combo >= 20 ? 14 : combo >= 10 ? 10 : 7);
        this.gridPulse = 1;
        this.particles.burst(halo.x, halo.y, COLORS.gold, 16, 380);
      }
      if (this.drops.length < 2 && Math.random() < 0.3) {
        this.drops.push(new PowerupDrop(rollPowerupKind(), halo.x, halo.y));
      }
      halo.spawn(WORLD_W, WORLD_H, this.speedMul, this.avoidList(halo));
    }
  }

  private updateDrops(dt: number): void {
    for (const drop of this.drops) drop.update(dt);
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i]!;
      if (drop.hitsPaddle(this.paddle)) {
        this.applyPowerup(drop);
        this.drops.splice(i, 1);
        continue;
      }
      if (drop.pastBottom(WORLD_H)) this.drops.splice(i, 1);
    }
  }

  private applyPowerup(drop: PowerupDrop): void {
    this.audio.pickup();
    this.particles.burst(drop.x, drop.y, drop.meta.color, 22, 260);
    this.particles.pop(drop.x, drop.y - 24, drop.meta.name, drop.meta.color);

    if (drop.kind === "twin") {
      this.spawnTwin();
      return;
    }
    this.effects.apply(drop.kind);
  }

  private spawnTwin(): void {
    if (this.liveSparkCount() >= 2) {
      this.particles.burst(this.paddle.x, this.paddle.top, COLORS.magenta, 14, 220);
      return;
    }
    const src =
      this.sparks.find((s) => s.alive && !s.fading && !s.held) ??
      this.sparks.find((s) => s.alive);
    if (!src) return;
    const clone = new Spark(src.x, src.y);
    clone.held = false;
    clone.vx = src.vx === 0 ? 240 : -src.vx;
    clone.vy = src.vy === 0 ? -420 : src.vy;
    this.sparks.push(clone);
    this.trails.push(new Trail());
    this.particles.burst(clone.x, clone.y, COLORS.magenta, 20, 300);
  }

  private triggerMiss(spark: Spark): void {
    if (spark.fading || !spark.alive) return;
    spark.startMiss();
    this.audio.miss();
    this.particles.driftUp(spark.x, spark.y, comboColor(this.score.combo), 36);
    if (this.liveSparkCount() === 0) this.score.combo = 0;
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
