import { COLORS, HALO_PALETTE, rgba } from "../fx/glow.ts";

export class Halo {
  x = 0;
  y = 0;
  outerR = 64;
  innerR = 36;
  rotation = 0;
  rotSpeed = 1.2;
  vx = 0;
  vy = 0;
  phase = 0;
  cooldown = 0;
  mover = false;
  accent: string = COLORS.cyan;

  spawn(
    worldW: number,
    worldH: number,
    speedMul: number,
    avoid: { x: number; y: number; r: number }[],
  ): void {
    this.outerR = 54 + Math.random() * 16;
    this.innerR = this.outerR * 0.58;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (0.7 + Math.random() * 1.6) * (Math.random() < 0.5 ? -1 : 1);
    this.mover = Math.random() < 0.35 + Math.min(0.4, (speedMul - 1) * 0.8);
    const drift = (40 + speedMul * 55) * (this.mover ? 1.55 : 0.7);
    const ang = Math.random() * Math.PI * 2;
    this.vx = Math.cos(ang) * drift;
    this.vy = Math.sin(ang) * drift * 0.55;
    this.phase = Math.random() * Math.PI * 2;
    this.cooldown = 0.18;
    this.accent = HALO_PALETTE[Math.floor(Math.random() * HALO_PALETTE.length)]!;

    const minY = 90;
    const maxY = worldH * 0.62;
    let placed = false;
    for (let attempt = 0; attempt < 24; attempt++) {
      this.x = this.outerR + 24 + Math.random() * (worldW - this.outerR * 2 - 48);
      this.y = minY + Math.random() * (maxY - minY);
      const ok = avoid.every((a) => Math.hypot(this.x - a.x, this.y - a.y) > a.r + this.outerR + 28);
      if (ok) {
        placed = true;
        break;
      }
    }
    if (!placed) {
      this.x = worldW * (0.25 + Math.random() * 0.5);
      this.y = worldH * 0.32;
    }
  }

  update(dt: number, worldW: number, worldH: number, frozen: boolean): void {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.rotation += this.rotSpeed * dt * (frozen ? 0.25 : 1);
    this.phase += dt * 2.4;

    if (!frozen) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    const minX = this.outerR + 12;
    const maxX = worldW - this.outerR - 12;
    const minY = this.outerR + 56;
    const maxY = worldH * 0.64;
    if (this.x < minX) {
      this.x = minX;
      this.vx = Math.abs(this.vx);
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx = -Math.abs(this.vx);
    }
    if (this.y < minY) {
      this.y = minY;
      this.vy = Math.abs(this.vy);
    } else if (this.y > maxY) {
      this.y = maxY;
      this.vy = -Math.abs(this.vy);
    }
  }

  contains(px: number, py: number): boolean {
    if (this.cooldown > 0) return false;
    return Math.hypot(px - this.x, py - this.y) < this.innerR;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const breathe = 0.72 + Math.sin(this.phase) * 0.28;
    const color = this.accent;
    const pulse = 0.85 + Math.sin(this.phase * 1.1) * 0.15;
    const mid = (this.outerR + this.innerR) / 2;
    const thickness = (this.outerR - this.innerR) * pulse;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.beginPath();
    ctx.arc(0, 0, this.innerR, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(12, 12, 26, 0.72)";
    ctx.fill();

    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(color, 0.55 + breathe * 0.45);
    ctx.lineWidth = thickness;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14 + breathe * 10;
    ctx.beginPath();
    ctx.arc(0, 0, mid, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba("#ffffff", 0.28 + breathe * 0.12);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([10, 14]);
    ctx.beginPath();
    ctx.arc(0, 0, mid, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const ticks = 6;
    ctx.strokeStyle = rgba(color, 0.55 + breathe * 0.35);
    ctx.lineWidth = 2;
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (this.innerR - 4), Math.sin(a) * (this.innerR - 4));
      ctx.lineTo(Math.cos(a) * (this.innerR + 6), Math.sin(a) * (this.innerR + 6));
      ctx.stroke();
    }

    ctx.restore();
  }
}
