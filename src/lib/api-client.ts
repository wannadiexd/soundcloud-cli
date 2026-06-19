import { useAuthStore } from '../store/authStore';
import { API_BASE } from './constants';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`API ${status}: ${body}`);
    this.name = 'ApiError';
  }
}

function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 60_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
  timeoutMs?: number,
): Promise<T> {
  const headers = new Headers(options.headers);
  const sessionId = useAuthStore.getState().sessionId;

  if (sessionId) {
    headers.set('x-session-id', sessionId);
  }

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE}${path}`;
  const res = await fetchWithTimeout(url, { ...options, headers }, timeoutMs);

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401) {
      useAuthStore.getState().logout();
    }
    throw new ApiError(res.status, body);
  }

  const ct = res.headers.get('content-type');
  if (ct?.includes('application/json')) {
    return res.json() as Promise<T>;
  }
  return res.text() as unknown as T;
}

export const api = apiRequest;