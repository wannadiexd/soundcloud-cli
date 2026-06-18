import { useSettingsStore } from '../store/settingsStore';

export type PerfMode = 'light' | 'medium' | 'beauty';

export const PERF_MODES: PerfMode[] = ['light', 'medium', 'beauty'];

export interface PerfProfile {
  mode: PerfMode;
  blur: (beautyPx: number) => number;
  particles: (beautyCount: number) => number;
  idleAnim: boolean;
  atmosphere: boolean;
  glow: boolean;
  bloom: boolean;
}

const PROFILES: Record<PerfMode, Omit<PerfProfile, 'mode'>> = {
  beauty: {
    blur: (px) => px,
    particles: (n) => n,
    idleAnim: true,
    atmosphere: true,
    glow: true,
    bloom: true,
  },
  medium: {
    blur: (px) => Math.round(px * 0.5),
    particles: (n) => Math.ceil(n * 0.45),
    idleAnim: true,
    atmosphere: true,
    glow: false,
    bloom: true,
  },
  light: {
    blur: () => 0,
    particles: () => 0,
    idleAnim: false,
    atmosphere: false,
    glow: false,
    bloom: false,
  },
};

const PROFILE_CACHE: Record<PerfMode, PerfProfile> = {
  light: { mode: 'light', ...PROFILES.light },
  medium: { mode: 'medium', ...PROFILES.medium },
  beauty: { mode: 'beauty', ...PROFILES.beauty },
};

export function getPerfProfile(mode: PerfMode): PerfProfile {
  return PROFILE_CACHE[mode] ?? PROFILE_CACHE.beauty;
}

export function usePerfMode(): PerfProfile {
  return useSettingsStore((s) => getPerfProfile(s.perfMode));
}

let visibilityGateInstalled = false;

export function setupVisibilityGate(): void {
  if (visibilityGateInstalled || typeof document === 'undefined') return;
  visibilityGateInstalled = true;
  const apply = () => {
    if (document.visibilityState === 'hidden') {
      document.documentElement.setAttribute('data-app-hidden', '1');
    } else {
      document.documentElement.removeAttribute('data-app-hidden');
    }
  };
  apply();
  document.addEventListener('visibilitychange', apply);
}