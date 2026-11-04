import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ACCENTS } from '@/data/theme';
import type { Settings } from '@/types/settings';

const STORAGE_KEY = 'gamingos.settings.v1';

export const DEFAULT_SETTINGS: Settings = {
  wallpaper: 'nebula',
  accent: 'cyberpunk-purple',
  animatedWallpaper: true,
  performanceMode: 'balanced',
  showFpsOverlay: true,
  iconClickMode: 'double',
  showWidgets: true,
  bootAnimation: true,
  masterVolume: 72,
  gameVolume: 85,
  chatVolume: 60,
  muted: false,
  spatialAudio: true,
  wifiEnabled: true,
  bluetoothEnabled: true,
  doNotDisturb: false,
  nightLight: false,
  brightness: 100,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage unavailable (private mode); settings stay in memory.
    }
  }, [settings]);

  // Accent colors live in CSS variables so every `accent` Tailwind class updates at once.
  useEffect(() => {
    const accent = ACCENTS.find((a) => a.id === settings.accent) ?? ACCENTS[0];
    const root = document.documentElement;
    root.style.setProperty('--accent', accent.rgb);
    root.style.setProperty('--accent-2', accent.rgb2);
  }, [settings.accent]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetSettings = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const value = useMemo(
    () => ({ settings, updateSettings, resetSettings }),
    [settings, updateSettings, resetSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
