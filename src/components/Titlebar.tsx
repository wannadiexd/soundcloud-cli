import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const MinusIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const SquareIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
const XIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const ChevronLeftIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const ChevronRightIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const HomeIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;

async function winAction(action: "minimize" | "toggleMaximize" | "close") {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    await win[action]();
  } catch {}
}

const navCls = "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-20 disabled:cursor-default text-white/45 hover:text-white hover:bg-white/[0.08] active:scale-90";

function WinButton({ onClick, danger, label, children }: {
  onClick: () => void;
  danger?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`w-10 h-9 rounded-lg flex items-center justify-center text-white/30 transition-all duration-150 cursor-pointer ${
        danger ? "hover:text-white hover:bg-red-500/80" : "hover:text-white/80 hover:bg-white/[0.07]"
      }`}
    >
      {children}
    </button>
  );
}

export default function Titlebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canGoBack = location.key !== "default";
  const onHome = location.pathname === "/home";

  return (
    <div
      className="relative z-50 h-14 flex items-center gap-3 px-3 select-none shrink-0"
      data-tauri-drag-region
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.014) 100%)",
        borderBottom: "0.5px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)" }}
      />

      {/* LEFT */}
      <div className="flex items-center gap-2 shrink-0">
        <img
          src="/sc.png"
          alt="SoundCloud"
          draggable={false}
          className="w-8 h-8 rounded-[10px] shrink-0"
          style={{ boxShadow: "0 2px 12px var(--color-accent-glow), inset 0 0 0 0.5px rgba(255,255,255,0.1)" }}
        />
        <button type="button" disabled={!canGoBack} onClick={() => navigate(-1)} className={navCls}>
          <ChevronLeftIcon />
        </button>
        <button type="button" onClick={() => navigate(1)} className={navCls}>
          <ChevronRightIcon />
        </button>
        <button
          type="button"
          onClick={() => navigate("/home")}
          className={onHome ? "w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer active:scale-90" : navCls}
          style={onHome ? {
            color: "#fff",
            background: "linear-gradient(180deg, var(--color-accent-glow), transparent), rgba(255,255,255,0.05)",
            boxShadow: "0 0 16px var(--color-accent-glow), inset 0 0.5px 0 rgba(255,255,255,0.14)",
          } : undefined}
        >
          <HomeIcon />
        </button>
      </div>

      {/* CENTER — search */}
      <div className="flex-1 flex justify-center min-w-0">
        <form
          onSubmit={(e) => { e.preventDefault(); if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`); }}
          className="relative w-full max-w-[560px]"
        >
          <div
            className="relative flex items-center gap-2.5 h-9 pl-4 pr-2 rounded-full"
            style={{
              background: "linear-gradient(165deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 60%, rgba(255,255,255,0.045) 100%)",
              border: `0.5px solid ${focused ? "rgba(255,85,0,0.6)" : "rgba(255,255,255,0.12)"}`,
              backdropFilter: "blur(24px) saturate(160%)",
              boxShadow: focused
                ? "0 10px 34px rgba(0,0,0,0.4), 0 0 12px rgba(255,85,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)"
                : "0 6px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07)",
              transition: "border-color 300ms ease, box-shadow 400ms ease",
            }}
          >
            <div className="absolute inset-x-6 top-0 h-px pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }}
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="shrink-0 transition-colors duration-300"
              style={{ color: focused ? "var(--color-accent)" : "rgba(255,255,255,0.45)" }}
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              id="global-search-input"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                if (e.target.value.trim()) navigate(`/search?q=${encodeURIComponent(e.target.value.trim())}`);
              }}
              onFocus={() => { if (blurTimer.current) clearTimeout(blurTimer.current); setFocused(true); }}
              onBlur={() => { blurTimer.current = setTimeout(() => setFocused(false), 150); }}
              onKeyDown={(e) => { if (e.key === "Escape") (e.currentTarget as HTMLInputElement).blur(); }}
              placeholder="Search"
              spellCheck={false}
              className="flex-1 min-w-0 bg-transparent outline-none ring-0 border-none text-[13px] text-white/90 placeholder:text-white/35 select-text"
            />
            {q && (
              <button type="button" onClick={() => { setQ(""); navigate("/search"); }}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <XIcon />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* RIGHT — window controls */}
      <div className="flex items-center gap-0.5 shrink-0">
        <WinButton onClick={() => winAction("minimize")} label="Minimize"><MinusIcon /></WinButton>
        <WinButton onClick={() => winAction("toggleMaximize")} label="Maximize"><SquareIcon /></WinButton>
        <WinButton onClick={() => winAction("close")} danger label="Close"><XIcon /></WinButton>
      </div>
    </div>
  );
}