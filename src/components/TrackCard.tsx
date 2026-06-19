import { usePlayerStore } from "../store/playerStore";
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

export default function TrackCard({ track, queue }: Props) {
  const { setTrack, setQueue, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const navigate = useNavigate();
  const isThisPlaying = currentTrack?.id === track.id && isPlaying;
  const isThisTrack = currentTrack?.id === track.id;

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