import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "../store/playerStore";
import { formatCount } from "../api/soundcloud";

const PlayIcon = () => <svg width="22" height="22" viewBox="0 0 20 20" fill="black"><path d="M5 3.5l12 6.5-12 6.5V3.5z"/></svg>;
const PauseIcon = () => <svg width="22" height="22" viewBox="0 0 20 20" fill="black"><rect x="4" y="3" width="4" height="14" rx="1"/><rect x="12" y="3" width="4" height="14" rx="1"/></svg>;
const ListIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const HeartIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;

export interface PlaylistCardData {
  id: string | number;
  title: string;
  artwork: string | null;
  trackCount?: number;
  likesCount?: number;
  isAlbum?: boolean;
  tracks?: { id: number; artwork: string | null }[];
  user?: { username: string };
}

function PlaylistCover({ data, className = "" }: { data: PlaylistCardData; className?: string }) {
  const cover = data.artwork ||
    data.tracks?.find(t => t.artwork)?.artwork?.replace("large", "t300x300") ||
    null;

  if (cover) return <img src={cover} alt={data.title} decoding="async" loading="lazy" className={`w-full h-full object-cover ${className}`} />;
  return (
    <div className={`w-full h-full flex items-center justify-center bg-white/[0.04] ${className}`}>
      <ListIcon />
    </div>
  );
}

export const PlaylistCard = memo(function PlaylistCard({
  playlist,
  showPlayback = false,
}: {
  playlist: PlaylistCardData;
  showPlayback?: boolean;
}) {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, setTrack, setQueue, togglePlay } = usePlayerStore();

  const trackIds = useMemo(() => new Set((playlist.tracks ?? []).map(t => t.id)), [playlist.tracks]);
  const isFromThis = !!currentTrack && trackIds.has(currentTrack.id);
  const isPlayingFromThis = isFromThis && isPlaying;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFromThis) { togglePlay(); return; }
    if (playlist.tracks && playlist.tracks.length > 0) {
      const tracks = playlist.tracks as any[];
      setQueue(tracks);
      setTrack(tracks[0]);
    } else {
      navigate(`/playlist/${playlist.id}`);
    }
  };

  return (
    <div
      className="group relative flex flex-col gap-3 cursor-pointer select-none"
      onClick={() => navigate(`/playlist/${playlist.id}`)}
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/[0.02] ring-1 ring-white/[0.06] shadow-lg group-hover:shadow-2xl group-hover:ring-white/[0.15] transition-all duration-500">
        <PlaylistCover
          data={playlist}
          className="transition-transform duration-700 group-hover:scale-[1.05]"
        />

        {showPlayback ? (
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100 ${isPlayingFromThis ? "bg-black/40 opacity-100" : "bg-black/0 opacity-0"}`}>
            <div
              onClick={handlePlay}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl hover:scale-110 active:scale-95 group-hover:scale-100 bg-white ${isPlayingFromThis ? "scale-100" : "scale-75"}`}
            >
              {isPlayingFromThis ? <PauseIcon /> : <PlayIcon />}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}

        {playlist.trackCount != null && (
          <div className={`absolute bottom-2.5 right-2.5 flex items-center gap-1.5 text-[11px] font-medium bg-black/60 backdrop-blur-md text-white/90 px-2.5 py-1 rounded-full shadow-lg ${showPlayback ? "opacity-0 group-hover:opacity-100 transition-opacity duration-300" : ""}`}>
            <ListIcon /> {playlist.trackCount}
          </div>
        )}
      </div>

      <div className="min-w-0 px-1">
        <p className="text-[14px] font-semibold text-white/90 truncate leading-snug group-hover:text-white transition-colors duration-200">
          {playlist.title}
        </p>
        {showPlayback ? (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider bg-white/[0.05] px-1.5 py-0.5 rounded-md">
              {playlist.isAlbum ? "Album" : "Playlist"}
            </span>
            {(playlist.likesCount ?? 0) > 0 && (
              <span className="text-[11px] text-white/30 tabular-nums flex items-center gap-1">
                <HeartIcon /> {formatCount(playlist.likesCount ?? 0)}
              </span>
            )}
          </div>
        ) : (
          <p className="text-[12px] text-white/40 truncate mt-1">
            {playlist.user?.username || "Playlist"}
          </p>
        )}
      </div>
    </div>
  );
});