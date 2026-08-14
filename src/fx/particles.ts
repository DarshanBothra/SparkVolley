import { rgba } from "./glow.ts";
import { px } from "./font.ts";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  r: number;
  color: string;
  drag: number;
};

type Floater = {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
};

export class Particles {
  private readonly bits: Particle[] = [];
  private readonly floaters: Floater[] = [];

  burst(x: number, y: number, color: string, count: number, speed = 220): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random() * 0.9);
      this.bits.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 1,
        maxLife: 0.35 + Math.random() * 0.45,
        r: 1.4 + Math.random() * 2.6,
        color,
        drag: 1.6 + Math.random(),
      });
    }
  }

  driftUp(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      this.bits.push({
        x: x + (Math.random() - 0.5) * 28,
        y: y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 40,
        vy: -40 - Math.random() * 90,
        life: 1,
        maxLife: 0.8 + Math.random() * 0.7,
        r: 1.2 + Math.random() * 2.2,
        color,
        drag: 0.4,
      });
    }
  }

  pop(x: number, y: number, text: string, color: string): void {
    this.floaters.push({ x, y, text, life: 1, color });
  }

  update(dt: number): void {
    for (const p of this.bits) {
      p.life -= dt / p.maxLife;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-p.drag * dt);
      p.vy *= Math.exp(-p.drag * 0.6 * dt);
    }
    for (let i = this.bits.length - 1; i >= 0; i--) {
      if (this.bits[i]!.life <= 0) this.bits.splice(i, 1);
    }

    for (const f of this.floaters) {
      f.life -= dt * 0.85;
      f.y -= 48 * dt;
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      if (this.floaters[i]!.life <= 0) this.floaters.splice(i, 1);
    }
  }

  clear(): void {
    this.bits.length = 0;
    this.floaters.length = 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.bits) {
      const a = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(p.color, a * 0.85);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = px(10);
    for (const f of this.floaters) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 12;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }

  wallSpark(x: number, y: number, nx: number, ny: number, color: string): void {
    for (let i = 0; i < 8; i++) {
      const spread = (Math.random() - 0.5) * 1.2;
      this.bits.push({
        x,
        y,
        vx: nx * (80 + Math.random() * 140) + ny * spread * 90,
        vy: ny * (80 + Math.random() * 140) + nx * spread * 90,
        life: 1,
        maxLife: 0.2 + Math.random() * 0.2,
        r: 1.2 + Math.random() * 1.6,
        color,
        drag: 3,
      });
    }
  }
}
