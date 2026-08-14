import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";

const TRACK_NAME = /^.+_.+\.(mp3|ogg|wav)$/i;

function listTracks(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => TRACK_NAME.test(name) && fs.statSync(path.join(dir, name)).isFile())
    .sort();
}

function mimeFor(file: string): string {
  if (file.endsWith(".mp3")) return "audio/mpeg";
  if (file.endsWith(".ogg")) return "audio/ogg";
  if (file.endsWith(".wav")) return "audio/wav";
  return "application/octet-stream";
}

function musicDirPlugin(): Plugin {
  const dir = path.resolve("music");

  return {
    name: "music-dir",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.url?.split("?")[0] ?? "";
        if (raw !== "/music/tracks.json" && !raw.startsWith("/music/")) {
          next();
          return;
        }

        if (raw === "/music/tracks.json") {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(listTracks(dir)));
          return;
        }

        const name = decodeURIComponent(raw.slice("/music/".length));
        if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
          res.statusCode = 403;
          res.end();
          return;
        }
        const file = path.join(dir, name);
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
          next();
          return;
        }
        res.setHeader("Content-Type", mimeFor(name.toLowerCase()));
        fs.createReadStream(file).pipe(res);
      });
    },
    closeBundle() {
      const dest = path.resolve("dist/music");
      fs.mkdirSync(dest, { recursive: true });
      const tracks = listTracks(dir);
      fs.writeFileSync(path.join(dest, "tracks.json"), JSON.stringify(tracks));
      for (const name of tracks) {
        fs.copyFileSync(path.join(dir, name), path.join(dest, name));
      }
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [musicDirPlugin()],
});
