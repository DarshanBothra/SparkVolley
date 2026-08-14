# Spark Volley

A keyboard-only neon arcade game: volley a living spark through drifting **Halo Gates**, chain combos, and chase a high score. Rounds last about 30–90 seconds. Missing the spark ends the light — no combat, no enemies.

Open the page and play. Best score is stored in `localStorage` on that device.

## Play locally

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck + production build into `dist/` |
| `npm run preview` | Serve the `dist/` build locally |

## Controls

| Key | Action |
| --- | --- |
| Left / A | Move paddle left |
| Right / D | Move paddle right |
| Space | Serve / start / restart after game over |
| P or Esc | Pause / resume |
| M | Mute audio |
| C | Copy a score line on the game-over screen |

Paddle movement uses acceleration (not teleport). Halo rims are scoring targets, not solid walls — you score when the spark’s **center** passes through the inner hole.

## Deploy a public URL

This is a static site (no server, no accounts). Build first:

```bash
npm run build
```

That writes static files to `dist/`. Pick one host:

### Vercel

```bash
npx vercel --yes --prod
```

The CLI prints a public URL when it finishes. You need to be logged in (`npx vercel login`) once.

### Netlify

```bash
npx netlify deploy --prod --dir=dist
```

Log in first if prompted (`npx netlify login`).

### GitHub Pages

From this repo, after a production build:

```bash
npx gh-pages -d dist
```

Then enable GitHub Pages for the `gh-pages` branch in the repo settings. The site will be at:

`https://<user>.github.io/<repo>/`

(`vite.config.ts` already sets `base: './'` so the build works in a subdirectory.)

You can also drag the `dist/` folder onto [https://app.netlify.com/drop](https://app.netlify.com/drop) for a one-off public URL with no CLI.

## Stack

Vanilla Vite + TypeScript + Canvas 2D. Audio is Web Audio beeps (no sound files).
