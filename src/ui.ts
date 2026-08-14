import { COLORS, comboColor, rgba, roundRectPath } from "./fx/glow.ts";
import { px } from "./fx/font.ts";
import type { EffectHud } from "./systems/effects.ts";

function neonText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size: number,
): void {
  ctx.save();
  ctx.font = px(size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.88;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) cur = test;
    else {
      if (cur) lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function drawTitle(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  ctx.save();
  ctx.fillStyle = "rgba(12, 12, 26, 0.35)";
  ctx.fillRect(0, 0, w, h);

  neonText(ctx, "SPARK VOLLEY", w / 2, h * 0.26, COLORS.cyan, 32);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  neonText(ctx, "SPARK VOLLEY", w / 2 + Math.sin(t * 2) * 1.5, h * 0.26, COLORS.magenta, 32);
  neonText(ctx, "SPARK VOLLEY", w / 2 - Math.sin(t * 1.6) * 1.2, h * 0.26, COLORS.orange, 32);
  ctx.restore();

  ctx.font = px(10);
  ctx.textAlign = "center";
  ctx.fillStyle = rgba(COLORS.gold, 0.9);
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 8;
  ctx.fillText("KEEP THE SPARK ALIVE", w / 2, h * 0.36);
  ctx.fillText("THREAD THE GATES  CHASE THE COMBO", w / 2, h * 0.4);

  const pulse = 0.55 + Math.sin(t * 4) * 0.45;
  ctx.shadowBlur = 12 * pulse;
  ctx.fillStyle = rgba(COLORS.cyan, 0.55 + pulse * 0.45);
  ctx.font = px(14);
  ctx.fillText("PRESS SPACE", w / 2, h * 0.5);

  drawControls(ctx, w / 2, h * 0.62, 1);
  ctx.restore();
}

export function drawControls(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  alpha: number,
): void {
  const lines = [
    "LEFT / A   PADDLE LEFT",
    "RIGHT / D  PADDLE RIGHT",
    "SPACE      SERVE / CONTINUE",
    "P / ESC    PAUSE / EXIT RULES",
    "M MUTE     N NEXT TRACK",
  ];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = px(8);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = rgba(COLORS.cyan, 0.85);
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 6;
  lines.forEach((line, i) => {
    ctx.fillText(line, cx, cy + i * 22);
  });
  ctx.restore();
}

export function drawHud(
  ctx: CanvasRenderingContext2D,
  w: number,
  score: number,
  best: number,
  combo: number,
  muted: boolean,
  hintAlpha: number,
  waitingServe: boolean,
  effects: EffectHud[],
): void {
  ctx.save();
  ctx.textBaseline = "top";
  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 10;

  ctx.textAlign = "left";
  ctx.font = px(16);
  ctx.fillText(score.toLocaleString(), 28, 20);

  ctx.font = px(8);
  ctx.fillStyle = rgba(COLORS.magenta, 0.9);
  ctx.shadowColor = COLORS.magenta;
  ctx.fillText(`BEST  ${best.toLocaleString()}`, 28, 48);

  ctx.textAlign = "right";
  ctx.fillStyle = comboColor(combo);
  ctx.shadowColor = comboColor(combo);
  ctx.font = px(14);
  ctx.fillText(combo > 0 ? `x${combo}` : "x1", w - 28, 22);

  ctx.font = px(8);
  ctx.fillText("COMBO", w - 28, 48);

  if (muted) {
    ctx.textAlign = "center";
    ctx.fillStyle = rgba(COLORS.gold, 0.8);
    ctx.shadowBlur = 0;
    ctx.font = px(8);
    ctx.fillText("MUTED", w / 2, 22);
  }

  ctx.restore();

  drawComboMeter(ctx, w, combo);
  drawEffectTimers(ctx, w, effects);

  if (hintAlpha > 0) {
    drawControls(ctx, w / 2, 118, hintAlpha * 0.9);
    if (waitingServe) {
      ctx.save();
      ctx.globalAlpha = hintAlpha;
      ctx.textAlign = "center";
      ctx.font = px(12);
      ctx.fillStyle = COLORS.gold;
      ctx.shadowColor = COLORS.gold;
      ctx.shadowBlur = 10;
      ctx.fillText("SPACE TO SERVE", w / 2, 96);
      ctx.restore();
    }
  }
}

function drawEffectTimers(
  ctx: CanvasRenderingContext2D,
  w: number,
  effects: EffectHud[],
): void {
  if (effects.length === 0) return;
  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.font = px(8);
  effects.forEach((fx, i) => {
    const y = 72 + i * 20;
    ctx.fillStyle = fx.color;
    ctx.shadowColor = fx.color;
    ctx.shadowBlur = 8;
    ctx.fillText(fx.remaining < 0 ? `${fx.name}  ON` : `${fx.name}  ${fx.remaining.toFixed(0)}S`, w - 28, y);
  });
  ctx.restore();
}

function drawComboMeter(ctx: CanvasRenderingContext2D, w: number, combo: number): void {
  const mw = 220;
  const mh = 8;
  const x = w / 2 - mw / 2;
  const y = 24;
  const color = comboColor(combo);
  const fill = Math.min(1, combo / 20);

  ctx.save();
  roundRectPath(ctx, x, y, mw, mh, 4);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  if (fill > 0) {
    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, x, y, mw, mh, 4);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillRect(x, y, mw * fill, mh);
    ctx.restore();
  }
  ctx.restore();
}

const RULE_LINES = [
  "Volley the spark. Thread halo gates.",
  "Don't let the light fall.",
  "A miss ends the round. Thread a gate",
  "before the next paddle hit to keep combo.",
  "Catch capsules with the paddle:",
  "TWIN SPARK - keep either spark alive.",
  "SLOW FIELD - the spark eases.",
  "LOCK GATES - new hoops stay put.",
  "AEGIS - the floor saves a miss.",
];

function drawRuleList(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  maxWidth: number,
): void {
  ctx.font = px(8);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  let yy = y;
  for (const line of RULE_LINES) {
    const upper = line.toUpperCase();
    const accent = upper.includes("TWIN")
      ? COLORS.magenta
      : upper.includes("SLOW")
        ? COLORS.cyan
        : upper.includes("LOCK")
          ? "#ffffff"
          : upper.includes("AEGIS")
            ? COLORS.orange
            : rgba("#ffffff", 0.88);
    ctx.fillStyle = accent;
    ctx.shadowColor = typeof accent === "string" && accent.startsWith("#") ? accent : COLORS.cyan;
    ctx.shadowBlur = 4;
    const wrapped = wrapText(ctx, line.toUpperCase(), maxWidth);
    for (const row of wrapped) {
      ctx.fillText(row, x, yy);
      yy += 18;
    }
  }
}

export function drawRules(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  ctx.save();
  ctx.fillStyle = "rgba(5, 5, 12, 0.82)";
  ctx.fillRect(0, 0, w, h);

  const cardW = Math.min(980, w - 60);
  const cardH = Math.min(680, h - 50);
  const x = (w - cardW) / 2;
  const y = (h - cardH) / 2;
  roundRectPath(ctx, x, y, cardW, cardH, 12);
  ctx.fillStyle = "rgba(12, 12, 26, 0.94)";
  ctx.fill();
  ctx.strokeStyle = rgba(COLORS.orange, 0.85);
  ctx.shadowColor = COLORS.orange;
  ctx.shadowBlur = 18;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  neonText(ctx, "RULES", w / 2, y + 42, COLORS.cyan, 28);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  neonText(ctx, "RULES", w / 2 + 1.2, y + 42, COLORS.orange, 28);
  ctx.restore();

  drawRuleList(ctx, x + 40, y + 72, cardW - 80);
  drawControls(ctx, w / 2, y + cardH - 150, 0.95);

  const pulse = 0.55 + Math.sin(t * 4) * 0.45;
  ctx.textAlign = "center";
  ctx.font = px(10);
  ctx.fillStyle = rgba(COLORS.gold, 0.55 + pulse * 0.45);
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 10;
  ctx.fillText("SPACE TO CONTINUE    ESC TO EXIT", w / 2, y + cardH - 28);
  ctx.restore();
}

export function drawPause(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.fillStyle = "rgba(5, 5, 12, 0.78)";
  ctx.fillRect(0, 0, w, h);
  neonText(ctx, "PAUSED", w / 2, h * 0.12, COLORS.cyan, 28);

  ctx.font = px(10);
  ctx.textAlign = "center";
  ctx.fillStyle = rgba(COLORS.gold, 0.95);
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 8;
  ctx.fillText("SPACE OR ESC TO CONTINUE", w / 2, h * 0.2);

  drawRuleList(ctx, w / 2 - 420, h * 0.26, 840);
  drawControls(ctx, w / 2, h * 0.78, 0.9);
  ctx.restore();
}

export function drawBlocked(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  musicOn: boolean,
): void {
  ctx.save();
  ctx.fillStyle = "rgba(5, 5, 12, 0.72)";
  ctx.fillRect(0, 0, w, h);

  const cardW = Math.min(860, w - 80);
  const cardH = 420;
  const x = (w - cardW) / 2;
  const y = (h - cardH) / 2;
  roundRectPath(ctx, x, y, cardW, cardH, 12);
  ctx.fillStyle = "rgba(12, 12, 26, 0.94)";
  ctx.fill();
  ctx.strokeStyle = rgba(COLORS.orange, 0.9);
  ctx.shadowColor = COLORS.orange;
  ctx.shadowBlur = 22;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  neonText(ctx, "DESKTOP ONLY", w / 2, y + 70, COLORS.cyan, 22);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  neonText(ctx, "DESKTOP ONLY", w / 2 + 1.4, y + 70, COLORS.magenta, 22);
  ctx.restore();

  ctx.font = px(10);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = rgba("#ffffff", 0.9);
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 6;
  const body = [
    "SPARK VOLLEY NEEDS A KEYBOARD.",
    "PHONES AND TABLETS CANNOT PLAY.",
    "",
    "OPEN THIS LINK ON A COMPUTER",
    "IN YOUR BROWSER TO START.",
  ];
  body.forEach((line, i) => {
    ctx.fillStyle = line.includes("COMPUTER") || line.includes("BROWSER") ? COLORS.orange : rgba("#ffffff", 0.9);
    ctx.fillText(line, w / 2, y + 120 + i * 22);
  });

  const pulse = 0.55 + Math.sin(t * 4) * 0.45;
  ctx.font = px(10);
  ctx.fillStyle = rgba(COLORS.gold, 0.55 + pulse * 0.45);
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 10;
  ctx.fillText(musicOn ? "SOUNDTRACK ONLINE" : "TAP ANYWHERE FOR MUSIC", w / 2, y + cardH - 48);
  ctx.restore();
}

export function drawGameOver(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  score: number,
  best: number,
  maxCombo: number,
  copyFlash: number,
  t: number,
): void {
  ctx.save();
  ctx.fillStyle = "rgba(12, 12, 26, 0.78)";
  ctx.fillRect(0, 0, w, h);

  neonText(ctx, "LIGHTS OUT", w / 2, h * 0.24, COLORS.magenta, 28);

  ctx.textAlign = "center";
  ctx.font = px(28);
  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 16;
  ctx.fillText(score.toLocaleString(), w / 2, h * 0.4);

  ctx.font = px(10);
  ctx.fillStyle = rgba(COLORS.gold, 0.95);
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 8;
  ctx.fillText(`BEST  ${best.toLocaleString()}    PEAK  x${maxCombo}`, w / 2, h * 0.5);

  const pulse = 0.55 + Math.sin(t * 4) * 0.45;
  ctx.fillStyle = rgba(COLORS.cyan, 0.55 + pulse * 0.45);
  ctx.shadowColor = COLORS.cyan;
  ctx.font = px(12);
  ctx.fillText("PRESS SPACE TO RETRY", w / 2, h * 0.62);

  ctx.font = px(8);
  ctx.fillStyle = rgba("#ffffff", 0.7 + copyFlash * 0.3);
  ctx.shadowBlur = 0;
  ctx.fillText(copyFlash > 0 ? "COPIED TO CLIPBOARD" : "C  COPY SCORE LINE", w / 2, h * 0.72);
  ctx.restore();
}

export function drawNowPlaying(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  label: string | null,
  muted: boolean,
): void {
  if (!label) return;
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.globalAlpha = muted ? 0.45 : 0.95;
  ctx.fillStyle = COLORS.orange;
  ctx.shadowColor = COLORS.orange;
  ctx.shadowBlur = muted ? 0 : 8;
  ctx.font = px(8);
  ctx.fillText("NOW PLAYING", 28, h - 44);
  ctx.fillStyle = muted ? rgba("#ffffff", 0.7) : "#ffffff";
  ctx.shadowBlur = 0;
  ctx.font = px(8);
  const text = muted ? `${label}  (MUTED)` : label;
  const max = w - 56;
  ctx.fillText(ctx.measureText(text).width > max ? `${text.slice(0, 28)}...` : text, 28, h - 22);
  ctx.restore();
}

export function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.78);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
