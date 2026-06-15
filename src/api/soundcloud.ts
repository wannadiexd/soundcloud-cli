const CLIENT_ID = "QNR5nrdLOvApYERC8AOUr3VjRfHnLjle";
const BACKEND = "/sc-auth";  // api.scdinternal.site
const SC_API = "/sc-api";    // api-v2.soundcloud.com (публичные запросы)

const streamCache = new Map<number, string>();

function getSessionId(): string | null {
  return localStorage.getItem("sc_session");
}

// Запросы к бэкенду scdinternal (авторизованные)
async function fetchBackend(endpoint: string, params: Record<string, string> = {}) {
  const sessionId = getSessionId();
  const url = new URL(`${BACKEND}${endpoint}`, window.location.origin);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const headers: Record<string, string> = {};
  if (sessionId) headers["x-session-id"] = sessionId;

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`Backend error: ${res.status} at ${endpoint}`);
  return res.json();
}

// Прямые запросы к SC API (публичные — чарты, поиск, треки)
async function fetchSC(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${SC_API}${endpoint}`, window.location.origin);
  url.searchParams.set("client_id", CLIENT_ID);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (res.status === 401) return { collection: [] };
  if (!res.ok) throw new Error(`SC API error: ${res.status} at ${endpoint}`);
  return res.json();
}

function mapTrack(track: any) {
  return {
    id: track.id,
    title: track.title,
    artist: track.user?.username || track.artist || "Unknown",
    artwork: (track.artwork_url || track.cover_url || "")?.replace("large", "t300x300"),
    streamUrl: "",
    duration: track.full_duration || track.duration || 0,
    likesCount: track.likes_count || 0,
    playbackCount: track.playback_count || 0,
    permalinkUrl: track.permalink_url || "",
  };
}

// Лайкнутые треки — через бэкенд
export async function getLikedTracks(limit = 50) {
  try {
    const data = await fetchBackend("/me/likes/tracks", { limit: String(limit), page: "1" });
    const items = data.collection ?? data.tracks ?? data ?? [];
    return items.map((item: any) => mapTrack(item.track ?? item));
  } catch (e) {
    console.error("getLikedTracks failed:", e);
    return [];
  }
}

// История прослушиваний — через бэкенд
export async function getPlayHistory(limit = 24) {
  try {
    const data = await fetchBackend("/history", { limit: String(limit) });
    const items = data.collection ?? data.tracks ?? data ?? [];
    return items.map((item: any) => mapTrack(item.track ?? item));
  } catch (e) {
    console.error("getPlayHistory failed:", e);
    return [];
  }
}

// Рекомендации/featured — через бэкенд
export async function getFeaturedTracks(limit = 20) {
  try {
    const data = await fetchBackend("/featured", { limit: String(limit) });
    const items = data.collection ?? data.tracks ?? data ?? [];
    return items.map((item: any) => mapTrack(item.track ?? item));
  } catch {
    // Фоллбэк на публичные чарты SC
    const data = await fetchSC("/charts", {
      kind: "trending",
      genre: "soundcloud:genres:all-music",
      limit: String(limit),
    });
    return (data.collection ?? []).map((item: any) => mapTrack(item.track));
  }
}

// Поиск — через бэкенд (индексированная база)
export async function searchTracks(query: string, limit = 30) {
  try {
    const data = await fetchBackend("/search/db/tracks", { q: query, limit: String(limit) });
    const items = data.collection ?? data.tracks ?? data ?? [];
    return items.map((item: any) => mapTrack(item));
  } catch {
    // Фоллбэк на SC API
    const data = await fetchSC("/search/tracks", { q: query, limit: String(limit) });
    return (data.collection ?? []).map((item: any) => mapTrack(item));
  }
}

// Стрим URL — через SC API напрямую (нужен client_id + track_authorization)
export async function getStreamUrl(trackId: number): Promise<string> {
  if (streamCache.has(trackId)) return streamCache.get(trackId)!;

  const track = await fetchSC(`/tracks/${trackId}`);
  const auth = track.track_authorization;
  if (!auth) throw new Error("No track authorization");

  const transcodings = track.media?.transcodings;
  if (!transcodings?.length) throw new Error("No transcodings");

  const progressive =
    transcodings.find((t: any) => t.format?.protocol === "progressive") ||
    transcodings[0];

  const streamUrl = progressive.url.replace("https://api-v2.soundcloud.com", "/sc-media");
  const url = new URL(streamUrl, window.location.origin);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("track_authorization", auth);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Stream fetch failed");
  const data = await res.json();

  const finalUrl = data.url.replace("https://cf-media.sndcdn.com", "/sc-cdn");
  streamCache.set(trackId, finalUrl);
  return finalUrl;
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}