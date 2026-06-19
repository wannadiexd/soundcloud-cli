const AlertIcon = () => <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const RefreshIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;
const HomeIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;

export default function ErrorScreen({
  error,
  onRetry,
  fullscreen = false,
}: {
  error?: Error | null;
  onRetry?: () => void;
  fullscreen?: boolean;
}) {
  const message = error?.message || String(error ?? "");

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden p-6 ${fullscreen ? "h-screen" : "min-h-full"}`}
      style={{ background: fullscreen ? "var(--bg-primary, #08080a)" : undefined }}
    >
      {/* Atmosphere */}
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] left-[12%] w-[55vw] h-[55vw] rounded-full"
          style={{ background: "radial-gradient(circle, var(--color-accent), transparent 62%)", opacity: 0.16, filter: "blur(120px)" }}
        />
        <div className="absolute -bottom-[24%] right-[8%] w-[48vw] h-[48vw] rounded-full"
          style={{ background: "radial-gradient(circle, var(--color-accent), transparent 62%)", opacity: 0.1, filter: "blur(130px)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[460px]">
        <div
          className="relative overflow-hidden rounded-[2rem] p-8 text-center"
          style={{
            border: "0.5px solid rgba(255,255,255,0.1)",
            background: "linear-gradient(168deg, rgba(23,22,28,0.9), rgba(11,10,14,0.95))",
            boxShadow: "0 40px 100px rgba(0,0,0,0.55), 0 0 80px var(--color-accent-glow), inset 0 1px 0 rgba(255,255,255,0.07)",
          }}
        >
          <span aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
          />

          {/* Emblem */}
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            <span aria-hidden className="absolute inset-0 rounded-full animate-ping"
              style={{ background: "var(--color-accent-glow)", animationDuration: "2.4s" }}
            />
            <span
              className="relative flex h-20 w-20 items-center justify-center rounded-[26px]"
              style={{
                color: "var(--color-accent)",
                background: "linear-gradient(150deg, var(--color-accent-glow), rgba(255,255,255,0.04))",
                border: "0.5px solid var(--color-accent-glow)",
                boxShadow: "0 0 30px var(--color-accent-glow), inset 0 1px 0 rgba(255,255,255,0.18)",
              }}
            >
              <AlertIcon />
            </span>
          </div>

          <h1
            className="text-[26px] font-black tracking-tight leading-tight"
            style={{
              backgroundImage: "linear-gradient(100deg, #fff 0%, #fff 40%, var(--color-accent) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Something went wrong
          </h1>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/45">
            A render error occurred. You can try again or reload the app.
          </p>

          {message && (
            <details className="group mt-5 text-left">
              <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.16em] text-white/30 hover:text-white/55 transition-colors">
                <span style={{ color: "var(--color-accent)" }}>▸</span> Details
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded-xl border border-white/[0.06] bg-black/40 p-3 text-[11px] leading-relaxed text-red-300/80 whitespace-pre-wrap break-words">
                {message}
              </pre>
            </details>
          )}

          <div className="mt-7 flex flex-col gap-2.5">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-sm font-bold transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97] cursor-pointer"
                style={{
                  color: "#fff",
                  background: "linear-gradient(180deg, var(--color-accent), var(--color-accent-hover))",
                  boxShadow: "0 12px 34px var(--color-accent-glow), inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
              >
                <RefreshIcon /> Try again
              </button>
            )}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] text-[13px] font-semibold text-white/70 hover:bg-white/[0.08] hover:text-white/90 active:scale-[0.97] cursor-pointer transition-all"
              >
                <RefreshIcon /> Reload
              </button>
              <button
                type="button"
                onClick={() => window.location.assign("/")}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] text-[13px] font-semibold text-white/70 hover:bg-white/[0.08] hover:text-white/90 active:scale-[0.97] cursor-pointer transition-all"
              >
                <HomeIcon /> Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}