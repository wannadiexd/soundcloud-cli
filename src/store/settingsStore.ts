import { create } from 'zustand';

export type PerfMode = 'light' | 'medium' | 'beauty';

interface SettingsState {
  accentColor: string;
  perfMode: PerfMode;
  setAccentColor: (color: string) => void;
  setPerfMode: (mode: PerfMode) => void;
}

const STORAGE_KEY = 'sc_settings';

const DEFAULTS = {
  accentColor: '#ff5500',
  perfMode: 'beauty' as PerfMode,
};

function loadSettings(): Pick<SettingsState, 'accentColor' | 'perfMode'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(state: Pick<SettingsState, 'accentColor' | 'perfMode'>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loadSettings(),

  setAccentColor: (accentColor) => {
    set({ accentColor });
    saveSettings({ accentColor, perfMode: get().perfMode });
  },

  setPerfMode: (perfMode) => {
    set({ perfMode });
    saveSettings({ accentColor: get().accentColor, perfMode });
  },
}));