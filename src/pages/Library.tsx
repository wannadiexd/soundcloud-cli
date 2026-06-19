import { memo, useMemo } from "react";
import { Routes, Route, NavLink, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getLikedTracks, formatDuration } from "../api/soundcloud";
import TrackCard from "../components/TrackCard";
import { useHistoryStore, type HistoryEntry } from "../store/historyStore";
import { usePlayerStore } from "../store/playerStore";
import { useAuthStore } from "../store/authStore";
import { useViewerAura } from "../lib/useViewerAura";
import { auraRgba } from "../lib/aura";
import { usePerfMode } from "../lib/perf";
import { USER_PAGE_KEYFRAMES } from "../components/user/keyframes";
import type { Track } from "../store/playerStore";

const HeartIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
const ClockIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const ChevronRightIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const ShuffleIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>;
const PlayIcon = () => <svg width="14" height="14" viewBox="0 0 20 20" fill="white"><path d="M5 3.5l12 6.5-12 6.5V3.5z"/></svg>;
const MusicIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const ArtworkMosaic = memo(function ArtworkMosaic({ tracks }: { tracks: Track[] }) {
  const perf = usePerfMode();
  const covers = useMemo(
    () => tracks.map((t) => t.artwork).filter(Boolean).slice(0, 21),
    [tracks]
  );
  if (!perf.bloom || covers.length < 6) return null;
  const tiles = [...covers, ...covers];
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit]" style={{ contain: "strict" }}>
      <div
        className="absolute -inset-[8%] flex flex-wrap content-start gap-1.5 opacity-[0.15]"
        style={{ filter: `blur(40px) saturate(140%)` }}
      >
        {tiles.map((src, i) => (
          <img key={i} src={src} alt="" decoding="async" className="w-[13%] aspect-square object-cover rounded-2xl" />
        ))}
      </div>
    </div>
  );
});

const Masthead = memo(function Masthead({ likedTracks }: { likedTracks: Track[] }) {
  const user = useAuthStore((s) => s.user);
  const aura = useViewerAura();
  const perf = usePerfMode();
  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const b = perf.blur(22);

  const shufflePlay = () => {
    if (!likedTracks.length) return;
    const shuffled = [...likedTracks].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setTrack(shuffled[0]);
  };

  const playSurface = `radial-gradient(125% 125% at 30% 22%, ${auraRgba(aura, 0.9)}, ${aura.orbs[0]} 70%)`;

  return (
    <section
      className="relative overflow-hidden rounded-[2.25rem] p-6 md:p-8"
      style={{
        border: "0.5px solid rgba(255,255,255,0.1)",
        boxShadow: `0 30px 80px rgba(0,0,0,0.42), 0 0 70px ${auraRgba(aura, 0.2)}`,
      }}
    >
      <div
        className="absolute inset-0 rounded-[inherit]"
        style={{
          backdropFilter: b > 0 ? `blur(${b}px) saturate(150%)` : undefined,
          background: b > 0
            ? `linear-gradient(145deg, ${auraRgba(aura, 0.1)}, rgba(12,11,16,0.55))`
            : "rgba(14,13,18,0.92)",
        }}
      />
      <ArtworkMosaic tracks={likedTracks} />
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{ background: `radial-gradient(120% 130% at 6% -12%, ${auraRgba(aura, 0.22)}, transparent 58%)` }}
      />

      <div className="relative z-10 flex items-center gap-5">
        {user && (
          <div className="relative shrink-0 w-[84px] h-[84px]">
            <div
              className="absolute -inset-2 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${auraRgba(aura, 0.45)}, transparent 70%)`, filter: "blur(10px)" }}
            />
            <div
              className="relative w-full h-full rounded-full overflow-hidden"
              style={{ border: `0.5px solid ${auraRgba(aura, 0.4)}`, boxShadow: `0 10px 34px ${auraRgba(aura, 0.4)}` }}
            >
              <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/40 font-bold mb-1.5">Library</p>
          <h1
            className="text-[26px] md:text-[34px] font-black tracking-tight leading-[1.05]"
            style={{
              backgroundImage: aura.nameGradient,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {greeting()}{user ? `, ${user.username}` : ""}
          </h1>
        </div>

        <button
          type="button"
          onClick={shufflePlay}
          disabled={likedTracks.length === 0}
          className="hidden sm:flex shrink-0 items-center gap-2.5 pl-4 pr-5 py-3 rounded-full font-bold text-[14px] text-black cursor-pointer transition-transform duration-300 hover:scale-[1.04] active:scale-95 disabled:opacity-60"
          style={{ background: playSurface, boxShadow: `0 12px 30px ${auraRgba(aura, 0.4)}` }}
        >
          <ShuffleIcon />
          Play your sound
        </button>
      </div>
    </section>
  );
});

const CollectionRail = memo(function CollectionRail({
  icon, title, count, to, children,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  to: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2.5 mb-3 px-1">
        <span className="text-white/55">{icon}</span>
        <h2 className="text-[16px] font-bold tracking-tight text-white/90">{title}</h2>
        {count != null && count > 0 && (
          <span className="text-[12px] text-white/30 tabular-nums">{count}</span>
        )}
        <Link
          to={to}
          className="ml-auto flex items-center gap-0.5 text-[12px] font-semibold text-white/45 hover:text-white/90 transition-colors"
        >
          See all <ChevronRightIcon />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {children}
      </div>
    </section>
  );
});

const ContinueRow = memo(function ContinueRow() {
  const entries = useHistoryStore((s) => s.entries);

  const tracks = useMemo(() => {
    const seen = new Set<number>();
    const out: Track[] = [];
    for (const e of entries) {
      if (seen.has(e.track.id)) continue;
      seen.add(e.track.id);
      out.push(e.track);
      if (out.length >= 14) break;
    }
    return out;
  }, [entries]);

  if (tracks.length === 0) return null;

  return (
    <CollectionRail icon={<ClockIcon />} title="Jump back in" to="/library/history">
      {tracks.map((track) => (
        <div key={track.id} className="w-[150px] shrink-0">
          <TrackCard track={track} queue={tracks} />
        </div>
      ))}
    </CollectionRail>
  );
});

function Hub() {
  const { data: likedTracks = [] } = useQuery<Track[]>({
    queryKey: ["likedTracks"],
    queryFn: () => getLikedTracks(50),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="space-y-8">
      <Masthead likedTracks={likedTracks} />
      <ContinueRow />
      {likedTracks.length > 0 && (
        <CollectionRail
          icon={<HeartIcon />}
          title="Liked tracks"
          count={likedTracks.length}
          to="/library/likes"
        >
          {likedTracks.slice(0, 12).map((track) => (
            <div key={track.id} className="w-[150px] shrink-0">
              <TrackCard track={track} queue={likedTracks} />
            </div>
          ))}
        </CollectionRail>
      )}
    </div>
  );
}

function Likes() {
  const { data: tracks = [], isLoading } = useQuery<Track[]>({
    queryKey: ["likedTracks"],
    queryFn: () => getLikedTracks(100),
  });

  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);

  if (isLoading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-square w-full rounded-2xl skeleton-shimmer" />
          <div className="mt-2.5 h-4 w-3/4 rounded-md skeleton-shimmer" />
          <div className="mt-1.5 h-3 w-1/2 rounded-md skeleton-shimmer" />
        </div>
      ))}
    </div>
  );

  if (!tracks.length) return <Empty label="No liked tracks yet" />;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[20px] font-bold text-white/90">Liked tracks</h2>
        <button
          type="button"
          onClick={() => { const s = [...tracks].sort(() => Math.random() - 0.5); setQueue(s); setTrack(s[0]); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-semibold text-white cursor-pointer transition-all hover:scale-[1.03]"
          style={{ background: "rgba(255,85,0,0.15)", border: "1px solid rgba(255,85,0,0.3)" }}
        >
          <ShuffleIcon /> Shuffle
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {tracks.map((track) => (
          <TrackCard key={track.id} track={track} queue={tracks} />
        ))}
      </div>
    </>
  );
}

function formatHistoryDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86400000);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  if (day.getTime() === today.getTime()) return "Today";
  if (day.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

function History() {
  const entries = useHistoryStore((s) => s.entries);
  const clear = useHistoryStore((s) => s.clear);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const setTrack = usePlayerStore((s) => s.setTrack);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  const rows = useMemo(() => {
    const out: Array<{ type: "header"; label: string } | { type: "entry"; entry: HistoryEntry }> = [];
    let lastLabel = "";
    for (const entry of entries) {
      const label = formatHistoryDate(entry.playedAt);
      if (label !== lastLabel) { lastLabel = label; out.push({ type: "header", label }); }
      out.push({ type: "entry", entry });
    }
    return out;
  }, [entries]);

  const allTracks = useMemo(() => entries.map((e) => e.track), [entries]);

  if (!entries.length) return <Empty label="No history yet" />;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[20px] font-bold text-white/90">History</h2>
        <button
          type="button"
          onClick={clear}
          className="text-[12px] text-white/30 hover:text-red-400 transition-colors cursor-pointer"
        >
          Clear history
        </button>
      </div>
      <div className="flex flex-col">
        {rows.map((row, i) =>
          row.type === "header" ? (
            <p key={i} className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/30 px-1 pt-5 pb-2 first:pt-0">
              {row.label}
            </p>
          ) : (
            <div
              key={i}
              className="group flex items-center gap-4 px-3 py-2.5 rounded-2xl hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
              onClick={() => { setQueue(allTracks); setTrack(row.entry.track); }}
            >
              <div className="relative w-10 h-10 shrink-0 rounded-xl overflow-hidden ring-1 ring-white/[0.08]">
                {row.entry.track.artwork
                  ? <img src={row.entry.track.artwork} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center bg-white/[0.04] text-white/20"><MusicIcon /></div>
                }
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayIcon />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13.5px] font-medium truncate ${currentTrack?.id === row.entry.track.id ? "text-[var(--color-accent)]" : "text-white/90"}`}>
                  {row.entry.track.title}
                </p>
                <p className="text-[12px] text-white/40 truncate mt-0.5">{row.entry.track.artist}</p>
              </div>
              <span className="text-[11px] text-white/20 tabular-nums shrink-0">
                {formatDuration(row.entry.track.duration)}
              </span>
              <span className="text-[11px] text-white/20 tabular-nums shrink-0 w-12 text-right">
                {new Date(row.entry.playedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )
        )}
      </div>
    </>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center">
        <MusicIcon />
      </div>
      <p className="text-white/40 text-[14px]">{label}</p>
    </div>
  );
}

const tabs = [
  { to: "/library", label: "Overview", end: true },
  { to: "/library/likes", label: "Likes" },
  { to: "/library/history", label: "History" },
];

function TabBar() {
  return (
    <div className="flex gap-0 border-b border-white/[0.06] mb-8">
      {tabs.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `pb-3 px-4 text-[13px] border-b-2 transition-colors ${
              isActive
                ? "text-white border-[var(--color-accent)] font-semibold"
                : "text-white/40 border-transparent hover:text-white/70"
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </div>
  );
}

export default memo(function Library() {

  return (
    <div className="relative min-h-full w-full">
      <style>{USER_PAGE_KEYFRAMES}</style>
      <div
        className="relative z-10 max-w-[1320px] mx-auto px-4 md:px-8 pt-6 pb-32"
        style={{ isolation: "isolate" }}
      >
        <TabBar />
        <Routes>
          <Route path="/" element={<Hub />} />
          <Route path="/likes" element={<Likes />} />
          <Route path="/history" element={<History />} />
          <Route path="/*" element={<Empty label="Coming soon" />} />
        </Routes>
      </div>
    </div>
  );
});