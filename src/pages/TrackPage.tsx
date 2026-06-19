import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTrack, getRelatedTracks, getTrackComments, formatDuration, formatCount, getStreamUrl } from "../api/soundcloud";
import { usePlayerStore } from "../store/playerStore";
import type { Track } from "../store/playerStore";

const ChevronLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
    <path d="M5 3.5l12 6.5-12 6.5V3.5z" />
  </svg>
);
const PauseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
    <rect x="4" y="3" width="4" height="14" rx="1" />
    <rect x="12" y="3" width="4" height="14" rx="1" />
  </svg>
);
const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);
const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);
const PlayCountIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 3.5l12 6.5-12 6.5V3.5z" />
  </svg>
);
const CommentIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

function HeroSkeleton() {
  return (
    <div
      className="relative rounded-[2rem] overflow-hidden p-6 md:p-8"
      style={{ background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-[200px] h-[200px] rounded-[1.5rem] skeleton-shimmer shrink-0 self-center lg:self-start" />
        <div className="flex-1 space-y-4">
          <div className="h-3 w-24 rounded-full skeleton-shimmer" />
          <div className="h-12 w-3/4 rounded-2xl skeleton-shimmer" />
          <div className="h-4 w-40 rounded-full skeleton-shimmer" />
          <div className="h-10 w-48 rounded-full skeleton-shimmer mt-4" />
        </div>
      </div>
    </div>
  );
}

export default function TrackPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const trackId = Number(id);

  const { currentTrack, isPlaying, setTrack, setQueue, togglePlay } = usePlayerStore();

  const { data: track, isLoading } = useQuery({
    queryKey: ["track", trackId],
    queryFn: () => getTrack(trackId),
    enabled: !!trackId,
  });

  const { data: related } = useQuery({
    queryKey: ["related", trackId],
    queryFn: () => getRelatedTracks(trackId, 10),
    enabled: !!trackId,
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", trackId],
    queryFn: () => getTrackComments(trackId, 20),
    enabled: !!trackId,
  });

  const isThisTrack = currentTrack?.id === trackId;
  const isThisPlaying = isThisTrack && isPlaying;

  const handlePlay = () => {
    if (!track) return;
    if (isThisTrack) {
      togglePlay();
    } else {
      setQueue([track]);
      setTrack(track);
    }
  };

  const handleMouseEnter = () => {
    if (track) getStreamUrl(track.id).catch(() => {});
  };

  const artworkLarge = track?.artwork?.replace("t300x300", "t500x500");

  return (
    <div className="relative min-h-full w-full">
      {artworkLarge && (
        <div
          className="fixed inset-0 pointer-events-none z-0 opacity-[0.07]"
          style={{
            backgroundImage: `url(${artworkLarge})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(80px) saturate(1.5)",
          }}
        />
      )}

      <div className="relative z-10 max-w-[1320px] mx-auto px-4 md:px-8 pt-5 pb-32" style={{ isolation: "isolate" }}>
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/55 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer mb-5"
        >
          <ChevronLeftIcon />
        </button>

        {isLoading && <HeroSkeleton />}

        {track && (
          <div className="space-y-6">
            <section
              className="relative rounded-[2rem] overflow-hidden p-6 md:p-8"
              style={{
                background: "linear-gradient(165deg, rgba(255,255,255,0.06), rgba(255,255,255,0.018) 60%, rgba(255,255,255,0.035))",
                border: "0.5px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(40px) saturate(1.5)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
              }}
            >
              {artworkLarge && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
                  <img
                    src={artworkLarge}
                    alt=""
                    className="w-full h-full object-cover scale-[1.4] opacity-[0.18]"
                    style={{ filter: "blur(60px) saturate(1.4)" }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(180deg, rgba(10,10,12,0.3), rgba(10,10,12,0.7))" }}
                  />
                </div>
              )}

              <div className="relative flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
                <div
                  className="relative w-[180px] h-[180px] md:w-[220px] md:h-[220px] shrink-0 rounded-[1.5rem] overflow-hidden cursor-pointer"
                  style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1) inset" }}
                  onClick={handlePlay}
                  onMouseEnter={handleMouseEnter}
                >
                  {track.artwork ? (
                    <img src={artworkLarge} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/[0.04] flex items-center justify-center text-white/20">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                      </svg>
                    </div>
                  )}
                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isThisTrack ? "bg-black/30 opacity-100" : "bg-black/0 opacity-0 hover:bg-black/30 hover:opacity-100"}`}>
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                      {isThisPlaying ? <PauseIcon /> : <PlayIcon />}
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0 w-full text-center lg:text-left">
                  {track.genre && (
                    <span
                      className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.06] text-white/55 border border-white/[0.06] uppercase tracking-[0.14em] mb-3"
                      style={{ color: "var(--color-accent)" }}
                    >
                      {track.genre}
                    </span>
                  )}

                  <h1 className="text-3xl md:text-5xl xl:text-6xl font-black leading-[0.95] tracking-tighter break-words text-white/95 mb-4">
                    {track.title}
                  </h1>

                  <div className="flex items-center gap-2.5 justify-center lg:justify-start mb-6">
                    {track.userAvatar && (
                      <img src={track.userAvatar} alt={track.artist} className="w-7 h-7 rounded-full ring-1 ring-white/[0.1]" />
                    )}
                    <span className="text-[15px] font-medium text-white/75">{track.artist}</span>
                    {track.releaseYear && (
                      <span className="text-[12px] text-white/30 tabular-nums">· {track.releaseYear}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 justify-center lg:justify-start flex-wrap">
                    <button
                      onClick={handlePlay}
                      onMouseEnter={handleMouseEnter}
                      className="flex items-center gap-2.5 pl-5 pr-6 h-11 rounded-full font-bold text-[14px] text-white cursor-pointer transition-all hover:scale-[1.03] active:scale-95"
                      style={{
                        background: "linear-gradient(180deg, var(--color-accent), var(--color-accent-hover))",
                        boxShadow: "0 10px 30px rgba(255,85,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
                      }}
                    >
                      {isThisPlaying ? <PauseIcon /> : <PlayIcon />}
                      {isThisPlaying ? "Pause" : "Play"}
                    </button>
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-[var(--color-accent)] hover:bg-white/[0.06] transition-all cursor-pointer border border-white/[0.08]">
                      <HeartIcon />
                    </button>
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer border border-white/[0.08]">
                      <ShareIcon />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mt-5 justify-center lg:justify-start">
                    <span className="flex items-center gap-1.5 text-[12px] text-white/30">
                      <PlayCountIcon /> {formatCount(track.playbackCount)}
                    </span>
                    <span className="flex items-center gap-1.5 text-[12px] text-white/30">
                      <HeartIcon /> {formatCount(track.likesCount)}
                    </span>
                    {track.commentCount > 0 && (
                      <span className="flex items-center gap-1.5 text-[12px] text-white/30">
                        <CommentIcon /> {formatCount(track.commentCount)}
                      </span>
                    )}
                    <span className="text-[12px] text-white/20 tabular-nums">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-5">
                {track.description && (
                  <section
                    className="rounded-2xl p-5"
                    style={{ background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.07)" }}
                  >
                    <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/35 mb-3">About</h2>
                    <p className="text-[13.5px] text-white/65 leading-relaxed whitespace-pre-wrap">{track.description}</p>
                  </section>
                )}

                {track.tagList && (
                  <div className="flex flex-wrap gap-2">
                    {track.tagList.split(" ").filter(Boolean).map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-[11px] text-white/45 cursor-pointer hover:text-white/70 transition-colors"
                        style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}
                      >
                        #{tag.replace(/"/g, "")}
                      </span>
                    ))}
                  </div>
                )}

                {comments && comments.length > 0 && (
                  <section
                    className="rounded-2xl p-5"
                    style={{ background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.07)" }}
                  >
                    <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/35 mb-4">
                      Comments · {formatCount(track.commentCount)}
                    </h2>
                    <div className="flex flex-col gap-4">
                      {comments.map((c: any) => (
                        <div key={c.id} className="flex items-start gap-3">
                          <img
                            src={c.user?.avatar_url || "/32x32.png"}
                            alt={c.user?.username}
                            className="w-8 h-8 rounded-full shrink-0 ring-1 ring-white/[0.08]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[12px] font-medium text-white/70">{c.user?.username}</span>
                              <span className="text-[11px] text-white/25 tabular-nums">
                                {formatDuration(c.timestamp || 0)}
                              </span>
                            </div>
                            <p className="text-[13px] text-white/55 leading-snug">{c.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {related && related.length > 0 && (
                <aside>
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/35 mb-4">Related tracks</h2>
                  <div className="flex flex-col gap-3">
                    {related.map((rel: Track) => (
                      <div
                        key={rel.id}
                        className="group flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer"
                        onClick={() => { setQueue(related); setTrack(rel); }}
                        onMouseEnter={() => getStreamUrl(rel.id).catch(() => {})}
                      >
                        <div className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden ring-1 ring-white/[0.08]">
                          {rel.artwork ? (
                            <img src={rel.artwork} alt={rel.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-white/[0.04]" />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            <PlayIcon />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-medium truncate ${currentTrack?.id === rel.id ? "text-[var(--color-accent)]" : "text-white/85"}`}>
                            {rel.title}
                          </p>
                          <p className="text-[11px] text-white/40 truncate mt-0.5">{rel.artist}</p>
                        </div>
                        <span className="text-[11px] text-white/20 tabular-nums shrink-0">
                          {formatDuration(rel.duration)}
                        </span>
                      </div>
                    ))}
                  </div>
                </aside>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}