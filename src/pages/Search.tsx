import { memo, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchTracks, getUser, formatCount } from "../api/soundcloud";
import TrackCard from "../components/TrackCard";
import { useDebouncedValue } from "../components/discover/useDebouncedValue";
import { useViewerAura } from "../lib/useViewerAura";
import { auraRgba } from "../lib/aura";
import { usePerfMode } from "../lib/perf";
import { USER_PAGE_KEYFRAMES } from "../components/user/keyframes";
import type { Track } from "../store/playerStore";

type TabId = "tracks" | "users" | "playlists";

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

// ── GenreTicker ─────────────────────────────────────────────────────────────
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

// ── EntityStrip (artists/users) ─────────────────────────────────────────────
interface EntityItem {
  key: string;
  label: string;
  sub?: string;
  image: string | null;
  round: boolean;
  onClick: () => void;
}

const EntityStrip = memo(function EntityStrip({ items }: { items: EntityItem[] }) {
  if (items.length === 0) return null;
  return (
    <div
      className="flex items-center gap-3 px-1 py-2 overflow-x-auto mb-5"
      style={{
        scrollbarWidth: "none",
        maskImage: "linear-gradient(90deg, transparent 0, #000 2%, #000 96%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 2%, #000 96%, transparent 100%)",
      }}
    >
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          onClick={it.onClick}
          className="group shrink-0 flex items-center gap-2.5 pl-1 pr-3.5 py-1 rounded-full transition-colors duration-300 cursor-pointer hover:bg-white/[0.06]"
          style={{ border: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          <span
            className={`relative w-9 h-9 shrink-0 overflow-hidden ${it.round ? "rounded-full" : "rounded-lg"}`}
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            {it.image ? (
              <img src={it.image} alt="" loading="lazy" decoding="async" draggable={false} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-white/40">
                {it.label.slice(0, 1).toUpperCase()}
              </span>
            )}
          </span>
          <span className="flex flex-col items-start leading-tight min-w-0">
            <span className="max-w-[140px] truncate text-[12.5px] text-white/80 group-hover:text-white transition-colors">{it.label}</span>
            {it.sub && <span className="text-[10.5px] text-white/35">{it.sub}</span>}
          </span>
        </button>
      ))}
    </div>
  );
});

// ── Tabs ────────────────────────────────────────────────────────────────────
const TABS: { id: TabId; label: string }[] = [
  { id: "tracks", label: "Tracks" },
  { id: "users", label: "Users" },
  { id: "playlists", label: "Playlists" },
];

function TabBar({
  active,
  onChange,
  counts,
  aura,
  deckBlur,
}: {
  active: TabId;
  onChange: (t: TabId) => void;
  counts: Record<TabId, number | null>;
  aura: ReturnType<typeof useViewerAura>;
  deckBlur: number;
}) {
  return (
    <div
      className="inline-flex items-center gap-0.5 p-1.5 rounded-2xl mb-6"
      style={{
        background: deckBlur > 0 ? "rgba(15,15,18,0.55)" : "rgba(15,15,18,0.92)",
        backdropFilter: deckBlur > 0 ? `blur(${deckBlur}px) saturate(180%)` : undefined,
        boxShadow: "0 8px 24px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.07)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className="relative inline-flex items-center gap-2 px-4 h-9 rounded-xl text-[12.5px] font-semibold transition-all duration-300 cursor-pointer"
            style={
              isActive
                ? {
                    background: `linear-gradient(180deg, ${auraRgba(aura, 0.22)}, ${auraRgba(aura, 0.06)})`,
                    border: `0.5px solid ${auraRgba(aura, 0.35)}`,
                    color: "#fff",
                    boxShadow: `0 6px 20px ${auraRgba(aura, 0.25)}`,
                  }
                : { color: "rgba(255,255,255,0.45)" }
            }
          >
            {tab.label}
            {counts[tab.id] != null && counts[tab.id]! > 0 && (
              <span
                className="text-[10px] tabular-nums font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  background: isActive ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.05)",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.35)",
                }}
              >
                {counts[tab.id]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Empty / No results ──────────────────────────────────────────────────────
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
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
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

const NoResults = memo(function NoResults({ q, tab }: { q: string; tab: TabId }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="text-white/25">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
      <p className="text-[15px] font-semibold text-white/50">No {tab} for "{q}"</p>
      <p className="text-[13px] text-white/30">Try a different search term</p>
    </div>
  );
});

// ── Skeleton ────────────────────────────────────────────────────────────────
function TrackSkeleton({ count = 24 }: { count?: number }) {
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

function UserSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="w-12 h-12 rounded-full skeleton-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded skeleton-shimmer" />
            <div className="h-3 w-1/4 rounded skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Users tab ───────────────────────────────────────────────────────────────
function UsersTab({ q, aura }: { q: string; aura: ReturnType<typeof useViewerAura> }) {
  const navigate = useNavigate();
  const { data: tracks = [], isLoading } = useQuery<Track[]>({
    queryKey: ["search-users-tracks", q],
    queryFn: () => searchTracks(q, 40),
    enabled: q.trim().length >= 2,
    placeholderData: (prev) => prev,
  });

  // dedupe artists from track results
  const artists = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: number; name: string; avatar: string | null }[] = [];
    for (const t of tracks) {
      if (t.userId && !seen.has(String(t.userId))) {
        seen.add(String(t.userId));
        out.push({ id: t.userId, name: t.artist, avatar: null });
      }
    }
    return out.slice(0, 20);
  }, [tracks]);

  if (isLoading) return <UserSkeleton />;
  if (artists.length === 0) return <NoResults q={q} tab="users" />;

  return (
    <div className="flex flex-col gap-1">
      {artists.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => navigate(`/user/${a.id}`)}
          className="group flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer text-left"
        >
          <div
            className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-[16px] font-bold text-white/40 ring-1 ring-white/[0.08]"
            style={{ background: auraRgba(aura, 0.12) }}
          >
            {a.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-white/85 group-hover:text-white transition-colors truncate">{a.name}</p>
            <p className="text-[11.5px] text-white/35 mt-0.5">Artist</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20 group-hover:text-white/50 transition-colors shrink-0">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

// ── Playlists tab ───────────────────────────────────────────────────────────
function PlaylistsTab({ q }: { q: string }) {
  return <NoResults q={q} tab="playlists" />;
}

// ── ResultsHeader ───────────────────────────────────────────────────────────
const ResultsHeader = memo(function ResultsHeader({
  q, count, isLoading, aura,
}: {
  q: string; count: number; isLoading: boolean; aura: ReturnType<typeof useViewerAura>;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
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
          {isLoading ? "Searching…" : `${count} results`}
        </p>
      </div>
    </div>
  );
});

// ── Main ────────────────────────────────────────────────────────────────────
export default memo(function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const aura = useViewerAura();
  const perf = usePerfMode();
  const deckBlur = perf.blur(32);
  const debounced = useDebouncedValue(q, 300);
  const [tab, setTab] = useState<TabId>("tracks");

  const { data: tracks = [], isLoading: tracksLoading } = useQuery<Track[]>({
    queryKey: ["search", debounced],
    queryFn: () => searchTracks(debounced, 40),
    enabled: debounced.trim().length >= 2,
    placeholderData: (prev) => prev,
  });

  const artists = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: number; name: string }[] = [];
    for (const t of tracks) {
      if (t.userId && !seen.has(String(t.userId))) {
        seen.add(String(t.userId));
        out.push({ id: t.userId, name: t.artist });
      }
    }
    return out.slice(0, 20);
  }, [tracks]);

  // EntityStrip — artists found in results
  const entityItems: EntityItem[] = useMemo(
    () =>
      artists.map((a) => ({
        key: String(a.id),
        label: a.name,
        sub: "Artist",
        image: null,
        round: true,
        onClick: () => {},
      })),
    [artists],
  );

  const counts: Record<TabId, number | null> = {
    tracks: tracks.length || null,
    users: artists.length || null,
    playlists: null,
  };

  const handleGenre = (genre: string) => {
    setSearchParams({ q: genre });
    const input = document.getElementById("global-search-input") as HTMLInputElement | null;
    if (input) input.value = genre;
  };

  return (
    <div className="relative min-h-full w-full">
      <style>{USER_PAGE_KEYFRAMES}</style>
      <div className="relative z-10 max-w-[1480px] mx-auto px-4 md:px-8 pt-6 pb-32" style={{ isolation: "isolate" }}>
        <GenreTicker onSelect={handleGenre} />

        {!q ? (
          <EmptyState aura={aura} />
        ) : (
          <>
            <ResultsHeader q={q} count={tab === "tracks" ? tracks.length : artists.length} isLoading={tracksLoading} aura={aura} />

            {/* Artists strip — показывается только на вкладке tracks */}
            {tab === "tracks" && artists.length > 0 && (
              <EntityStrip items={entityItems} />
            )}

            <TabBar active={tab} onChange={setTab} counts={counts} aura={aura} deckBlur={deckBlur} />

            {tab === "tracks" && (
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
                {tracksLoading && tracks.length === 0 ? (
                  <TrackSkeleton />
                ) : tracks.length === 0 ? (
                  <div className="col-span-full"><NoResults q={q} tab="tracks" /></div>
                ) : (
                  tracks.map((track) => (
                    <div key={track.id} className="animate-fade-in-up">
                      <TrackCard track={track} queue={tracks} />
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "users" && <UsersTab q={debounced} aura={aura} />}
            {tab === "playlists" && <PlaylistsTab q={debounced} />}
          </>
        )}
      </div>
    </div>
  );
});