import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Aura, auraRgb, auraRgba } from '../../lib/aura';
import { dur } from '../../lib/formatters';
import { usePerfMode } from '../../lib/perf';
import { useTrackPlay } from '../../lib/useTrackPlay';
import type { Track } from '../../store/playerStore';

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
    <path d="M5 3.5l12 6.5-12 6.5V3.5z" />
  </svg>
);
const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
    <rect x="4" y="3" width="4" height="14" rx="1" />
    <rect x="12" y="3" width="4" height="14" rx="1" />
  </svg>
);
const MusicIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
  </svg>
);

interface AlbumTrackRowProps {
  track: Track;
  position: number;
  queue: Track[];
  aura: Aura;
}

function AlbumTrackRowImpl({ track, position, queue, aura }: AlbumTrackRowProps) {
    if (!track?.id) return null;
  const { isThis, isThisPlaying, togglePlay } = useTrackPlay(track, queue);
  const navigate = useNavigate();
  const hoverB = usePerfMode().blur(16);

  return (
    <div
      className="group flex items-center gap-4 px-4 py-2.5 rounded-2xl transition-all duration-300 select-none cursor-pointer"
      style={{
        background: isThis
          ? `linear-gradient(90deg, ${auraRgba(aura, 0.16)}, ${auraRgba(aura, 0.04)} 70%, transparent)`
          : undefined,
        boxShadow: isThis ? `inset 0 0 0 1px ${auraRgba(aura, 0.35)}` : undefined,
      }}
      onMouseEnter={(e) => {
        if (!isThis) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={(e) => {
        if (!isThis) e.currentTarget.style.background = '';
      }}
    >
      <div
        className="w-10 h-10 flex items-center justify-center shrink-0 relative"
        onClick={togglePlay}
      >
        {isThisPlaying ? (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white"
            style={{
              background: auraRgb(aura),
              boxShadow: `0 0 24px ${auraRgba(aura, 0.5)}`,
            }}
          >
            <PauseIcon />
          </div>
        ) : (
          <>
            <span className="text-[13px] text-white/30 tabular-nums font-semibold group-hover:opacity-0 transition-opacity">
              {position}
            </span>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/80"
                style={{
                  background: hoverB > 0 ? 'rgba(255,255,255,0.10)' : 'rgba(54,54,60,0.92)',
                  boxShadow: `inset 0 0 0 1px ${auraRgba(aura, 0.3)}`,
                  backdropFilter: hoverB > 0 ? `blur(${hoverB}px)` : undefined,
                  WebkitBackdropFilter: hoverB > 0 ? `blur(${hoverB}px)` : undefined,
                }}
              >
                <PlayIcon />
              </div>
            </div>
          </>
        )}
      </div>

      <div
        className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 transition-transform duration-500 group-hover:scale-105"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}
        onClick={togglePlay}
      >
        {track.artwork ? (
          <img src={track.artwork} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/[0.04] text-white/20">
            <MusicIcon />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0" onClick={togglePlay}>
        <p
          className="text-[13px] font-medium truncate transition-colors duration-150"
          style={{ color: isThis ? auraRgba(aura, 0.95) : 'rgba(255,255,255,0.9)' }}
        >
          {track.title}
        </p>
        <p
          className="text-[11px] text-white/40 truncate mt-0.5 hover:text-white/70 transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (track.userId) navigate(`/user/${track.userId}`);
          }}
        >
          {track.artist}
        </p>
      </div>

      <span className="text-[12px] text-white/30 tabular-nums font-medium shrink-0 w-12 text-right">
        {dur(track.duration)}
      </span>
    </div>
  );
}

export const AlbumTrackRow = memo(AlbumTrackRowImpl);