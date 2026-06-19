import { memo, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  getTrack, getRelatedTracks, getTrackComments,
  formatDuration, formatCount, getStreamUrl,
} from "../api/soundcloud";
import { usePlayerStore } from "../store/playerStore";
import { useViewerAura } from "../lib/useViewerAura";
import { auraRgba } from "../lib/aura";
import { usePerfMode } from "../lib/perf";
import { USER_PAGE_KEYFRAMES } from "../components/user/keyframes";
import type { Track } from "../store/playerStore";

// ── Icons ──────────────────────────────────────────────────────────────────
const PlayIcon = () => <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3.5l12 6.5-12 6.5V3.5z"/></svg>;
const PauseIcon = () => <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><rect x="4" y="3" width="4" height="14" rx="1"/><rect x="12" y="3" width="4" height="14" rx="1"/></svg>;
const HeartIcon = ({ filled }: { filled?: boolean }) => <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
const ShareIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const ChevronDownIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const ChevronUpIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>;
const HashIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>;
const MusicIcon = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-white/10"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
const SmallPlayIcon = () => <svg width="14" height="14" viewBox="0 0 20 20" fill="white"><path d="M5 3.5l12 6.5-12 6.5V3.5z"/></svg>;

const PANEL = {
  background: "rgba(255,255,255,0.025)",
  border: "0.5px solid rgba(255,255,255,0.07)",
} as const;

// ── StatOrb ────────────────────────────────────────────────────────────────
function StatOrb({ value, label, accent }: { value?: number | null; label: string; accent: string }) {
  const b = usePerfMode().blur(24);
  return (
    <div
      className="relative px-4 py-2.5 rounded-2xl flex items-baseline gap-2 transition-transform duration-500 hover:scale-[1.04]"
      style={{
        background: b > 0 ? "rgba(255,255,255,0.04)" : "rgba(28,28,32,0.85)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        backdropFilter: b > 0 ? `blur(${b}px)` : undefined,
        boxShadow: `inset 0 0.5px 0 rgba(255,255,255,0.08), 0 8px 24px ${accent}`,
      }}
    >
      <span className="text-[18px] font-black tabular-nums tracking-tight text-white">
        {value != null ? formatCount(value) : "—"}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{label}</span>
    </div>
  );
}

// ── LinerNotes ─────────────────────────────────────────────────────────────
function parseTags(tagList?: string): string[] {
  if (!tagList) return [];
  const tags: string[] = [];
  const re = /"([^"]+)"|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tagList))) tags.push(m[1] || m[2]);
  return tags;
}

function Credit({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{label}</span>
      <span
        className={`text-[13px] truncate ${onClick ? "text-white/75 hover:text-white cursor-pointer transition-colors" : "text-white/70"}`}
        onClick={onClick}
      >
        {value}
      </span>
    </div>
  );
}

const LinerNotes = memo(function LinerNotes({ track, accentGlow }: { track: any; accentGlow: string }) {
  const [expanded, setExpanded] = useState(false);
  const desc = track.description?.trim();
  const descLong = !!desc && desc.length > 280;
  const tags = parseTags(track.tagList);

  const credits: { label: string; value: string }[] = [];
  if (track.releaseYear) credits.push({ label: "Released", value: String(track.releaseYear) });
  if (track.genre) credits.push({ label: "Genre", value: track.genre });
  if (track.duration) credits.push({ label: "Duration", value: formatDuration(track.duration) });

  return (
    <section className="glass rounded-[2rem] p-6 md:p-7 space-y-6">
      {/* Stats */}
      <div className="flex flex-wrap gap-2.5">
        <StatOrb value={track.playbackCount} label="Plays" accent={accentGlow} />
        <StatOrb value={track.likesCount} label="Likes" accent={accentGlow} />
        {track.repostsCount != null && <StatOrb value={track.repostsCount} label="Reposts" accent={accentGlow} />}
        <StatOrb value={track.commentCount} label="Comments" accent={accentGlow} />
      </div>

      {/* Description */}
      {desc && (
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30 mb-2.5">Description</h3>
          <p className={`text-[13.5px] text-white/55 leading-relaxed whitespace-pre-wrap break-words ${!expanded && descLong ? "line-clamp-4" : ""}`}>
            {desc}
          </p>
          {descLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 mt-2 text-[11px] text-white/35 hover:text-white/60 transition-colors cursor-pointer"
            >
              {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* Credits */}
      {credits.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
          {credits.map((c) => <Credit key={c.label} {...c} />)}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <HashIcon />
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-white/[0.04] text-white/40 border border-white/[0.05] hover:bg-white/[0.07] hover:text-white/60 transition-all cursor-default"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </section>
  );
});

// ── RoomSleeve ─────────────────────────────────────────────────────────────
const RoomSleeve = memo(function RoomSleeve({
  track, related, relatedLoading, accentGlow,
}: {
  track: any;
  related: Track[];
  relatedLoading: boolean;
  accentGlow: string;
}) {
  const navigate = useNavigate();
  const { setTrack, setQueue, currentTrack } = usePlayerStore();

  return (
    <div className="space-y-5">
      {/* Artist card */}
      {track.userId && (
        <button
          type="button"
          onClick={() => navigate(`/user/${track.userId}`)}
          className="group/ac w-full rounded-[1.5rem] p-6 flex flex-col items-center text-center gap-3.5 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
          style={PANEL}
        >
          {track.userAvatar && (
            <img
              src={track.userAvatar}
              alt={track.artist}
              className="w-20 h-20 rounded-full object-cover ring-1 ring-white/[0.12] transition-transform duration-500 group-hover/ac:scale-105"
              style={{ boxShadow: `0 14px 36px ${accentGlow}` }}
            />
          )}
          <div>
            <p className="text-[15px] font-bold text-white/90 group-hover/ac:text-white transition-colors">
              {track.artist}
            </p>
            <p className="text-[11px] text-white/35 mt-1">View profile →</p>
          </div>
        </button>
      )}

      {/* Related */}
      {relatedLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
        </div>
      ) : related.length > 0 && (
        <div className="rounded-[1.5rem] p-4" style={PANEL}>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40 mb-3 px-1">
            Related tracks
          </h3>
          <div className="flex flex-col gap-1">
            {related.map((rel) => (
              <div
                key={rel.id}
                className="group/rel flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer"
                onClick={() => { setQueue(related); setTrack(rel); }}
                onMouseEnter={() => getStreamUrl(rel.id).catch(() => {})}
              >
                <div className="relative w-10 h-10 shrink-0 rounded-xl overflow-hidden ring-1 ring-white/[0.08]">
                  {rel.artwork
                    ? <img src={rel.artwork} alt={rel.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-white/[0.04]" />
                  }
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/rel:opacity-100 transition-opacity">
                    <SmallPlayIcon />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[12.5px] font-medium truncate ${currentTrack?.id === rel.id ? "text-[var(--color-accent)]" : "text-white/85"}`}>
                    {rel.title}
                  </p>
                  <p className="text-[11px] text-white/40 truncate mt-0.5">{rel.artist}</p>
                </div>
                <span className="text-[10px] text-white/20 tabular-nums shrink-0">
                  {formatDuration(rel.duration)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// ── RoomVoices (comments) ──────────────────────────────────────────────────
const RoomVoices = memo(function RoomVoices({ comments, track }: { comments: any[]; track: any }) {
  if (!comments.length) return null;
  return (
    <section className="rounded-2xl p-5" style={PANEL}>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35 mb-4">
        Comments · {formatCount(track.commentCount)}
      </h2>
      <div className="flex flex-col gap-4">
        {comments.map((c: any) => (
          <div key={c.id} className="flex items-start gap-3">
            <img
              src={c.user?.avatar_url?.replace("large", "small") || ""}
              alt={c.user?.username}
              className="w-8 h-8 rounded-full shrink-0 ring-1 ring-white/[0.08] bg-white/[0.04]"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[12px] font-medium text-white/70">{c.user?.username}</span>
                {c.timestamp > 0 && (
                  <span className="text-[11px] text-white/25 tabular-nums">
                    @ {formatDuration(c.timestamp * 1000)}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-white/55 leading-snug">{c.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

// ── Skeleton ───────────────────────────────────────────────────────────────
function HeroSkeleton() {
  return (
    <div className="relative rounded-[2rem] overflow-hidden glass-featured p-6 md:p-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-[180px] h-[180px] md:w-[220px] md:h-[220px] rounded-[2.2rem] skeleton-shimmer shrink-0 self-center lg:self-start" />
        <div className="flex-1 space-y-4 w-full">
          <div className="h-4 w-40 rounded-full skeleton-shimmer" />
          <div className="h-12 w-3/4 rounded-2xl skeleton-shimmer" />
          <div className="h-5 w-48 rounded-full skeleton-shimmer" />
          <div className="h-11 w-64 rounded-full skeleton-shimmer mt-6" />
        </div>
      </div>
      <div className="h-[96px] mt-8 rounded-xl skeleton-shimmer" />
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default memo(function TrackPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const trackId = Number(id);
  const aura = useViewerAura();
  const perf = usePerfMode();

  const { currentTrack, isPlaying, setTrack, setQueue, togglePlay } = usePlayerStore();

  const { data: track, isLoading } = useQuery({
    queryKey: ["track", trackId],
    queryFn: () => getTrack(trackId),
    enabled: !!trackId,
    staleTime: 30_000,
  });

  const { data: related = [], isLoading: relatedLoading } = useQuery<Track[]>({
    queryKey: ["related", trackId],
    queryFn: () => getRelatedTracks(trackId, 12),
    enabled: !!trackId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", trackId],
    queryFn: () => getTrackComments(trackId, 30),
    enabled: !!trackId,
  });

  const isThis = currentTrack?.id === trackId;
  const isThisPlaying = isThis && isPlaying;
  const accentGlow = auraRgba(aura, 0.2);

  const handlePlay = useCallback(() => {
    if (!track) return;
    if (isThis) togglePlay();
    else { setQueue([track, ...related]); setTrack(track); }
  }, [track, isThis, related, togglePlay, setQueue, setTrack]);

  const artworkLarge = track?.artwork?.replace("t300x300", "t500x500");
  const b = perf.blur(90);

  if (isLoading) return (
    <div className="relative min-h-full w-full">
      <style>{USER_PAGE_KEYFRAMES}</style>
      <div className="relative z-10 max-w-[1320px] mx-auto px-4 md:px-8 pt-5 pb-10">
        <HeroSkeleton />
      </div>
    </div>
  );

  if (!track) return null;

  return (
    <div className="relative min-h-full w-full">
      <style>{USER_PAGE_KEYFRAMES}</style>

      {/* Ambient bg */}
      {artworkLarge && b > 0 && (
        <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.07]"
          style={{ backgroundImage: `url(${artworkLarge})`, backgroundSize: "cover", backgroundPosition: "center", filter: `blur(80px) saturate(1.5)` }}
        />
      )}

      <div
        className="relative z-10 max-w-[1320px] mx-auto px-4 md:px-8 pt-5 pb-32 space-y-7"
        style={{ isolation: "isolate" }}
      >
        {/* Back + room label */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/55 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          {track.genre && (
            <span className="text-[10px] uppercase tracking-[0.24em] text-white/20">
              {track.genre}
            </span>
          )}
        </div>

        {/* RoomHero */}
        <section
          className="relative rounded-[2rem] overflow-hidden glass-featured"
          style={{ isolation: "isolate" }}
        >
          {artworkLarge && b > 0 && (
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <img src={artworkLarge} alt="" className="w-full h-full object-cover scale-[1.4] opacity-[0.20]" style={{ filter: `blur(${b}px) saturate(1.4)` }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,10,12,0.40), rgba(10,10,12,0.66))" }} />
            </div>
          )}

          <div className="relative p-6 md:p-8 flex flex-col gap-7">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
              {/* Cover */}
              <div
                className="relative w-[180px] h-[180px] md:w-[220px] md:h-[220px] shrink-0 rounded-[2.2rem] overflow-hidden cursor-pointer"
                style={{ boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${accentGlow}, 0 0 0 1px rgba(255,255,255,0.1) inset` }}
                onClick={handlePlay}
                onMouseEnter={() => getStreamUrl(track.id).catch(() => {})}
              >
                {track.artwork
                  ? <img src={artworkLarge} alt={track.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-white/[0.04] flex items-center justify-center"><MusicIcon /></div>
                }
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isThis ? "bg-black/30 opacity-100" : "bg-black/0 opacity-0 hover:bg-black/30 hover:opacity-100"}`}>
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                    {isThisPlaying ? <PauseIcon /> : <PlayIcon />}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 w-full text-center lg:text-left">
                <div className="flex items-center gap-2 flex-wrap justify-center lg:justify-start mb-3.5">
                  {track.genre && (
                    <span
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.06] uppercase tracking-[0.14em]"
                      style={{ color: "var(--color-accent)" }}
                    >
                      {track.genre}
                    </span>
                  )}
                  {track.releaseYear && (
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.05] text-white/40 border border-white/[0.06] tabular-nums">
                      {track.releaseYear}
                    </span>
                  )}
                </div>

                <h1 className="text-4xl md:text-6xl xl:text-7xl font-black leading-[0.95] tracking-tighter break-words mb-4"
                  style={{
                    backgroundImage: aura.nameGradient,
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {track.title}
                </h1>

                <div className="flex items-center gap-2.5 justify-center lg:justify-start mb-6">
                  {track.userAvatar && (
                    <img
                      src={track.userAvatar}
                      alt={track.artist}
                      className="w-7 h-7 rounded-full ring-1 ring-white/[0.1] cursor-pointer hover:ring-white/[0.22] transition-all"
                      onClick={() => track.userId && navigate(`/user/${track.userId}`)}
                    />
                  )}
                  <span
                    className="text-[15px] font-medium text-white/75 hover:text-white transition-colors cursor-pointer"
                    onClick={() => track.userId && navigate(`/user/${track.userId}`)}
                  >
                    {track.artist}
                  </span>
                </div>

                {/* Action rail */}
                <div className="flex items-center gap-3 justify-center lg:justify-start flex-wrap">
                  <button
                    onClick={handlePlay}
                    onMouseEnter={() => getStreamUrl(track.id).catch(() => {})}
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
                  <button
                    onClick={() => navigator.clipboard.writeText(track.permalinkUrl || "").catch(() => {})}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer border border-white/[0.08]"
                    title="Copy link"
                  >
                    <ShareIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LinerNotes */}
        <LinerNotes track={track} accentGlow={accentGlow} />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8 items-start">
          <RoomVoices comments={comments} track={track} />
          <RoomSleeve
            track={track}
            related={related}
            relatedLoading={relatedLoading}
            accentGlow={accentGlow}
          />
        </div>
      </div>
    </div>
  );
});