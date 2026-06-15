import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchTracks } from "../api/soundcloud";
import TrackCard from "../components/TrackCard";

function ShelfSkeleton({ count = 20 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="aspect-square w-full rounded-2xl skeleton-shimmer" />
          <div className="mt-2.5 h-4 w-3/4 rounded-md skeleton-shimmer" />
          <div className="mt-1.5 h-3 w-1/2 rounded-md skeleton-shimmer" />
        </div>
      ))}
    </>
  );
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";

  const { data: tracks, isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchTracks(q, 30),
    enabled: q.length > 0,
  });

  return (
    <div className="w-full max-w-[1480px] mx-auto px-8 pt-10 pb-32">
      {!q && (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="text-white/30">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="text-white/60 font-medium text-[15px]">Search SoundCloud</p>
          <p className="text-white/30 text-[13px]">Find tracks, artists, albums and more</p>
        </div>
      )}

      {q && (
        <>
          <div className="mb-6">
            <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-white/90">
              Results for "{q}"
            </h2>
            <p className="mt-1 text-[13px] text-white/50">
              {tracks ? `${tracks.length} tracks found` : "Searching..."}
            </p>
          </div>

          <div className="mb-4 flex items-center gap-2.5 pl-1">
            <span className="font-mono text-[10.5px] text-white/25 tabular-nums">01</span>
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">Tracks</span>
            <span className="h-px flex-1 bg-white/[0.05]" />
          </div>

          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
            {isLoading && <ShelfSkeleton />}
            {tracks?.map((track: any) => (
              <TrackCard key={track.id} track={track} queue={tracks} />
            ))}
          </div>

          {tracks && tracks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <p className="text-white/40 text-[14px]">No results for "{q}"</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}