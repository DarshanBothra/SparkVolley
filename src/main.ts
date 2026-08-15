import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";
import { Game, WORLD_H, WORLD_W } from "./game.ts";
import { Input } from "./input.ts";

inject();
injectSpeedInsights();

const el = document.getElementById("game");
if (!(el instanceof HTMLCanvasElement)) {
  throw new Error("Missing #game canvas");
}
const canvas: HTMLCanvasElement = el;

const context = canvas.getContext("2d");
if (!context) throw new Error("Canvas 2D is not available");
const ctx: CanvasRenderingContext2D = context;

const game = new Game();
const input = new Input();

function layout(): void {
  const aspect = WORLD_W / WORLD_H;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let cssW: number;
  let cssH: number;
  if (vw / vh > aspect) {
    cssH = vh;
    cssW = cssH * aspect;
  } else {
    cssW = vw;
    cssH = cssW / aspect;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  canvas.width = Math.round(WORLD_W * dpr);
  canvas.height = Math.round(WORLD_H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
}

layout();
window.addEventListener("resize", () => {
  layout();
  game.syncDevice();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.state === "playing") game.pauseForBlur();
});

let last = performance.now();

function frame(now: number): void {
  const dt = (now - last) / 1000;
  last = now;
  game.update(dt, input);
  game.draw(ctx);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
