import { useEffect, useRef, useState, useCallback, memo } from "react";
import * as Slider from "@radix-ui/react-slider";
import { usePlayerStore } from "../store/playerStore";
import { getStreamUrl, formatDuration } from "../api/soundcloud";

// ── Icons ──────────────────────────────────────────────────────────────────
const VolumeXIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>;
const Volume1Icon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>;
const Volume2Icon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>;
const SkipBackIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>;
const SkipForwardIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm9-12v12h2V6h-2z"/></svg>;
const ShuffleIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>;
const RepeatIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>;
const Repeat1Icon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/><text x="9.5" y="14.5" fontSize="7" fontWeight="800" stroke="none" fill="currentColor">1</text></svg>;
const HeartIcon = ({ filled }: { filled: boolean }) => <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
const QueueIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const XIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const MusicIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;

const smBtn = (active: boolean) =>
  `relative w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 ${
    active
      ? "text-[var(--color-accent)]"
      : "text-white/50 hover:text-white hover:bg-white/[0.08]"
  }`;
const mdBtn = "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer text-white/50 hover:text-white hover:bg-white/[0.08] active:scale-90";

// ── Progress bar — обновляется через DOM, не через React state ─────────────
const ProgressSlider = memo(function ProgressSlider({
  audioRef,
  onSeek,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onSeek: (t: number) => void;
}) {
  const rangeRef = useRef<HTMLSpanElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const draggingRef = useRef(false);
  const durationRef = useRef(0);
  const [dragVal, setDragVal] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      if (draggingRef.current) return;
      const d = audio.duration || 0;
      const pct = d > 0 ? (audio.currentTime / d) * 100 : 0;
      if (rangeRef.current) rangeRef.current.style.width = `${pct}%`;
      if (thumbRef.current) (thumbRef.current.parentElement as HTMLElement).style.left = `${pct}%`;
    };

    const onMeta = () => {
      durationRef.current = audio.duration || 0;
      setDur(audio.duration || 0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
    };
  }, [audioRef]);

  return (
    <Slider.Root
      className="relative flex items-center w-full h-5 cursor-pointer group select-none touch-none"
      value={[dragVal]}
      max={dur || 1}
      step={0.1}
      onValueChange={([v]) => {
        draggingRef.current = true;
        setDragVal(v);
        const pct = durationRef.current > 0 ? (v / durationRef.current) * 100 : 0;
        if (rangeRef.current) rangeRef.current.style.width = `${pct}%`;
        if (thumbRef.current) (thumbRef.current.parentElement as HTMLElement).style.left = `${pct}%`;
      }}
      onValueCommit={([v]) => {
        draggingRef.current = false;
        setDragVal(v);
        onSeek(v);
      }}
    >
      <Slider.Track className="relative h-[3px] grow rounded-full bg-white/[0.08] group-hover:h-[5px] transition-all duration-150">
        <Slider.Range
          ref={rangeRef}
          className="absolute h-full rounded-full will-change-[width]"
          style={{ background: "var(--color-accent)", width: "0%" }}
        />
      </Slider.Track>
      <Slider.Thumb
        ref={thumbRef}
        className="block w-3 h-3 rounded-full scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 outline-none will-change-transform"
        style={{ background: "var(--color-accent)", boxShadow: "0 0 10px var(--color-accent-glow)" }}
      />
    </Slider.Root>
  );
});

// ── Time display — тоже через DOM ──────────────────────────────────────────
const TimeDisplay = memo(function TimeDisplay({
  audioRef,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const currRef = useRef<HTMLElement>(null);
  const durRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      if (currRef.current) currRef.current.textContent = formatDuration(audio.currentTime * 1000);
    };
    const onMeta = () => {
      if (durRef.current) durRef.current.textContent = formatDuration((audio.duration || 0) * 1000);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
    };
  }, [audioRef]);

  return (
    <div className="npb-times">
      <b ref={currRef}>0:00</b>
      <span ref={durRef}>0:00</span>
    </div>
  );
});

// ── Volume slider ──────────────────────────────────────────────────────────
const VolumeSlider = memo(function VolumeSlider({
  volume,
  onChange,
}: {
  volume: number;
  onChange: (v: number) => void;
}) {
  return (
    <Slider.Root
      className="relative flex items-center h-5 w-[72px] cursor-pointer group select-none touch-none"
      value={[volume]}
      max={1}
      step={0.01}
      onValueChange={([v]) => onChange(v)}
    >
      <Slider.Track className="relative h-[3px] grow rounded-full bg-white/[0.08] group-hover:h-[4px] transition-all duration-150">
        <Slider.Range className="absolute h-full rounded-full bg-white/60" />
      </Slider.Track>
      <Slider.Thumb className="block w-2.5 h-2.5 rounded-full bg-white scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 outline-none" />
    </Slider.Root>
  );
});

// ── Queue panel ────────────────────────────────────────────────────────────
const QueuePanel = memo(function QueuePanel({ onClose }: { onClose: () => void }) {
  const queue = usePlayerStore((s) => s.queue);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const setTrack = usePlayerStore((s) => s.setTrack);

  return (
    <div
      className="absolute bottom-[calc(100%+12px)] right-2 w-[300px] rounded-[20px] border border-white/[0.08] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.7)]"
      style={{
        background: "rgba(14,14,18,0.97)",
        backdropFilter: "blur(40px)",
        animation: "fadeInUp 0.22s var(--ease-apple) both",
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <span className="text-[13px] font-semibold text-white/80">Queue</span>
        <span className="text-[11px] text-white/30 tabular-nums">{queue.length} tracks</span>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.07] cursor-pointer transition-all"
        >
          <XIcon />
        </button>
      </div>

      <div className="overflow-y-auto max-h-[320px] p-2 scrollbar-hide">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-white/20">
            <MusicIcon />
            <span className="text-[12px]">Queue is empty</span>
          </div>
        ) : (
          queue.map((track, i) => {
            const active = currentTrack?.id === track.id;
            return (
              <button
                key={`${track.id}-${i}`}
                type="button"
                onClick={() => setTrack(track)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer hover:bg-white/[0.05]"
                style={active ? { background: "rgba(255,85,0,0.07)" } : undefined}
              >
                <span className="w-5 shrink-0 text-[10px] tabular-nums text-white/25 text-center">
                  {active
                    ? <span style={{ color: "var(--color-accent)" }}>▶</span>
                    : i + 1}
                </span>
                <div className="relative w-8 h-8 shrink-0 rounded-lg overflow-hidden bg-white/[0.06]">
                  {track.artwork
                    ? <img src={track.artwork} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white/20"><MusicIcon /></div>
                  }
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p
                    className="text-[12px] font-medium truncate"
                    style={{ color: active ? "var(--color-accent)" : "rgba(255,255,255,0.85)" }}
                  >
                    {track.title}
                  </p>
                  <p className="text-[11px] text-white/35 truncate">{track.artist}</p>
                </div>
                <span className="text-[10px] text-white/25 tabular-nums shrink-0">
                  {formatDuration(track.duration)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
});

// ── Like button ────────────────────────────────────────────────────────────
const LikeButton = memo(function LikeButton({ trackId }: { trackId: number }) {
  const [liked, setLiked] = useState(false);
  const prevId = useRef(trackId);

  // Сбрасываем при смене трека
  useEffect(() => {
    if (prevId.current !== trackId) {
      prevId.current = trackId;
      setLiked(false);
    }
  }, [trackId]);

  const toggle = useCallback(() => {
    setLiked((v) => !v);
    // TODO: реальный API лайков
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      title={liked ? "Unlike" : "Like"}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer hover:bg-white/[0.04] ${
        liked ? "text-[var(--color-accent)]" : "text-white/30 hover:text-white/60"
      }`}
    >
      <HeartIcon filled={liked} />
    </button>
  );
});

// ── Main Player ────────────────────────────────────────────────────────────
export default memo(function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    currentTrack, isPlaying, volume, shuffle, repeat,
    togglePlay, setVolume, setProgress, setDuration,
    nextTrack, prevTrack, toggleShuffle, cycleRepeat, onTrackEnded,
  } = usePlayerStore();

  const [queueOpen, setQueueOpen] = useState(false);

  // Загрузка трека
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    const audio = audioRef.current;
    getStreamUrl(currentTrack.id).then((url) => {
      audio.src = url;
      audio.play().catch(() => {});
    });
  }, [currentTrack?.id]);

  // Play / pause
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [isPlaying]);

  // Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
    setDuration(audioRef.current.duration || 0);
  }, [setProgress, setDuration]);

  const handleSeek = useCallback((t: number) => {
    if (audioRef.current) audioRef.current.currentTime = t;
    setProgress(t);
  }, [setProgress]);

  if (!currentTrack) return null;

  return (
    <div className="npb">
      <audio
  ref={audioRef}
  onTimeUpdate={handleTimeUpdate}
  onEnded={() => {
    if (usePlayerStore.getState().repeat === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } else {
      onTrackEnded();
    }
  }}
/>
      <div className="npb-underglow" />

      <div className="npb-dock" data-playing={isPlaying ? "true" : "false"}>
        <div className="npb-glass" />

        {queueOpen && <QueuePanel onClose={() => setQueueOpen(false)} />}

        <div className="npb-content">
          <div className="npb-row">

            {/* Artwork */}
            <div className="npb-art">
              {currentTrack.artwork
                ? <img src={currentTrack.artwork} alt={currentTrack.title} />
                : <div className="w-full h-full flex items-center justify-center bg-white/[0.06] text-white/20"><MusicIcon /></div>
              }
              <span className="npb-ring" />
              <span className="npb-eq"><i /><i /><i /><i /></span>
            </div>

            {/* Track info */}
            <div className="npb-txt">
              <div className="npb-ttl">{currentTrack.title}</div>
              <div className="npb-sub"><span>{currentTrack.artist}</span></div>
            </div>

            {/* Like */}
            <LikeButton trackId={currentTrack.id} />

            <div className="npb-sep" />

            {/* Playback controls */}
            <div className="flex items-center gap-0.5">
              <button type="button" className={smBtn(shuffle)} onClick={toggleShuffle} title="Shuffle">
                <ShuffleIcon />
                {shuffle && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: "var(--color-accent)", boxShadow: "0 0 6px var(--color-accent-glow)" }} />
                )}
              </button>
              <button type="button" className={mdBtn} onClick={prevTrack}><SkipBackIcon /></button>
              <button type="button" className="npb-play" onClick={togglePlay}>
                {isPlaying
                  ? <svg width="20" height="20" viewBox="0 0 20 20" fill="white"><rect x="4" y="3" width="4" height="14" rx="1"/><rect x="12" y="3" width="4" height="14" rx="1"/></svg>
                  : <svg width="20" height="20" viewBox="0 0 20 20" fill="white"><path d="M5 3.5l12 6.5-12 6.5V3.5z"/></svg>
                }
              </button>
              <button type="button" className={mdBtn} onClick={nextTrack}><SkipForwardIcon /></button>
              <button type="button" className={smBtn(repeat !== "off")} onClick={cycleRepeat} title={`Repeat: ${repeat}`}>
                {repeat === "one" ? <Repeat1Icon /> : <RepeatIcon />}
              </button>
            </div>

            <div className="npb-sep" />

            {/* Volume + Queue */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className={smBtn(queueOpen)}
                onClick={() => setQueueOpen((v) => !v)}
                title="Queue"
              >
                <QueueIcon />
              </button>
              <button
                type="button"
                onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all cursor-pointer"
              >
                {volume === 0 ? <VolumeXIcon /> : volume < 0.5 ? <Volume1Icon /> : <Volume2Icon />}
              </button>
              <VolumeSlider volume={volume} onChange={setVolume} />
              <span className="text-[10px] tabular-nums text-white/30 w-[28px] text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="npb-lane">
            <TimeDisplay audioRef={audioRef} />
            <ProgressSlider audioRef={audioRef} onSeek={handleSeek} />
          </div>
        </div>
      </div>
    </div>
  );
});