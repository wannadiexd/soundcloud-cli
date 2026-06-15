import { useEffect, useRef, useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { usePlayerStore } from "../store/playerStore";
import { getStreamUrl, formatDuration } from "../api/soundcloud";

const VolumeXIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
  </svg>
);
const Volume1Icon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/>
  </svg>
);
const Volume2Icon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
  </svg>
);
const SkipBackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
  </svg>
);
const SkipForwardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18l8.5-6L6 6v12zm9-12v12h2V6h-2z"/>
  </svg>
);
const ShuffleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>
  </svg>
);
const RepeatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
  </svg>
);
const RepeatOneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
    <text x="11" y="15" fontSize="8" fontWeight="700" stroke="none" fill="currentColor">1</text>
  </svg>
);

function ProgressSlider({ progress, duration, onSeek }: { progress: number; duration: number; onSeek: (t: number) => void }) {
  return (
    <Slider.Root
      className="relative flex items-center w-full h-5 cursor-pointer group select-none touch-none"
      value={[progress]}
      max={duration || 1}
      step={0.1}
      onValueChange={([v]) => onSeek(v)}
    >
      <Slider.Track className="relative h-[3px] grow rounded-full bg-white/[0.08] group-hover:h-[5px] transition-all duration-150">
        <Slider.Range className="absolute h-full rounded-full" style={{ background: "var(--color-accent)" }} />
      </Slider.Track>
      <Slider.Thumb
        className="block w-3 h-3 rounded-full scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 outline-none"
        style={{ background: "var(--color-accent)", boxShadow: "0 0 10px var(--color-accent-glow)" }}
      />
    </Slider.Root>
  );
}

function VolumeSlider({ volume, onChange }: { volume: number; onChange: (v: number) => void }) {
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
}

const btnClass = "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer hover:bg-white/[0.08] hover:-translate-y-px active:scale-90 text-white/55 hover:text-white";

const btnSmClass = "relative w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer hover:bg-white/[0.08] hover:-translate-y-px active:scale-90 text-white/55 hover:text-white";
const btnSmActiveClass = "relative w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer hover:-translate-y-px active:scale-90";

export default function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    currentTrack, isPlaying, volume, progress, duration, shuffle, repeat,
    togglePlay, setVolume, setProgress, setDuration, nextTrack, prevTrack,
    toggleShuffle, cycleRepeat, onTrackEnded,
  } = usePlayerStore();

  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    getStreamUrl(currentTrack.id).then((url) => {
      if (!audioRef.current) return;
      audioRef.current.src = url;
      audioRef.current.play();
    });
  }, [currentTrack]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play();
    else audioRef.current.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // когда включается "repeat one" и трек уже доиграл — перематываем на 0
  useEffect(() => {
    if (audioRef.current && progress === 0 && isPlaying) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  }, [progress, isPlaying]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
    setDuration(audioRef.current.duration || 0);
  };

  if (!currentTrack) return null;

  return (
    <div className="npb">
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={onTrackEnded} />
      <div className="npb-underglow" />

      <div className="npb-dock" data-playing={isPlaying ? "true" : "false"}>
        <div className="npb-glass" />

        <div className="npb-content">
          <div className="npb-row">
            {/* Artwork */}
            <div className="npb-art">
              <img src={currentTrack.artwork || "/placeholder.png"} alt={currentTrack.title} />
              <div className="npb-eq"><i /><i /><i /><i /></div>
            </div>

            {/* Track info */}
            <div className="npb-txt">
              <div className="npb-ttl">{currentTrack.title}</div>
              <div className="npb-sub"><span>{currentTrack.artist}</span></div>
            </div>

            <div className="npb-sep" />

            {/* Playback controls */}
            <div className="flex items-center gap-0.5">
              <button
                className={shuffle ? btnSmActiveClass : btnSmClass}
                style={shuffle ? { color: "var(--color-accent)" } : undefined}
                onClick={toggleShuffle}
                title="Shuffle"
              >
                <ShuffleIcon />
                {shuffle && (
                  <span
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: "var(--color-accent)", boxShadow: "0 0 6px var(--color-accent-glow)" }}
                  />
                )}
              </button>
              <button className={btnClass} onClick={prevTrack}><SkipBackIcon /></button>
              <button className="npb-play" onClick={togglePlay}>
                {isPlaying ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                    <rect x="4" y="3" width="4" height="14" rx="1" />
                    <rect x="12" y="3" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                    <path d="M5 3.5l12 6.5-12 6.5V3.5z" />
                  </svg>
                )}
              </button>
              <button className={btnClass} onClick={nextTrack}><SkipForwardIcon /></button>
              <button
                className={repeat !== "off" ? btnSmActiveClass : btnSmClass}
                style={repeat !== "off" ? { color: "var(--color-accent)" } : undefined}
                onClick={cycleRepeat}
                title={`Repeat: ${repeat}`}
              >
                {repeat === "one" ? <RepeatOneIcon /> : <RepeatIcon />}
                {repeat !== "off" && (
                  <span
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: "var(--color-accent)", boxShadow: "0 0 6px var(--color-accent-glow)" }}
                  />
                )}
              </button>
            </div>

            <div className="npb-sep" />

            {/* Volume */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all cursor-pointer"
              >
                {volume === 0 ? <VolumeXIcon /> : volume < 0.5 ? <Volume1Icon /> : <Volume2Icon />}
              </button>
              <VolumeSlider volume={volume} onChange={setVolume} />
              <span className="text-[10px] tabular-nums text-white/30 w-[34px] text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="npb-lane">
            <div className="npb-times">
              <b>{formatDuration(progress * 1000)}</b>
              <span>{formatDuration(duration * 1000)}</span>
            </div>
            <ProgressSlider
              progress={progress}
              duration={duration}
              onSeek={(t) => {
                if (audioRef.current) audioRef.current.currentTime = t;
                setProgress(t);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}