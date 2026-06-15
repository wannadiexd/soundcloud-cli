import { create } from "zustand";
import type { Track } from "./playerStore";

export interface HistoryEntry {
  track: Track;
  playedAt: number;
}

interface HistoryStore {
  entries: HistoryEntry[];
  addEntry: (track: Track) => void;
  clear: () => void;
}

const STORAGE_KEY = "sc_history";
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
    const filtered = get().entries.filter((e) => e.track.id !== track.id);
    const next = [{ track, playedAt: Date.now() }, ...filtered].slice(0, MAX_ENTRIES);
    saveHistory(next);
    set({ entries: next });
  },

  clear: () => {
    saveHistory([]);
    set({ entries: [] });
  },
}));