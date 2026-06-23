import { usePlayerStore } from "../store/playerStore";
import { useLikesStore } from "../store/likesStore";
import { formatDuration, formatCount, getStreamUrl } from "../api/soundcloud";
import { useNavigate } from "react-router-dom";
import type { Track } from "../store/playerStore";

interface Props {
  track: Track;
  queue: Track[];
}

const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="black">
    <path d="M5 3.5l12 6.5-12 6.5V3.5z" />
  </svg>
);
const PauseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="black">
    <rect x="4" y="3" width="4" height="14" rx="1" />
    <rect x="12" y="3" width="4" height="14" rx="1" />
  </svg>
);
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export default function TrackCard({ track, queue }: Props) {
  const { setTrack, setQueue, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const isLiked = useLikesStore((s) => s.isLiked(track?.id ?? 0));
  const toggleLike = useLikesStore((s) => s.toggleLike);
  const navigate = useNavigate();
  const isThisPlaying = currentTrack?.id === track?.id && isPlaying;
  const isThisTrack = currentTrack?.id === track?.id;

  if (!track?.id) return null;

  const handleMouseEnter = () => {
    getStreamUrl(track.id).catch(() => {});
  };

  const handlePlay = () => {
    if (isThisTrack) {
      togglePlay();
    } else {
      setQueue(queue);
      setTrack(track);
    }
  };

  return (
    <div
      className="group relative select-none"
      onMouseEnter={handleMouseEnter}
      style={{ contain: "layout paint style" }}
    >
      <div
        className="relative aspect-square rounded-2xl overflow-hidden bg-white/[0.03] cursor-pointer ring-1 ring-white/[0.06] group-hover:ring-white/[0.12] transition-all duration-300"
        onClick={handlePlay}
        style={{ transitionTimingFunction: "var(--ease-apple)" }}
      >
        {track.artwork ? (
          <img
            src={track.artwork}
            alt={track.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            decoding="async"
            loading="lazy"
            style={{ transitionTimingFunction: "var(--ease-apple)" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
            </svg>
          </div>
        )}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            isThisTrack
              ? "bg-black/30 backdrop-blur-[2px] opacity-100"
              : "bg-black/0 opacity-0 group-hover:bg-black/30 group-hover:backdrop-blur-[2px] group-hover:opacity-100"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xl transition-all duration-300 ${
              isThisTrack ? "scale-100" : "scale-75 group-hover:scale-100"
            }`}
            style={{ transitionTimingFunction: "var(--ease-apple)" }}
          >
            {isThisPlaying ? <PauseIcon /> : <PlayIcon />}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
          className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer opacity-0 group-hover:opacity-100 ${
            isLiked
              ? "opacity-100 text-[var(--color-accent)]"
              : "text-white/70 hover:text-white"
          }`}
          style={{
            background: isLiked
              ? "var(--color-accent-glow)"
              : "rgba(0,0,0,0.45)",
            backdropFilter: "blur(8px)",
            border: isLiked ? "0.5px solid var(--color-accent)" : "0.5px solid rgba(255,255,255,0.12)",
          }}
        >
          <HeartIcon filled={isLiked} />
        </button>

        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="text-[10px] font-medium bg-black/50 backdrop-blur-md text-white/80 px-2 py-0.5 rounded-full">
            {formatDuration(track.duration)}
          </div>
        </div>
      </div>

      <div className="mt-3 min-w-0">
        <p
          className="text-[13px] font-medium truncate leading-snug text-white/90 hover:text-white transition-colors duration-150 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); navigate(`/track/${track.id}`); }}
        >
          {track.title}
        </p>
        <p
          className="text-[11px] truncate mt-0.5 text-white/35 hover:text-white/60 transition-colors duration-150 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (track.userId) navigate(`/user/${track.userId}`);
          }}
        >
          {track.artist}
        </p>
        {track.playbackCount != null && (
          <p className="text-[10px] text-white/20 mt-1 tabular-nums">
            {formatCount(track.playbackCount)} plays
          </p>
        )}
      </div>
    </div>
  );
}