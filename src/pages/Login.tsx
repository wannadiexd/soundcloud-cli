import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { startLogin, pollLoginStatus, fetchMe } from "../api/auth";

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);
  const [isPolling, setIsPolling] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loginRequestIdRef = useRef<string | null>(null);

  const clearPoll = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
  };

  const poll = async () => {
    if (!loginRequestIdRef.current) return;
    try {
      const data = await pollLoginStatus(loginRequestIdRef.current);
      if (data.step) setStep(data.step);
      if (data.status === "completed" && data.sessionId) {
        clearPoll();
        setSession(data.sessionId);
        const user = await fetchMe(data.sessionId);
        setUser({ id: user.id, username: user.username, avatar: user.avatar_url });
        navigate("/home", { replace: true });
        return;
      }
      if (data.status === "failed" || data.status === "expired") {
        clearPoll();
        setIsPolling(false);
        setError(data.error || "Authentication failed.");
        return;
      }
      pollRef.current = setTimeout(poll, 700);
    } catch {
      pollRef.current = setTimeout(poll, 700);
    }
  };

  const handleLogin = async () => {
    setError(null);
    setIsPolling(true);
    setStep(null);
    try {
      const { url, loginRequestId } = await startLogin();
      loginRequestIdRef.current = loginRequestId;
      window.open(url, "_blank");
      pollRef.current = setTimeout(poll, 700);
    } catch {
      setIsPolling(false);
      setError("Failed to connect to server.");
    }
  };

  useEffect(() => () => clearPoll(), []);

  const steps = [
    { key: "token", label: "Exchanging authorization code" },
    { key: "extract", label: "Extracting account data" },
    { key: "finalizing", label: "Finalizing session" },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden bg-[rgb(8,8,10)]">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(255,85,0,0.3) 0%, transparent 70%)" }}
        />
      </div>

      {/* Stars */}
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/20"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.1,
          }}
        />
      ))}

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[400px] mx-4 rounded-[2.25rem] px-10 pt-10 pb-8 text-center animate-fade-in-up"
        style={{
          background: "linear-gradient(165deg, rgba(255,255,255,0.06), rgba(255,255,255,0.018) 60%, rgba(255,255,255,0.035))",
          border: "0.5px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(60px) saturate(1.5)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.55), 0 0 80px rgba(255,85,0,0.1), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Top sheen */}
        <div className="absolute inset-x-8 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
        />

        {/* Icon */}
        <div className="w-[72px] h-[72px] mx-auto mb-6 rounded-[22px] flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #ff5500, #ff7b3a)",
            boxShadow: "0 12px 40px rgba(255,85,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          <img src="/sc.png" alt="SoundCloud" className="w-9 h-9 object-contain brightness-[100]" />
        </div>

        {/* Title */}
        <h1 className="text-[22px] font-bold tracking-[-0.02em] mb-2">
          <span className="text-white">Sound</span>
          <span style={{ color: "var(--color-accent)" }}>Cloud</span>
        </h1>
        <p className="text-[13px] text-white/45 mb-8">Your music, your way</p>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl text-[12.5px] text-left"
            style={{ background: "rgba(255,69,58,0.08)", border: "1px solid rgba(255,69,58,0.2)", color: "rgba(255,99,88,0.95)" }}
          >
            {error}
          </div>
        )}

        {/* Steps */}
        {isPolling && (
          <div className="flex flex-col gap-2 mb-6 text-left">
            {steps.map((s, i) => {
              const isDone = stepIndex > i;
              const isActive = stepIndex === i;
              return (
                <div
                  key={s.key}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-[12.5px] transition-all duration-300"
                  style={{
                    background: isActive ? "rgba(255,123,58,0.07)" : "rgba(255,255,255,0.03)",
                    border: isActive ? "1px solid rgba(255,123,58,0.18)" : "1px solid rgba(255,255,255,0.05)",
                    color: isActive ? "rgba(255,255,255,0.85)" : isDone ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.3)",
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      background: isDone ? "rgb(52,199,89)" : isActive ? "#ff7b3a" : "rgba(255,255,255,0.15)",
                      boxShadow: isActive ? "0 0 12px rgba(255,123,58,0.65)" : isDone ? "0 0 8px rgba(52,199,89,0.4)" : "none",
                    }}
                  />
                  {s.label}
                </div>
              );
            })}
          </div>
        )}

        {/* Button */}
        {!isPolling ? (
          <button
            onClick={handleLogin}
            className="w-full h-12 rounded-2xl text-[14px] font-bold text-white cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.97] flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(180deg, #ff5500, #ff6a1a)",
              boxShadow: "0 14px 40px rgba(255,85,0,0.35), inset 0 1px 0 rgba(255,255,255,0.28)",
            }}
          >
            Sign in with SoundCloud
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center justify-center gap-3 py-3">
            <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-[#ff5500] animate-spin" />
            <span className="text-[13px] text-white/45">Waiting for authorization...</span>
          </div>
        )}
      </div>
    </div>
  );
}