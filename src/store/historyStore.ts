import { create } from 'zustand';
import { api } from '../lib/api-client';
import type { Track } from './playerStore';

export interface HistoryEntry {
  track: Track;
  playedAt: number;
}

interface HistoryStore {
  entries: HistoryEntry[];
  addEntry: (track: Track) => void;
  clear: () => void;
  syncFromBackend: () => Promise<void>;
}

const STORAGE_KEY = 'sc_history';
const MAX_ENTRIES = 100;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  entries: loadHistory(),

  addEntry: (track) => {
    const filtered = get().entries.filter((e) => e?.track?.id !== track.id);
    const next = [{ track, playedAt: Date.now() }, ...filtered].slice(0, MAX_ENTRIES);
    saveHistory(next);
    set({ entries: next });

    // sync с бэкендом (когда появится)
    api('/history', {
      method: 'POST',
      body: JSON.stringify({
        track_urn: `soundcloud:tracks:${track.id}`,
        track_data: track,
      }),
    }).catch(() => {});
  },

  clear: () => {
    saveHistory([]);
    set({ entries: [] });

    api('/history', { method: 'DELETE' }).catch(() => {});
  },

  syncFromBackend: async () => {
  try {
    const data = await api<{ collection: { track: any; played_at: string }[] }>(
      '/history?limit=100',
    );
    const entries: HistoryEntry[] = data.collection
      .filter((item) => item?.track?.id)
      .map((item) => {
        const t = item.track;
        return {
          track: {
            id: t.id,
            title: t.title || "Unknown",
            artist: t.user?.username || t.artist || "Unknown",
            artwork: t.artwork_url?.replace("large", "t300x300") || t.artwork || null,
            duration: t.full_duration || t.duration || 0,
            playbackCount: t.playback_count || t.playbackCount || 0,
            likesCount: t.likes_count || t.likesCount || 0,
            streamUrl: t.streamUrl || "",
            permalinkUrl: t.permalink_url || t.permalinkUrl || "",
            userId: String(t.user?.id || t.userId || ""),
            userAvatar: t.user?.avatar_url || t.userAvatar || null,
            genre: t.genre || null,
          } as unknown as Track,
          playedAt: new Date(item.played_at).getTime(),
        };
      });
    saveHistory(entries);
    set({ entries });
  } catch {
    // бэкенд заглушка
  }
},
}));