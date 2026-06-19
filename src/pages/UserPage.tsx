import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUser, getUserTracks, getUserLikes, formatCount, getStreamUrl } from "../api/soundcloud";
import { usePlayerStore } from "../store/playerStore";
import TrackCard from "../components/TrackCard";
import type { Track } from "../store/playerStore";

const ChevronLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path d="M5 3.5l12 6.5-12 6.5V3.5z" />
  </svg>
);

const VerifiedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

type TabId = "tracks" | "likes";

function StatOrb({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[18px] font-black tabular-nums text-white/90">{formatCount(value)}</span>
      <span className="text-[10px] uppercase tracking-[0.16em] text-white/35 font-semibold">{label}</span>
    </div>
  );
}

function TrackRow({ track, queue, index }: { track: Track; queue: Track[]; index: number }) {
  const { setTrack, setQueue, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const navigate = useNavigate();
  const isThisTrack = currentTrack?.id === track.id;
  const isThisPlaying = isThisTrack && isPlaying;

  const handlePlay = () => {
    if (isThisTrack) togglePlay();
    else { setQueue(queue); setTrack(track); }
  };

  return (
    <div
      className="group flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer"
      style={isThisTrack ? { background: "rgba(255,85,0,0.06)" } : undefined}
      onMouseEnter={() => getStreamUrl(track.id).catch(() => {})}
    >
      <span className="w-6 text-center text-[12px] tabular-nums shrink-0"
        style={{ color: isThisTrack ? "var(--color-accent)" : "rgba(255,255,255,0.2)" }}
      >
        {isThisPlaying ? (
          <span className="flex items-center justify-center gap-0.5">
            <i className="block w-0.5 h-3 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
            <i className="block w-0.5 h-4 rounded-full animate-pulse" style={{ background: "var(--color-accent)", animationDelay: "0.2s" }} />
            <i className="block w-0.5 h-2 rounded-full animate-pulse" style={{ background: "var(--color-accent)", animationDelay: "0.4s" }} />
          </span>
        ) : index + 1}
      </span>

      <div className="relative w-10 h-10 shrink-0 rounded-xl overflow-hidden ring-1 ring-white/[0.08]" onClick={handlePlay}>
        {track.artwork ? (
          <img src={track.artwork} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-white/[0.04]" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayIcon />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-medium truncate hover:underline cursor-pointer"
          style={{ color: isThisTrack ? "var(--color-accent)" : "rgba(255,255,255,0.85)" }}
          onClick={() => navigate(`/track/${track.id}`)}
        >
          {track.title}
        </p>
        <p className="text-[11px] text-white/35 truncate mt-0.5">{track.artist}</p>
      </div>

      <span className="text-[11px] text-white/20 tabular-nums shrink-0">
        {formatCount(track.playbackCount)} plays
      </span>
    </div>
  );
}

export default function UserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("tracks");

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUser(id!),
    enabled: !!id,
  });

  const { data: tracks = [] } = useQuery<Track[]>({
    queryKey: ["user-tracks", id],
    queryFn: () => getUserTracks(id!, 50),
    enabled: !!id && activeTab === "tracks",
  });

  const { data: likes = [] } = useQuery<Track[]>({
    queryKey: ["user-likes", id],
    queryFn: () => getUserLikes(id!, 50),
    enabled: !!id && activeTab === "likes",
  });

  const currentQueue = activeTab === "tracks" ? tracks : likes;

  const tabs: { id: TabId; label: string; count: number }[] = user ? [
    { id: "tracks", label: "Tracks", count: user.trackCount },
    { id: "likes", label: "Likes", count: user.likesCount },
  ] : [];

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[var(--color-accent)] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative min-h-full w-full">
      {/* Banner / ambient */}
      {user.banner ? (
        <div className="absolute inset-x-0 top-0 h-[280px] pointer-events-none overflow-hidden">
          <img src={user.banner} alt="" className="w-full h-full object-cover opacity-30" style={{ filter: "blur(2px) saturate(1.3)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,8,10,0.2), rgba(8,8,10,0.95))" }} />
        </div>
      ) : (
        <div className="absolute inset-x-0 top-0 h-[280px] pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, rgba(255,85,0,0.12), transparent 70%)` }}
        />
      )}

      <div className="relative z-10 max-w-[1320px] mx-auto px-4 md:px-8 pt-5 pb-32" style={{ isolation: "isolate" }}>
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/55 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer mb-8"
        >
          <ChevronLeftIcon />
        </button>

        {/* Hero */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-10">
          {/* Avatar */}
          <div
            className="w-28 h-28 md:w-36 md:h-36 rounded-full shrink-0 overflow-hidden ring-4"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 4px rgba(255,255,255,0.08)" }}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/[0.06] flex items-center justify-center text-white/20 text-4xl font-bold">
                {user.username[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white/95">
                {user.username}
              </h1>
              {user.verified && (
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "var(--color-accent)", boxShadow: "0 0 12px rgba(255,85,0,0.4)" }}
                >
                  <VerifiedIcon />
                </span>
              )}
            </div>

            {user.fullName && user.fullName !== user.username && (
              <p className="text-[14px] text-white/45 mb-3">{user.fullName}</p>
            )}

            {(user.city || user.country) && (
              <p className="text-[12px] text-white/30 mb-4">
                📍 {[user.city, user.country].filter(Boolean).join(", ")}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-8 justify-center md:justify-start">
              <StatOrb label="Followers" value={user.followersCount} />
              <StatOrb label="Following" value={user.followingsCount} />
              <StatOrb label="Tracks" value={user.trackCount} />
            </div>
          </div>
        </div>

        {/* Description */}
        {user.description && (
          <div
            className="rounded-2xl p-5 mb-6"
            style={{ background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-[13px] text-white/55 leading-relaxed whitespace-pre-wrap">{user.description}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5 border-b border-white/[0.06] pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="px-4 pb-3 text-[13px] border-b-2 transition-colors cursor-pointer"
              style={{
                borderColor: activeTab === tab.id ? "white" : "transparent",
                color: activeTab === tab.id ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
                fontWeight: activeTab === tab.id ? 600 : 400,
                marginBottom: "-1px",
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 text-[11px] text-white/30 tabular-nums">{formatCount(tab.count)}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          className="rounded-2xl p-3 md:p-4"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "0.5px solid rgba(255,255,255,0.06)",
          }}
        >
          {currentQueue.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-white/25 text-[13px]">
              Nothing here yet
            </div>
          ) : activeTab === "tracks" ? (
            <div className="flex flex-col gap-1">
              {tracks.map((track, i) => (
                <TrackRow key={track.id} track={track} queue={tracks} index={i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
              {likes.map((track) => (
                <TrackCard key={track.id} track={track} queue={likes} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}