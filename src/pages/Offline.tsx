import { memo, useMemo, useState, useCallback } from "react";
import { useHistoryStore } from "../store/historyStore";
import { usePlayerStore } from "../store/playerStore";
import { usePerfMode } from "../lib/perf";
import { useViewerAura } from "../lib/useViewerAura";
import { auraRgba } from "../lib/aura";
import { USER_PAGE_KEYFRAMES } from "../components/user/keyframes";
import { formatDuration, formatCount } from "../api/soundcloud";
import type { Track } from "../store/playerStore";

const PlayIcon = () => <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3.5l12 6.5-12 6.5V3.5z"/></svg>;
const ShuffleIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>;
const SearchIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const XIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>;
const MusicIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
const DownloadIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const WifiOffIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/><path d="M5 12.55a10.94 10.94 0 015.17-2.39"/><path d="M10.71 5.05A16 16 0 0122.56 9"/><path d="M1.42 9a15.91 15.91 0 014.7-2.88"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>;

type SortMode = "recent" | "title" | "artist" | "duration";

function shuffled<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ─── Storage stats panel ───────────────────────────────────────────────────
function StoragePanel({
  trackCount,
  aura,
  deckBlur,
  onPlayAll,
  onShuffle,
}: {
  trackCount: number;
  aura: ReturnType<typeof useViewerAura>;
  deckBlur: number;
  onPlayAll: () => void;
  onShuffle: () => void;
}) {
  return (
    <section
      className="relative grid overflow-hidden rounded-[20px] border border-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_60px_-32px_rgba(0,0,0,0.8)] lg:grid-cols-2"
      style={{
        background: deckBlur > 0
          ? "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))"
          : "rgb(17,17,21)",
        backdropFilter: deckBlur > 0 ? `blur(${deckBlur}px) saturate(1.25)` : undefined,
        WebkitBackdropFilter: deckBlur > 0 ? `blur(${deckBlur}px) saturate(1.25)` : undefined,
      }}
    >
      {/* accent top line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
        style={{ background: "linear-gradient(90deg, transparent, var(--color-accent-glow) 18%, transparent 42%)" }}
      />

      {/* left — info */}
      <div className="flex flex-col justify-between gap-6 p-6 md:p-8">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${auraRgba(aura, 0.28)}, ${auraRgba(aura, 0.04)})`,
                boxShadow: `inset 0 0 0 1px ${auraRgba(aura, 0.4)}`,
              }}
            >
              <DownloadIcon />
            </span>
            <h2 className="text-[15px] font-bold text-white/95 tracking-tight">Offline library</h2>
          </div>
          <p className="text-[13px] text-white/45 leading-relaxed max-w-[320px]">
            Tracks you've listened to are cached locally and available offline. Your listening history acts as your offline library.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onPlayAll}
            disabled={trackCount === 0}
            className="inline-flex items-center gap-2 px-5 h-9 rounded-xl text-[12.5px] font-semibold cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-40 disabled:cursor-default"
            style={{
              background: `linear-gradient(180deg, ${auraRgba(aura, 0.3)}, ${auraRgba(aura, 0.1)})`,
              border: `1px solid ${auraRgba(aura, 0.4)}`,
              color: "#fff",
              boxShadow: `0 8px 20px ${auraRgba(aura, 0.2)}`,
            }}
          >
            <PlayIcon /> Play all
          </button>
          <button
            type="button"
            onClick={onShuffle}
            disabled={trackCount === 0}
            className="inline-flex items-center gap-2 px-5 h-9 rounded-xl text-[12.5px] font-semibold text-white/70 cursor-pointer transition-all duration-200 hover:text-white hover:bg-white/[0.08] active:scale-[0.97] disabled:opacity-40 disabled:cursor-default"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <ShuffleIcon /> Shuffle
          </button>
        </div>
      </div>

      {/* divider */}
      <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent lg:mx-0 lg:h-auto lg:w-px lg:bg-gradient-to-b" />

      {/* right — stats */}
      <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
        {[
          { label: "Cached tracks", value: String(trackCount), sub: "in history" },
          { label: "Storage", value: trackCount > 0 ? "Streamed" : "Empty", sub: "audio cached by browser" },
          { label: "Status", value: "Ready", sub: "available offline*", highlight: true },
        ].map(({ label, value, sub, highlight }) => (
          <div key={label} className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">{label}</p>
              <p className="text-[11px] text-white/25 mt-0.5">{sub}</p>
            </div>
            <span
              className="text-[20px] font-black tabular-nums tracking-tight shrink-0"
              style={{ color: highlight ? auraRgba(aura, 0.9) : "rgba(255,255,255,0.9)" }}
            >
              {value}
            </span>
          </div>
        ))}
        <p className="text-[10px] text-white/20 mt-1">* Browser cache only — may be cleared by the system</p>
      </div>
    </section>
  );
}

// ─── Toolbar ───────────────────────────────────────────────────────────────
function Toolbar({
  total,
  query,
  onQuery,
  sort,
  onSort,
  aura,
  deckBlur,
}: {
  total: number;
  query: string;
  onQuery: (q: string) => void;
  sort: SortMode;
  onSort: (s: SortMode) => void;
  aura: ReturnType<typeof useViewerAura>;
  deckBlur: number;
}) {
  const SORTS: { id: SortMode; label: string }[] = [
    { id: "recent", label: "Recent" },
    { id: "title", label: "Title" },
    { id: "artist", label: "Artist" },
    { id: "duration", label: "Duration" },
  ];

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[13px] text-white/40 font-medium tabular-nums">{total} tracks</span>
        <span className="text-white/15">·</span>
        <div
          className="inline-flex items-center gap-0.5 p-0.5 rounded-xl"
          style={{
            background: deckBlur > 0 ? "rgba(255,255,255,0.03)" : "rgba(22,22,27,0.9)",
            border: "0.5px solid rgba(255,255,255,0.06)",
          }}
        >
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSort(s.id)}
              className="px-3 h-7 rounded-[10px] text-[11.5px] font-semibold cursor-pointer transition-all duration-200"
              style={
                sort === s.id
                  ? {
                      background: `linear-gradient(180deg, ${auraRgba(aura, 0.22)}, ${auraRgba(aura, 0.06)})`,
                      boxShadow: `inset 0 0 0 1px ${auraRgba(aura, 0.35)}`,
                      color: "#fff",
                    }
                  : { color: "rgba(255,255,255,0.45)" }
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-white/30">
          <SearchIcon />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Filter tracks…"
          className="text-[12.5px] text-white/85 placeholder:text-white/25 py-2 pl-8 pr-7 rounded-xl outline-none w-[200px] transition-all duration-200"
          style={{
            background: deckBlur > 0 ? "rgba(255,255,255,0.04)" : "rgba(24,24,28,0.9)",
            border: "0.5px solid rgba(255,255,255,0.07)",
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => onQuery("")}
            className="absolute inset-y-0 right-2 flex items-center text-white/30 hover:text-white/70 cursor-pointer transition-colors"
          >
            <XIcon />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Track row ─────────────────────────────────────────────────────────────
function TrackRow({
  track,
  index,
  isPlaying,
  onClick,
  aura,
}: {
  track: Track;
  index: number;
  isPlaying: boolean;
  onClick: () => void;
  aura: ReturnType<typeof useViewerAura>;
}) {
  return (
    <div
      className="group flex items-center gap-4 px-4 py-2.5 rounded-[14px] hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      {/* index / play */}
      <div className="w-6 shrink-0 flex items-center justify-center">
        <span
          className={`text-[11px] tabular-nums font-medium transition-all duration-200 group-hover:opacity-0 ${isPlaying ? "opacity-0" : "opacity-100"}`}
          style={{ color: isPlaying ? auraRgba(aura, 0.9) : "rgba(255,255,255,0.25)" }}
        >
          {isPlaying ? "▶" : index + 1}
        </span>
        <span className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white/70">
          <PlayIcon />
        </span>
      </div>

      {/* artwork */}
      <div className="relative w-10 h-10 shrink-0 rounded-xl overflow-hidden ring-1 ring-white/[0.08]">
        {track.artwork ? (
          <img src={track.artwork} alt="" className="w-full h-full object-cover" decoding="async" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/[0.04] text-white/20">
            <MusicIcon />
          </div>
        )}
        {isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `${auraRgba(aura, 0.5)}` }}
          >
            <span className="text-white text-[8px] font-black">▶</span>
          </div>
        )}
      </div>

      {/* info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-medium truncate transition-colors duration-150"
          style={{ color: isPlaying ? auraRgba(aura, 0.95) : "rgba(255,255,255,0.9)" }}
        >
          {track.title}
        </p>
        <p className="text-[11.5px] text-white/40 truncate mt-0.5">{track.artist}</p>
      </div>

      {/* plays */}
      <span className="hidden sm:block text-[11px] text-white/20 tabular-nums shrink-0 w-16 text-right">
        {formatCount(track.playbackCount)} plays
      </span>

      {/* duration */}
      <span className="text-[11px] text-white/25 tabular-nums shrink-0 w-10 text-right">
        {formatDuration(track.duration)}
      </span>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────
function Empty({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center text-white/20">
        {query ? <SearchIcon /> : <WifiOffIcon />}
      </div>
      <div className="text-center">
        <p className="text-[15px] font-semibold text-white/60">
          {query ? `No results for "${query}"` : "No cached tracks yet"}
        </p>
        <p className="text-[13px] text-white/30 mt-1">
          {query ? "Try a different search term" : "Play some tracks and they'll appear here"}
        </p>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default memo(function Offline() {
  const entries = useHistoryStore((s) => s.entries);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const aura = useViewerAura();
  const perf = usePerfMode();
  const deckBlur = perf.blur(24);

  const [sort, setSort] = useState<SortMode>("recent");
  const [query, setQuery] = useState("");

  const allTracks = useMemo(() => entries.map((e) => e.track), [entries]);

  const sorted = useMemo(() => {
    let list = [...allTracks];
    if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "artist") list.sort((a, b) => a.artist.localeCompare(b.artist));
    else if (sort === "duration") list.sort((a, b) => b.duration - a.duration);
    return list;
  }, [allTracks, sort]);

  const filtered = useMemo(() => {
    if (!query.trim()) return sorted;
    const q = query.toLowerCase();
    return sorted.filter(
      (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q),
    );
  }, [sorted, query]);

  const handlePlay = useCallback((track: Track) => {
    setQueue(filtered);
    setTrack(track);
  }, [filtered, setQueue, setTrack]);

  const handlePlayAll = useCallback(() => {
    if (filtered.length === 0) return;
    setQueue(filtered);
    setTrack(filtered[0]);
  }, [filtered, setQueue, setTrack]);

  const handleShuffle = useCallback(() => {
    if (filtered.length === 0) return;
    const q = shuffled(filtered);
    setQueue(q);
    setTrack(q[0]);
  }, [filtered, setQueue, setTrack]);

  return (
    <div className="relative min-h-full px-5 py-6 md:px-8">
      <style>{USER_PAGE_KEYFRAMES}</style>

      <div
        className="relative z-10 mx-auto flex w-full max-w-[1180px] flex-col gap-5"
        style={{ isolation: "isolate" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-black tracking-tight text-white/95 leading-none">
              Offline
            </h1>
            <p className="text-[13px] text-white/40 mt-1.5">
              Your cached listening history — available without an internet connection
            </p>
          </div>
          <div
            className="shrink-0 flex items-center gap-2 px-3 h-8 rounded-xl text-[11.5px] font-semibold"
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              color: "rgba(74,222,128,0.9)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Ready
          </div>
        </div>

        {/* Storage panel */}
        <StoragePanel
          trackCount={allTracks.length}
          aura={aura}
          deckBlur={deckBlur}
          onPlayAll={handlePlayAll}
          onShuffle={handleShuffle}
        />

        {/* Toolbar */}
        <Toolbar
          total={filtered.length}
          query={query}
          onQuery={setQuery}
          sort={sort}
          onSort={setSort}
          aura={aura}
          deckBlur={deckBlur}
        />

        {/* Track list */}
        <div
          className="rounded-[18px] overflow-hidden border border-white/[0.06]"
          style={{
            background: deckBlur > 0
              ? "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))"
              : "rgb(17,17,21)",
            backdropFilter: deckBlur > 0 ? `blur(${deckBlur}px)` : undefined,
            WebkitBackdropFilter: deckBlur > 0 ? `blur(${deckBlur}px)` : undefined,
          }}
        >
          {filtered.length === 0 ? (
            <Empty query={query} />
          ) : (
            <div className="p-2">
              {filtered.map((track, i) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={i}
                  isPlaying={currentTrack?.id === track.id}
                  onClick={() => handlePlay(track)}
                  aura={aura}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});