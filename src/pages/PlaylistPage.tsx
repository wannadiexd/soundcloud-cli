import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPlaylist, getStreamUrl, formatDuration, formatCount } from "../api/soundcloud";
import { usePlayerStore } from "../store/playerStore";
import { useViewerAura } from "../lib/useViewerAura";
import { auraRgba } from "../lib/aura";
import { usePerfMode } from "../lib/perf";
import { USER_PAGE_KEYFRAMES } from "../components/user/keyframes";
import type { Track } from "../store/playerStore";

const PLAYLIST_KEYFRAMES = `
@keyframes crate-deal-in {
  from { opacity: 0; transform: translateY(26px); }
  to   { opacity: 1; transform: translateY(0); }
}
.crate-sleeve-in { animation: crate-deal-in 620ms cubic-bezier(0.2,0.8,0.2,1) both; }
`;

const PlayIcon = () => <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3.5l12 6.5-12 6.5V3.5z"/></svg>;
const PauseIcon = () => <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><rect x="4" y="3" width="4" height="14" rx="1"/><rect x="12" y="3" width="4" height="14" rx="1"/></svg>;
const ShuffleIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>;
const HeartIcon = ({ filled }: { filled?: boolean }) => <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
const LinkIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const GripIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/></svg>;
const TrashIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const ListIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const MusicIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/15"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
const SmallPlayIcon = () => <svg width="12" height="12" viewBox="0 0 20 20" fill="white"><path d="M5 3.5l12 6.5-12 6.5V3.5z"/></svg>;
const SmallPauseIcon = () => <svg width="12" height="12" viewBox="0 0 20 20" fill="white"><rect x="4" y="3" width="4" height="14" rx="1"/><rect x="12" y="3" width="4" height="14" rx="1"/></svg>;

const SLEEVE_SHADOW = "0 24px 50px rgba(0,0,0,0.5), inset 0 0 0 0.5px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.14)";
const FAN = [
  { rot: 0, x: 0, y: 0, s: 1, z: 50 },
  { rot: 6, x: 17, y: 7, s: 0.965, z: 40 },
  { rot: -7, x: -17, y: 9, s: 0.95, z: 30 },
  { rot: 11, x: 31, y: 15, s: 0.93, z: 20 },
  { rot: -12, x: -31, y: 17, s: 0.91, z: 10 },
] as const;

const CrateStack = memo(function CrateStack({
  playlist, tracks, isPlaying, onPlay,
}: {
  playlist: any;
  tracks: Track[];
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const perf = usePerfMode();
  const covers = useMemo(() => {
    const urls: string[] = [];
    const seen = new Set<string>();
    const push = (u: string | null) => { if (u && !seen.has(u)) { seen.add(u); urls.push(u); } };
    push(playlist.artwork?.replace("t300x300", "t200x200") || null);
    for (const tr of tracks) { if (urls.length >= 5) break; push(tr.artwork?.replace("t300x300", "t200x200") || null); }
    return urls.slice(0, 5);
  }, [playlist.artwork, tracks]);

  return (
    <button
      type="button"
      onClick={onPlay}
      className="relative shrink-0 self-center lg:self-start group/crate cursor-pointer w-[150px] h-[150px] md:w-[200px] md:h-[200px]"
      style={{ perspective: "1000px" }}
    >
      {covers.length === 0 && (
        <div className="absolute inset-0 rounded-[1.7rem] flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", boxShadow: SLEEVE_SHADOW }}>
          <MusicIcon />
        </div>
      )}
      {covers.map((url, i) => {
        const f = FAN[i] ?? FAN[FAN.length - 1];
        const isFront = i === 0;
        return (
          <div
            key={url}
            className={perf.idleAnim ? "crate-sleeve-in" : ""}
            style={{ position: "absolute", inset: 0, zIndex: f.z, animationDelay: perf.idleAnim ? `${(covers.length - 1 - i) * 70}ms` : undefined }}
          >
            <div
              className="w-full h-full rounded-[1.7rem] overflow-hidden transition-transform duration-500"
              style={{ transform: `rotate(${f.rot}deg) translate(${f.x}px, ${f.y}px) scale(${f.s})`, boxShadow: SLEEVE_SHADOW }}
            >
              <img src={url} alt="" decoding="async" loading="lazy"
                className={`w-full h-full object-cover ${isFront ? "transition-transform duration-700 group-hover/crate:scale-[1.05]" : ""}`}
              />
              {isFront && (
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isPlaying ? "bg-black/25 opacity-100" : "bg-black/0 opacity-0 group-hover/crate:bg-black/30 group-hover/crate:opacity-100"}`}>
                  <span className={`w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-2xl transition-transform duration-300 ${isPlaying ? "scale-100" : "scale-75 group-hover/crate:scale-100"}`}>
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <span
        className="absolute -bottom-2 -right-1 z-[60] inline-flex items-center gap-1 text-[10px] font-bold tabular-nums px-2.5 py-1 rounded-full text-white/85"
        style={{ background: "rgba(10,10,12,0.75)", border: "0.5px solid rgba(255,255,255,0.14)", boxShadow: "0 8px 20px rgba(0,0,0,0.4)" }}
      >
        <ListIcon /> {playlist.trackCount}
      </span>
    </button>
  );
});

const CuratorCard = memo(function CuratorCard({
  user, aura, description,
}: {
  user: any;
  aura: ReturnType<typeof useViewerAura>;
  description?: string | null;
}) {
  const navigate = useNavigate();
  const b = usePerfMode().blur(24);
  return (
    <div className="rounded-[1.4rem] p-4 md:p-5" style={{ background: "rgba(255,255,255,0.035)", border: "0.5px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-3.5">
        <button type="button" onClick={() => navigate(`/user/${user.id}`)} className="shrink-0 cursor-pointer">
          <img src={user.avatar || ""} alt={user.username} className="w-12 h-12 rounded-full object-cover ring-1 ring-white/[0.1]" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Curated by</p>
          <button type="button" onClick={() => navigate(`/user/${user.id}`)}
            className="block text-[16px] font-bold text-white/90 truncate hover:text-white transition-colors cursor-pointer text-left max-w-full"
          >
            {user.username}
          </button>
        </div>
      </div>
      {user.followersCount != null && (
        <div className="flex flex-wrap gap-2.5 mt-4">
          <div className="px-4 py-2.5 rounded-2xl flex items-baseline gap-2"
            style={{ background: b > 0 ? "rgba(255,255,255,0.04)" : "rgba(28,28,32,0.85)", border: "0.5px solid rgba(255,255,255,0.08)", boxShadow: `inset 0 0.5px 0 rgba(255,255,255,0.08), 0 8px 24px ${auraRgba(aura, 0.18)}` }}
          >
            <span className="text-[18px] font-black tabular-nums text-white">{formatCount(user.followersCount)}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Followers</span>
          </div>
        </div>
      )}
      {description && (
        <div className="mt-4 pl-3.5" style={{ borderLeft: `2px solid ${auraRgba(aura, 0.45)}` }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mb-1.5">Liner note</p>
          <p className="text-[12.5px] text-white/55 leading-relaxed whitespace-pre-wrap break-words line-clamp-4 hover:line-clamp-none transition-all duration-500">
            {description}
          </p>
        </div>
      )}
    </div>
  );
});

const PlaylistActions = memo(function PlaylistActions({
  playlist, isPlaying, onPlayAll, onShuffle,
}: {
  playlist: any;
  isPlaying: boolean;
  onPlayAll: () => void;
  onShuffle: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = () => {
    if (playlist.permalinkUrl) navigator.clipboard.writeText(playlist.permalinkUrl).catch(() => {});
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-start">
      <button
        type="button"
        onClick={onPlayAll}
        className="group relative overflow-hidden inline-flex items-center gap-2.5 pl-4 pr-6 h-11 rounded-full text-[14px] font-semibold cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all duration-300"
        style={{
          background: isPlaying ? "#fff" : "var(--color-accent)",
          color: isPlaying ? "#000" : "#fff",
          boxShadow: "0 12px 32px var(--color-accent-glow), inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
      >
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)" }}
        />
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
        Play all
      </button>

      <button
        type="button"
        onClick={onShuffle}
        className="inline-flex items-center gap-1.5 px-3.5 h-11 rounded-2xl text-[12.5px] font-semibold border bg-white/[0.04] border-white/[0.07] text-white/65 hover:bg-white/[0.07] hover:text-white/90 hover:border-white/[0.12] transition-all cursor-pointer active:scale-[0.96]"
      >
        <ShuffleIcon /> Shuffle
      </button>

      <button
        type="button"
        onClick={() => setLiked(v => !v)}
        className={`inline-flex items-center gap-1.5 px-3.5 h-11 rounded-2xl text-[12.5px] font-semibold border transition-all cursor-pointer active:scale-[0.96] ${liked ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)] border-[var(--color-accent)]/30" : "bg-white/[0.04] border-white/[0.07] text-white/65 hover:bg-white/[0.07]"}`}
      >
        <HeartIcon filled={liked} /> {formatCount(playlist.likesCount)}
      </button>

      <div className="flex items-center gap-0.5 h-11 px-1.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.07)" }}>
        <button
          type="button"
          onClick={copy}
          className={`inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all cursor-pointer ${copied ? "text-emerald-400 bg-emerald-500/12" : "text-white/60 hover:text-white/95 hover:bg-white/[0.07]"}`}
        >
          {copied ? <CheckIcon /> : <LinkIcon />}
        </button>
      </div>
    </div>
  );
});

function RowBody({ track, index, isThis, isThisPlaying, onToggle }: {
  track: Track; index: number; isThis: boolean; isThisPlaying: boolean; onToggle: () => void;
}) {
  const navigate = useNavigate();
  return (
    <>
      <div className="w-8 h-8 flex items-center justify-center shrink-0 cursor-pointer" onClick={onToggle}
        onMouseEnter={() => getStreamUrl(track.id).catch(() => {})}
      >
        {isThisPlaying ? (
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--color-accent)", boxShadow: "0 0 12px var(--color-accent-glow)" }}>
            <SmallPauseIcon />
          </div>
        ) : (
          <>
            <span className="text-[12px] text-white/25 tabular-nums font-medium group-hover:hidden">{index + 1}</span>
            <div className="hidden group-hover:flex w-7 h-7 rounded-full bg-white/10 items-center justify-center"><SmallPlayIcon /></div>
          </>
        )}
      </div>

      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/[0.06]">
        {track.artwork
          ? <img src={track.artwork} alt="" className="w-full h-full object-cover" decoding="async" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center bg-white/[0.03]"><MusicIcon /></div>
        }
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-medium truncate cursor-pointer hover:underline"
          style={{ color: isThis ? "var(--color-accent)" : "rgba(255,255,255,0.85)" }}
          onClick={() => navigate(`/track/${track.id}`)}
        >
          {track.title}
        </p>
        <p className="text-[11px] text-white/40 truncate mt-0.5 cursor-pointer hover:text-white/70"
          onClick={() => navigate(`/user/${(track as any).userId || ""}`)}
        >
          {track.artist}
        </p>
      </div>

      {track.playbackCount > 0 && (
        <span className="hidden sm:block text-[10px] text-white/20 tabular-nums shrink-0">
          {formatCount(track.playbackCount)}
        </span>
      )}

      <span className="text-[11px] text-white/25 tabular-nums font-medium shrink-0 w-10 text-right">
        {formatDuration(track.duration)}
      </span>
    </>
  );
}

const ROW_BASE = "group relative flex items-center gap-3.5 pl-4 pr-4 py-3 rounded-xl transition-colors duration-200 select-none";

const SortableRow = memo(function SortableRow({ track, index, queue, onRemove }: {
  track: Track; index: number; queue: Track[]; onRemove: (id: number) => void;
}) {
  const { setTrack, setQueue, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const isThis = currentTrack?.id === track.id;
  const isThisPlaying = isThis && isPlaying;
  const onToggle = () => { if (isThis) togglePlay(); else { setQueue(queue); setTrack(track); } };

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
      className={`${ROW_BASE} ${isThis ? "bg-[var(--color-accent)]/[0.06] ring-1 ring-[var(--color-accent)]/20" : "hover:bg-white/[0.03]"}`}
    >
      <div className="w-5 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing text-white/15 hover:text-white/40 transition-colors -ml-1" {...attributes} {...listeners}>
        <GripIcon />
      </div>
      <RowBody track={track} index={index} isThis={isThis} isThisPlaying={isThisPlaying} onToggle={onToggle} />
      <button type="button" onClick={() => onRemove(track.id)}
        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0 cursor-pointer"
      >
        <TrashIcon />
      </button>
    </div>
  );
});

const ReadonlyRow = memo(function ReadonlyRow({ track, index, queue }: { track: Track; index: number; queue: Track[] }) {
  const { setTrack, setQueue, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const isThis = currentTrack?.id === track.id;
  const isThisPlaying = isThis && isPlaying;
  const onToggle = () => { if (isThis) togglePlay(); else { setQueue(queue); setTrack(track); } };
  return (
    <div className={`${ROW_BASE} ${isThis ? "bg-[var(--color-accent)]/[0.06] ring-1 ring-[var(--color-accent)]/20" : "hover:bg-white/[0.03]"}`}>
      <RowBody track={track} index={index} isThis={isThis} isThisPlaying={isThisPlaying} onToggle={onToggle} />
    </div>
  );
});

function OverlayRow({ track, index, queue }: { track: Track; index: number; queue: Track[] }) {
  const { currentTrack, isPlaying, togglePlay, setTrack, setQueue } = usePlayerStore();
  const isThis = currentTrack?.id === track.id;
  const isThisPlaying = isThis && isPlaying;
  const onToggle = () => { if (isThis) togglePlay(); else { setQueue(queue); setTrack(track); } };
  return (
    <div className={`${ROW_BASE} bg-white/[0.06] cursor-grabbing`}
      style={{ transform: "rotate(1.5deg)", boxShadow: "0 24px 60px rgba(0,0,0,0.55), inset 0 0 0 0.5px rgba(255,255,255,0.12)" }}
    >
      <div className="w-5 flex items-center justify-center shrink-0 text-white/40 -ml-1"><GripIcon /></div>
      <RowBody track={track} index={index} isThis={isThis} isThisPlaying={isThisPlaying} onToggle={onToggle} />
    </div>
  );
}

const SequenceList = memo(function SequenceList({ tracks, isOwner, onDragEnd, onRemove }: {
  tracks: Track[];
  isOwner: boolean;
  onDragEnd: (e: DragEndEvent) => void;
  onRemove: (id: number) => void;
}) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = useMemo(() => tracks.map(t => t.id), [tracks]);
  const activeTrack = activeId ? tracks.find(t => t.id === activeId) : null;
  const activeIndex = activeId ? tracks.findIndex(t => t.id === activeId) : -1;

  if (tracks.length === 0) return (
    <div className="py-20 flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
        <MusicIcon />
      </div>
      <p className="text-white/30 text-sm">Empty playlist</p>
    </div>
  );

  return (
    <div className="rounded-[2rem] p-4 md:p-5" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)", boxShadow: "0 24px 60px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
      <div className="flex items-center justify-between px-3 pt-1 pb-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
          <ListIcon /> The Sequence <span className="text-white/25 ml-1 tabular-nums">{tracks.length}</span>
        </span>
      </div>

      {isOwner ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as number)}
          onDragEnd={(e) => { setActiveId(null); onDragEnd(e); }}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {tracks.map((t, i) => <SortableRow key={t.id} track={t} index={i} queue={tracks} onRemove={onRemove} />)}
          </SortableContext>
          <DragOverlay>
            {activeTrack && <OverlayRow track={activeTrack} index={activeIndex} queue={tracks} />}
          </DragOverlay>
        </DndContext>
      ) : (
        tracks.map((t, i) => <ReadonlyRow key={t.id} track={t} index={i} queue={tracks} />)
      )}
    </div>
  );
});

function HeroSkeleton() {
  return (
    <div className="relative rounded-[2.5rem] overflow-hidden glass-featured p-6 md:p-10">
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="w-[150px] h-[150px] md:w-[200px] md:h-[200px] rounded-[1.7rem] skeleton-shimmer shrink-0 self-center lg:self-start" />
        <div className="flex-1 space-y-4 w-full">
          <div className="h-4 w-32 rounded-full skeleton-shimmer" />
          <div className="h-14 w-2/3 rounded-2xl skeleton-shimmer" />
          <div className="h-11 w-72 rounded-full skeleton-shimmer mt-6" />
          <div className="h-24 w-full rounded-2xl skeleton-shimmer mt-4" />
        </div>
      </div>
    </div>
  );
}

export default memo(function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const aura = useViewerAura();
  const perf = usePerfMode();

  const { setTrack, setQueue, currentTrack, isPlaying } = usePlayerStore();

  const { data: playlist, isLoading } = useQuery({
    queryKey: ["playlist", id],
    queryFn: () => getPlaylist(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    if (playlist?.tracks) setTracks(playlist.tracks as Track[]);
  }, [playlist]);

  const trackIdSet = useMemo(() => new Set(tracks.map(t => t.id)), [tracks]);
  const isPlayingFromThis = isPlaying && !!currentTrack && trackIdSet.has(currentTrack.id);

  const handlePlayAll = useCallback(() => {
    if (!tracks.length) return;
    if (isPlayingFromThis) usePlayerStore.getState().togglePlay();
    else { setQueue(tracks); setTrack(tracks[0]); }
  }, [tracks, isPlayingFromThis, setQueue, setTrack]);

  const handleShuffle = useCallback(() => {
    if (!tracks.length) return;
    const s = [...tracks].sort(() => Math.random() - 0.5);
    setQueue(s); setTrack(s[0]);
  }, [tracks, setQueue, setTrack]);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = tracks.findIndex(t => t.id === active.id);
    const newIdx = tracks.findIndex(t => t.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const next = [...tracks];
    const [moved] = next.splice(oldIdx, 1);
    next.splice(newIdx, 0, moved);
    setTracks(next);
  }, [tracks]);

  const handleRemove = useCallback((trackId: number) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
  }, []);

  const b = perf.blur(28);

  if (isLoading || !playlist) return (
    <div className="relative min-h-full w-full">
      <style>{PLAYLIST_KEYFRAMES}{USER_PAGE_KEYFRAMES}</style>
      <div className="relative z-10 max-w-[1320px] mx-auto px-4 md:px-8 pt-5 pb-10">
        <HeroSkeleton />
      </div>
    </div>
  );

  const titleStyle = {
    backgroundImage: aura.nameGradient,
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text" as const,
    backgroundClip: "text" as const,
    color: "transparent",
    filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))",
  };

  return (
    <div className="relative min-h-full w-full">
      <style>{PLAYLIST_KEYFRAMES}{USER_PAGE_KEYFRAMES}</style>

      <div className="relative z-10 max-w-[1320px] mx-auto px-4 md:px-8 pt-5 pb-32 space-y-7" style={{ isolation: "isolate" }}>
        <button type="button" onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white/55 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        <div
          className="relative overflow-hidden rounded-[2.25rem] p-6 md:p-10"
          style={{
            background: b > 0 ? `linear-gradient(145deg, ${auraRgba(aura, 0.08)}, rgba(12,11,16,0.55))` : "rgba(14,13,18,0.92)",
            backdropFilter: b > 0 ? `blur(${b}px) saturate(150%)` : undefined,
            boxShadow: `0 30px 80px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 70px ${auraRgba(aura, 0.12)}`,
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)" }}
          />
          <div className="absolute inset-0 pointer-events-none rounded-[inherit]"
            style={{ background: `radial-gradient(120% 130% at 6% -12%, ${auraRgba(aura, 0.18)}, transparent 56%)` }}
          />

          <div className="relative flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start">
            <CrateStack playlist={playlist} tracks={tracks} isPlaying={isPlayingFromThis} onPlay={handlePlayAll} />

            <div className="flex-1 min-w-0 w-full flex flex-col gap-5 text-center lg:text-left">
              <div className="flex flex-wrap items-center gap-2 justify-center lg:justify-start">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.28em] text-white/70"
                  style={{ background: "rgba(255,255,255,0.05)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}
                >
                  <ListIcon /> {playlist.isAlbum ? "Album" : "Playlist"}
                </span>
                {playlist.genre && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.16em] text-white/55"
                    style={{ background: auraRgba(aura, 0.15) }}
                  >
                    {playlist.genre}
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black leading-[0.9] tracking-tighter break-words" style={titleStyle}>
                {playlist.title}
              </h1>

              <div className="pt-1">
                <PlaylistActions playlist={playlist} isPlaying={isPlayingFromThis} onPlayAll={handlePlayAll} onShuffle={handleShuffle} />
              </div>

              <CuratorCard user={playlist.user} aura={aura} description={playlist.description} />
            </div>
          </div>
        </div>

        <SequenceList tracks={tracks} isOwner={false} onDragEnd={handleDragEnd} onRemove={handleRemove} />
      </div>
    </div>
  );
});