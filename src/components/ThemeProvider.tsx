import { useEffect } from "react";
import { useSettingsStore } from "../store/settingsStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const accentColor = useSettingsStore((s) => s.accentColor);

  useEffect(() => {
    document.documentElement.style.setProperty("--color-accent", accentColor);
    document.documentElement.style.setProperty("--color-accent-glow", `${accentColor}55`);
    document.documentElement.style.setProperty("--color-accent-hover", accentColor + "dd");
    document.documentElement.style.setProperty("--color-accent-selection", accentColor + "4d");
  }, [accentColor]);

  return <>{children}</>;
}