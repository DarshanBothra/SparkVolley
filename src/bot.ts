/** Demo autoplay: predict spark landing from current velocity + gravity, then steer. */

export function isDemoMode(): boolean {
  try {
    if (!isLocalHost()) return false;
    const q = new URLSearchParams(window.location.search);
    return q.has("demo") || q.has("bot");
  } catch {
    return false;
  }
}

function isLocalHost(): boolean {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
}

export type BotSpark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  held: boolean;
  fading: boolean;
  alive: boolean;
};

export type BotHalo = { x: number; y: number };
export type BotDrop = { x: number; y: number; vy: number };

type Landing = { x: number; t: number };

export function botSteer(opts: {
  paddleX: number;
  paddleWidth: number;
  paddleTop: number;
  worldW: number;
  speedMul: number;
  gravityMul: number;
  aegis: boolean;
  sparks: BotSpark[];
  halos: BotHalo[];
  drops: BotDrop[];
}): { left: boolean; right: boolean } {
  const live = opts.sparks.filter((s) => s.alive && !s.fading && !s.held);
  if (live.length === 0) return { left: false, right: false };

  let best: Landing | null = null;
  let bestSpark: BotSpark | null = null;
  for (const spark of live) {
    const land = predictLanding(spark, opts);
    if (!land) continue;
    if (!best || land.t < best.t) {
      best = land;
      bestSpark = spark;
    }
  }
  if (!best || !bestSpark) return { left: false, right: false };

  let target = aimForHalo(best.x, bestSpark, best.t, opts);

  if (best.t > 1.15) {
    const dropX = catchableDrop(best.t, opts);
    if (dropX !== null) target = dropX;
  }

  const dead = 12;
  if (target < opts.paddleX - dead) return { left: true, right: false };
  if (target > opts.paddleX + dead) return { left: false, right: true };
  return { left: false, right: false };
}

function predictLanding(
  spark: BotSpark,
  opts: {
    paddleTop: number;
    worldW: number;
    speedMul: number;
    gravityMul: number;
    aegis: boolean;
  },
): Landing | null {
  let x = spark.x;
  let y = spark.y;
  let vx = spark.vx;
  let vy = spark.vy;
  const r = spark.r;
  const dt = 1 / 180;
  const gravity = 500 * opts.gravityMul;
  const maxSp = 750 * opts.speedMul;
  const rest = 0.985;
  const maxT = 7;
  const paddleY = opts.paddleTop;

  for (let t = 0; t < maxT; t += dt) {
    vy += gravity * dt;
    x += vx * dt;
    y += vy * dt;

    const sp = Math.hypot(vx, vy);
    if (sp > maxSp) {
      vx *= maxSp / sp;
      vy *= maxSp / sp;
    }

    if (x < r) {
      x = r;
      vx = Math.abs(vx) * rest;
    } else if (x > opts.worldW - r) {
      x = opts.worldW - r;
      vx = -Math.abs(vx) * rest;
    }

    if (y < r) {
      y = r;
      vy = Math.abs(vy) * rest;
    }

    if (opts.aegis && y > 800 - r - 6) {
      y = 800 - r - 6;
      vy = -Math.abs(vy) * 0.94;
    }

    if (vy > 0 && y + r >= paddleY) {
      return { x, t };
    }
  }
  return { x, t: maxT };
}

function aimForHalo(
  landX: number,
  spark: BotSpark,
  t: number,
  opts: {
    paddleWidth: number;
    paddleTop: number;
    worldW: number;
    halos: BotHalo[];
  },
): number {
  if (t > 0.95 || opts.halos.length === 0) return clampPaddle(landX, opts);

  let halo = opts.halos[0]!;
  let best = Infinity;
  for (const h of opts.halos) {
    const d = Math.abs(h.x - landX) + Math.abs(h.y - spark.y) * 0.35;
    if (d < best) {
      best = d;
      halo = h;
    }
  }

  const rise = Math.max(40, opts.paddleTop - halo.y);
  const angle = Math.atan2(halo.x - landX, rise);
  const maxAng = Math.PI * 0.42;
  const offset = Math.max(-0.78, Math.min(0.78, angle / maxAng));
  return clampPaddle(landX - offset * (opts.paddleWidth / 2), opts);
}

function catchableDrop(
  sparkT: number,
  opts: { paddleTop: number; drops: BotDrop[] },
): number | null {
  let pick: { x: number; t: number } | null = null;
  for (const drop of opts.drops) {
    const t = timeForDrop(drop, opts.paddleTop);
    if (t < 0 || t > sparkT - 0.4) continue;
    if (!pick || t < pick.t) pick = { x: drop.x, t };
  }
  return pick ? pick.x : null;
}

function timeForDrop(drop: BotDrop, paddleTop: number): number {
  let y = drop.y;
  let vy = drop.vy;
  const dt = 1 / 90;
  for (let t = 0; t < 4; t += dt) {
    vy += 420 * dt;
    y += vy * dt;
    if (y >= paddleTop) return t;
  }
  return -1;
}

function clampPaddle(x: number, opts: { paddleWidth: number; worldW: number }): number {
  const half = opts.paddleWidth / 2;
  return Math.max(half, Math.min(opts.worldW - half, x));
}
