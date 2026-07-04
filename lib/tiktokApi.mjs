const VIDEO_LIST_URL = "https://open.tiktokapis.com/v2/video/list/";
const FIELDS = [
  "id",
  "title",
  "video_description",
  "create_time",
  "cover_image_url",
  "share_url",
  "embed_link",
  "view_count",
  "like_count",
  "comment_count",
  "share_count",
].join(",");

export async function fetchAllVideos(accessToken) {
  const videos = [];
  let cursor = 0;
  let hasMore = true;
  let guard = 0;

  while (hasMore && guard < 50) {
    guard++;
    const res = await fetch(`${VIDEO_LIST_URL}?fields=${FIELDS}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ max_count: 20, cursor }),
    });
    const body = await res.json();
    if (!res.ok || (body.error && body.error.code && body.error.code !== "ok")) {
      throw new Error(`TikTok video/list error (${res.status}): ${JSON.stringify(body.error ?? body)}`);
    }
    const page = body.data?.videos ?? [];
    videos.push(...page);
    hasMore = Boolean(body.data?.has_more);
    cursor = body.data?.cursor ?? cursor;
    if (page.length === 0) break;
  }

  return videos;
}
