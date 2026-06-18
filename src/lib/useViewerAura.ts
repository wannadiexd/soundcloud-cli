import { useMemo } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { type Aura, auraFromHex, DEFAULT_AURA } from './aura';

export function useViewerAura(): Aura {
  const accentColor = useSettingsStore((s) => s.accentColor);
  return useMemo(() => auraFromHex(accentColor) ?? DEFAULT_AURA, [accentColor]);
}