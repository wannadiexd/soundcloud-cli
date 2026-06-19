import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUser, getUserTracks, getUserLikes, formatCount, getStreamUrl } from "../api/soundcloud";
import { usePlayerStore } from "../store/playerStore";
import { useViewerAura } from "../lib/useViewerAura";
import { auraRgba } from "../lib/aura";
import { usePerfMode } from "../lib/perf";
import { USER_PAGE_KEYFRAMES } from "../components/user/keyframes";
import TrackCard from "../components/TrackCard";
import type { Track } from "../store/playerStore";

// ── Icons ──────────────────────────────────────────────────────────────────
const PlayIcon = () => <svg width="14" height="14" viewBox="0 0 20 20" fill="white"><path d="M5 3.5l12 6.5-12 6.5V3.5z"/></svg>;
const VerifiedIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const GlobeIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>;
const MusicIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
const UsersIcon = () => <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-white/10"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;

// ── TabDock ────────────────────────────────────────────────────────────────
type TabId = "popular" | "tracks" | "likes" | "followers" | "following";

interface TabDesc {
  id: TabId;
  label: string;
  count?: number | null;
}

const TabDock = memo(function TabDock({
  tabs, active, onChange, aura,
}: {
  tabs: TabDesc[];
  active: TabId;
  onChange: (id: TabId) => void;
  aura: ReturnType<typeof useViewerAura>;
}) {
  const perf = usePerfMode();
  const dockRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const [overflows, setOverflows] = useState(false);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  useLayoutEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const btn = dock.querySelector<HTMLButtonElement>(`[data-tab="${active}"]`);
    if (!btn) return;
    const update = () => {
      const dr = dock.getBoundingClientRect();
      const br = btn.getBoundingClientRect();
      setPill({ x: br.left - dr.left + dock.scrollLeft, w: br.width });
      setOverflows(dock.scrollWidth > dock.clientWidth + 1);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(dock); ro.observe(btn);
    return () => ro.disconnect();
  }, [active, tabs]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const dock = dockRef.current;
    if (!dock || dock.scrollWidth <= dock.clientWidth + 1) return;
    dragRef.current = { active: true, startX: e.clientX, startScroll: dock.scrollLeft, moved: false };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const dock = dockRef.current;
    if (!dock) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) > 5) {
      drag.moved = true;
      dock.setPointerCapture(e.pointerId);
      dock.style.cursor = "grabbing";
    }
    if (drag.moved) dock.scrollLeft = drag.startScroll - dx;
  }, []);

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false; drag.moved = false;
    const dock = dockRef.current;
    if (!dock) return;
    if (dock.hasPointerCapture(e.pointerId)) dock.releasePointerCapture(e.pointerId);
    dock.style.cursor = "";
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (dragRef.current.moved) { e.preventDefault(); e.stopPropagation(); }
  }, []);

  const b = perf.blur(40);

  return (
    <div className="sticky top-3 z-40 flex justify-center pointer-events-none px-2">
      <div
        ref={dockRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        className="pointer-events-auto relative flex items-center gap-0.5 p-1.5 rounded-2xl min-w-0 max-w-full overflow-x-auto overscroll-x-contain touch-pan-x select-none scrollbar-hide"
        style={{
          background: b > 0 ? "rgba(15,15,18,0.55)" : "rgba(15,15,18,0.92)",
          backdropFilter: b > 0 ? `blur(${b}px) saturate(180%)` : undefined,
          boxShadow: "0 24px 60px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.08)",
          cursor: overflows ? "grab" : undefined,
        }}
      >
        {pill && (
          <div
            className="absolute top-1.5 bottom-1.5 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] pointer-events-none"
            style={{
              left: pill.x,
              width: pill.w,
              background: `linear-gradient(180deg, ${auraRgba(aura, 0.22)}, ${auraRgba(aura, 0.06)})`,
              border: `0.5px solid ${auraRgba(aura, 0.35)}`,
              boxShadow: `0 6px 20px ${auraRgba(aura, 0.25)}, inset 0 0.5px 0 rgba(255,255,255,0.12)`,
            }}
          />
        )}
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-tab={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative z-10 shrink-0 inline-flex items-center gap-2 px-3.5 md:px-4 h-9 rounded-xl text-[12.5px] font-semibold transition-colors duration-300 cursor-pointer ${isActive ? "text-white" : "text-white/45 hover:text-white/85"}`}
            >
              <span className="whitespace-nowrap">{tab.label}</span>
              {tab.count != null && (
                <span
                  className="text-[10px] tabular-nums font-bold px-1.5 py-0.5 rounded-md transition-colors"
                  style={{
                    background: isActive ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.05)",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.35)",
                  }}
                >
                  {formatCount(tab.count)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

// ── StatOrb ────────────────────────────────────────────────────────────────
const StatOrb = memo(function StatOrb({ value, label, accent }: { value?: number | null; label: string; accent: string }) {
  const b = usePerfMode().blur(24);
  return (
    <div
      className="relative px-5 py-3 rounded-2xl flex items-baseline gap-2.5 transition-transform duration-500 hover:scale-[1.04]"
      style={{
        background: b > 0 ? "rgba(255,255,255,0.04)" : "rgba(28,28,32,0.85)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        backdropFilter: b > 0 ? `blur(${b}px)` : undefined,
        boxShadow: `inset 0 0.5px 0 rgba(255,255,255,0.08), 0 8px 24px ${accent}`,
      }}
    >
      <span className="text-[20px] font-black tabular-nums tracking-tight text-white">
        {value != null ? formatCount(value) : "—"}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">{label}</span>
    </div>
  );
});

// ── AvatarArtifact ─────────────────────────────────────────────────────────
const AvatarArtifact = memo(function AvatarArtifact({
  username, avatarUrl, aura,
}: {
  username: string;
  avatarUrl?: string | null;
  aura: ReturnType<typeof useViewerAura>;
}) {
  const url = avatarUrl?.replace("large", "t500x500");
  return (
    <div className="relative shrink-0 self-center group w-[148px] h-[148px] md:w-[180px] md:h-[180px]">
      <div
        className="relative w-full h-full rounded-[2rem] overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.10)",
          boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 40px ${auraRgba(aura, 0.2)}, inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      >
        {url
          ? <img src={url} alt={username} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.06]" />
          : <div className="w-full h-full flex items-center justify-center"><UsersIcon /></div>
        }
      </div>
    </div>
  );
});

// ── TrackRow ───────────────────────────────────────────────────────────────
const TrackRow = memo(function TrackRow({
  track, queue, index, aura,
}: {
  track: Track;
  queue: Track[];
  index: number;
  aura: ReturnType<typeof useViewerAura>;
}) {
  const { setTrack, setQueue, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const navigate = useNavigate();
  const isThis = currentTrack?.id === track.id;
  const isThisPlaying = isThis && isPlaying;

  const handlePlay = () => {
    if (isThis) togglePlay();
    else { setQueue(queue); setTrack(track); }
  };

  return (
    <div
      className="group flex items-center gap-4 px-4 py-2.5 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer"
      style={isThis ? { background: `${auraRgba(aura, 0.07)}` } : undefined}
      onMouseEnter={() => getStreamUrl(track.id).catch(() => {})}
    >
      <span className="w-6 text-center text-[12px] tabular-nums shrink-0"
        style={{ color: isThis ? aura.orbs[0] : "rgba(255,255,255,0.2)" }}
      >
        {isThisPlaying ? (
          <span className="flex items-center justify-center gap-0.5">
            <i className="block w-0.5 h-3 rounded-full animate-pulse" style={{ background: aura.orbs[0] }} />
            <i className="block w-0.5 h-4 rounded-full animate-pulse" style={{ background: aura.orbs[0], animationDelay: "0.2s" }} />
            <i className="block w-0.5 h-2 rounded-full animate-pulse" style={{ background: aura.orbs[0], animationDelay: "0.4s" }} />
          </span>
        ) : index + 1}
      </span>

      <div className="relative w-10 h-10 shrink-0 rounded-xl overflow-hidden ring-1 ring-white/[0.08]" onClick={handlePlay}>
        {track.artwork
          ? <img src={track.artwork} alt={track.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-white/[0.04]" />
        }
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayIcon />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-medium truncate hover:underline cursor-pointer"
          style={{ color: isThis ? aura.orbs[0] : "rgba(255,255,255,0.85)" }}
          onClick={() => navigate(`/track/${track.id}`)}
        >
          {track.title}
        </p>
        <p className="text-[11px] text-white/35 truncate mt-0.5">{track.artist}</p>
      </div>

      <span className="text-[11px] text-white/20 tabular-nums shrink-0 hidden sm:block">
        {formatCount(track.playbackCount)} plays
      </span>
    </div>
  );
});

// ── Empty ──────────────────────────────────────────────────────────────────
function Empty({ label = "Nothing here yet" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/[0.03] border border-white/[0.06]">
        <MusicIcon />
      </div>
      <p className="text-white/30 text-[14px]">{label}</p>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="flex flex-col gap-2 p-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-2.5">
          <div className="w-6 h-4 rounded skeleton-shimmer" />
          <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/2 rounded skeleton-shimmer" />
            <div className="h-3 w-1/3 rounded skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tabs content ───────────────────────────────────────────────────────────
function TracksTab({ id, aura }: { id: string; aura: ReturnType<typeof useViewerAura> }) {
  const { data: tracks = [], isLoading } = useQuery<Track[]>({
    queryKey: ["user-tracks", id],
    queryFn: () => getUserTracks(id, 50),
    staleTime: 1000 * 60 * 5,
  });
  if (isLoading) return <Skeleton />;
  if (!tracks.length) return <Empty label="No tracks yet" />;
  return (
    <div className="flex flex-col gap-1 p-2">
      {tracks.map((t, i) => <TrackRow key={t.id} track={t} queue={tracks} index={i} aura={aura} />)}
    </div>
  );
}

function LikesTab({ id, aura }: { id: string; aura: ReturnType<typeof useViewerAura> }) {
  const { data: tracks = [], isLoading } = useQuery<Track[]>({
    queryKey: ["user-likes", id],
    queryFn: () => getUserLikes(id, 50),
    staleTime: 1000 * 60 * 5,
  });
  if (isLoading) return (
    <div className="grid gap-4 p-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-square rounded-2xl skeleton-shimmer" />
          <div className="mt-2 h-4 w-3/4 rounded skeleton-shimmer" />
          <div className="mt-1 h-3 w-1/2 rounded skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
  if (!tracks.length) return <Empty label="No likes yet" />;
  return (
    <div className="grid gap-4 p-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
      {tracks.map((t) => <TrackCard key={t.id} track={t} queue={tracks} />)}
    </div>
  );
}

function PopularTab({ id, aura }: { id: string; aura: ReturnType<typeof useViewerAura> }) {
  // Popular = первые треки отсортированные по plays
  const { data: tracks = [], isLoading } = useQuery<Track[]>({
    queryKey: ["user-tracks", id],
    queryFn: () => getUserTracks(id, 50),
    staleTime: 1000 * 60 * 5,
  });
  const sorted = [...tracks].sort((a, b) => b.playbackCount - a.playbackCount).slice(0, 20);
  if (isLoading) return <Skeleton />;
  if (!sorted.length) return <Empty label="No tracks yet" />;
  return (
    <div className="flex flex-col gap-1 p-2">
      {sorted.map((t, i) => <TrackRow key={t.id} track={t} queue={sorted} index={i} aura={aura} />)}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default memo(function UserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const aura = useViewerAura();
  const perf = usePerfMode();
  const [activeTab, setActiveTab] = useState<TabId>("popular");

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUser(id!),
    enabled: !!id,
  });

  const tabs: TabDesc[] = user ? [
    { id: "popular", label: "Popular" },
    { id: "tracks", label: "Tracks", count: user.trackCount },
    { id: "likes", label: "Likes", count: user.likesCount },
    { id: "followers", label: "Followers", count: user.followersCount },
    { id: "following", label: "Following", count: user.followingsCount },
  ] : [];

  const b = perf.blur(28);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[var(--color-accent)] animate-spin" />
    </div>
  );

  if (!user) return null;

  return (
    <div className="relative min-h-full w-full">
      <style>{USER_PAGE_KEYFRAMES}</style>

      {/* Aura background */}
      <div className="absolute inset-x-0 top-0 h-[420px] pointer-events-none overflow-hidden">
        {user.banner ? (
          <>
            <img src={user.banner} alt="" className="w-full h-full object-cover opacity-25" style={{ filter: "blur(2px) saturate(1.3)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,8,10,0.1) 0%, rgba(8,8,10,0.98) 100%)" }} />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${auraRgba(aura, 0.25)}, transparent 70%)`,
            }}
          />
        )}
      </div>

      <div
        className="relative z-10 w-full max-w-[1480px] mx-auto px-4 md:px-8 pt-10 md:pt-14 pb-32"
        style={{ isolation: "isolate" }}
      >
        {/* IdentityHub */}
        <div
          className="relative overflow-hidden rounded-[2.25rem] mb-10"
          style={{
            background: b > 0
              ? `linear-gradient(145deg, ${auraRgba(aura, 0.08)}, rgba(12,11,16,0.55))`
              : "rgba(14,13,18,0.92)",
            backdropFilter: b > 0 ? `blur(${b}px) saturate(150%)` : undefined,
            boxShadow: `0 30px 80px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 70px ${auraRgba(aura, 0.15)}`,
          }}
        >
          {/* top gloss */}
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)" }} />
          {/* aura glow */}
          <div className="absolute inset-0 pointer-events-none rounded-[inherit]"
            style={{ background: `radial-gradient(120% 130% at 6% -12%, ${auraRgba(aura, 0.18)}, transparent 56%)` }}
          />

          <div className="relative p-6 md:p-10 flex flex-col lg:flex-row gap-8 lg:gap-10 items-center lg:items-stretch">
            <AvatarArtifact username={user.username} avatarUrl={user.avatar} aura={aura} />

            <div className="flex-1 min-w-0 flex flex-col justify-between gap-5 text-center lg:text-left">
              {/* Chips */}
              <div className="flex flex-wrap items-center gap-2 justify-center lg:justify-start">
                {user.verified && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
                    style={{ background: "var(--color-accent)", boxShadow: "0 0 16px rgba(255,85,0,0.4)" }}
                  >
                    <VerifiedIcon /> Verified
                  </span>
                )}
                {(user.city || user.country) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] text-white/50 bg-white/[0.05] border border-white/[0.07]">
                    <GlobeIcon /> {[user.city, user.country].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>

              {/* Name */}
              <div className="flex flex-col items-center lg:items-start gap-3">
                <h1
                  className="text-5xl md:text-6xl font-black leading-[0.9] tracking-tighter break-words max-w-full"
                  style={{
                    backgroundImage: aura.nameGradient,
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {user.username}
                </h1>
                {user.fullName && user.fullName !== user.username && (
                  <p className="text-[13px] text-white/40 font-medium">{user.fullName}</p>
                )}
              </div>

              {/* Description */}
              {user.description && (
                <p className="text-[14px] text-white/60 leading-relaxed max-w-2xl line-clamp-3 hover:line-clamp-none transition-all duration-700 cursor-help">
                  {user.description}
                </p>
              )}

              {/* Back button */}
              <div className="flex justify-center lg:justify-start">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="text-[12px] text-white/35 hover:text-white/70 transition-colors cursor-pointer"
                >
                  ← Back
                </button>
              </div>
            </div>

            {/* Stats — desktop */}
            <div className="hidden xl:flex flex-col gap-3 self-stretch min-w-[160px]">
              <StatOrb value={user.followersCount} label="Followers" accent={auraRgba(aura, 0.2)} />
              <StatOrb value={user.followingsCount} label="Following" accent={auraRgba(aura, 0.16)} />
              <StatOrb value={user.trackCount} label="Tracks" accent={auraRgba(aura, 0.14)} />
              <StatOrb value={user.likesCount} label="Likes" accent={auraRgba(aura, 0.12)} />
            </div>
          </div>

          {/* Stats — mobile */}
          <div className="xl:hidden flex flex-wrap gap-2 px-6 md:px-10 pb-6 md:pb-8 justify-center lg:justify-start">
            <StatOrb value={user.followersCount} label="Followers" accent={auraRgba(aura, 0.2)} />
            <StatOrb value={user.followingsCount} label="Following" accent={auraRgba(aura, 0.16)} />
            <StatOrb value={user.trackCount} label="Tracks" accent={auraRgba(aura, 0.14)} />
            <StatOrb value={user.likesCount} label="Likes" accent={auraRgba(aura, 0.12)} />
          </div>
        </div>

        {/* TabDock */}
        <div className="mb-6">
          <TabDock tabs={tabs} active={activeTab} onChange={setActiveTab} aura={aura} />
        </div>

        {/* Content panel */}
        <div
          className="rounded-[2rem] p-3 md:p-5"
          style={{
            background: b > 0
              ? "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.015) 100%)"
              : "rgba(18,18,22,0.85)",
            backdropFilter: b > 0 ? `blur(${b}px) saturate(160%)` : undefined,
            boxShadow: "0 30px 80px rgba(0,0,0,0.30), inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {activeTab === "popular" && <PopularTab id={id!} aura={aura} />}
          {activeTab === "tracks" && <TracksTab id={id!} aura={aura} />}
          {activeTab === "likes" && <LikesTab id={id!} aura={aura} />}
          {(activeTab === "followers" || activeTab === "following") && (
            <Empty label="Coming soon" />
          )}
        </div>
      </div>
    </div>
  );
});