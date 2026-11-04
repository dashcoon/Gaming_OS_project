import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  CornerDownLeft,
  Download,
  Eye,
  File,
  Folder,
  Gauge,
  Lock,
  Moon,
  Palette,
  Play,
  RotateCw,
  Search,
  type LucideIcon,
} from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import { APP_META, APP_ORDER } from '@/data/apps';
import { FILE_SYSTEM, type FSNode } from '@/data/fileSystem';
import { ACCENTS, WALLPAPERS } from '@/data/theme';
import { useSettings } from '@/context/SettingsContext';
import { useSystem } from '@/context/SystemContext';
import { useWindowManager } from '@/context/WindowManagerContext';
import type { AppMeta } from '@/types/os';

interface Result {
  id: string;
  group: 'Apps' | 'Games' | 'Actions' | 'Files';
  title: string;
  subtitle: string;
  keywords: string;
  icon?: LucideIcon;
  app?: AppMeta;
  cover?: string;
  run: () => void;
}

function allFiles(node: FSNode, path: string[] = []): { node: FSNode; path: string }[] {
  const out: { node: FSNode; path: string }[] = [];
  for (const child of node.children ?? []) {
    const p = [...path, child.name];
    out.push({ node: child, path: p.join('/') });
    out.push(...allFiles(child, p));
  }
  return out;
}

const FILES = allFiles(FILE_SYSTEM);

/** Match score: 0 = no match. Prefix matches rank above substring matches. */
function score(r: Result, q: string): number {
  const title = r.title.toLowerCase();
  if (title.startsWith(q)) return 3;
  if (title.split(/[\s:]+/).some((w) => w.startsWith(q))) return 2;
  if (title.includes(q) || r.keywords.includes(q)) return 1;
  return 0;
}

/** Spotlight-style launcher for apps, games, quick actions and files (Ctrl+Space / Ctrl+K). */
export default function Spotlight({ onClose }: { onClose: () => void }) {
  const wm = useWindowManager();
  const { games, launchGame, installGame, gameStatus } = useSystem();
  const { settings, updateSettings } = useSettings();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo<Result[]>(() => {
    const apps: Result[] = APP_ORDER.map((id) => ({
      id: `app-${id}`,
      group: 'Apps',
      title: APP_META[id].title,
      subtitle: 'Application',
      keywords: [id, ...APP_META[id].aliases].join(' '),
      app: APP_META[id],
      run: () => wm.openApp(id),
    }));

    const gameResults: Result[] = games.map((g) => {
      const status = gameStatus(g.id);
      return {
        id: `game-${g.id}`,
        group: 'Games',
        title: g.title,
        subtitle:
          status === 'running'
            ? 'Running'
            : status === 'installing'
              ? 'Installing…'
              : g.installed
                ? `Play · ${g.genre}`
                : `Install · ${g.sizeGB.toFixed(1)} GB`,
        keywords: `${g.genre} ${g.tags.join(' ')} game`.toLowerCase(),
        icon: g.installed ? Play : Download,
        cover: g.cover,
        run: () => (g.installed ? launchGame(g.id) : (installGame(g.id), wm.openApp('steam'))),
      };
    });

    const nextWallpaper = WALLPAPERS[(WALLPAPERS.findIndex((w) => w.id === settings.wallpaper) + 1) % WALLPAPERS.length];
    const actions: Result[] = [
      {
        id: 'act-perf',
        group: 'Actions',
        title: settings.performanceMode === 'performance' ? 'Switch to Balanced mode' : 'Switch to Performance mode',
        subtitle: 'Power mode',
        keywords: 'performance balanced power fps mode',
        icon: Gauge,
        run: () => updateSettings({ performanceMode: settings.performanceMode === 'performance' ? 'balanced' : 'performance' }),
      },
      {
        id: 'act-dnd',
        group: 'Actions',
        title: settings.doNotDisturb ? 'Turn off Do Not Disturb' : 'Turn on Do Not Disturb',
        subtitle: 'Notifications',
        keywords: 'do not disturb dnd focus notifications silence',
        icon: Moon,
        run: () => updateSettings({ doNotDisturb: !settings.doNotDisturb }),
      },
      {
        id: 'act-wallpaper',
        group: 'Actions',
        title: `Next wallpaper: ${nextWallpaper.name}`,
        subtitle: 'Appearance',
        keywords: 'wallpaper background theme',
        icon: Palette,
        run: () => updateSettings({ wallpaper: nextWallpaper.id }),
      },
      ...ACCENTS.filter((a) => a.id !== settings.accent).map<Result>((a) => ({
        id: `act-accent-${a.id}`,
        group: 'Actions',
        title: `Accent color: ${a.name}`,
        subtitle: 'Appearance',
        keywords: 'accent color theme',
        icon: Palette,
        run: () => updateSettings({ accent: a.id }),
      })),
      {
        id: 'act-desktop',
        group: 'Actions',
        title: 'Show desktop',
        subtitle: 'Minimize all windows',
        keywords: 'show desktop minimize all',
        icon: Eye,
        run: wm.minimizeAll,
      },
      { id: 'act-lock', group: 'Actions', title: 'Lock screen', subtitle: 'Ctrl+Alt+L', keywords: 'lock sign out', icon: Lock, run: wm.lockScreen },
      { id: 'act-restart', group: 'Actions', title: 'Restart', subtitle: 'Close everything and boot again', keywords: 'restart reboot', icon: RotateCw, run: wm.restart },
    ];

    const q = query.trim().toLowerCase();
    if (!q) {
      const installed = new Set(games.filter((g) => g.installed).map((g) => `game-${g.id}`));
      const recent = gameResults.filter((r) => installed.has(r.id)).slice(0, 3);
      return [...apps, ...recent, ...actions.slice(0, 3)];
    }

    const files: Result[] = FILES.filter(({ node }) => node.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map(({ node, path }) => ({
        id: `file-${node.id}`,
        group: 'Files',
        title: node.name,
        subtitle: path,
        keywords: '',
        icon: node.children ? Folder : File,
        run: () => wm.openApp('files'),
      }));

    const ranked = [...apps, ...gameResults, ...actions]
      .map((r) => ({ r, s: score(r, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.r);
    const order: Result['group'][] = ['Apps', 'Games', 'Actions', 'Files'];
    return [...ranked, ...files].sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
  }, [query, games, gameStatus, launchGame, installGame, settings, updateSettings, wm]);

  useEffect(() => setIndex(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  const run = (r: Result | undefined) => {
    if (!r) return;
    r.run();
    onClose();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(results[index]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  let lastGroup = '';

  return (
    <div className="fixed inset-0 z-[9800] flex justify-center bg-black/30 pt-[14vh] backdrop-blur-[2px]" onPointerDown={onClose}>
      <div
        role="dialog"
        aria-label="Search"
        onPointerDown={(e) => e.stopPropagation()}
        className="glass-strong flex h-fit max-h-[60vh] w-[min(640px,calc(100vw-32px))] animate-window-open flex-col overflow-hidden rounded-2xl shadow-[0_30px_80px_-10px_rgba(0,0,0,0.9)] ring-1 ring-accent/20"
      >
        <label className="flex items-center gap-3 border-b border-slate-700/50 px-4">
          <Search className="h-5 w-5 shrink-0 text-accent" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search apps, games, files and actions"
            aria-label="Search"
            spellCheck={false}
            className="h-14 flex-1 bg-transparent text-lg text-white outline-none placeholder:text-slate-500"
          />
          <kbd className="rounded border border-slate-600 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">esc</kbd>
        </label>

        {results.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No results for “{query}”.</p>
        ) : (
          <ul ref={listRef} role="listbox" className="scroll-thin overflow-y-auto p-2">
            {results.map((r, i) => {
              const header = r.group !== lastGroup ? r.group : null;
              lastGroup = r.group;
              const active = i === index;
              const Icon = r.icon;
              return (
                <li key={r.id}>
                  {header && (
                    <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {header}
                    </p>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    data-index={i}
                    onMouseMove={() => setIndex(i)}
                    onClick={() => run(r)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left ${
                      active ? 'bg-accent/90 text-white' : 'text-slate-200'
                    }`}
                  >
                    {r.app ? (
                      <AppIcon app={r.app} size={30} />
                    ) : r.cover ? (
                      <span className={`flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-gradient-to-br ${r.cover}`}>
                        {Icon && <Icon className="h-4 w-4 text-white" />}
                      </span>
                    ) : (
                      <span className={`flex h-[30px] w-[30px] items-center justify-center rounded-lg ${active ? 'bg-white/20' : 'bg-white/5'}`}>
                        {Icon && <Icon className="h-4 w-4" />}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{r.title}</span>
                      <span className={`block truncate text-xs ${active ? 'text-white/75' : 'text-slate-500'}`}>{r.subtitle}</span>
                    </span>
                    {active && <CornerDownLeft className="h-4 w-4 shrink-0 opacity-80" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <footer className="flex items-center gap-4 border-t border-slate-700/50 px-4 py-2 text-[11px] text-slate-500">
          <span>
            <kbd className="font-mono">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="font-mono">↵</kbd> open
          </span>
          <span className="ml-auto">
            <kbd className="font-mono">Ctrl Space</kbd> to search anytime
          </span>
        </footer>
      </div>
    </div>
  );
}
