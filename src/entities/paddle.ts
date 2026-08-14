import { COLORS, rgba, roundRectPath } from "../fx/glow.ts";

export class Paddle {
  x: number;
  y: number;
  width = 176;
  height = 18;
  vx = 0;
  impactFlash = 0;
  shimmer = 0;

  constructor(worldW: number, worldH: number) {
    this.x = worldW / 2;
    this.y = worldH - 58;
  }

  reset(worldW: number): void {
    this.x = worldW / 2;
    this.vx = 0;
    this.impactFlash = 0;
  }

  get left(): number {
    return this.x - this.width / 2;
  }

  get right(): number {
    return this.x + this.width / 2;
  }

  get top(): number {
    return this.y - this.height / 2;
  }

  get bottom(): number {
    return this.y + this.height / 2;
  }

  update(dt: number, left: boolean, right: boolean, worldW: number): void {
    const accel = 3400;
    const maxSpeed = 800;
    const friction = 9;

    if (left && !right) this.vx -= accel * dt;
    else if (right && !left) this.vx += accel * dt;
    else this.vx *= Math.exp(-friction * dt);

    this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));
    this.x += this.vx * dt;

    const half = this.width / 2;
    if (this.x < half) {
      this.x = half;
      this.vx = 0;
    } else if (this.x > worldW - half) {
      this.x = worldW - half;
      this.vx = 0;
    }

    this.impactFlash = Math.max(0, this.impactFlash - dt * 3.6);
    this.shimmer += dt;
  }

  hit(sweet: boolean): void {
    this.impactFlash = sweet ? 1 : 0.72;
  }

  draw(ctx: CanvasRenderingContext2D, accent: string): void {
    const x = this.left;
    const y = this.top;
    const bloom = 0.35 + this.impactFlash * 0.8;
    const color = this.impactFlash > 0.55 ? COLORS.gold : accent;

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 18 + this.impactFlash * 28;

    roundRectPath(ctx, x, y, this.width, this.height, 9);
    ctx.fillStyle = rgba(color, 0.18 + bloom * 0.25);
    ctx.fill();

    ctx.lineWidth = 2.4;
    ctx.strokeStyle = color;
    ctx.stroke();

    const cap = 14;
    ctx.fillStyle = rgba("#ffffff", 0.55 + this.impactFlash * 0.4);
    roundRectPath(ctx, x + 3, y + 4, cap, this.height - 8, 4);
    ctx.fill();
    roundRectPath(ctx, x + this.width - cap - 3, y + 4, cap, this.height - 8, 4);
    ctx.fill();

    const shimmerX = x + ((Math.sin(this.shimmer * 2.4) * 0.5 + 0.5) * (this.width - 40) + 20);
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = rgba("#ffffff", 0.12 + this.impactFlash * 0.25);
    ctx.fillRect(shimmerX, y + 3, 18, this.height - 6);

    ctx.restore();
  }
}
