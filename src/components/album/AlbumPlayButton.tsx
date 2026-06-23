import { memo, useCallback, useMemo } from 'react';
import { Pause, Play } from 'lucide-react';
import { type Aura, auraRgb, auraRgba, isLight } from '../../lib/aura';
import { useIsPlayingFrom } from '../../lib/useTrackPlay';
import type { Track } from '../../store/playerStore';
import { usePlayerStore } from '../../store/playerStore';

interface AlbumPlayButtonProps {
  tracks: Track[];
  aura: Aura;
}

function AlbumPlayButtonImpl({ tracks, aura }: AlbumPlayButtonProps) {
  const { playable, playableUrns } = useMemo(() => {
    const list: Track[] = [];
    const urns = new Set<string>();
    for (const tr of tracks) {
      list.push(tr);
      if (tr.urn) urns.add(tr.urn);
      else urns.add(String(tr.id));
    }
    return { playable: list, playableUrns: urns };
  }, [tracks]);

  const isPlayingFromAlbum = useIsPlayingFrom(playableUrns);
  const lightAura = isLight(aura);
  const empty = playable.length === 0;

  const onClick = useCallback(() => {
    if (empty) return;
    const { setTrack, setQueue, pause, resume, isPlaying, currentTrack } = usePlayerStore.getState();
    const currentId = currentTrack ? (currentTrack.urn ?? String(currentTrack.id)) : null;
    if (isPlayingFromAlbum) {
      pause();
      return;
    }
    if (currentId && playableUrns.has(currentId)) {
      resume();
      return;
    }
    setQueue(playable);
    setTrack(playable[0]);
  }, [empty, isPlayingFromAlbum, playable, playableUrns]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={empty}
      className="group relative inline-flex items-center gap-3 h-11 pl-2 pr-5 rounded-full text-[13px] font-semibold cursor-pointer transition-all duration-500 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: `linear-gradient(180deg, ${auraRgba(aura, 0.85)}, ${auraRgba(aura, 0.65)})`,
        color: lightAura ? '#000' : '#fff',
        boxShadow: `0 12px 32px ${auraRgba(aura, 0.45)}, inset 0 0 0 1px ${auraRgba(aura, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.3)`,
      }}
    >
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center"
        style={{
          background: lightAura ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)',
          boxShadow: `inset 0 0 0 1px ${lightAura ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)'}`,
        }}
      >
        {isPlayingFromAlbum
          ? <Pause size={14} fill="currentColor" />
          : <Play size={14} fill="currentColor" />
        }
      </span>
      <span className="tracking-wide">
        {isPlayingFromAlbum ? 'Pause album' : 'Play album'}
      </span>
      <span
        className="absolute inset-0 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{ boxShadow: `0 0 60px ${auraRgb(aura)}` }}
      />
    </button>
  );
}

export const AlbumPlayButton = memo(AlbumPlayButtonImpl);