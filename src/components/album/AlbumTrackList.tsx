import { memo, useMemo } from 'react';
import { type Aura, auraRgba } from '../../lib/aura';
import { dur } from '../../lib/formatters';
import { usePerfMode } from '../../lib/perf';
import type { Track } from '../../store/playerStore';
import { AlbumTrackRow } from './AlbumTrackRow';

const MusicIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
  </svg>
);

interface AlbumTrackListProps {
  tracks: Track[];
  aura: Aura;
}

function AlbumTrackListImpl({ tracks, aura }: AlbumTrackListProps) {
  const perf = usePerfMode();
  const b = perf.blur(28);

  const totalDuration = useMemo(
    () => tracks.reduce((acc, t) => acc + (t.duration ?? 0), 0),
    [tracks],
  );

  if (tracks.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.03)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}
        >
          <MusicIcon />
        </div>
        <p className="text-white/30 text-sm">No tracks</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-[2rem] p-3 md:p-5"
      style={{
        background: b > 0
          ? 'linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.015) 100%)'
          : 'rgba(18,18,22,0.85)',
        backdropFilter: b > 0 ? `blur(${b}px) saturate(160%)` : undefined,
        WebkitBackdropFilter: b > 0 ? `blur(${b}px) saturate(160%)` : undefined,
        boxShadow: '0 30px 80px rgba(0,0,0,0.30), inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center justify-between px-3 pt-2 pb-4">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
          <MusicIcon /> Tracks
          <span className="text-white/25 ml-1">{tracks.length}</span>
        </span>
        <span className="text-[11px] text-white/30 font-bold uppercase tracking-[0.18em] tabular-nums">
          {dur(totalDuration)}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        {tracks.map((track, i) => (
          <AlbumTrackRow
            key={track.id}
            track={track}
            position={i + 1}
            queue={tracks}
            aura={aura}
          />
        ))}
      </div>
    </div>
  );
}

export const AlbumTrackList = memo(AlbumTrackListImpl);