import { memo, useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuraField } from "../components/AuraField";
import { GlassHeroPanel } from "../components/ui/GlassHeroPanel";
import { HorizontalScroll } from "../components/ui/HorizontalScroll";
import { TabDock, type TabDescriptor } from "../components/user/TabDock";
import { PrismBand, type PrismSegment } from "../components/discover/PrismBand";
import { InfiniteSentinel } from "../components/discover/InfiniteSentinel";
import { useDebouncedValue } from "../components/discover/useDebouncedValue";
import { USER_PAGE_KEYFRAMES } from "../components/user/keyframes";
import { useViewerAura } from "../lib/useViewerAura";
import { usePerfMode } from "../lib/perf";
import { auraRgba } from "../lib/aura";
import { fc, dur } from "../lib/formatters";
import { gradientForId, monogramOf } from "../components/discover/visuals";
import TrackCard from "../components/TrackCard";
import { getFeaturedTracks, searchTracks, formatDuration } from "../api/soundcloud";
import { usePlayerStore } from "../store/playerStore";
import type { Track } from "../store/playerStore";

const GENRES = [
  { id: "all",         label: "All",        color: "#a855f7", share: 0.14, query: "" },
  { id: "electronic", label: "Electronic", color: "#06b6d4", share: 0.13, query: "electronic" },
  { id: "hip-hop",    label: "Hip-Hop",    color: "#f97316", share: 0.12, query: "hip hop" },
  { id: "pop",        label: "Pop",        color: "#ec4899", share: 0.11, query: "pop" },
  { id: "lo-fi",      label: "Lo-fi",      color: "#7c3aed", share: 0.10, query: "lofi" },
  { id: "r&b",        label: "R&B",        color: "#fb7185", share: 0.09, query: "r&b soul" },
  { id: "indie",      label: "Indie",      color: "#10b981", share: 0.08, query: "indie" },
  { id: "house",      label: "House",      color: "#0ea5e9", share: 0.08, query: "house music" },
  { id: "ambient",    label: "Ambient",    color: "#84cc16", share: 0.07, query: "ambient" },
  { id: "trap",       label: "Trap",       color: "#facc15", share: 0.08, query: "trap" },
] as const;

type GenreId = (typeof GENRES)[number]["id"];

type SortId = "trending" | "new" | "popular";
const SORT_TABS: ReadonlyArray<TabDescriptor<SortId>> = [
  { id: "trending", label: "Trending" },
  { id: "new",      label: "New releases" },
  { id: "popular",  label: "Popular" },
];

const CompassArtifact = memo(function CompassArtifact({
  aura,
  idleAnim,
}: {
  aura: ReturnType<typeof useViewerAura>;
  idleAnim: boolean;
}) {
  return (
    <div className="relative shrink-0 self-center lg:self-start w-[180px] h-[180px] md:w-[220px] md:h-[220px]">
      <div
        className="absolute -inset-[5px] rounded-[2.4rem] pointer-events-none overflow-hidden"
        style={{
          padding: "3px",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          filter: `drop-shadow(0 0 18px ${aura.orbs[0]}aa)`,
        }}
      >
        <div
          className="absolute -inset-[40%]"
          style={{
            background: `conic-gradient(from 0deg, ${aura.orbs[0]}, ${aura.orbs[1]}, ${aura.orbs[2]}, ${aura.orbs[0]})`,
            animation: idleAnim ? "ring-rotate 14s linear infinite" : undefined,
          }}
        />
      </div>

      <div
        className="relative w-full h-full rounded-[2.2rem] overflow-hidden flex items-center justify-center"
        style={{
          background: `radial-gradient(120% 90% at 30% 20%, ${auraRgba(aura, 0.38)} 0%, rgba(20,20,24,0.4) 60%, rgba(10,10,12,0.7) 100%)`,
          boxShadow: `0 30px 70px ${auraRgba(aura, 0.35)}, inset 0 0 0 1px rgba(255,255,255,0.10), inset 0 1px 0 rgba(255,255,255,0.16)`,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(80% 60% at 50% 0%, rgba(255,255,255,0.18) 0%, transparent 60%)",
            mixBlendMode: "overlay",
          }}
        />

        <div
          className="relative text-white"
          style={{
            animation: idleAnim ? "ring-rotate 30s linear infinite" : undefined,
            filter: `drop-shadow(0 0 18px ${auraRgba(aura, 0.7)})`,
          }}
        >
          <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="12 2 14.09 8.26 20 9.27 16 13.14 17.18 19.02 12 16 6.82 19.02 8 13.14 4 9.27 9.91 8.26 12 2" fill="currentColor" strokeWidth="0.8"/>
            <line x1="12" y1="2" x2="12" y2="4"/>
            <line x1="12" y1="20" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="4" y2="12"/>
            <line x1="20" y1="12" x2="22" y2="12"/>
          </svg>
        </div>
      </div>
    </div>
  );
});

const DiscoverHero = memo(function DiscoverHero({
  aura,
  onSurpriseMe,
  isSurprising,
}: {
  aura: ReturnType<typeof useViewerAura>;
  onSurpriseMe: () => void;
  isSurprising: boolean;
}) {
  const perf = usePerfMode();

  return (
    <GlassHeroPanel hasStar={false} aura={aura}>
      <div className="relative p-6 md:p-12 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-stretch">
        <CompassArtifact aura={aura} idleAnim={perf.idleAnim} />

        <div className="flex-1 min-w-0 flex flex-col justify-between gap-6 text-center lg:text-left">
          <h1
            className="text-5xl md:text-7xl lg:text-[88px] font-black leading-[0.85] tracking-tighter"
            style={{
              background: aura.nameGradient,
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: perf.idleAnim ? "prismatic-shift 8s linear infinite" : undefined,
              filter: "drop-shadow(0 12px 36px rgba(0,0,0,0.55))",
            }}
          >
            Discover
          </h1>

          <div className="flex flex-wrap items-center gap-2.5 justify-center lg:justify-start text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
            <span className="inline-flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/45"><path d="M12 2a3 3 0 0 0-3 3v1H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a3 3 0 0 0 6 0v-1h1a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4V5a3 3 0 0 0-3-3z"/></svg>
              {fc(GENRES.length - 1)} Genres
            </span>
            <span className="text-white/15">·</span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/45"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              Updated daily
            </span>
            <span className="text-white/15">·</span>
            <span
              className="inline-flex items-center gap-1.5"
              style={{ color: auraRgba(aura, 0.85) }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
              Fresh picks
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 justify-center lg:justify-start">
            <button
              type="button"
              onClick={onSurpriseMe}
              disabled={isSurprising}
              className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-7 h-11 rounded-full text-[13px] font-semibold text-black cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:scale-[1.04] active:scale-[0.97] disabled:opacity-60 disabled:cursor-default disabled:hover:scale-100"
              style={{
                background: "linear-gradient(180deg, #ffffff, #e5e7eb)",
                border: "0.5px solid rgba(255,255,255,0.4)",
                boxShadow: `0 12px 32px ${auraRgba(aura, 0.35)}, inset 0 1px 0 rgba(255,255,255,0.6)`,
              }}
            >
              <span
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms]"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)" }}
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
              {isSurprising ? "Loading…" : "Surprise me"}
            </button>
          </div>
        </div>

        <div className="hidden xl:flex flex-col gap-3 self-stretch min-w-[200px]">
          {[
            { label: "Genres", value: fc(GENRES.length - 1), icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
            { label: "Updated", value: "Daily", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
            { label: "Fresh", value: "Today", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>, highlight: true },
          ].map(({ label, value, icon, highlight }) => {
            const perf2 = perf;
            const b = perf2.blur(24);
            return (
              <div
                key={label}
                className="relative px-5 py-3 rounded-2xl flex items-baseline gap-2.5 transition-all duration-500 hover:scale-[1.04]"
                style={{
                  background: highlight
                    ? `linear-gradient(135deg, ${auraRgba(aura, 0.16)}, rgba(255,255,255,0.02))`
                    : b > 0 ? "rgba(255,255,255,0.04)" : "rgba(24,24,28,0.9)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  backdropFilter: b > 0 ? `blur(${b}px)` : undefined,
                  WebkitBackdropFilter: b > 0 ? `blur(${b}px)` : undefined,
                  boxShadow: `inset 0 0.5px 0 rgba(255,255,255,0.08), 0 8px 24px ${auraRgba(aura, highlight ? 0.28 : 0.14)}`,
                }}
              >
                <span className="text-white/55">{icon}</span>
                <span className="text-[22px] font-black tabular-nums tracking-tight text-white">{value}</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </GlassHeroPanel>
  );
});

const SpotlightCard = memo(function SpotlightCard({ track, aura }: { track: Track; aura: ReturnType<typeof useViewerAura> }) {
  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const [g1, g2, g3] = useMemo(() => gradientForId(String(track.id), 3), [track.id]);
  const perf = usePerfMode();

  return (
    <button
      type="button"
      onClick={() => { setQueue([track]); setTrack(track); }}
      className="group relative shrink-0 w-[280px] h-[360px] rounded-[1.75rem] cursor-pointer overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:scale-[1.02]"
      style={{
        background: `linear-gradient(160deg, ${g1} 0%, ${g2} 60%, ${g3} 100%)`,
        boxShadow: "0 30px 60px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.10), inset 0 1px 0 rgba(255,255,255,0.18)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(80% 50% at 50% 0%, rgba(255,255,255,0.22) 0%, transparent 60%)",
          mixBlendMode: "overlay",
        }}
      />
      {perf.bloom && (
        <div
          className="absolute -inset-x-20 -bottom-32 h-64 pointer-events-none opacity-70"
          style={{
            background: `radial-gradient(60% 50% at 50% 50%, ${g1}, transparent 70%)`,
            filter: `blur(${perf.blur(40)}px)`,
            mixBlendMode: "screen",
          }}
        />
      )}

      {track.artwork ? (
        <img
          src={track.artwork}
          alt={track.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.05]"
          decoding="async"
          loading="lazy"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-white/95 font-black tracking-tight select-none"
            style={{ fontSize: "clamp(96px, 9vw, 132px)", textShadow: "0 16px 36px rgba(0,0,0,0.5)" }}
          >
            {monogramOf(track.title)}
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col gap-2 text-left">
        <div
          className="absolute inset-x-0 bottom-0 top-[-40px] pointer-events-none"
          style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.7) 100%)" }}
        />
        <p className="relative text-[10px] font-bold uppercase tracking-[0.28em] text-white/85" style={{ textShadow: "0 4px 12px rgba(0,0,0,0.7)" }}>
          {track.artist}
        </p>
        <p className="relative text-[22px] font-black leading-[0.95] text-white tracking-tight" style={{ textShadow: "0 6px 20px rgba(0,0,0,0.65)" }}>
          {track.title}
        </p>
        <div className="relative flex items-center gap-2 text-[10px] text-white/75 tabular-nums">
          <span>{formatDuration(track.duration)}</span>
          {track.playbackCount > 0 && (
            <>
              <span className="text-white/35">·</span>
              <span>{fc(track.playbackCount)} plays</span>
            </>
          )}
        </div>
      </div>

      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `inset 0 0 0 1px ${auraRgba(aura, 0.5)}, inset 0 0 60px ${auraRgba(aura, 0.25)}` }}
      />
    </button>
  );
});

const SearchInput = memo(function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const perf = usePerfMode();
  const b = perf.blur(20);
  return (
    <div className="relative w-full max-w-[300px]">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search in Discover…"
        className="w-full text-[13px] text-white/85 placeholder:text-white/25 py-2.5 pl-9 pr-8 rounded-2xl outline-none transition-all duration-300"
        style={{
          background: b > 0 ? "rgba(255,255,255,0.04)" : "rgba(24,24,28,0.9)",
          border: "0.5px solid rgba(255,255,255,0.06)",
          backdropFilter: b > 0 ? `blur(${b}px)` : undefined,
          WebkitBackdropFilter: b > 0 ? `blur(${b}px)` : undefined,
        }}
      />
      {value && (
        <button type="button" onClick={() => onChange("")} className="absolute inset-y-0 right-2 flex items-center text-white/30 hover:text-white/70 cursor-pointer transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      )}
    </div>
  );
});

const PAGE_SIZE = 24;

function TrackGrid({ genreId, query }: { genreId: GenreId; query: string }) {
  const genre = GENRES.find((g) => g.id === genreId)!;
  const { data, isLoading, isFetching } = useQuery<Track[]>({
    queryKey: ["discover-grid", genreId, query],
    queryFn: async () => {
      const q = query.trim() || genre.query;
      if (q) return searchTracks(q, PAGE_SIZE);
      return getFeaturedTracks(PAGE_SIZE);
    },
    placeholderData: (prev) => prev,
  });

  if (isLoading && !data) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-square w-full rounded-2xl skeleton-shimmer" />
            <div className="mt-2.5 h-4 w-3/4 rounded-md skeleton-shimmer" />
            <div className="mt-1.5 h-3 w-1/2 rounded-md skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  const tracks = data ?? [];
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-6">
        {tracks.map((track) => (
          <TrackCard key={track.id} track={track} queue={tracks} />
        ))}
      </div>
      <InfiniteSentinel hasMore={tracks.length >= PAGE_SIZE} isFetching={isFetching} onLoadMore={() => {}} />
    </>
  );
}

export default memo(function Discover() {
  const aura = useViewerAura();
  const perf = usePerfMode();
  const catalogBlur = perf.blur(28);

  const [genre, setGenre] = useState<GenreId>("all");
  const [sort, setSort] = useState<SortId>("trending");
  const [query, setQuery] = useState("");
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);
  const [isSurprising, setIsSurprising] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 220);

  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const { data: spotlightTracks } = useQuery<Track[]>({
    queryKey: ["discover-spotlight"],
    queryFn: () => getFeaturedTracks(10),
  });

  const prismSegments = useMemo<PrismSegment[]>(
    () => GENRES.filter((g) => g.id !== "all").map((g) => ({ genre: g.label, share: g.share, color: g.color })),
    [],
  );

  const handlePrismSelect = useCallback((genreLabel: string) => {
    const found = GENRES.find((g) => g.label === genreLabel);
    if (found) setGenre(found.id);
  }, []);

  const activeGenreLabel = GENRES.find((g) => g.id === genre)?.label ?? "All";

  const onSurpriseMe = useCallback(async () => {
    if (isSurprising) return;
    setIsSurprising(true);
    try {
      const tracks = await getFeaturedTracks(20);
      if (tracks.length > 0) {
        const pick = tracks[Math.floor(Math.random() * tracks.length)];
        setQueue(tracks);
        setTrack(pick);
      }
    } finally {
      setIsSurprising(false);
    }
  }, [isSurprising, setTrack, setQueue]);

  return (
    <>
      <style>{USER_PAGE_KEYFRAMES}</style>
      <div className="relative w-full min-h-screen">
        <AuraField aura={aura} isStar={false} />

        <div
          className="relative z-10 w-full max-w-[1480px] mx-auto px-4 md:px-8 pt-10 md:pt-14 pb-32 flex flex-col gap-10"
          style={{ isolation: "isolate" }}
        >
          <DiscoverHero aura={aura} onSurpriseMe={onSurpriseMe} isSurprising={isSurprising} />

          {spotlightTracks && spotlightTracks.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3 px-1">
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${auraRgba(aura, 0.28)}, ${auraRgba(aura, 0.04)})`,
                    boxShadow: `inset 0 0 0 1px ${auraRgba(aura, 0.4)}`,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/85"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
                </span>
                <h2 className="text-[15px] font-bold text-white/95 tracking-tight">
                  Spotlight
                  <span className="ml-2 text-[11px] font-bold tabular-nums text-white/30">{spotlightTracks.length}</span>
                </h2>
              </div>
              <HorizontalScroll className="px-1">
                {spotlightTracks.map((track) => (
                  <SpotlightCard key={track.id} track={track} aura={aura} />
                ))}
              </HorizontalScroll>
            </section>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 pl-1">
              <span className="font-mono text-[10.5px] text-white/25 tabular-nums">01</span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">Browse by genre</span>
              <span className="h-px flex-1 bg-white/[0.05]" />
              {hoveredGenre && <span className="text-[12px] text-white/40 capitalize">{hoveredGenre}</span>}
            </div>
            <PrismBand
              segments={prismSegments}
              active={activeGenreLabel === "All" ? prismSegments[0].genre : activeGenreLabel}
              onSelect={handlePrismSelect}
              onHover={setHoveredGenre}
            />
            <div className="flex flex-wrap gap-1.5 mt-1">
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGenre(g.id)}
                  className="px-3 h-7 rounded-xl text-[11.5px] font-semibold cursor-pointer transition-all duration-200"
                  style={
                    genre === g.id
                      ? { background: `${g.color}28`, border: `1px solid ${g.color}55`, color: g.color }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" }
                  }
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="rounded-[2rem] p-4 md:p-6"
            style={{
              background: catalogBlur > 0
                ? "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.015) 100%)"
                : "rgba(18,18,22,0.85)",
              backdropFilter: catalogBlur > 0 ? `blur(${catalogBlur}px) saturate(160%)` : undefined,
              WebkitBackdropFilter: catalogBlur > 0 ? `blur(${catalogBlur}px) saturate(160%)` : undefined,
              boxShadow: "0 30px 80px rgba(0,0,0,0.30), inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
              <TabDock<SortId> tabs={SORT_TABS} active={sort} onChange={setSort} aura={aura} />
              <SearchInput value={query} onChange={setQuery} />
            </div>
            <div className="flex items-center gap-2.5 pl-1 mt-4 mb-1">
              <span className="font-mono text-[10.5px] text-white/25 tabular-nums">02</span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">
                {debouncedQuery ? `Results for "${debouncedQuery}"` : `${GENRES.find((g) => g.id === genre)?.label ?? "All"} · ${sort}`}
              </span>
              <span className="h-px flex-1 bg-white/[0.05]" />
            </div>
            <TrackGrid genreId={genre} query={debouncedQuery} />
          </div>
        </div>
      </div>
    </>
  );
});