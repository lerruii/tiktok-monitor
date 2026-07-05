import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DATA_DIR = path.join(ROOT, "data");
const PUBLIC_DIR = path.join(ROOT, "public");
const STORIES_FILE = path.join(DATA_DIR, "stories.json");
const LATEST_FILE = path.join(DATA_DIR, "latest.json");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");
const DATA_JS_FILE = path.join(PUBLIC_DIR, "data.js");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function todayLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * TikTok pierde la marca "/video/<id>" cuando el link viene acortado
 * (vm.tiktok.com/xxxx o tiktok.com/t/xxxx); seguir el redirect resuelve
 * la URL canónica antes de extraer el id.
 */
async function resolveCanonicalUrl(url) {
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: { "User-Agent": UA },
  });
  return { finalUrl: res.url, html: await res.text(), status: res.status };
}

function extractFromEmbeddedJson(html) {
  const patterns = [
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/,
    /<script id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match) continue;
    let json;
    try {
      json = JSON.parse(match[1]);
    } catch {
      continue;
    }

    const itemModule =
      json?.__DEFAULT_SCOPE__?.["webapp.video-detail"]?.itemInfo?.itemStruct ??
      Object.values(json?.ItemModule ?? {})[0];

    if (!itemModule) continue;

    const stats = itemModule.stats ?? itemModule.statsV2 ?? {};
    return {
      id: itemModule.id,
      title: itemModule.desc ?? "",
      create_time: Number(itemModule.createTime) || null,
      view_count: Number(stats.playCount) || 0,
      like_count: Number(stats.diggCount) || 0,
      comment_count: Number(stats.commentCount) || 0,
      share_count: Number(stats.shareCount) || 0,
      cover_image_url: itemModule.video?.cover ?? itemModule.video?.originCover ?? null,
    };
  }
  return null;
}

async function extractWithClaude(html, url) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const snippet = html.slice(0, 60000);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Este es el HTML crudo de una página de video de TikTok (${url}). Extrae exactamente estos campos del contenido embebido y responde SOLO con un JSON válido, nada más:
{"id": string|null, "title": string, "create_time": number|null (unix seconds), "view_count": number, "like_count": number, "comment_count": number, "share_count": number, "cover_image_url": string|null}

HTML:
${snippet}`,
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const body = await res.json();
  const text = body.content?.[0]?.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

async function fetchVideoStats(url) {
  const { finalUrl, html, status } = await resolveCanonicalUrl(url);
  if (status !== 200) {
    return { error: `HTTP ${status} al abrir ${url}` };
  }

  let stats = extractFromEmbeddedJson(html);
  let source = "html";
  if (!stats || !stats.id) {
    stats = await extractWithClaude(html, finalUrl);
    source = "claude";
  }
  if (!stats) {
    return { error: `No se pudo extraer datos de ${url} (TikTok pudo haber bloqueado la solicitud)` };
  }

  const idMatch = finalUrl.match(/\/video\/(\d+)/);
  return {
    ok: true,
    source,
    stats: {
      id: stats.id || idMatch?.[1] || finalUrl,
      title: stats.title || "",
      create_time: stats.create_time,
      view_count: stats.view_count || 0,
      like_count: stats.like_count || 0,
      comment_count: stats.comment_count || 0,
      share_count: stats.share_count || 0,
      share_url: finalUrl,
      cover_image_url: stats.cover_image_url || null,
    },
  };
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const stories = readJson(STORIES_FILE, []);
  const errors = [];
  const resultStories = [];

  for (const story of stories) {
    const parts = [];
    for (const link of story.tiktokLinks ?? []) {
      try {
        const result = await fetchVideoStats(link.url);
        if (result.error) {
          errors.push(result.error);
          continue;
        }
        parts.push({ part: link.part, url: link.url, ...result.stats });
        console.log(`[ok:${result.source}] ${story.title} · Parte ${link.part} -> ${result.stats.view_count} vistas`);
      } catch (err) {
        errors.push(`${link.url}: ${err.message ?? err}`);
      }
      // pequeña pausa entre requests para no golpear TikTok de forma agresiva
      await new Promise((r) => setTimeout(r, 1500));
    }
    parts.sort((a, b) => (a.part ?? 0) - (b.part ?? 0));
    resultStories.push({
      id: story.id,
      title: story.title,
      youtubeDate: story.youtubeDate ?? null,
      parts,
    });
  }

  const date = todayLocal();
  const history = readJson(HISTORY_FILE, []);
  const snapshotParts = {};
  for (const story of resultStories) {
    for (const p of story.parts) {
      snapshotParts[`${story.id}:${p.part}`] = {
        view_count: p.view_count,
        like_count: p.like_count,
        comment_count: p.comment_count,
        share_count: p.share_count,
      };
    }
  }
  const todayIndex = history.findIndex((entry) => entry.date === date);
  const todaySnapshot = { date, parts: snapshotParts };
  if (todayIndex === -1) history.push(todaySnapshot);
  else history[todayIndex] = todaySnapshot;
  history.sort((a, b) => a.date.localeCompare(b.date));

  const latest = {
    generatedAt: new Date().toISOString(),
    totalStories: resultStories.length,
    stories: resultStories,
    errors,
  };

  fs.writeFileSync(LATEST_FILE, JSON.stringify(latest, null, 2));
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  fs.writeFileSync(DATA_JS_FILE, `window.__TIKTOK_DATA__ = ${JSON.stringify({ latest, history })};\n`);

  const totalParts = resultStories.reduce((s, story) => s + story.parts.length, 0);
  const withPart2 = resultStories.filter((s) => s.parts.length >= 2).length;
  console.log(
    `[${new Date().toISOString()}] OK: ${resultStories.length} historias, ${totalParts} partes de TikTok, ${withPart2} con parte 2, ${errors.length} errores.`
  );
  if (errors.length) console.log("Errores:", errors.join(" | "));
}

main().catch((err) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message ?? err);
  process.exitCode = 1;
});
