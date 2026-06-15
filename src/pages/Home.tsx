import { useQuery } from "@tanstack/react-query";
import { getFeaturedTracks } from "../api/soundcloud";
import TrackCard from "../components/TrackCard";
import type { Track } from "../store/playerStore";

function ShelfSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-[176px] shrink-0">
          <div className="aspect-square w-full rounded-2xl skeleton-shimmer" />
          <div className="mt-2.5 h-4 w-3/4 rounded-md skeleton-shimmer" />
          <div className="mt-1.5 h-3 w-1/2 rounded-md skeleton-shimmer" />
        </div>
      ))}
    </>
  );
}

function SubShelf({
  index,
  label,
  isLoading,
  tracks,
}: {
  index: string;
  label: string;
  isLoading: boolean;
  tracks: Track[];
}) {
  if (!isLoading && tracks.length === 0) return null;
  return (
    <div>
      <div className="mb-3 flex items-center gap-2.5 pl-1">
        <span className="font-mono text-[10.5px] text-white/25 tabular-nums">{index}</span>
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">
          {label}
        </span>
        <span className="h-px flex-1 bg-white/[0.05]" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {isLoading ? (
          <ShelfSkeleton />
        ) : (
          tracks.map((track) => (
            <div key={track.id} className="w-[176px] shrink-0">
              <TrackCard track={track} queue={tracks} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending"],
    queryFn: () => getFeaturedTracks(20),
  });

  const { data: recommended, isLoading: recommendedLoading } = useQuery({
    queryKey: ["recommended"],
    queryFn: () => getFeaturedTracks(20),
  });

  return (
    <div className="w-full max-w-[1480px] mx-auto px-8 pt-10 pb-32">
      <section className="pt-2">
        <div className="mb-5">
          <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-white/90">
            Your station
          </h2>
          <p className="mt-1 text-[13px] leading-snug text-white/50">
            Tracks picked just for you
          </p>
        </div>
        <div className="flex flex-col gap-8">
          <SubShelf
            index="01"
            label="Trending now"
            isLoading={trendingLoading}
            tracks={trending ?? []}
          />
          <SubShelf
            index="02"
            label="Recommended"
            isLoading={recommendedLoading}
            tracks={recommended ?? []}
          />
        </div>
      </section>
    </div>
  );
}