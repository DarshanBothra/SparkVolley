export const COLORS = {
  bg: "#07070f",
  cyan: "#00f0ff",
  magenta: "#ff2bd6",
  gold: "#f8ff4a",
} as const;

export function comboColor(combo: number): string {
  if (combo >= 10) return COLORS.gold;
  if (combo >= 5) return COLORS.magenta;
  return COLORS.cyan;
}

export function hexRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export class Trail {
  private readonly points: { x: number; y: number; a: number }[] = [];

  push(x: number, y: number): void {
    this.points.push({ x, y, a: 1 });
    if (this.points.length > 24) this.points.shift();
  }

  update(dt: number): void {
    for (const p of this.points) p.a -= dt * 3.4;
    for (let i = this.points.length - 1; i >= 0; i--) {
      if (this.points[i]!.a <= 0) this.points.splice(i, 1);
    }
  }

  clear(): void {
    this.points.length = 0;
  }

  draw(ctx: CanvasRenderingContext2D, color: string, radius: number): void {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i]!;
      const t = i / Math.max(1, this.points.length - 1);
      const r = radius * (0.35 + t * 0.7);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(color, p.a * 0.22);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class Shake {
  mag = 0;

  add(amount: number): void {
    this.mag = Math.min(22, this.mag + amount);
  }

  update(dt: number): void {
    this.mag = Math.max(0, this.mag - dt * 32);
  }

  apply(ctx: CanvasRenderingContext2D): void {
    if (this.mag <= 0.4) return;
    ctx.translate(
      (Math.random() - 0.5) * this.mag * 2,
      (Math.random() - 0.5) * this.mag * 2,
    );
  }
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pulse: number,
): void {
  const alpha = 0.05 + pulse * 0.16;
  ctx.save();
  ctx.strokeStyle = rgba(COLORS.cyan, alpha);
  ctx.lineWidth = 1;

  const vpX = w * 0.5;
  const cols = 18;
  for (let i = 0; i <= cols; i++) {
    const x = (i / cols) * w;
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(vpX + (x - vpX) * 0.12, 0);
    ctx.stroke();
  }

  const rows = 14;
  for (let i = 1; i <= rows; i++) {
    const t = i / rows;
    const y = (t * t * 0.55 + t * 0.45) * h;
    const spread = 0.12 + (y / h) * 0.88;
    ctx.beginPath();
    ctx.moveTo(vpX - (w * 0.5) * spread, y);
    ctx.lineTo(vpX + (w * 0.5) * spread, y);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawGlowCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  intensity = 1,
): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4.2);
  g.addColorStop(0, rgba(color, 0.95 * intensity));
  g.addColorStop(0.18, rgba(color, 0.45 * intensity));
  g.addColorStop(0.45, rgba(color, 0.12 * intensity));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 4.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.92 * intensity;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85 * intensity;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
