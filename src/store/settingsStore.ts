import { create } from "zustand";

export type PerfMode = "light" | "medium" | "beauty";
export type ThemePreset = "soundcloud" | "dark" | "neon" | "forest" | "crimson" | "custom";

interface SettingsState {
  accentColor: string;
  perfMode: PerfMode;
  themePreset: ThemePreset;
  floatingComments: boolean;
  normalizeVolume: boolean;
  setAccentColor: (color: string) => void;
  setPerfMode: (mode: PerfMode) => void;
  setThemePreset: (preset: ThemePreset) => void;
  setFloatingComments: (v: boolean) => void;
  setNormalizeVolume: (v: boolean) => void;
  resetTheme: () => void;
}

const STORAGE_KEY = "sc_settings";

const DEFAULTS = {
  accentColor: "#ff5500",
  perfMode: "beauty" as PerfMode,
  themePreset: "soundcloud" as ThemePreset,
  floatingComments: false,
  normalizeVolume: false,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(state: Omit<SettingsState, keyof { setAccentColor: any; setPerfMode: any; setThemePreset: any; setFloatingComments: any; setNormalizeVolume: any; resetTheme: any }>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...load(),

  setAccentColor: (accentColor) => {
    set({ accentColor });
    document.documentElement.style.setProperty("--color-accent", accentColor);
    document.documentElement.style.setProperty("--color-accent-glow", `${accentColor}55`);
    const s = get(); save({ accentColor, perfMode: s.perfMode, themePreset: s.themePreset, floatingComments: s.floatingComments, normalizeVolume: s.normalizeVolume });
  },

  setPerfMode: (perfMode) => {
    set({ perfMode });
    const s = get(); save({ accentColor: s.accentColor, perfMode, themePreset: s.themePreset, floatingComments: s.floatingComments, normalizeVolume: s.normalizeVolume });
  },

  setThemePreset: (themePreset) => {
    set({ themePreset });
    const s = get(); save({ accentColor: s.accentColor, perfMode: s.perfMode, themePreset, floatingComments: s.floatingComments, normalizeVolume: s.normalizeVolume });
  },

  setFloatingComments: (floatingComments) => {
    set({ floatingComments });
    const s = get(); save({ accentColor: s.accentColor, perfMode: s.perfMode, themePreset: s.themePreset, floatingComments, normalizeVolume: s.normalizeVolume });
  },

  setNormalizeVolume: (normalizeVolume) => {
    set({ normalizeVolume });
    const s = get(); save({ accentColor: s.accentColor, perfMode: s.perfMode, themePreset: s.themePreset, floatingComments: s.floatingComments, normalizeVolume });
  },

  resetTheme: () => {
    const accentColor = "#ff5500";
    set({ accentColor, themePreset: "soundcloud" });
    document.documentElement.style.setProperty("--color-accent", accentColor);
    document.documentElement.style.setProperty("--color-accent-glow", `${accentColor}55`);
    const s = get(); save({ accentColor, perfMode: s.perfMode, themePreset: "soundcloud", floatingComments: s.floatingComments, normalizeVolume: s.normalizeVolume });
  },
}));  