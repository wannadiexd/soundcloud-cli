import { create } from "zustand";

export interface Track {
  id: number;
  title: string;
  artist: string;
  artwork: string;
  streamUrl: string;
  duration: number;
  likesCount: number;
  playbackCount: number;
  permalinkUrl: string;
}

interface PlayerStore {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  setTrack: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  duration: 0,

  setTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  setQueue: (tracks) => set({ queue: tracks }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),

  nextTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || queue.length === 0) return;
    const index = queue.findIndex((t) => t.id === currentTrack.id);
    const next = queue[index + 1];
    if (next) set({ currentTrack: next, isPlaying: true, progress: 0 });
  },

  prevTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || queue.length === 0) return;
    const index = queue.findIndex((t) => t.id === currentTrack.id);
    const prev = queue[index - 1];
    if (prev) set({ currentTrack: prev, isPlaying: true, progress: 0 });
  },
}));