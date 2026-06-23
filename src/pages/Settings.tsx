import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { usePlayerStore } from "../store/playerStore";
import { useSettingsStore, type PerfMode } from "../store/settingsStore";
import { useViewerAura } from "../lib/useViewerAura";
import { auraRgba } from "../lib/aura";

const UserIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const VolumeIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>;
const PaletteIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>;
const LogOutIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const ZapIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;

type CategoryId = "account" | "playback" | "appearance" | "performance";

interface Category {
  id: CategoryId;
  label: string;
  icon: ReactNode;
}

const CATEGORIES: Category[] = [
  { id: "account",     label: "Account",     icon: <UserIcon /> },
  { id: "playback",    label: "Playback",    icon: <VolumeIcon /> },
  { id: "appearance",  label: "Appearance",  icon: <PaletteIcon /> },
  { id: "performance", label: "Performance", icon: <ZapIcon /> },
];

function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col"
      style={{ background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.07)" }}
    >
      {children}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-b-0 last:pb-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-white/85">{label}</p>
        {hint && <p className="text-[11.5px] text-white/35 mt-0.5">{hint}</p>}
      </div>
      {children && <div className="shrink-0 ml-4">{children}</div>}
    </div>
  );
}

function CardTitle({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35 mb-4">{children}</p>
  );
}

function AccountSection() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardTitle>Profile</CardTitle>
        {user ? (
          <div className="flex items-center gap-4">
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-14 h-14 rounded-full object-cover ring-1 ring-white/10 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-white/90 truncate">{user.username}</p>
              <p className="text-[12px] text-white/35 mt-0.5">SoundCloud · #{user.id}</p>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-white/35">Not signed in</p>
        )}
      </Card>

      <Card>
        <CardTitle>Session</CardTitle>
        <Row label="Sign out" hint="You'll need to log in again">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 h-8 rounded-xl text-[12px] font-semibold cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
            style={{
              background: "rgba(255,69,58,0.08)",
              border: "1px solid rgba(255,69,58,0.2)",
              color: "rgba(255,99,88,0.95)",
            }}
          >
            <LogOutIcon /> Sign out
          </button>
        </Row>
      </Card>
    </div>
  );
}

function PlaybackSection() {
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardTitle>Volume</CardTitle>
        <Row label="Default volume" hint="Volume level when the app starts">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-28 cursor-pointer"
              style={{ accentColor: "var(--color-accent)" }}
            />
            <span className="text-[12px] tabular-nums text-white/40 w-[36px] text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </Row>
      </Card>

      <Card>
        <CardTitle>Coming soon</CardTitle>
        <Row label="Crossfade" hint="Smooth transition between tracks" />
        <Row label="Audio quality" hint="Streaming bitrate preference" />
        <Row label="Normalize volume" hint="Equalise loudness across tracks" />
      </Card>
    </div>
  );
}

const ACCENT_PRESETS = [
  { label: "SoundCloud", color: "#ff5500" },
  { label: "Crimson",    color: "#e11d48" },
  { label: "Violet",     color: "#7c3aed" },
  { label: "Ocean",      color: "#0ea5e9" },
  { label: "Forest",     color: "#10b981" },
  { label: "Gold",       color: "#f59e0b" },
  { label: "Rose",       color: "#f43f5e" },
  { label: "Slate",      color: "#64748b" },
];

function AppearanceSection() {
  const accentColor = useSettingsStore((s) => s.accentColor);
  const setAccentColor = useSettingsStore((s) => s.setAccentColor);

  const handleAccentChange = (color: string) => {
    setAccentColor(color);
    document.documentElement.style.setProperty("--color-accent", color);
    document.documentElement.style.setProperty("--color-accent-glow", `${color}55`);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardTitle>Accent colour</CardTitle>
        <div className="flex flex-wrap gap-2.5 mt-1">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.color}
              type="button"
              onClick={() => handleAccentChange(preset.color)}
              className="group flex flex-col items-center gap-1.5 cursor-pointer"
              title={preset.label}
            >
              <span
                className="w-8 h-8 rounded-full transition-all duration-200 group-hover:scale-110"
                style={{
                  background: preset.color,
                  boxShadow: accentColor === preset.color
                    ? `0 0 0 2px rgba(255,255,255,0.9), 0 0 16px ${preset.color}88`
                    : `0 0 0 1px rgba(255,255,255,0.12)`,
                }}
              />
              <span className="text-[9px] text-white/35 font-medium">{preset.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label className="text-[12px] text-white/50">Custom</label>
          <input
            type="color"
            value={accentColor}
            onChange={(e) => handleAccentChange(e.target.value)}
            className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
          />
          <span className="text-[11px] text-white/30 font-mono">{accentColor}</span>
        </div>
      </Card>
    </div>
  );
}

const PERF_MODES: { id: PerfMode; label: string; hint: string }[] = [
  { id: "light",  label: "Light",  hint: "No blur, no bloom — maximum performance" },
  { id: "medium", label: "Medium", hint: "Some blur and glow effects" },
  { id: "beauty", label: "Beauty", hint: "Full effects — blur, bloom, animations" },
];

function PerformanceSection() {
  const perfMode = useSettingsStore((s) => s.perfMode);
  const setPerfMode = useSettingsStore((s) => s.setPerfMode);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardTitle>Render quality</CardTitle>
        <div className="flex flex-col gap-2 mt-1">
          {PERF_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setPerfMode(mode.id)}
              className="flex items-center gap-3 p-3 rounded-xl text-left cursor-pointer transition-all duration-200"
              style={{
                background: perfMode === mode.id
                  ? "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))"
                  : "rgba(255,255,255,0.02)",
                border: perfMode === mode.id
                  ? "0.5px solid rgba(255,255,255,0.14)"
                  : "0.5px solid rgba(255,255,255,0.05)",
              }}
            >
              <span
                className="w-4 h-4 rounded-full shrink-0 transition-all duration-200"
                style={{
                  background: perfMode === mode.id ? "var(--color-accent)" : "rgba(255,255,255,0.1)",
                  boxShadow: perfMode === mode.id ? "0 0 10px var(--color-accent-glow)" : undefined,
                }}
              />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white/85">{mode.label}</p>
                <p className="text-[11px] text-white/35 mt-0.5">{mode.hint}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function Settings() {
  const [active, setActive] = useState<CategoryId>("account");
  const aura = useViewerAura();

  const category = CATEGORIES.find((c) => c.id === active)!;

  const Body =
    active === "account"     ? AccountSection :
    active === "playback"    ? PlaybackSection :
    active === "appearance"  ? AppearanceSection :
    PerformanceSection;

  return (
    <div className="w-full max-w-[1080px] mx-auto px-6 md:px-8 pt-8 pb-32 flex gap-8">
      <div className="w-[200px] shrink-0 flex flex-col gap-1 pt-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25 px-3 mb-3">
          Settings
        </p>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActive(cat.id)}
            className="flex items-center gap-3 px-3 h-9 rounded-xl text-left cursor-pointer transition-all duration-200 text-[13px] font-medium"
            style={
              active === cat.id
                ? {
                    background: `linear-gradient(135deg, ${auraRgba(aura, 0.18)}, ${auraRgba(aura, 0.04)})`,
                    border: `0.5px solid ${auraRgba(aura, 0.3)}`,
                    color: "#fff",
                    boxShadow: `0 4px 16px ${auraRgba(aura, 0.2)}`,
                  }
                : { color: "rgba(255,255,255,0.45)" }
            }
          >
            <span style={{ color: active === cat.id ? "var(--color-accent)" : undefined }}>
              {cat.icon}
            </span>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-0">
        <header className="mb-6 flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${auraRgba(aura, 0.28)}, ${auraRgba(aura, 0.04)})`,
              border: `0.5px solid ${auraRgba(aura, 0.4)}`,
              boxShadow: `0 0 24px ${auraRgba(aura, 0.2)}`,
              color: "var(--color-accent)",
            }}
          >
            {category.icon}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/30 font-bold mb-0.5">Settings</p>
            <h1
              className="text-[26px] font-black tracking-tight leading-none"
              style={{
                backgroundImage: aura.nameGradient,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {category.label}
            </h1>
          </div>
        </header>

        <div key={active} className="flex flex-col gap-4">
          <Body />
        </div>
      </div>
    </div>
  );
}