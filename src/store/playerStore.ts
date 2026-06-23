import { create } from 'zustand';
import { useHistoryStore } from './historyStore';

export interface Track {
  id: number;
  urn?: string;
  title: string;
  artist: string;
  artwork: string;
  streamUrl: string;
  duration: number;
  likesCount: number;
  playbackCount: number;
  permalinkUrl: string;
  userId?: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerStore {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  setTrack: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  onTrackEnded: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  duration: 0,
  shuffle: false,
  repeat: 'off',

  setTrack: (track) => {
    useHistoryStore.getState().addEntry(track);
    set({ currentTrack: track, isPlaying: true });
  },

  setQueue: (tracks) => set({ queue: tracks }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

  cycleRepeat: () =>
    set((state) => ({
      repeat: state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off',
    })),

  nextTrack: () => {
    const { queue, currentTrack, shuffle, repeat } = get();
    if (!currentTrack || queue.length === 0) return;
    const index = queue.findIndex((t) => t.id === currentTrack.id);

    if (shuffle && queue.length > 1) {
      let randIndex = index;
      while (randIndex === index) randIndex = Math.floor(Math.random() * queue.length);
      const track = queue[randIndex];
      useHistoryStore.getState().addEntry(track);
      set({ currentTrack: track, isPlaying: true, progress: 0 });
      return;
    }

    let next = queue[index + 1];
    if (!next && repeat === 'all') next = queue[0];
    if (next) {
      useHistoryStore.getState().addEntry(next);
      set({ currentTrack: next, isPlaying: true, progress: 0 });
    } else {
      set({ isPlaying: false, progress: 0 });
    }
  },

  prevTrack: () => {
    const { queue, currentTrack, shuffle, repeat } = get();
    if (!currentTrack || queue.length === 0) return;
    const index = queue.findIndex((t) => t.id === currentTrack.id);

    if (shuffle && queue.length > 1) {
      let randIndex = index;
      while (randIndex === index) randIndex = Math.floor(Math.random() * queue.length);
      const track = queue[randIndex];
      useHistoryStore.getState().addEntry(track);
      set({ currentTrack: track, isPlaying: true, progress: 0 });
      return;
    }

    let prev = queue[index - 1];
    if (!prev && repeat === 'all') prev = queue[queue.length - 1];
    if (prev) {
      useHistoryStore.getState().addEntry(prev);
      set({ currentTrack: prev, isPlaying: true, progress: 0 });
    }
  },

  onTrackEnded: () => {
    const { repeat, nextTrack } = get();
    if (repeat === 'one') {
      set({ progress: 0, isPlaying: true });
      return;
    }
    nextTrack();
  },
}));