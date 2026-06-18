import { memo, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchTracks } from "../api/soundcloud";
import TrackCard from "../components/TrackCard";
import { useDebouncedValue } from "../components/discover/useDebouncedValue";
import { useViewerAura } from "../lib/useViewerAura";
import { auraRgba } from "../lib/aura";
import { usePerfMode } from "../lib/perf";
import { USER_PAGE_KEYFRAMES } from "../components/user/keyframes";
import type { Track } from "../store/playerStore";

// ── Genre ticker ───────────────────────────────────────────────────────────
const GENRES = [
  { key: "electronic", label: "Electronic", color: "#06b6d4" },
  { key: "hip hop", label: "Hip-Hop", color: "#f97316" },
  { key: "pop", label: "Pop", color: "#ec4899" },
  { key: "lofi", label: "Lo-fi", color: "#7c3aed" },
  { key: "r&b soul", label: "R&B", color: "#fb7185" },
  { key: "indie", label: "Indie", color: "#10b981" },
  { key: "house music", label: "House", color: "#0ea5e9" },
  { key: "ambient", label: "Ambient", color: "#84cc16" },
  { key: "trap", label: "Trap", color: "#facc15" },
  { key: "jazz", label: "Jazz", color: "#a78bfa" },
  { key: "classical", label: "Classical", color: "#f9a8d4" },
  { key: "metal", label: "Metal", color: "#94a3b8" },
  { key: "dnb", label: "DnB", color: "#f43f5e" },
  { key: "techno", label: "Techno", color: "#22d3ee" },
];

const GenreTicker = memo(function GenreTicker({ onSelect }: { onSelect: (q: string) => void }) {
  const perf = usePerfMode();
  const chips = [...GENRES, ...GENRES, ...GENRES];

  return (
    <div
      className="relative h-7 overflow-hidden select-none mb-6"
      style={{
        maskImage: "linear-gradient(90deg, transparent 0, #000 5%, #000 95%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 5%, #000 95%, transparent 100%)",
      }}
    >
      <style>{`
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .genre-ticker { animation: ticker 60s linear infinite; }
        .genre-ticker:hover { animation-play-state: paused; }
      `}</style>
      <div
        className={`genre-ticker flex items-center gap-5 whitespace-nowrap ${perf.idleAnim ? "will-change-transform" : ""}`}
        style={{ width: "max-content", ...(perf.idleAnim ? {} : { animation: "none" }) }}
      >
        {chips.map((g, i) => (
          <button
            key={`${g.key}-${i}`}
            type="button"
            onClick={() => onSelect(g.key)}
            className="group/chip inline-flex items-center gap-1.5 text-[12px] text-white/45 hover:text-white/90 transition-colors duration-300 cursor-pointer"
          >
            <span
              className="w-1.5 h-1.5 rounded-full transition-transform duration-300 group-hover/chip:scale-150"
              style={{ background: g.color, boxShadow: `0 0 8px ${g.color}` }}
            />
            {g.label}
          </button>
        ))}
      </div>
    </div>
  );
});

// ── Empty state ────────────────────────────────────────────────────────────
const EmptyState = memo(function EmptyState({ aura }: { aura: ReturnType<typeof useViewerAura> }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5">
      <div
        className="w-20 h-20 rounded-[22px] flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${auraRgba(aura, 0.2)}, rgba(255,255,255,0.03))`,
          border: `1px solid ${auraRgba(aura, 0.3)}`,
          boxShadow: `0 0 40px ${auraRgba(aura, 0.15)}`,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/50">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[18px] font-bold text-white/80">Search SoundCloud</p>
        <p className="text-[13px] text-white/35 mt-1.5">Find tracks, artists, playlists and more</p>
      </div>
      <p className="text-[12px] text-white/25 uppercase tracking-[0.18em] font-semibold">or browse by genre</p>
    </div>
  );
});

// ── No results ─────────────────────────────────────────────────────────────
const NoResults = memo(function NoResults({ q }: { q: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="text-white/25">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
      <p className="text-[15px] font-semibold text-white/50">No results for "{q}"</p>
      <p className="text-[13px] text-white/30">Try a different search term or genre</p>
    </div>
  );
});

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skeleton({ count = 24 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 30}ms` }} className="animate-fade-in-up">
          <div className="aspect-square w-full rounded-2xl skeleton-shimmer" />
          <div className="mt-2.5 h-4 w-3/4 rounded-md skeleton-shimmer" />
          <div className="mt-1.5 h-3 w-1/2 rounded-md skeleton-shimmer" />
        </div>
      ))}
    </>
  );
}

// ── Results header ─────────────────────────────────────────────────────────
const ResultsHeader = memo(function ResultsHeader({
  q, count, isLoading, aura,
}: {
  q: string;
  count: number;
  isLoading: boolean;
  aura: ReturnType<typeof useViewerAura>;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2
          className="text-[24px] font-black tracking-tight"
          style={{
            backgroundImage: aura.nameGradient,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {q}
        </h2>
        <p className="mt-1 text-[12px] text-white/35 font-medium">
          {isLoading ? "Searching…" : `${count} tracks`}
        </p>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-[10.5px] text-white/25 tabular-nums">01</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Tracks</span>
        <span className="h-px w-16 bg-white/[0.06]" />
      </div>
    </div>
  );
});

// ── Main ───────────────────────────────────────────────────────────────────
export default memo(function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get("q") || "";
  const aura = useViewerAura();
  const debounced = useDebouncedValue(q, 300);

  const { data: tracks = [], isLoading } = useQuery<Track[]>({
    queryKey: ["search", debounced],
    queryFn: () => searchTracks(debounced, 40),
    enabled: debounced.trim().length >= 2,
    placeholderData: (prev) => prev,
  });

  const handleGenre = (genre: string) => {
    setSearchParams({ q: genre });
    // также обновляем глобальный поиск в titlebar
    const input = document.getElementById("global-search-input") as HTMLInputElement | null;
    if (input) input.value = genre;
  };

  return (
    <div className="relative min-h-full w-full">
      <style>{USER_PAGE_KEYFRAMES}</style>

      <div
        className="relative z-10 max-w-[1480px] mx-auto px-4 md:px-8 pt-6 pb-32"
        style={{ isolation: "isolate" }}
      >
        <GenreTicker onSelect={handleGenre} />

        {!q ? (
          <EmptyState aura={aura} />
        ) : (
          <>
            <ResultsHeader q={q} count={tracks.length} isLoading={isLoading} aura={aura} />

            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
            >
              {isLoading && tracks.length === 0 ? (
                <Skeleton />
              ) : tracks.length === 0 ? (
                <div className="col-span-full">
                  <NoResults q={q} />
                </div>
              ) : (
                tracks.map((track) => (
                  <div key={track.id} className="animate-fade-in-up">
                    <TrackCard track={track} queue={tracks} />
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
});