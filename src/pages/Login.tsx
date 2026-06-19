import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useOAuthFlow } from '../lib/use-oauth-flow';
import { useQueryClient } from '@tanstack/react-query';

export default function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const [copied, setCopied] = useState(false);

  const onLoginSuccess = async (sessionId: string) => {
    await setSession(sessionId);
    await fetchUser();
    queryClient.invalidateQueries();
    navigate('/home', { replace: true });
  };

  const { startLogin, authUrl, isPolling, step, error } = useOAuthFlow(onLoginSuccess);

  const stepLabel =
    step === 'token' ? 'Exchanging authorization code' :
    step === 'profile' ? 'Extracting account data' :
    step === 'session' ? 'Finalizing session' :
    'Waiting for authorization...';

  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden bg-[rgb(8,8,10)]">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(255,85,0,0.3) 0%, transparent 70%)' }}
        />
      </div>

      {Array.from({ length: 24 }, (_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/20"
          style={{
            top: `${(i * 37) % 100}%`,
            left: `${(i * 61) % 100}%`,
            opacity: 0.1 + (i % 5) * 0.1,
          }}
        />
      ))}

      <div
        className="relative z-10 w-full max-w-[400px] mx-4 rounded-[2.25rem] px-10 pt-10 pb-8 text-center animate-fade-in-up"
        style={{
          background: 'linear-gradient(165deg, rgba(255,255,255,0.06), rgba(255,255,255,0.018) 60%, rgba(255,255,255,0.035))',
          border: '0.5px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(60px) saturate(1.5)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 0 80px rgba(255,85,0,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <div
          className="absolute inset-x-8 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
        />

        <div
          className="w-[72px] h-[72px] mx-auto mb-6 rounded-[22px] flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #ff5500, #ff7b3a)',
            boxShadow: '0 12px 40px rgba(255,85,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
          }}
        >
          <img src="/sc.png" alt="SoundCloud" className="w-9 h-9 object-contain brightness-[100]" />
        </div>

        <h1 className="text-[22px] font-bold tracking-[-0.02em] mb-2">
          <span className="text-white">Sound</span>
          <span style={{ color: 'var(--color-accent)' }}>Cloud</span>
        </h1>
        <p className="text-[13px] text-white/45 mb-8">
          {isPolling ? 'Signing in...' : 'Your music, your way'}
        </p>

        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-2xl text-[12.5px] text-left"
            style={{
              background: 'rgba(255,69,58,0.08)',
              border: '1px solid rgba(255,69,58,0.2)',
              color: 'rgba(255,99,88,0.95)',
            }}
          >
            {error.kind === 'unreachable' ? 'Server unreachable. Check your connection.' :
             error.kind === 'expired' ? 'Login expired. Please try again.' :
             error.message}
          </div>
        )}

        {isPolling ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="w-10 h-10 rounded-full border-2 border-white/[0.08] border-t-[#ff5500] animate-spin" />
            <p className="text-[12px] text-white/45">{stepLabel}</p>
            {authUrl && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(authUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-white/40 hover:text-white/60 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy link
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={startLogin}
            className="w-full h-12 rounded-2xl text-[14px] font-bold text-white cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.97] flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(180deg, #ff5500, #ff6a1a)',
              boxShadow: '0 14px 40px rgba(255,85,0,0.35), inset 0 1px 0 rgba(255,255,255,0.28)',
            }}
          >
            Sign in with SoundCloud
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}