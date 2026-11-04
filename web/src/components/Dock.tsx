import { useState } from 'react';
import AppIcon from '@/components/AppIcon';
import { APP_META, APP_ORDER } from '@/data/apps';
import type { AppId, WindowState } from '@/types/os';

interface DockProps {
  windows: WindowState[];
  activeId: AppId | null;
  /** Apps currently playing their launch bounce. */
  bouncing: Set<AppId>;
  onAppClick: (id: AppId) => void;
}

const BASE = 48;

/** Centered floating macOS-style dock with magnification, tooltips and open-app indicators. */
export default function Dock({ windows, activeId, bouncing, onAppClick }: DockProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const scaleFor = (index: number) => {
    if (hovered === null) return 1;
    const distance = Math.abs(index - hovered);
    return distance === 0 ? 1.35 : distance === 1 ? 1.15 : distance === 2 ? 1.05 : 1;
  };

  return (
    <nav
      aria-label="Dock"
      className="pointer-events-none fixed inset-x-0 bottom-3 z-[9000] flex justify-center"
    >
      <ul
        onMouseLeave={() => setHovered(null)}
        className="glass pointer-events-auto flex items-end gap-2 rounded-2xl px-3 pb-2 pt-2 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)]"
      >
        {APP_ORDER.map((id, index) => {
          const app = APP_META[id];
          const win = windows.find((w) => w.id === id);
          const scale = scaleFor(index);
          const isActive = activeId === id;
          const hasDivider = id === 'settings';
          return (
            <li key={id} className="flex items-end">
              {hasDivider && <span className="mx-1 mb-1 h-10 w-px self-center bg-slate-600/60" aria-hidden />}
              <button
                type="button"
                aria-label={app.title}
                onMouseEnter={() => setHovered(index)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                onClick={() => onAppClick(id)}
                className="group relative flex flex-col items-center outline-none"
              >
                {/* Tooltip */}
                <span
                  className={`glass-strong pointer-events-none absolute -top-11 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium text-slate-100 transition-all duration-150 ${
                    hovered === index ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
                  }`}
                >
                  {app.title}
                </span>
                <span
                  className={`block origin-bottom transition-transform duration-150 ease-out ${
                    bouncing.has(id) ? 'animate-dock-bounce' : ''
                  }`}
                  style={{ transform: `scale(${scale})`, marginLeft: (scale - 1) * 10, marginRight: (scale - 1) * 10 }}
                >
                  <span
                    className={`block rounded-[22%] transition-shadow ${isActive ? 'accent-glow' : ''} group-focus-visible:ring-2 group-focus-visible:ring-accent`}
                  >
                    <AppIcon app={app} size={BASE} />
                  </span>
                </span>
                {/* Open indicator */}
                <span
                  className={`mt-1 h-1 rounded-full transition-all ${
                    win ? (win.isMinimized ? 'w-1 bg-slate-400' : 'w-3 bg-accent shadow-[0_0_8px_rgb(var(--accent))]') : 'w-1 bg-transparent'
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
