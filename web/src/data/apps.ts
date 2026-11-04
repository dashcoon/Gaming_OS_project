import { Compass, FolderOpen, Gamepad2, Info, Settings, SquareTerminal } from 'lucide-react';
import type { AppId, AppMeta } from '@/types/os';

/**
 * App metadata without components, so any module (e.g. the terminal's `launch`
 * command) can reference apps without importing every app component.
 */
export const APP_META: Record<AppId, AppMeta> = {
  steam: {
    id: 'steam',
    title: 'Steam',
    icon: Gamepad2,
    tile: 'from-sky-700 via-blue-900 to-slate-900',
    aliases: ['games', 'library'],
    defaultSize: { width: 1040, height: 660 },
    minSize: { width: 640, height: 420 },
  },
  firefox: {
    id: 'firefox',
    title: 'Firefox',
    icon: Compass,
    tile: 'from-orange-500 via-rose-500 to-purple-600',
    aliases: ['browser', 'web'],
    defaultSize: { width: 1000, height: 640 },
    minSize: { width: 520, height: 360 },
  },
  terminal: {
    id: 'terminal',
    title: 'Terminal',
    icon: SquareTerminal,
    tile: 'from-slate-800 via-slate-900 to-black',
    aliases: ['term', 'shell', 'console'],
    defaultSize: { width: 760, height: 480 },
    minSize: { width: 420, height: 260 },
  },
  files: {
    id: 'files',
    title: 'File Explorer',
    icon: FolderOpen,
    tile: 'from-amber-400 via-yellow-500 to-orange-500',
    aliases: ['explorer', 'finder', 'fileexplorer'],
    defaultSize: { width: 900, height: 560 },
    minSize: { width: 560, height: 340 },
  },
  settings: {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    tile: 'from-zinc-500 via-slate-600 to-slate-800',
    aliases: ['preferences', 'config'],
    defaultSize: { width: 820, height: 560 },
    minSize: { width: 560, height: 380 },
  },
  about: {
    id: 'about',
    title: 'About This PC',
    icon: Info,
    tile: 'from-accent via-accent-2 to-slate-900',
    aliases: ['system', 'specs', 'info'],
    defaultSize: { width: 620, height: 480 },
    minSize: { width: 480, height: 380 },
  },
};

export const APP_ORDER: AppId[] = ['steam', 'firefox', 'terminal', 'files', 'settings', 'about'];

/** Resolves user input ("firefox", "browser", "File Explorer") to an app id. */
export function resolveAppId(input: string): AppId | null {
  const needle = input.toLowerCase().replace(/[\s_-]/g, '');
  for (const id of APP_ORDER) {
    const meta = APP_META[id];
    const names = [id, meta.title, ...meta.aliases].map((n) => n.toLowerCase().replace(/[\s_-]/g, ''));
    if (names.includes(needle)) return id;
  }
  return null;
}
