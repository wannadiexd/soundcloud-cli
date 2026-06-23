import { useCallback, useRef } from 'react';
import type { Track } from '../store/playerStore';
import { usePlayerStore } from '../store/playerStore';

export function useTrackPlay(track: Track | undefined, queue?: Track[] | (() => Track[]), onPlay?: () => void) {
  const isThis = usePlayerStore((s) => !!track && s.currentTrack?.id === track.id);
  const isThisPlaying = usePlayerStore((s) => !!track && s.currentTrack?.id === track.id && s.isPlaying);

  const trackRef = useRef(track);
  const queueRef = useRef(queue);
  const onPlayRef = useRef(onPlay);
  trackRef.current = track;
  queueRef.current = queue;
  onPlayRef.current = onPlay;

  const togglePlay = useCallback(() => {
    if (!trackRef.current) return;
    const { setTrack, setQueue, pause, resume } = usePlayerStore.getState();
    if (isThisPlaying) {
      pause();
    } else if (isThis) {
      resume();
    } else {
      const q = queueRef.current;
      const resolved = typeof q === 'function' ? q() : q;
      const finalQueue = resolved?.length ? resolved : [trackRef.current];
      setQueue(finalQueue);
      setTrack(trackRef.current);
      onPlayRef.current?.();
    }
  }, [isThis, isThisPlaying]);

  return { isThis, isThisPlaying, togglePlay };
}

export function useIsPlayingFrom(trackUrns: Set<string>) {
  return usePlayerStore(
    (s) => s.isPlaying && s.currentTrack != null && trackUrns.has(String(s.currentTrack.id)),
  );
}