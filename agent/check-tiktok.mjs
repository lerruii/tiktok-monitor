import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, PUBLIC_DIR, assertConfigured } from "../lib/config.mjs";
import { getValidAccessToken } from "../lib/tokens.mjs";
import { fetchAllVideos } from "../lib/tiktokApi.mjs";
import { groupIntoSeries } from "../lib/series.mjs";

const LATEST_FILE = path.join(DATA_DIR, "latest.json");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");
const DATA_JS_FILE = path.join(PUBLIC_DIR, "data.js");

function todayLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function metricsOf(video) {
  return {
    view_count: video.view_count ?? 0,
    like_count: video.like_count ?? 0,
    comment_count: video.comment_count ?? 0,
    share_count: video.share_count ?? 0,
  };
}

async function main() {
  assertConfigured();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const accessToken = await getValidAccessToken();
  const videos = await fetchAllVideos(accessToken);
  const series = groupIntoSeries(videos);

  const date = todayLocal();
  const history = readJson(HISTORY_FILE, []);
  const snapshotVideos = {};
  for (const v of videos) snapshotVideos[v.id] = metricsOf(v);

  const todayIndex = history.findIndex((entry) => entry.date === date);
  const todaySnapshot = { date, videos: snapshotVideos };
  if (todayIndex === -1) history.push(todaySnapshot);
  else history[todayIndex] = todaySnapshot;
  history.sort((a, b) => a.date.localeCompare(b.date));

  const latest = {
    generatedAt: new Date().toISOString(),
    totalVideos: videos.length,
    videos,
    series,
  };

  fs.writeFileSync(LATEST_FILE, JSON.stringify(latest, null, 2));
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  fs.writeFileSync(
    DATA_JS_FILE,
    `window.__TIKTOK_DATA__ = ${JSON.stringify({ latest, history })};\n`
  );

  const withPart2 = series.filter((s) => s.hasPart2).length;
  console.log(
    `[${new Date().toISOString()}] OK: ${videos.length} videos, ${series.length} series detectadas, ${withPart2} con parte 2.`
  );
}

main().catch((err) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message ?? err);
  process.exitCode = 1;
});
