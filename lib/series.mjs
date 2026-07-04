const PART_PATTERN = /\b(?:pt|parte|part)\s*\.?\s*(\d+)\b/i;
const SIMILARITY_THRESHOLD = 0.55;

export function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractPart(title) {
  const m = title.match(PART_PATTERN);
  if (!m) return null;
  return { part: Number(m[1]), base: normalize(title.slice(0, m.index)) };
}

function wordSet(s) {
  return new Set(s.split(" ").filter(Boolean));
}

function similarity(a, b) {
  const sa = wordSet(a);
  const sb = wordSet(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter++;
  return inter / Math.max(sa.size, sb.size);
}

/**
 * Groups videos into series by matching the PT/Parte marker and clustering
 * near-identical leading text, since a "parte 2" title isn't guaranteed to be
 * byte-identical to its "parte 1" counterpart.
 */
export function groupIntoSeries(videos) {
  const withPart = videos
    .map((v) => {
      const info = extractPart(v.title ?? "");
      return info ? { video: v, ...info } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a.video.create_time ?? 0) - (b.video.create_time ?? 0));

  const clusters = [];

  for (const entry of withPart) {
    let cluster = clusters.find((c) => similarity(c.base, entry.base) >= SIMILARITY_THRESHOLD);
    if (!cluster) {
      cluster = { base: entry.base, parts: {} };
      clusters.push(cluster);
    }
    const existing = cluster.parts[entry.part];
    if (!existing || (entry.video.create_time ?? 0) < (existing.create_time ?? 0)) {
      cluster.parts[entry.part] = entry.video;
    }
  }

  return clusters.map((c) => {
    const partNumbers = Object.keys(c.parts).map(Number).sort((a, b) => a - b);
    const firstPart = c.parts[partNumbers[0]];
    return {
      key: c.base.slice(0, 60),
      title: firstPart?.title ?? c.base,
      parts: partNumbers.map((n) => ({ part: n, video: c.parts[n] })),
      hasPart2: partNumbers.includes(2),
      maxPart: partNumbers[partNumbers.length - 1],
    };
  });
}
