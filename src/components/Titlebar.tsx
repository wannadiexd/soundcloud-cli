import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Titlebar() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <div
      className="relative z-50 h-14 flex items-center gap-3 px-3 select-none shrink-0"
      style={{
        background: "rgba(8, 8, 10, 0.95)",
        borderBottom: "0.5px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)" }}
      />

      <div className="flex-1 flex justify-center min-w-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
          }}
          className="relative w-full max-w-[600px]"
        >
          <div
            className="relative flex items-center gap-2.5 h-10 pl-4 pr-2 rounded-full"
            style={{
              background: "linear-gradient(165deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 60%, rgba(255,255,255,0.045) 100%)",
              border: `0.5px solid ${focused ? "rgba(255,85,0,0.6)" : "rgba(255,255,255,0.12)"}`,
              backdropFilter: "blur(24px) saturate(160%)",
              boxShadow: focused
                ? "0 10px 34px rgba(0,0,0,0.4), 0 0 12px rgba(255,85,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)"
                : "0 6px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07)",
              transition: "border-color 300ms ease, box-shadow 400ms ease",
              outline: "none",
            }}
          >
            <div
              className="absolute inset-x-6 top-0 h-px pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }}
            />
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="shrink-0 transition-colors duration-300"
              style={{ color: focused ? "var(--color-accent)" : "rgba(255,255,255,0.45)" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="global-search-input"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                if (e.target.value.trim()) navigate(`/search?q=${encodeURIComponent(e.target.value.trim())}`);
              }}
              onFocus={() => {
                if (blurTimer.current) clearTimeout(blurTimer.current);
                setFocused(true);
              }}
              onBlur={() => {
                blurTimer.current = setTimeout(() => setFocused(false), 150);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") (e.currentTarget as HTMLInputElement).blur();
              }}
              placeholder="Search"
              spellCheck={false}
              className="flex-1 min-w-0 bg-transparent outline-none ring-0 border-none text-[14px] text-white/90 placeholder:text-white/35 select-text"
            />
            {q && (
              <button
                type="button"
                onClick={() => { setQ(""); navigate("/search"); }}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}