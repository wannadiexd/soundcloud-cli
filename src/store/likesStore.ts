import { create } from 'zustand';
import { api } from '../lib/api-client';

const STORAGE_KEY = 'sc_likes';

function loadLikes(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveLikes(ids: Set<number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {}
}

interface LikesStore {
  likedIds: Set<number>;
  isLiked: (id: number) => boolean;
  toggleLike: (id: number) => Promise<void>;
  fetchLikes: () => Promise<void>;
}

export const useLikesStore = create<LikesStore>((set, get) => ({
  likedIds: loadLikes(),

  isLiked: (id) => get().likedIds.has(id),

  toggleLike: async (id) => {
    const { likedIds } = get();
    const next = new Set(likedIds);
    const wasLiked = next.has(id);

    if (wasLiked) next.delete(id);
    else next.add(id);
    saveLikes(next);
    set({ likedIds: next });

    try {
      const urn = `soundcloud:tracks:${id}`;
      if (wasLiked) {
        await api(`/likes/tracks/${encodeURIComponent(urn)}`, { method: 'DELETE' });
      } else {
        await api(`/likes/tracks/${encodeURIComponent(urn)}`, { method: 'POST' });
      }
    } catch {
      const rolled = new Set(get().likedIds);
      if (wasLiked) rolled.add(id);
      else rolled.delete(id);
      saveLikes(rolled);
      set({ likedIds: rolled });
    }
  },

  fetchLikes: async () => {
    try {
      const data = await api<{ collection: { id: number }[] }>('/me/likes/tracks?limit=200');
      const ids = new Set(data.collection.map((t) => t.id));
      saveLikes(ids);
      set({ likedIds: ids });
    } catch {
      // бэкенд заглушка
    }
  },
}));