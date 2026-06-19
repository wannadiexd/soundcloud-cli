import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { usePlayerStore } from "../store/playerStore";

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const VolumeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
  </svg>
);
const LogOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

function SectionHeader({ index, label }: { index: string; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5 pl-1">
      <span className="font-mono text-[10.5px] text-white/25 tabular-nums">{index}</span>
      <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">{label}</span>
      <span className="h-px flex-1 bg-white/[0.05]" />
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
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

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="w-full max-w-[760px] mx-auto px-8 pt-10 pb-32">
      <div className="mb-8">
        <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-white/90">Settings</h2>
        <p className="mt-1 text-[13px] leading-snug text-white/50">Manage your account and app preferences</p>
      </div>

      <div className="flex flex-col gap-8">
        <div>
          <SectionHeader index="01" label="Account" />
          <Card>
            {user ? (
              <div className="flex items-center gap-4">
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-14 h-14 rounded-full object-cover ring-1 ring-white/10"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-white/90 truncate">{user.username}</p>
                  <p className="text-[12px] text-white/40 mt-0.5">SoundCloud account #{user.id}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 h-9 rounded-xl text-[12.5px] font-semibold cursor-pointer transition-all duration-200"
                  style={{
                    background: "rgba(255,69,58,0.08)",
                    border: "1px solid rgba(255,69,58,0.2)",
                    color: "rgba(255,99,88,0.95)",
                  }}
                >
                  <LogOutIcon />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-white/40">
                <UserIcon />
                <span className="text-[13px]">Not signed in</span>
              </div>
            )}
          </Card>
        </div>

        {/* Playback */}
        <div>
          <SectionHeader index="02" label="Playback" />
          <Card>
            <Row label="Default volume" hint="Applied when the app starts">
              <div className="flex items-center gap-3">
                <VolumeIcon />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-32 cursor-pointer"
                  style={{ accentColor: "var(--color-accent)" }}
                />
                <span className="text-[12px] tabular-nums text-white/40 w-[36px] text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </Row>
            <Row label="Crossfade" hint="Coming soon" />
            <Row label="Audio quality" hint="Coming soon" />
          </Card>
        </div>
      </div>
    </div>
  );
}