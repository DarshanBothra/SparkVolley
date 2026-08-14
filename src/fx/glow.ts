export const COLORS = {
  bg: "#05050c",
  court: "#0c0c1a",
  cyan: "#00f0ff",
  magenta: "#ff2bd6",
  orange: "#ff6a00",
  gold: "#f8ff4a",
} as const;

export const HALO_PALETTE = [COLORS.cyan, COLORS.magenta, COLORS.orange] as const;

export function comboColor(combo: number): string {
  if (combo >= 15) return COLORS.gold;
  if (combo >= 10) return COLORS.orange;
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

export function drawCourt(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pulse: number,
  railFlash: { left: number; right: number; top: number },
  aegis: boolean,
): void {
  ctx.fillStyle = COLORS.court;
  ctx.fillRect(0, 0, w, h);

  const rail = 7;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const leftGlow = 16 + pulse * 14 + railFlash.left * 22;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = leftGlow;
  ctx.fillStyle = COLORS.cyan;
  ctx.fillRect(0, 0, rail, h);
  ctx.fillStyle = rgba("#ffffff", 0.35 + railFlash.left * 0.5);
  ctx.fillRect(2, 0, 2, h);

  const rightGlow = 16 + pulse * 14 + railFlash.right * 22;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = rightGlow;
  ctx.fillStyle = COLORS.cyan;
  ctx.fillRect(w - rail, 0, rail, h);
  ctx.fillStyle = rgba("#ffffff", 0.35 + railFlash.right * 0.5);
  ctx.fillRect(w - 4, 0, 2, h);

  const topGlow = 16 + pulse * 14 + railFlash.top * 22;
  const topGrad = ctx.createLinearGradient(0, 0, w, 0);
  topGrad.addColorStop(0, COLORS.magenta);
  topGrad.addColorStop(0.5, COLORS.orange);
  topGrad.addColorStop(1, COLORS.magenta);
  ctx.shadowColor = COLORS.orange;
  ctx.shadowBlur = topGlow;
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, w, rail);
  ctx.fillStyle = rgba("#ffffff", 0.28 + railFlash.top * 0.45);
  ctx.fillRect(0, 2, w, 2);

  const floorH = aegis ? 10 : 5;
  ctx.shadowColor = COLORS.orange;
  ctx.shadowBlur = aegis ? 28 : 10;
  ctx.fillStyle = aegis ? COLORS.orange : rgba(COLORS.orange, 0.42);
  ctx.fillRect(rail, h - floorH, w - rail * 2, floorH);
  if (aegis) {
    ctx.fillStyle = rgba("#ffffff", 0.45);
    ctx.fillRect(rail, h - floorH + 2, w - rail * 2, 2);
  }

  ctx.restore();
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pulse: number,
): void {
  const alpha = 0.045 + pulse * 0.14;
  ctx.save();
  ctx.lineWidth = 1;

  const vpX = w * 0.5;
  const cols = 18;
  for (let i = 0; i <= cols; i++) {
    const x = (i / cols) * w;
    ctx.strokeStyle = rgba(i % 2 === 0 ? COLORS.cyan : COLORS.orange, alpha);
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
    ctx.strokeStyle = rgba(i % 2 === 0 ? COLORS.orange : COLORS.cyan, alpha * 0.9);
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

export class Afterimage {
  private readonly items: { x: number; y: number; r: number; life: number }[] = [];

  spawn(x: number, y: number, r: number): void {
    this.items.push({ x, y, r, life: 1 });
  }

  update(dt: number): void {
    for (const item of this.items) item.life -= dt * 2.8;
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (this.items[i]!.life <= 0) this.items.splice(i, 1);
    }
  }

  clear(): void {
    this.items.length = 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const item of this.items) {
      const a = Math.max(0, item.life);
      drawGlowCircle(ctx, item.x - 7, item.y, item.r * 0.9, COLORS.cyan, a * 0.55);
      drawGlowCircle(ctx, item.x + 7, item.y, item.r * 0.9, COLORS.orange, a * 0.55);
    }
  }
}

export class Motes {
  private readonly bits: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    color: string;
    a: number;
  }[] = [];

  constructor(w: number, h: number) {
    const palette = [COLORS.cyan, COLORS.magenta, COLORS.orange];
    for (let i = 0; i < 42; i++) {
      this.bits.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 18,
        vy: -8 - Math.random() * 22,
        r: 0.7 + Math.random() * 1.6,
        color: palette[i % palette.length]!,
        a: 0.12 + Math.random() * 0.22,
      });
    }
  }

  update(dt: number, w: number, h: number): void {
    for (const p of this.bits) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y < -8) p.y = h + 8;
      if (p.x < -8) p.x = w + 8;
      if (p.x > w + 8) p.x = -8;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.bits) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(p.color, p.a);
      ctx.fill();
    }
    ctx.restore();
  }
}
