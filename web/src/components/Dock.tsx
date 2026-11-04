import { useState, type ReactNode } from 'react';
import { LayoutGrid } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import { APP_META, APP_ORDER } from '@/data/apps';
import { useSystem } from '@/context/SystemContext';
import type { AppId, WindowState } from '@/types/os';

interface DockProps {
  windows: WindowState[];
  activeId: AppId | null;
  /** Apps currently playing their launch bounce. */
  bouncing: Set<AppId>;
  onAppClick: (id: AppId) => void;
  onLauncherClick: () => void;
}

const BASE = 48;

/**
 * Centered floating macOS-style dock: launcher, apps with magnification, tooltips and
 * open/minimized indicators, plus a tile for the game that is running.
 */
export default function Dock({ windows, activeId, bouncing, onAppClick, onLauncherClick }: DockProps) {
  const { running, games } = useSystem();
  const [hovered, setHovered] = useState<number | null>(null);
  const runningGame = running ? games.find((g) => g.id === running.gameId) : undefined;

  const scaleFor = (index: number) => {
    if (hovered === null) return 1;
    const distance = Math.abs(index - hovered);
    return distance === 0 ? 1.35 : distance === 1 ? 1.15 : distance === 2 ? 1.05 : 1;
  };

  const item = (index: number, label: string, onClick: () => void, tile: ReactNode, indicator: ReactNode, bounce = false) => {
    const scale = scaleFor(index);
    return (
      <button
        type="button"
        aria-label={label}
        onMouseEnter={() => setHovered(index)}
        onFocus={() => setHovered(index)}
        onBlur={() => setHovered(null)}
        onClick={onClick}
        className="group relative flex flex-col items-center outline-none"
      >
        <span
          className={`popover pointer-events-none absolute -top-11 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium text-slate-100 transition-all duration-150 ${
            hovered === index ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
          }`}
        >
          {label}
        </span>
        <span
          className={`block origin-bottom transition-transform duration-150 ease-out ${bounce ? 'animate-dock-bounce' : ''}`}
          style={{ transform: `scale(${scale})`, marginLeft: (scale - 1) * 10, marginRight: (scale - 1) * 10 }}
        >
          <span className="block rounded-[22%] group-focus-visible:ring-2 group-focus-visible:ring-accent">{tile}</span>
        </span>
        {indicator}
      </button>
    );
  };

  const emptyIndicator = <span className="mt-1 h-1 w-1" />;

  return (
    <nav aria-label="Dock" className="pointer-events-none fixed inset-x-0 bottom-3 z-[9000] flex justify-center">
      <ul
        onMouseLeave={() => setHovered(null)}
        className="glass pointer-events-auto flex items-end gap-2 rounded-2xl px-3 pb-2 pt-2 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)]"
      >
        <li className="flex items-end">
          {item(
            0,
            'Search & Launch',
            onLauncherClick,
            <span
              className="flex items-center justify-center rounded-[22%] bg-gradient-to-br from-accent via-accent-2 to-slate-900 shadow-lg ring-1 ring-white/15"
              style={{ width: BASE, height: BASE }}
            >
              <LayoutGrid className="h-6 w-6 text-white" />
            </span>,
            emptyIndicator,
          )}
          <span className="mx-1 mb-1 h-10 w-px self-center bg-slate-600/60" aria-hidden />
        </li>

        {APP_ORDER.map((id, i) => {
          const app = APP_META[id];
          const win = windows.find((w) => w.id === id);
          const isActive = activeId === id;
          return (
            <li key={id} className="flex items-end">
              {id === 'settings' && <span className="mx-1 mb-1 h-10 w-px self-center bg-slate-600/60" aria-hidden />}
              {item(
                i + 1,
                app.title,
                () => onAppClick(id),
                <span className={`block rounded-[22%] transition-shadow ${isActive ? 'accent-glow' : ''}`}>
                  <AppIcon app={app} size={BASE} />
                </span>,
                <span
                  className={`mt-1 h-1 rounded-full transition-all ${
                    win
                      ? win.isMinimized
                        ? 'w-1 bg-slate-400'
                        : 'w-3 bg-accent shadow-[0_0_8px_rgb(var(--accent))]'
                      : 'w-1 bg-transparent'
                  }`}
                />,
                bouncing.has(id),
              )}
            </li>
          );
        })}

        {runningGame && (
          <li className="flex animate-fade-in items-end">
            <span className="mx-1 mb-1 h-10 w-px self-center bg-slate-600/60" aria-hidden />
            {item(
              APP_ORDER.length + 1,
              `${running?.status === 'launching' ? 'Launching' : 'Playing'} ${runningGame.title}`,
              () => onAppClick('steam'),
              <span
                className={`relative flex items-center justify-center rounded-[22%] bg-gradient-to-br ${runningGame.cover} shadow-lg ring-2 ring-accent/70`}
                style={{ width: BASE, height: BASE }}
              >
                <runningGame.icon className={`h-6 w-6 text-white ${running?.status === 'launching' ? 'animate-pulse' : ''}`} />
              </span>,
              <span className="mt-1 h-1 w-3 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgb(52_211_153)]" />,
            )}
          </li>
        )}
      </ul>
    </nav>
  );
}
