import { COLORS, rgba, roundRectPath } from "../fx/glow.ts";
import { px } from "../fx/font.ts";
import type { Paddle } from "./paddle.ts";

export type PowerupKind = "twin" | "slow" | "freeze" | "aegis";

export const POWERUP_META: Record<
  PowerupKind,
  { name: string; color: string; letter: string; duration: number }
> = {
  twin: { name: "Twin Spark", color: COLORS.magenta, letter: "T", duration: 0 },
  slow: { name: "Slow Field", color: COLORS.cyan, letter: "S", duration: 8 },
  freeze: { name: "Lock Gates", color: "#ffffff", letter: "L", duration: 8 },
  aegis: { name: "Aegis", color: COLORS.orange, letter: "A", duration: 5 },
};

const DROP_WEIGHTS: { kind: PowerupKind; w: number }[] = [
  { kind: "twin", w: 0.3 },
  { kind: "slow", w: 0.3 },
  { kind: "freeze", w: 0.28 },
  { kind: "aegis", w: 0.12 },
];

export function rollPowerupKind(): PowerupKind {
  const n = Math.random();
  let acc = 0;
  for (const row of DROP_WEIGHTS) {
    acc += row.w;
    if (n <= acc) return row.kind;
  }
  return "slow";
}

export class PowerupDrop {
  readonly kind: PowerupKind;
  x: number;
  y: number;
  vy = 80;
  phase = Math.random() * Math.PI * 2;
  readonly r = 16;

  constructor(kind: PowerupKind, x: number, y: number) {
    this.kind = kind;
    this.x = x;
    this.y = y;
  }

  get meta() {
    return POWERUP_META[this.kind];
  }

  update(dt: number): void {
    this.vy += 420 * dt;
    this.y += this.vy * dt;
    this.phase += dt * 4;
    this.x += Math.sin(this.phase) * 28 * dt;
  }

  hitsPaddle(paddle: Paddle): boolean {
    return (
      this.y + this.r >= paddle.top &&
      this.y - this.r <= paddle.bottom &&
      this.x + this.r >= paddle.left &&
      this.x - this.r <= paddle.right
    );
  }

  pastBottom(worldH: number): boolean {
    return this.y - this.r > worldH + 20;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { color, letter } = this.meta;
    const pulse = 0.75 + Math.sin(this.phase) * 0.25;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = color;
    ctx.shadowBlur = 16 + pulse * 10;
    roundRectPath(ctx, -18, -12, 36, 24, 12);
    ctx.fillStyle = rgba(color, 0.22 + pulse * 0.18);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#ffffff";
    ctx.font = px(10);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, 0, 1);
    ctx.restore();
  }
}
