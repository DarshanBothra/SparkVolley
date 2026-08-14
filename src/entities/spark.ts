export class Spark {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx = 0;
  vy = 0;
  r = 11;
  held = true;
  fading = false;
  fade = 1;
  alive = true;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
  }

  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = 0;
    this.vy = 0;
    this.held = true;
    this.fading = false;
    this.fade = 1;
    this.alive = true;
  }

  serve(speed: number): void {
    this.held = false;
    const angle = (Math.random() - 0.5) * 0.7;
    this.vx = Math.sin(angle) * speed * 0.32;
    this.vy = -speed;
  }

  startMiss(): void {
    this.fading = true;
    this.vx *= 0.25;
    this.vy = -70;
  }

  update(
    dt: number,
    worldW: number,
    speedMul: number,
  ): "left" | "right" | "top" | null {
    this.prevX = this.x;
    this.prevY = this.y;
    if (this.held || !this.alive) return null;

    if (this.fading) {
      this.fade = Math.max(0, this.fade - dt * 0.9);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vy -= 50 * dt;
      this.vx *= Math.exp(-1.2 * dt);
      if (this.fade <= 0) this.alive = false;
      return null;
    }

    const gravity = 640;
    this.vy += gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const maxSp = 1000 * speedMul;
    const sp = Math.hypot(this.vx, this.vy);
    if (sp > maxSp) {
      this.vx *= maxSp / sp;
      this.vy *= maxSp / sp;
    }

    const rest = 0.985;
    let wall: "left" | "right" | "top" | null = null;

    if (this.x < this.r) {
      this.x = this.r;
      this.vx = Math.abs(this.vx) * rest;
      wall = "left";
    } else if (this.x > worldW - this.r) {
      this.x = worldW - this.r;
      this.vx = -Math.abs(this.vx) * rest;
      wall = "right";
    }

    if (this.y < this.r) {
      this.y = this.r;
      this.vy = Math.abs(this.vy) * rest;
      wall = "top";
    }

    return wall;
  }

  pastPaddle(paddleBottom: number): boolean {
    return !this.held && !this.fading && this.y - this.r > paddleBottom + 8;
  }
}
