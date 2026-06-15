const CLIENT_ID = "QNR5nrdLOvApYERC8AOUr3VjRfHnLjle";
const BASE_URL = import.meta.env.DEV
  ? "/sc-api"
  : "https://api-v2.soundcloud.com";

const streamCache = new Map<number, string>();

async function fetchSC(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`, window.location.origin);
  url.searchParams.set("client_id", CLIENT_ID);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const sessionId = localStorage.getItem("sc_session");

  const headers: Record<string, string> = {};
  if (sessionId && sessionId !== "null" && sessionId !== "undefined") {
    headers["Authorization"] = sessionId.startsWith("OAuth")
      ? sessionId
      : `OAuth ${sessionId}`;
  }

  const res = await fetch(url.toString(), { headers });
  
  if (res.status === 401) {
    localStorage.removeItem("sc_session");
    console.error(`Unauthorized 401 at ${endpoint}. Your session may be invalid or expired.`);
    // Возвращаем пустые данные, чтобы не ронять приложение
    return { collection: [] };
  }

  if (!res.ok) {
    throw new Error(`SoundCloud API error: ${res.status} at ${endpoint}`);
  }
  return res.json();
}

function mapTrack(track: any) {
  return {
    id: track.id,
    title: track.title,
    artist: track.user?.username || "Unknown",
    artwork: track.artwork_url?.replace("large", "t300x300") || "",
    streamUrl: "",
    duration: track.full_duration || track.duration,
    likesCount: track.likes_count || 0,
    playbackCount: track.playback_count || 0,
    permalinkUrl: track.permalink_url || "",
  };
}

export async function searchTracks(query: string, limit = 20) {
  const data = await fetchSC("/search/tracks", {
    q: query,
    limit: String(limit),
  });
  return data.collection.map((item: any) => mapTrack(item));
}

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

  const streamUrl = progressive.url.replace(
    "https://api-v2.soundcloud.com",
    "/sc-media"
  );
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

export async function getFeaturedTracks(limit = 20) {
  const data = await fetchSC("/charts", {
    kind: "trending",
    genre: "soundcloud:genres:all-music",
    limit: String(limit),
  });
  return data.collection.map((item: any) => mapTrack(item.track));
}

export async function getTracksByUser(userId: number, limit = 20) {
  const data = await fetchSC(`/users/${userId}/tracks`, {
    limit: String(limit),
  });
  return data.collection.map((item: any) => mapTrack(item));
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

export async function getLikedTracks(limit = 24) {
  try {
    const me = await fetchSC("/me");
    if (!me || !me.id) throw new Error("User ID not found in /me response");

    const data = await fetchSC(`/users/${me.id}/likes`, {
      limit: String(limit),
    });
    return data.collection
      .filter((item: any) => item.track)
      .map((item: any) => mapTrack(item.track));
  } catch (err) {
    console.error("Failed to load liked tracks:", err);
    throw err;
  }
}

export async function getPlayHistory(limit = 24) {
  const data = await fetchSC("/me/play-history/tracks", {
    limit: String(limit),
  });
  return data.collection.map((item: any) => mapTrack(item.track || item));
}