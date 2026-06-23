import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE } from './constants';

interface LoginResponse {
  url: string;
  loginRequestId: string;
}

interface LoginStatusResponse {
  status: 'pending' | 'completed' | 'failed' | 'expired';
  step?: 'token' | 'profile' | 'session';
  sessionId?: string;
  username?: string;
  error?: string;
}

async function openUrl(url: string) {
  if ((window as any).__TAURI_INTERNALS__) {
    const { openUrl: tauriOpenUrl } = await import('@tauri-apps/plugin-opener');
    await tauriOpenUrl(url);
  } else {
    window.open(url, '_blank');
  }
}

export type OAuthStep = 'waiting' | 'token' | 'profile' | 'session';
export type OAuthFlowError = {
  kind: 'failed' | 'expired' | 'unreachable';
  message: string;
};

const POLL_INTERVAL_MS = 700;
const UNREACHABLE_AFTER_MS = 15_000;

export function useOAuthFlow(
  onSuccess: (sessionId: string) => void,
  onFailure?: (err: OAuthFlowError) => void,
) {
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [step, setStep] = useState<OAuthStep>('waiting');
  const [error, setError] = useState<OAuthFlowError | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onFailureRef = useRef(onFailure);
  onSuccessRef.current = onSuccess;
  onFailureRef.current = onFailure;

  const cancel = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
    setIsPolling(false);
    setAuthUrl(null);
    setStep('waiting');
  }, []);

  useEffect(() => cancel, [cancel]);

  const fail = useCallback(
    (err: OAuthFlowError) => {
      cancel();
      setError(err);
      onFailureRef.current?.(err);
    },
    [cancel],
  );

  const startLogin = useCallback(async () => {
    cancel();
    setError(null);
    setIsPolling(true);
    setStep('waiting');

    let login: LoginResponse;
    try {
      const res = await fetch(`${API_BASE}/auth/login`);
      if (!res.ok) throw new Error('Backend unreachable');
      login = await res.json();
    } catch (e) {
      fail({
        kind: 'unreachable',
        message: e instanceof Error ? e.message : 'Backend unreachable',
      });
      return;
    }

    const { url, loginRequestId } = login;
    setAuthUrl(url);
    await openUrl(url);

    let failingSince: number | null = null;

    const pollOnce = async () => {
      let data: LoginStatusResponse | null = null;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8_000);
        const res = await fetch(
          `${API_BASE}/auth/login/status?id=${encodeURIComponent(loginRequestId)}`,
          { signal: controller.signal, cache: 'no-store' },
        );
        clearTimeout(timer);
        if (res.ok) data = await res.json();
      } catch {}

      if (!data) {
        const now = Date.now();
        if (failingSince == null) failingSince = now;
        if (now - failingSince >= UNREACHABLE_AFTER_MS) {
          fail({ kind: 'unreachable', message: 'Backend unreachable' });
          return;
        }
        pollRef.current = setTimeout(pollOnce, POLL_INTERVAL_MS);
        return;
      }
      failingSince = null;

      if (data.step) setStep(data.step);

      if (data.status === 'completed' && data.sessionId) {
        cancel();
        onSuccessRef.current(data.sessionId);
        return;
      }
      if (data.status === 'failed' || data.status === 'expired') {
        fail({ kind: data.status, message: data.error ?? 'Login failed' });
        return;
      }
      pollRef.current = setTimeout(pollOnce, POLL_INTERVAL_MS);
    };

    pollRef.current = setTimeout(pollOnce, POLL_INTERVAL_MS);
  }, [cancel, fail]);

  return { startLogin, authUrl, isPolling, step, cancel, error };
}