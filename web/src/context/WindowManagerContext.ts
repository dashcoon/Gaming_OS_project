import { createContext, useContext } from 'react';
import type { AppId, WindowState } from '@/types/os';

export interface WindowManagerValue {
  windows: WindowState[];
  activeId: AppId | null;
  openApp: (id: AppId) => void;
  closeApp: (id: AppId) => void;
  minimizeApp: (id: AppId) => void;
  focusApp: (id: AppId) => void;
  toggleMaximize: (id: AppId) => void;
  minimizeAll: () => void;
  closeAll: () => void;
}

/** Provided by <Desktop />, which owns the window manager state. */
export const WindowManagerContext = createContext<WindowManagerValue | null>(null);

export function useWindowManager(): WindowManagerValue {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error('useWindowManager must be used inside <Desktop />');
  return ctx;
}
