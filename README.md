# Spark Volley

A keyboard-only neon arcade game: volley a living spark through drifting **Halo Gates**, chain combos, and chase a high score. Rounds last about 30–90 seconds. Missing the spark ends the light — no combat, no enemies.

**Desktop / laptop only.** Phones and tablets see a lock screen (music can still play). Player-facing how-to: [LAUNCH.md](LAUNCH.md).

The first visit in a browser opens a **rules** screen. Press **Space** to continue or **Esc** to exit the rules; you cannot start a round until that screen has been seen. Pause always shows the same rules.

Open the page and play. Best score is stored in `localStorage` on that device. Soundtrack files in `music/` ship with the build so a shared URL plays the same tracks.

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
| Space | Continue / serve / restart / resume from pause |
| P or Esc | Pause (shows rules) / resume / exit first-load rules |
| M | Mute audio (music + sound effects) |
| N | Next soundtrack track |
| C | Copy a score line on the game-over screen |

Paddle movement uses acceleration (not teleport). Halo rims are scoring targets, not solid walls — you score when the spark’s **center** passes through the inner hole.

## Powerups

Threading a halo sometimes drops a capsule. Catch it with the paddle:

| Capsule | Effect |
| --- | --- |
| Twin Spark | A second spark. The round continues if either spark is still in play. |
| Slow Field | Lower gravity and speed for a few seconds. |
| Lock Gates | New hoops still spawn, but they stay where they appear. |
| Aegis | The floor bounces the spark instead of a miss, briefly. |

## Soundtrack

Drop files into [`music/`](music/) using this name:

`Song-Name_Artist-Name.mp3`

Spaces become hyphens; each word is Title-Cased. Example: `Never-Gonna-Give-You-Up_Rick-Astley.mp3` displays as **Never Gonna Give You Up — Rick Astley**.

The HUD shows **NOW PLAYING**. The game shuffles every matching file and copies `music/` into the production build. Restart the dev server after adding tracks.

## Deploy a public URL

This is a static site (no server, no accounts). Build first:

```bash
npm run build
```

That writes static files to `dist/` (including `dist/music/`). Pick one host:

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

Vanilla Vite + TypeScript + Canvas 2D. Sound effects are Web Audio beeps. Music is files you add under `music/`.
