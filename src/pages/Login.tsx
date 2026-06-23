import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useOAuthFlow } from "../lib/use-oauth-flow";
import { useQueryClient } from "@tanstack/react-query";
import { useViewerAura } from "../lib/useViewerAura";
import { usePerfMode } from "../lib/perf";
import { USER_PAGE_KEYFRAMES } from "../components/user/keyframes";

const AUTH_KEYFRAMES = `
@keyframes auth-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
@keyframes auth-sonar {
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(2.2); opacity: 0; }
}
@keyframes auth-shine {
  0% { transform: translateX(-100%); }
  20%, 100% { transform: translateX(400%); }
}
@keyframes auth-rise {
  from { opacity: 0; transform: translateY(24px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
`;

const AudioLinesIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/>
  </svg>
);
const ChevronRightIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const RefreshIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;
const AlertIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const CopyIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
const CheckIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const GlobeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>;
const DownloadIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

const BrandMark = memo(function BrandMark({ subtitle }: { subtitle: string }) {
  const perf = usePerfMode();
  const aura = useViewerAura();
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="relative w-[84px] h-[84px] mb-6"
        style={{ animation: perf.idleAnim ? "auth-float 6s ease-in-out infinite" : undefined }}
      >
        <div aria-hidden className="absolute -inset-6 rounded-full"
          style={{ background: "radial-gradient(circle, var(--color-accent-glow), transparent 70%)", filter: perf.glow ? "blur(16px)" : undefined }}
        />
        {perf.idleAnim && [0, 1, 2].map((i) => (
          <span key={i} aria-hidden className="absolute inset-0 rounded-[26px]"
            style={{ border: "1px solid var(--color-accent)", opacity: 0, animation: `auth-sonar 3s ease-out ${i}s infinite` }}
          />
        ))}
        <div
          className="relative w-full h-full rounded-[26px] flex items-center justify-center"
          style={{
            background: "linear-gradient(150deg, var(--color-accent), var(--color-accent-hover, #ff7700))",
            boxShadow: "0 14px 44px var(--color-accent-glow), 0 0 30px var(--color-accent-glow), inset 0 1px 0 rgba(255,255,255,0.32)",
            color: "white",
          }}
        >
          <AudioLinesIcon />
        </div>
      </div>
      <h1
        className="text-[32px] font-black tracking-tight leading-none"
        style={{ backgroundImage: aura.nameGradient, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
      >
        SoundCloud
      </h1>
      <p className="text-[13px] text-white/40 mt-2.5 min-h-[18px]">{subtitle}</p>
    </div>
  );
});

function OfflineEntryCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-[22px] border border-white/[0.10] p-[1px] text-left transition-all duration-300 hover:border-white/[0.18] active:scale-[0.985] cursor-pointer"
      style={{
        background: "linear-gradient(140deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 55%, rgba(255,255,255,0.06))",
        boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
        backdropFilter: "blur(40px)",
      }}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[22px]"
        style={{ background: "radial-gradient(ellipse at top left, rgba(255,255,255,0.18), transparent 55%)", opacity: 0.8 }}
      />
      <span aria-hidden className="pointer-events-none absolute -inset-px rounded-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle at top right, rgba(56,189,248,0.18), transparent 55%)" }}
      />
      <span className="relative flex items-center gap-3 rounded-[21px] px-4 py-3.5" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(40px)" }}>
        <span className="relative flex w-11 h-11 shrink-0 items-center justify-center rounded-[16px] border border-white/[0.16]"
          style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 14px rgba(0,0,0,0.25)" }}
        >
          <GlobeIcon />
          <span className="absolute -bottom-1 -right-1 flex w-[18px] h-[18px] items-center justify-center rounded-full border border-white/[0.18]"
            style={{ background: "rgba(52,211,153,0.9)", boxShadow: "0 2px 6px rgba(16,185,129,0.45)", color: "#052e16" }}
          >
            <DownloadIcon />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-semibold tracking-tight text-white/90">Continue offline</span>
          <span className="mt-0.5 block text-[11.5px] leading-snug text-white/45">Browse your cached library</span>
        </span>
        <ChevronRightIcon />
      </span>
    </button>
  );
}

function PrimaryButton({ onClick, idle, children }: { onClick: () => void; idle: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full h-12 overflow-hidden rounded-2xl text-sm font-bold cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
      style={{
        color: "white",
        background: "linear-gradient(180deg, var(--color-accent), var(--color-accent-hover, #ff7700))",
        boxShadow: "0 14px 40px var(--color-accent-glow), inset 0 1px 0 rgba(255,255,255,0.28)",
      }}
    >
      {idle && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-1/3 pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)", animation: "auth-shine 4.5s ease-in-out infinite" }}
        />
      )}
      <span className="relative flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}

const AuthBackdrop = memo(function AuthBackdrop() {
  const perf = usePerfMode();
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute top-[18%] left-[14%] w-[55vw] h-[55vw] rounded-full opacity-[0.14]"
        style={{ background: "radial-gradient(circle, var(--color-accent), transparent 62%)", filter: "blur(120px)" }}
      />
      <div className="absolute bottom-[10%] right-[8%] w-[45vw] h-[45vw] rounded-full opacity-[0.10]"
        style={{ background: "radial-gradient(circle, var(--color-accent), transparent 62%)", filter: "blur(130px)" }}
      />
      {perf.atmosphere && Array.from({ length: 40 }, (_, i) => (
        <div key={i}
          className="absolute rounded-full"
          style={{
            width: i % 3 === 0 ? 2 : 1,
            height: i % 3 === 0 ? 2 : 1,
            top: `${(i * 37 + 11) % 100}%`,
            left: `${(i * 61 + 7) % 100}%`,
            background: "white",
            opacity: 0.06 + (i % 5) * 0.04,
            boxShadow: i % 4 === 0 ? "0 0 4px rgba(255,255,255,0.5)" : undefined,
          }}
        />
      ))}
    </div>
  );
});

export default memo(function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const perf = usePerfMode();
  const [copied, setCopied] = useState(false);

  const onLoginSuccess = async (sessionId: string) => {
    await setSession(sessionId);
    await fetchUser();
    queryClient.invalidateQueries();
    navigate("/home", { replace: true });
  };

  const { startLogin, authUrl, isPolling, step, error } = useOAuthFlow(onLoginSuccess);

  const stepLabel =
    step === "token" ? "Exchanging authorization code…" :
    step === "profile" ? "Extracting account data…" :
    step === "session" ? "Finalizing session…" :
    "Waiting for authorization…";

  const handleLogin = async () => {
    try { await startLogin(); } catch (e) { console.error("Login failed:", e); }
  };

  const handleOffline = () => navigate("/offline", { replace: true });

  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden bg-[rgb(8,8,10)]">
      <style>{USER_PAGE_KEYFRAMES + AUTH_KEYFRAMES}</style>
      <AuthBackdrop />

      <div
        className="relative z-10 w-full max-w-[400px] mx-4"
        style={{ isolation: "isolate", animation: "auth-rise 0.6s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <div
          className="relative overflow-hidden rounded-[2.25rem] px-8 pt-9 pb-7"
          style={{
            border: "0.5px solid rgba(255,255,255,0.1)",
            background: "linear-gradient(165deg, rgba(255,255,255,0.06), rgba(255,255,255,0.018) 60%, rgba(255,255,255,0.035))",
            backdropFilter: "blur(60px) saturate(1.5)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.55), 0 0 80px var(--color-accent-glow), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <span aria-hidden className="absolute inset-x-8 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
          />

          <BrandMark subtitle={isPolling ? "Signing in…" : "Your music, elevated"} />

          <div className="mt-8">
            {error ? (
              <div className="flex flex-col items-stretch gap-4">
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-5 py-5 text-center">
                  <div className="flex w-11 h-11 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10">
                    <AlertIcon />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-white/90">Login failed</p>
                    <p className="mt-1 text-[12px] leading-snug text-white/45 break-words">{error.message}</p>
                  </div>
                </div>
                <PrimaryButton onClick={handleLogin} idle={perf.idleAnim}>
                  <RefreshIcon /> Try again
                </PrimaryButton>
                <OfflineEntryCard onClick={handleOffline} />
              </div>
            ) : isPolling ? (
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="w-10 h-10 rounded-full border-2 border-white/[0.08] border-t-[var(--color-accent)] animate-spin" />
                <p className="text-[12px] text-white/45">{stepLabel}</p>
                {authUrl && (
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(authUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-white/40 hover:text-white/60 transition-all cursor-pointer"
                  >
                    {copied ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy link</>}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-stretch gap-3">
                <PrimaryButton onClick={handleLogin} idle={perf.idleAnim}>
                  Sign in <ChevronRightIcon />
                </PrimaryButton>
                <div className="my-1 flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-white/25">
                  <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1))" }} />
                  or
                  <div className="h-px flex-1" style={{ background: "linear-gradient(270deg, transparent, rgba(255,255,255,0.1))" }} />
                </div>
                <OfflineEntryCard onClick={handleOffline} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});