import { Halo } from "./entities/halo.ts";
import { POWERUP_META, PowerupDrop, type PowerupKind } from "./entities/powerup.ts";
import { COLORS, comboColor, drawGlowCircle, rgba, roundRectPath } from "./fx/glow.ts";
import { px } from "./fx/font.ts";
import type { GameSettings } from "./settings.ts";
import type { EffectHud } from "./systems/effects.ts";

const rulesScoreHalo = new Halo();
const rulesComboHalo = new Halo();

export type RulesPage = 0 | 1 | 2 | 3 | 4;
export const RULES_LAST_PAGE = 4;

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
    "SPACE      SERVE / START",
    "P / ESC    OPTIONS",
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
    ctx.fillText(line, cx, cy + i * 26);
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
  ctx.fillText(`BEST  ${best.toLocaleString()}`, 28, 52);

  ctx.textAlign = "right";
  ctx.fillStyle = comboColor(combo);
  ctx.shadowColor = comboColor(combo);
  ctx.font = px(14);
  ctx.fillText(combo > 0 ? `x${combo}` : "x1", w - 28, 22);

  ctx.font = px(8);
  ctx.fillText("COMBO", w - 28, 52);

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
    drawControls(ctx, w / 2, 124, hintAlpha * 0.9);
    if (waitingServe) {
      ctx.save();
      ctx.globalAlpha = hintAlpha;
      ctx.textAlign = "center";
      ctx.font = px(12);
      ctx.fillStyle = COLORS.gold;
      ctx.shadowColor = COLORS.gold;
      ctx.shadowBlur = 10;
      ctx.fillText("SPACE TO SERVE", w / 2, 90);
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
    const y = 78 + i * 24;
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

function dimScreen(ctx: CanvasRenderingContext2D, w: number, h: number, alpha = 0.82): void {
  ctx.fillStyle = `rgba(5, 5, 12, ${alpha})`;
  ctx.fillRect(0, 0, w, h);
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stroke: string,
): void {
  roundRectPath(ctx, x, y, w, h, 12);
  ctx.fillStyle = "rgba(12, 12, 26, 0.94)";
  ctx.fill();
  ctx.strokeStyle = rgba(stroke, 0.85);
  ctx.shadowColor = stroke;
  ctx.shadowBlur = 18;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawCardFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  roundRectPath(ctx, x, y, w, h, 10);
  ctx.fillStyle = "rgba(8, 8, 20, 0.92)";
  ctx.fill();
  ctx.strokeStyle = rgba(color, 0.8);
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawSparkIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPaddleIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  roundRectPath(ctx, x - 48, y - 10, 96, 20, 8);
  ctx.fillStyle = rgba(color, 0.22);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.fillStyle = rgba(COLORS.orange, 0.85);
  roundRectPath(ctx, x - 44, y - 6, 12, 12, 4);
  ctx.fill();
  roundRectPath(ctx, x + 32, y - 6, 12, 12, 4);
  ctx.fill();
  ctx.restore();
}

function drawHaloIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = rgba("#ffffff", 0.7);
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPillIcon(ctx: CanvasRenderingContext2D, x: number, y: number, kind: PowerupKind): void {
  const meta = POWERUP_META[kind];
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = meta.color;
  ctx.shadowBlur = 16;
  roundRectPath(ctx, -28, -16, 56, 32, 14);
  ctx.fillStyle = rgba(meta.color, 0.28);
  ctx.fill();
  ctx.strokeStyle = meta.color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.font = px(14);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(meta.letter, 0, 1);
  ctx.restore();
}

function drawInfoCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  title: string,
  body: string,
  icon: (ctx: CanvasRenderingContext2D, cx: number, cy: number) => void,
  layout?: { iconY?: number; titleY?: number; bodyY?: number; titleSize?: number; lineH?: number; wrapPad?: number },
): void {
  const iconY = layout?.iconY ?? 58;
  const titleY = layout?.titleY ?? 112;
  const bodyY = layout?.bodyY ?? 140;
  const titleSize = layout?.titleSize ?? 18;
  const lineH = layout?.lineH ?? 26;
  const wrapPad = layout?.wrapPad ?? 36;
  drawCardFrame(ctx, x, y, w, h, color);
  icon(ctx, x + w / 2, y + iconY);
  neonText(ctx, title, x + w / 2, y + titleY, color, titleSize);
  ctx.save();
  ctx.font = px(12);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = rgba("#ffffff", 0.88);
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;
  const lines = wrapText(ctx, body.toUpperCase(), w - wrapPad);
  lines.forEach((line, i) => {
    ctx.fillText(line, x + w / 2, y + bodyY + i * lineH);
  });
  ctx.restore();
}

function drawDemoPaddle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  color: string,
  flash = 0,
): void {
  const height = Math.max(12, width * 0.13);
  const glow = flash > 0.15 ? COLORS.gold : color;
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 14 + flash * 22;
  roundRectPath(ctx, cx - width / 2, cy - height / 2, width, height, 8);
  ctx.fillStyle = rgba(glow, 0.2 + flash * 0.35);
  ctx.fill();
  ctx.strokeStyle = glow;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.fillStyle = rgba(COLORS.orange, 0.85 + flash * 0.15);
  const cap = Math.max(10, width * 0.12);
  roundRectPath(ctx, cx - width / 2 + 4, cy - height / 2 + 3, cap, height - 6, 4);
  ctx.fill();
  roundRectPath(ctx, cx + width / 2 - cap - 4, cy - height / 2 + 3, cap, height - 6, 4);
  ctx.fill();
  ctx.restore();
}

function drawDemoBurst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  age: number,
): void {
  const span = 0.55;
  if (age < 0 || age > span) return;
  const a = 1 - age / span;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2;
    const dist = 18 + age * 120;
    ctx.beginPath();
    ctx.arc(x + Math.cos(ang) * dist, y + Math.sin(ang) * dist, 2.2 + a * 2, 0, Math.PI * 2);
    ctx.fillStyle = rgba(color, a * 0.9);
    ctx.fill();
  }
  ctx.restore();
}

function drawScoreDemo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
): void {
  drawCardFrame(ctx, x, y, w, h, COLORS.magenta);

  const captionH = 78;
  const stageX = x + 16;
  const stageY = y + 16;
  const stageW = w - 32;
  const stageH = h - captionH - 20;

  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, stageX, stageY, stageW, stageH, 8);
  ctx.clip();

  const cx = stageX + stageW / 2;
  const period = 3;
  const u = ((t % period) + period) % period;
  const hold = 0.32;
  const fly = 1.18;
  const scoreAt = hold + fly;

  const paddleY = stageY + stageH - 28;
  const startY = paddleY - 18;
  const haloY = stageY + stageH * 0.38;
  const throughY = haloY - 10;

  rulesScoreHalo.x = cx;
  rulesScoreHalo.y = haloY;
  rulesScoreHalo.outerR = 52;
  rulesScoreHalo.innerR = 30;
  rulesScoreHalo.rotation = t * 0.85;
  rulesScoreHalo.phase = t * 2.4;
  rulesScoreHalo.cooldown = 0;
  rulesScoreHalo.accent = COLORS.magenta;

  let sparkY = startY;
  let sparkOn = true;
  let paddleFlash = 0;
  if (u < hold) {
    sparkY = startY;
    paddleFlash = Math.max(0, 1 - u / hold) * 0.6;
  } else if (u < scoreAt) {
    const p = (u - hold) / fly;
    const ease = 1 - (1 - p) * (1 - p);
    sparkY = startY + (throughY - startY) * ease;
    if (p < 0.12) paddleFlash = 1 - p / 0.12;
  } else {
    const p = Math.min(1, (u - scoreAt) / 0.4);
    sparkY = throughY - 48 * p;
    sparkOn = p < 0.95;
  }

  const scored = u >= scoreAt;
  const scoreAge = u - scoreAt;
  const haloFlash = scored ? Math.max(0, 1 - scoreAge / 0.45) : 0;
  if (haloFlash > 0) rulesScoreHalo.accent = COLORS.gold;

  rulesScoreHalo.draw(ctx);
  if (haloFlash > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(COLORS.gold, haloFlash);
    ctx.shadowColor = COLORS.gold;
    ctx.shadowBlur = 22 * haloFlash;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, haloY, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawDemoPaddle(ctx, cx, paddleY, 110, COLORS.orange, paddleFlash);
  if (sparkOn) drawGlowCircle(ctx, cx, sparkY, 10, COLORS.cyan, 1);
  drawDemoBurst(ctx, cx, haloY, COLORS.gold, scoreAge);

  if (scored && scoreAge < 1.25) {
    ctx.save();
    ctx.font = px(14);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = Math.max(0, 1 - scoreAge / 1.25);
    ctx.fillStyle = COLORS.gold;
    ctx.shadowColor = COLORS.gold;
    ctx.shadowBlur = 12;
    ctx.fillText("+100", cx, haloY - 28 - scoreAge * 40);
    ctx.restore();
  }
  ctx.restore();

  ctx.save();
  ctx.font = px(12);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = rgba("#ffffff", 0.9);
  ctx.shadowColor = COLORS.magenta;
  ctx.shadowBlur = 4;
  const caption =
    "SEND THE SPARK THROUGH THE MIDDLE OF A RING. THAT IS A POINT. DO IT AGAIN BEFORE YOU BOUNCE TO KEEP YOUR COMBO.";
  const capLines = wrapText(ctx, caption, w - 48);
  capLines.forEach((line, i) => {
    ctx.fillText(line, x + w / 2, y + h - captionH + 8 + i * 26);
  });
  ctx.restore();
}

function drawComboDemo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
): void {
  drawCardFrame(ctx, x, y, w, h, COLORS.gold);

  const captionH = 90;
  const stageX = x + 16;
  const stageY = y + 16;
  const stageW = w - 32;
  const stageH = h - captionH - 20;

  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, stageX, stageY, stageW, stageH, 8);
  ctx.clip();

  const cx = stageX + stageW / 2;
  const period = 4.4;
  const u = ((t % period) + period) % period;

  const paddleY = stageY + stageH - 28;
  const startY = paddleY - 18;
  const haloY = stageY + stageH * 0.36;
  const throughY = haloY - 10;
  const topY = throughY - 36;

  rulesComboHalo.x = cx;
  rulesComboHalo.y = haloY;
  rulesComboHalo.outerR = 52;
  rulesComboHalo.innerR = 30;
  rulesComboHalo.rotation = t * 0.9;
  rulesComboHalo.phase = t * 2.4;
  rulesComboHalo.cooldown = 0;

  const t1Hold = 0.28;
  const t1Fly = 1.05;
  const t1Score = t1Hold + t1Fly;
  const t1Down = t1Score + 0.55;
  const t2Bounce = t1Down + 0.22;
  const t2Fly = 0.95;
  const t2Score = t2Bounce + t2Fly;

  let sparkY = startY;
  let sparkOn = true;
  let paddleFlash = 0;
  let combo = 0;
  let popText = "";
  let popAge = 0;
  let popColor: string = COLORS.cyan;

  if (u < t1Hold) {
    sparkY = startY;
    paddleFlash = Math.max(0, 1 - u / t1Hold) * 0.5;
  } else if (u < t1Score) {
    const p = (u - t1Hold) / t1Fly;
    sparkY = startY + (throughY - startY) * (1 - (1 - p) * (1 - p));
    if (p < 0.12) paddleFlash = 1 - p / 0.12;
  } else if (u < t1Down) {
    combo = 1;
    popText = "+100";
    popAge = u - t1Score;
    popColor = COLORS.cyan;
    const p = (u - t1Score) / (t1Down - t1Score);
    sparkY = throughY + (startY - throughY) * (p * p);
  } else if (u < t2Bounce) {
    combo = 1;
    sparkY = startY;
    paddleFlash = 1;
  } else if (u < t2Score) {
    combo = 1;
    const p = (u - t2Bounce) / t2Fly;
    sparkY = startY + (throughY - startY) * (1 - (1 - p) * (1 - p));
    if (p < 0.12) paddleFlash = 1 - p / 0.12;
  } else {
    combo = 2;
    popText = "+200";
    popAge = u - t2Score;
    popColor = COLORS.gold;
    const p = Math.min(1, (u - t2Score) / 0.45);
    sparkY = throughY + (topY - throughY) * p;
    sparkOn = p < 0.98;
  }

  rulesComboHalo.accent = combo >= 2 ? COLORS.gold : COLORS.cyan;
  rulesComboHalo.draw(ctx);
  if (combo >= 2) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(COLORS.gold, 0.85);
    ctx.shadowColor = COLORS.gold;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, haloY, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawDemoPaddle(ctx, cx, paddleY, 110, COLORS.orange, paddleFlash);
  if (sparkOn) {
    drawGlowCircle(ctx, cx, sparkY, 10, combo >= 2 ? COLORS.gold : COLORS.cyan, 1);
  }
  if (u >= t1Score && u < t1Score + 0.55) drawDemoBurst(ctx, cx, haloY, COLORS.cyan, u - t1Score);
  if (u >= t2Score) drawDemoBurst(ctx, cx, haloY, COLORS.gold, u - t2Score);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = px(16);
  const labelColor = combo >= 2 ? COLORS.gold : COLORS.cyan;
  ctx.fillStyle = labelColor;
  ctx.shadowColor = labelColor;
  ctx.shadowBlur = 12;
  ctx.fillText(`COMBO x${combo}`, cx, stageY + 28);
  ctx.restore();

  if (popText && popAge < 1.1) {
    ctx.save();
    ctx.font = px(14);
    ctx.textAlign = "center";
    ctx.globalAlpha = Math.max(0, 1 - popAge / 1.1);
    ctx.fillStyle = popColor;
    ctx.shadowColor = popColor;
    ctx.shadowBlur = 12;
    ctx.fillText(popText, cx, haloY - 28 - popAge * 36);
    ctx.restore();
  }
  ctx.restore();

  ctx.save();
  ctx.font = px(12);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = rgba("#ffffff", 0.9);
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 4;
  const caption =
    "HIT TWO RINGS IN A ROW BEFORE YOU BOUNCE. THAT IS A COMBO. YOU GET MORE POINTS EACH TIME.";
  wrapText(ctx, caption, w - 48).forEach((line, i) => {
    ctx.fillText(line, x + w / 2, y + h - captionH + 8 + i * 26);
  });
  ctx.restore();
}

function drawMissDemo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
): void {
  drawCardFrame(ctx, x, y, w, h, COLORS.magenta);

  const captionH = 90;
  const stageX = x + 16;
  const stageY = y + 16;
  const stageW = w - 32;
  const stageH = h - captionH - 20;

  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, stageX, stageY, stageW, stageH, 8);
  ctx.clip();

  const cx = stageX + stageW / 2;
  const period = 3.4;
  const u = ((t % period) + period) % period;

  const paddleY = stageY + stageH - 28;
  const startY = paddleY - 18;
  const peakY = stageY + stageH * 0.22;
  const missY = paddleY + 48;

  const hold = 0.28;
  const up = 0.85;
  const down = 1.15;
  const fadeAt = hold + up + down;

  let sparkX = cx;
  let sparkY = startY;
  let sparkOn = true;
  let fade = 1;
  let paddleX = cx;
  let lightsOut = false;

  if (u < hold) {
    sparkY = startY;
  } else if (u < hold + up) {
    const p = (u - hold) / up;
    sparkY = startY + (peakY - startY) * (1 - (1 - p) * (1 - p));
  } else if (u < fadeAt) {
    const p = (u - hold - up) / down;
    sparkY = peakY + (missY - peakY) * (p * p);
    paddleX = cx - Math.min(1, p / 0.45) * 130;
    sparkX = cx + 8 * p;
  } else {
    lightsOut = true;
    const p = Math.min(1, (u - fadeAt) / 0.9);
    sparkY = missY - 30 * p;
    sparkX = cx + 12;
    paddleX = cx - 130;
    fade = Math.max(0, 1 - p);
    sparkOn = fade > 0.05;
  }

  drawDemoPaddle(ctx, paddleX, paddleY, 110, COLORS.orange, 0);
  if (sparkOn) drawGlowCircle(ctx, sparkX, sparkY, 10, COLORS.magenta, fade);

  if (lightsOut) {
    const age = u - fadeAt;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 12; i++) {
      const drift = age * (40 + i * 6);
      ctx.beginPath();
      ctx.arc(sparkX + (i - 6) * 7, sparkY - drift, 2, 0, Math.PI * 2);
      ctx.fillStyle = rgba(COLORS.magenta, Math.max(0, 0.7 - age * 0.55));
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.font = px(18);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = Math.min(1, age / 0.25);
    ctx.fillStyle = COLORS.magenta;
    ctx.shadowColor = COLORS.magenta;
    ctx.shadowBlur = 16;
    ctx.fillText("LIGHTS OUT", cx, stageY + stageH * 0.42);
    ctx.restore();
  }
  ctx.restore();

  ctx.save();
  ctx.font = px(12);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = rgba("#ffffff", 0.9);
  ctx.shadowColor = COLORS.magenta;
  ctx.shadowBlur = 4;
  const caption =
    "IF THE SPARK FALLS PAST YOUR PADDLE, THE ROUND ENDS. THAT IS HOW YOU LOSE. PRESS SPACE TO TRY AGAIN.";
  wrapText(ctx, caption, w - 48).forEach((line, i) => {
    ctx.fillText(line, x + w / 2, y + h - captionH + 8 + i * 26);
  });
  ctx.restore();
}

function drawCatchDemo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
): void {
  drawCardFrame(ctx, x, y, w, h, COLORS.orange);

  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, x + 8, y + 8, w - 16, h - 16, 8);
  ctx.clip();

  const period = 2.8;
  const loop = Math.floor(t / period);
  const u = ((t % period) + period) % period;
  const kinds: PowerupKind[] = ["twin", "slow", "freeze", "aegis"];
  const kind = kinds[((loop % kinds.length) + kinds.length) % kinds.length]!;
  const color = POWERUP_META[kind].color;

  const cx = x + w / 2;
  const dropStartY = y + 28;
  const paddleY = y + h - 28;
  const catchY = paddleY - 16;
  const fallDur = 1.35;
  const startPad = x + 56;
  const dropX = cx + Math.sin(t * 3.2) * 10;

  let dropY = dropStartY;
  let paddleX = startPad;
  let caught = false;
  let catchAge = 0;
  if (u < fallDur) {
    const p = u / fallDur;
    dropY = dropStartY + (catchY - dropStartY) * p * p;
    paddleX = startPad + (dropX - startPad) * Math.min(1, p / 0.82);
  } else {
    dropY = catchY;
    paddleX = dropX;
    caught = true;
    catchAge = u - fallDur;
  }

  const flash = caught ? Math.max(0, 1 - catchAge / 0.45) : 0;
  drawDemoPaddle(ctx, paddleX, paddleY, 100, COLORS.orange, flash);

  if (!caught || catchAge < 0.22) {
    const drop = new PowerupDrop(kind, dropX, dropY);
    drop.phase = t * 4;
    drop.draw(ctx);
  }

  if (caught && catchAge < 1.15) {
    ctx.save();
    ctx.font = px(14);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = Math.max(0, 1 - catchAge / 1.15);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.fillText("GOT IT!", cx, paddleY - 36 - catchAge * 28);
    ctx.restore();
    drawDemoBurst(ctx, dropX, catchY, color, catchAge);
  }
  ctx.restore();
}

export function drawRules(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  page: RulesPage,
  fromMenu: boolean,
): void {
  ctx.save();
  dimScreen(ctx, w, h, 0.82);

  const panelW = Math.min(1180, w - 40);
  const panelH = Math.min(700, h - 40);
  const px0 = (w - panelW) / 2;
  const py0 = (h - panelH) / 2;
  drawPanel(ctx, px0, py0, panelW, panelH, COLORS.orange);

  const headings = [
    "HOW TO PLAY",
    "HOW YOU SCORE",
    "COMBOS",
    "IF YOU MISS",
    "BONUSES",
  ] as const;
  const heading = headings[page];
  neonText(ctx, heading, w / 2, py0 + 48, COLORS.cyan, 22);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  neonText(ctx, heading, w / 2 + 1.2, py0 + 48, COLORS.orange, 22);
  ctx.restore();

  const footerReserve = 108;
  const contentTop = py0 + 88;
  const contentBottom = py0 + panelH - footerReserve;

  if (page === 0) {
    const gap = 18;
    const cardW = 360;
    const cardH = Math.min(420, contentBottom - contentTop);
    const total = cardW * 3 + gap * 2;
    let x = w / 2 - total / 2;
    const y = contentTop;
    const playLayout = { wrapPad: 40, lineH: 26, bodyY: 138 };
    drawInfoCard(
      ctx,
      x,
      y,
      cardW,
      cardH,
      COLORS.orange,
      "YOU",
      "THIS IS YOUR PADDLE. USE THE ARROWS OR A AND D TO MOVE. BOUNCE THE LIGHT BACK UP.",
      (c, cx, cy) => drawPaddleIcon(c, cx, cy, COLORS.orange),
      playLayout,
    );
    x += cardW + gap;
    drawInfoCard(
      ctx,
      x,
      y,
      cardW,
      cardH,
      COLORS.cyan,
      "THE LIGHT",
      "THIS GLOWING BALL IS THE SPARK. DO NOT LET IT FALL PAST YOUR PADDLE.",
      (c, cx, cy) => drawSparkIcon(c, cx, cy, COLORS.cyan),
      playLayout,
    );
    x += cardW + gap;
    drawInfoCard(
      ctx,
      x,
      y,
      cardW,
      cardH,
      COLORS.magenta,
      "THE RINGS",
      "SEND THE SPARK THROUGH THE HOLE IN A RING TO SCORE. HITS IN A ROW MAKE A COMBO.",
      (c, cx, cy) => drawHaloIcon(c, cx, cy, COLORS.magenta),
      playLayout,
    );
  } else if (page === 1) {
    const demoW = Math.min(1040, panelW - 56);
    const demoH = contentBottom - contentTop;
    drawScoreDemo(ctx, w / 2 - demoW / 2, contentTop, demoW, demoH, t);
  } else if (page === 2) {
    const demoW = Math.min(1040, panelW - 56);
    const demoH = contentBottom - contentTop;
    drawComboDemo(ctx, w / 2 - demoW / 2, contentTop, demoW, demoH, t);
  } else if (page === 3) {
    const demoW = Math.min(1040, panelW - 56);
    const demoH = contentBottom - contentTop;
    drawMissDemo(ctx, w / 2 - demoW / 2, contentTop, demoW, demoH, t);
  } else {
    const kinds: PowerupKind[] = ["twin", "slow", "freeze", "aegis"];
    const blurb: Record<PowerupKind, string> = {
      twin: "A SECOND SPARK APPEARS. YOU ONLY NEED TO SAVE ONE.",
      slow: "THE SPARK MOVES SLOWER FOR A FEW SECONDS. EASIER TO CATCH.",
      freeze: "NEW RINGS STILL APPEAR, BUT THEY STAY STILL.",
      aegis: "IF YOU MISS, THE FLOOR BOUNCES THE SPARK BACK. ONLY FOR A FEW SECONDS.",
    };
    const demoH = 168;
    const demoW = Math.min(1040, panelW - 56);
    drawCatchDemo(ctx, w / 2 - demoW / 2, contentTop, demoW, demoH, t);

    const gap = 14;
    const cardW = 262;
    const cardY = contentTop + demoH + 14;
    const cardH = Math.max(200, contentBottom - cardY);
    const total = cardW * 4 + gap * 3;
    let x = w / 2 - total / 2;
    const compact = {
      iconY: 36,
      titleY: 78,
      bodyY: 100,
      titleSize: 14,
      lineH: 22,
      wrapPad: 22,
    };
    for (const kind of kinds) {
      const meta = POWERUP_META[kind];
      drawInfoCard(
        ctx,
        x,
        cardY,
        cardW,
        cardH,
        meta.color,
        meta.name.toUpperCase(),
        blurb[kind],
        (c, cx, cy) => drawPillIcon(c, cx, cy, kind),
        compact,
      );
      x += cardW + gap;
    }
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = px(12);
  ctx.fillStyle = rgba(COLORS.cyan, 0.9);
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 8;
  ctx.fillText(`${page + 1}/${RULES_LAST_PAGE + 1}`, w / 2, py0 + panelH - 78);
  ctx.font = px(10);
  ctx.fillStyle = rgba("#ffffff", 0.8);
  ctx.shadowBlur = 0;
  ctx.fillText("LEFT / RIGHT   A / D", w / 2, py0 + panelH - 50);

  const pulse = 0.55 + Math.sin(t * 4) * 0.45;
  ctx.font = px(12);
  ctx.fillStyle = rgba(COLORS.gold, 0.55 + pulse * 0.45);
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 10;
  const footer = fromMenu
    ? "ESC BACK TO OPTIONS"
    : page < RULES_LAST_PAGE
      ? "SPACE NEXT"
      : "SPACE CONTINUE";
  ctx.fillText(footer, w / 2, py0 + panelH - 24);
  ctx.restore();
}

export function drawOptions(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  fromPlay: boolean,
  copyFlash: number,
): void {
  ctx.save();
  dimScreen(ctx, w, h, 0.78);

  const cardW = 640;
  const cardH = 460;
  const x = (w - cardW) / 2;
  const y = (h - cardH) / 2;
  drawPanel(ctx, x, y, cardW, cardH, COLORS.cyan);

  neonText(ctx, "OPTIONS", w / 2, y + 56, COLORS.cyan, 22);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  neonText(ctx, "OPTIONS", w / 2 + 1.2, y + 56, COLORS.magenta, 22);
  ctx.restore();

  const rows = [
    { label: "SETTINGS", key: "S", color: COLORS.cyan },
    { label: "RULES", key: "R", color: COLORS.orange },
    { label: "COPY STATS", key: "C", color: COLORS.magenta },
  ];
  rows.forEach((row, i) => {
    const ry = y + 130 + i * 70;
    roundRectPath(ctx, x + 48, ry, cardW - 96, 56, 8);
    ctx.fillStyle = rgba(row.color, 0.1);
    ctx.fill();
    ctx.strokeStyle = rgba(row.color, 0.7);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = px(14);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = row.color;
    ctx.shadowColor = row.color;
    ctx.shadowBlur = 10;
    ctx.fillText(row.label, x + 72, ry + 28);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 0;
    ctx.font = px(14);
    ctx.fillText(row.key, x + cardW - 72, ry + 28);
  });

  const pulse = 0.55 + Math.sin(t * 4) * 0.45;
  ctx.textAlign = "center";
  ctx.font = px(12);
  ctx.fillStyle = rgba(COLORS.gold, 0.55 + pulse * 0.45);
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 10;
  ctx.fillText(fromPlay ? "ESC / P  RESUME" : "ESC / P  TITLE", w / 2, y + cardH - 48);

  ctx.font = px(10);
  ctx.shadowBlur = 0;
  ctx.fillStyle = rgba("#ffffff", 0.7 + copyFlash * 0.3);
  ctx.fillText(copyFlash > 0 ? "COPIED TO CLIPBOARD" : "", w / 2, y + cardH - 22);
  ctx.restore();
}

export function drawSettings(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  settings: GameSettings,
  row: 0 | 1 | 2,
): void {
  ctx.save();
  dimScreen(ctx, w, h, 0.82);

  const cardW = 720;
  const cardH = 500;
  const x = (w - cardW) / 2;
  const y = (h - cardH) / 2;
  drawPanel(ctx, x, y, cardW, cardH, COLORS.gold);

  neonText(ctx, "SETTINGS", w / 2, y + 52, COLORS.gold, 22);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  neonText(ctx, "SETTINGS", w / 2 + 1.2, y + 52, COLORS.cyan, 22);
  ctx.restore();

  drawSettingBar(ctx, x + 48, y + 120, cardW - 96, "MUSIC", settings.music, 10, row === 0, COLORS.cyan);
  drawSettingBar(ctx, x + 48, y + 220, cardW - 96, "SFX", settings.sfx, 10, row === 1, COLORS.magenta);
  drawPaddleSpeedRow(ctx, x + 48, y + 320, cardW - 96, settings.paddle, row === 2);

  const pulse = 0.55 + Math.sin(t * 4) * 0.45;
  ctx.textAlign = "center";
  ctx.font = px(12);
  ctx.fillStyle = rgba(COLORS.gold, 0.55 + pulse * 0.45);
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 10;
  ctx.fillText("UP / DOWN  SELECT     LEFT / RIGHT  CHANGE", w / 2, y + cardH - 52);
  ctx.font = px(10);
  ctx.fillStyle = rgba("#ffffff", 0.8);
  ctx.shadowBlur = 0;
  ctx.fillText("ESC / S  BACK TO OPTIONS", w / 2, y + cardH - 24);
  ctx.restore();
}

function drawSettingBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  label: string,
  value: number,
  max: number,
  selected: boolean,
  color: string,
): void {
  const accent = selected ? COLORS.gold : color;
  ctx.save();
  if (selected) {
    roundRectPath(ctx, x - 8, y - 12, w + 16, 84, 8);
    ctx.fillStyle = rgba(COLORS.gold, 0.08);
    ctx.fill();
  }
  ctx.font = px(14);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 8;
  ctx.fillText(label, x, y);
  ctx.textAlign = "right";
  ctx.fillText(String(value), x + w, y);

  const barY = y + 32;
  const barH = 16;
  roundRectPath(ctx, x, barY, w, barH, 6);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  const fill = value / max;
  if (fill > 0) {
    ctx.save();
    roundRectPath(ctx, x, barY, w, barH, 6);
    ctx.clip();
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 10;
    ctx.fillRect(x, barY, w * fill, barH);
    ctx.restore();
  }
  ctx.restore();
}

function drawPaddleSpeedRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  level: number,
  selected: boolean,
): void {
  const accent = selected ? COLORS.gold : COLORS.orange;
  ctx.save();
  if (selected) {
    roundRectPath(ctx, x - 8, y - 12, w + 16, 84, 8);
    ctx.fillStyle = rgba(COLORS.gold, 0.08);
    ctx.fill();
  }
  ctx.font = px(14);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 8;
  ctx.fillText("PADDLE", x, y);
  ctx.textAlign = "right";
  ctx.fillText(`SPEED ${level}`, x + w, y);

  const slots = 5;
  const gap = 12;
  const slotW = (w - gap * (slots - 1)) / slots;
  const slotY = y + 32;
  for (let i = 1; i <= slots; i++) {
    const sx = x + (i - 1) * (slotW + gap);
    roundRectPath(ctx, sx, slotY, slotW, 22, 6);
    if (i <= level) {
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 8;
      ctx.fill();
    } else {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(accent, i === level ? 1 : 0.35);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
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
    ctx.fillText(line, w / 2, y + 120 + i * 26);
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
  ctx.fillText("NOW PLAYING", 28, h - 48);
  ctx.fillStyle = muted ? rgba("#ffffff", 0.7) : "#ffffff";
  ctx.shadowBlur = 0;
  ctx.font = px(8);
  const text = muted ? `${label}  (MUTED)` : label;
  const max = w - 56;
  ctx.fillText(ctx.measureText(text).width > max ? `${text.slice(0, 24)}...` : text, 28, h - 24);
  ctx.restore();
}

export function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.78);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
