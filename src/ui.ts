import { COLORS, comboColor, rgba, roundRectPath } from "./fx/glow.ts";

function neonText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size: number,
  weight = "800",
): void {
  ctx.save();
  ctx.font = `${weight} ${size}px "Segoe UI", "Helvetica Neue", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.88;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawTitle(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  ctx.save();
  ctx.fillStyle = "rgba(7, 7, 15, 0.35)";
  ctx.fillRect(0, 0, w, h);

  neonText(ctx, "SPARK VOLLEY", w / 2, h * 0.28, COLORS.cyan, 72);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  neonText(ctx, "SPARK VOLLEY", w / 2 + Math.sin(t * 2) * 1.5, h * 0.28, COLORS.magenta, 72);
  ctx.restore();

  ctx.font = "500 22px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = rgba(COLORS.gold, 0.9);
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 8;
  ctx.fillText("Keep the spark alive. Thread the halo gates. Chase the combo.", w / 2, h * 0.38);

  const pulse = 0.55 + Math.sin(t * 4) * 0.45;
  ctx.shadowBlur = 12 * pulse;
  ctx.fillStyle = rgba(COLORS.cyan, 0.55 + pulse * 0.45);
  ctx.font = "700 26px 'Segoe UI', sans-serif";
  ctx.fillText("PRESS SPACE", w / 2, h * 0.48);

  drawControls(ctx, w / 2, h * 0.66, 1);
  ctx.restore();
}

export function drawControls(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  alpha: number,
): void {
  const lines = [
    "← / A    paddle left",
    "→ / D    paddle right",
    "SPACE    serve / restart",
    "P / ESC  pause",
    "M        mute",
  ];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "500 16px ui-monospace, SFMono-Regular, Menlo, monospace";
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
): void {
  ctx.save();
  ctx.textBaseline = "top";
  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 10;

  ctx.textAlign = "left";
  ctx.font = "800 28px 'Segoe UI', sans-serif";
  ctx.fillText(score.toLocaleString(), 28, 20);

  ctx.font = "600 14px 'Segoe UI', sans-serif";
  ctx.fillStyle = rgba(COLORS.magenta, 0.9);
  ctx.shadowColor = COLORS.magenta;
  ctx.fillText(`BEST  ${best.toLocaleString()}`, 28, 54);

  ctx.textAlign = "right";
  ctx.fillStyle = comboColor(combo);
  ctx.shadowColor = comboColor(combo);
  ctx.font = "800 22px 'Segoe UI', sans-serif";
  ctx.fillText(combo > 0 ? `×${combo}` : "×1", w - 28, 22);

  ctx.font = "600 12px 'Segoe UI', sans-serif";
  ctx.fillText("COMBO", w - 28, 50);

  if (muted) {
    ctx.textAlign = "center";
    ctx.fillStyle = rgba(COLORS.gold, 0.8);
    ctx.shadowBlur = 0;
    ctx.font = "700 12px 'Segoe UI', sans-serif";
    ctx.fillText("MUTED", w / 2, 22);
  }

  ctx.restore();

  drawComboMeter(ctx, w, combo);

  if (hintAlpha > 0) {
    drawControls(ctx, w / 2, 118, hintAlpha * 0.9);
    if (waitingServe) {
      ctx.save();
      ctx.globalAlpha = hintAlpha;
      ctx.textAlign = "center";
      ctx.font = "700 20px 'Segoe UI', sans-serif";
      ctx.fillStyle = COLORS.gold;
      ctx.shadowColor = COLORS.gold;
      ctx.shadowBlur = 10;
      ctx.fillText("SPACE TO SERVE", w / 2, 96);
      ctx.restore();
    }
  }
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

export function drawPause(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.fillStyle = "rgba(7, 7, 15, 0.72)";
  ctx.fillRect(0, 0, w, h);
  neonText(ctx, "PAUSED", w / 2, h * 0.36, COLORS.cyan, 56);
  ctx.font = "600 20px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = rgba(COLORS.gold, 0.9);
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 8;
  ctx.fillText("P / ESC to resume", w / 2, h * 0.46);
  drawControls(ctx, w / 2, h * 0.58, 0.9);
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
  ctx.fillStyle = "rgba(7, 7, 15, 0.78)";
  ctx.fillRect(0, 0, w, h);

  neonText(ctx, "LIGHTS OUT", w / 2, h * 0.24, COLORS.magenta, 56);

  ctx.textAlign = "center";
  ctx.font = "800 64px 'Segoe UI', sans-serif";
  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 16;
  ctx.fillText(score.toLocaleString(), w / 2, h * 0.4);

  ctx.font = "600 20px 'Segoe UI', sans-serif";
  ctx.fillStyle = rgba(COLORS.gold, 0.95);
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 8;
  ctx.fillText(`Best  ${best.toLocaleString()}    Peak combo  ×${maxCombo}`, w / 2, h * 0.5);

  const pulse = 0.55 + Math.sin(t * 4) * 0.45;
  ctx.fillStyle = rgba(COLORS.cyan, 0.55 + pulse * 0.45);
  ctx.shadowColor = COLORS.cyan;
  ctx.font = "700 24px 'Segoe UI', sans-serif";
  ctx.fillText("PRESS SPACE TO RETRY", w / 2, h * 0.62);

  ctx.font = "500 16px 'Segoe UI', sans-serif";
  ctx.fillStyle = rgba("#ffffff", 0.7 + copyFlash * 0.3);
  ctx.shadowBlur = 0;
  ctx.fillText(
    copyFlash > 0 ? "Copied to clipboard" : "C  —  copy score line",
    w / 2,
    h * 0.72,
  );
  ctx.restore();
}

export function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.78);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
