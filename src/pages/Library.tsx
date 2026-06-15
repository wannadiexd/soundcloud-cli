import { Routes, Route, NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getFeaturedTracks, getLikedTracks, formatDuration } from "../api/soundcloud";
import TrackCard from "../components/TrackCard";
import { useHistoryStore, type HistoryEntry } from "../store/historyStore";
import { usePlayerStore } from "../store/playerStore";

const tabs = [
  { to: "/library", label: "Overview", end: true },
  { to: "/library/likes", label: "Likes" },
  { to: "/library/playlists", label: "Playlists" },
  { to: "/library/albums", label: "Albums" },
  { to: "/library/stations", label: "Stations" },
  { to: "/library/following", label: "Following" },
  { to: "/library/history", label: "History" },
];

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="white">
    <path d="M5 3.5l12 6.5-12 6.5V3.5z" />
  </svg>
);

const MusicIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
  </svg>
);

function TabBar() {
  return (
    <div className="flex gap-0 border-b border-white/[0.06] px-8 mb-8">
      {tabs.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `pb-3 px-4 text-[13px] border-b-2 transition-colors ${
              isActive
                ? "text-white border-white font-semibold"
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

function SubShelf({ index, label, tracks }: { index: string; label: string; tracks: any[] }) {
  if (tracks.length === 0) return null;
  return (
    <div className="mb-10">
      <div className="mb-3 flex items-center gap-2.5 pl-1">
        <span className="font-mono text-[10.5px] text-white/25 tabular-nums">{index}</span>
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">
          {label}
        </span>
        <span className="h-px flex-1 bg-white/[0.05]" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {tracks.map((track: any) => (
          <div key={track.id} className="w-[176px] shrink-0">
            <TrackCard track={track} queue={tracks} />
          </div>
        ))}
      </div>
    </div>
  );
}

function GridShelf({ tracks }: { tracks: any[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {tracks.map((track: any) => (
        <TrackCard key={track.id} track={track} queue={tracks} />
      ))}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="text-white/25">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>
      <p className="text-white/40 text-[14px]">{label}</p>
    </div>
  );
}

function Overview() {
  const { data: tracks, isLoading } = useQuery({
    queryKey: ["featured"],
    queryFn: () => getFeaturedTracks(24),
  });

  if (isLoading) return (
    <div className="px-8">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-[176px] shrink-0">
            <div className="aspect-square w-full rounded-2xl skeleton-shimmer" />
            <div className="mt-2.5 h-4 w-3/4 rounded-md skeleton-shimmer" />
            <div className="mt-1.5 h-3 w-1/2 rounded-md skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );

  if (!tracks) return null;

  return (
    <div className="px-8">
      <SubShelf index="01" label="Recently played" tracks={tracks.slice(0, 12)} />
      <SubShelf index="02" label="Likes" tracks={tracks.slice(12, 24)} />
    </div>
  );
}

function Likes() {
  const { data: tracks, isLoading } = useQuery({
    queryKey: ["likedTracks"],
    queryFn: () => getLikedTracks(50),
  });

  return (
    <div className="px-8">
      <p className="text-white/60 text-[13px] mb-6">Hear the tracks you've liked:</p>
      {isLoading ? (
        <div className="grid grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-square w-full rounded-2xl skeleton-shimmer" />
              <div className="mt-2.5 h-4 w-3/4 rounded-md skeleton-shimmer" />
            </div>
          ))}
        </div>
      ) : (
        tracks && <GridShelf tracks={tracks} />
      )}
    </div>
  );
}

function formatHistoryDate(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (dayStart.getTime() === today.getTime()) return "Today";
  if (dayStart.getTime() === yesterday.getTime()) return "Yesterday";
  return "Earlier";
}

type HistoryRow =
  | { type: "header"; id: string; label: string }
  | { type: "entry"; id: string; entry: HistoryEntry };

function History() {
  const entries = useHistoryStore((s) => s.entries);
  const clear = useHistoryStore((s) => s.clear);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const setTrack = usePlayerStore((s) => s.setTrack);

  const rows = useMemo<HistoryRow[]>(() => {
    const flat: HistoryRow[] = [];
    let currentLabel = "";
    for (const entry of entries) {
      const label = formatHistoryDate(entry.playedAt);
      if (label !== currentLabel) {
        currentLabel = label;
        flat.push({ type: "header", id: `header:${label}`, label });
      }
      flat.push({ type: "entry", id: `${entry.track.id}:${entry.playedAt}`, entry });
    }
    return flat;
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="px-8">
        <Empty label="No history yet" />
      </div>
    );
  }

  const allTracks = entries.map((e) => e.track);

  return (
    <div className="px-8">
      <div className="flex justify-end mb-4">
        <button
          onClick={clear}
          className="text-[12px] text-white/30 hover:text-red-400 transition-colors cursor-pointer"
        >
          Clear history
        </button>
      </div>

      <div className="flex flex-col">
        {rows.map((row) =>
          row.type === "header" ? (
            <div key={row.id} className="py-3">
              <h3 className="text-[13px] font-bold text-white/30 uppercase tracking-wider px-1">
                {row.label}
              </h3>
            </div>
          ) : (
            <div
              key={row.id}
              className="group flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/[0.04] transition-all duration-300"
            >
              <button
                type="button"
                className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/[0.08] shadow-md cursor-pointer"
                onClick={() => {
                  setQueue(allTracks);
                  setTrack(row.entry.track);
                }}
              >
                {row.entry.track.artwork ? (
                  <img
                    src={row.entry.track.artwork}
                    alt=""
                    className="w-full h-full object-cover"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/[0.05] to-transparent text-white/20">
                    <MusicIcon />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                  <PlayIcon />
                </div>
              </button>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-[14px] font-medium truncate text-white/90">
                  {row.entry.track.title}
                </p>
                <p className="text-[12px] text-white/40 truncate mt-0.5">
                  {row.entry.track.artist}
                </p>
              </div>

              <span className="text-[11px] text-white/20 tabular-nums shrink-0">
                {formatDuration(row.entry.track.duration)}
              </span>

              <span className="text-[11px] text-white/20 tabular-nums shrink-0 w-12 text-right">
                {new Date(row.entry.playedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function Library() {
  return (
    <div className="w-full max-w-[1480px] mx-auto pt-8 pb-32">
      <TabBar />
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/likes" element={<Likes />} />
        <Route path="/playlists" element={<div className="px-8"><Empty label="No playlists yet" /></div>} />
        <Route path="/albums" element={<div className="px-8"><Empty label="No albums yet" /></div>} />
        <Route path="/stations" element={<div className="px-8"><Empty label="No stations yet" /></div>} />
        <Route path="/following" element={<div className="px-8"><Empty label="Not following anyone yet" /></div>} />
        <Route path="/history" element={<History />} />
      </Routes>
    </div>
  );
}