import { Routes, Route, NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getFeaturedTracks, getLikedTracks } from "../api/soundcloud";
import TrackCard from "../components/TrackCard";

const tabs = [
  { to: "/library", label: "Overview", end: true },
  { to: "/library/likes", label: "Likes" },
  { to: "/library/playlists", label: "Playlists" },
  { to: "/library/albums", label: "Albums" },
  { to: "/library/stations", label: "Stations" },
  { to: "/library/following", label: "Following" },
  { to: "/library/history", label: "History" },
];

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
        <Route path="/history" element={<div className="px-8"><Empty label="No history yet" /></div>} />
      </Routes>
    </div>
  );
}