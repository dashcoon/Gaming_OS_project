import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import AppIcon from '@/components/AppIcon';
import { APP_META, APP_ORDER } from '@/data/apps';
import { useSettings } from '@/context/SettingsContext';
import type { AppId } from '@/types/os';

interface DesktopIconsProps {
  onLaunch: (id: AppId) => void;
  /** Bumped by the desktop when its background is clicked, to clear the selection. */
  clearToken: number;
}

/** Desktop shortcut grid. Launch mode (single or double click) comes from Settings. */
export default function DesktopIcons({ onLaunch, clearToken }: DesktopIconsProps) {
  const { settings } = useSettings();
  const [selected, setSelected] = useState<AppId | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const single = settings.iconClickMode === 'single';

  useEffect(() => setSelected(null), [clearToken]);

  const onKeyDown = (e: KeyboardEvent, id: AppId, index: number) => {
    if (e.key === 'Enter') onLaunch(id);
    const delta = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (delta) {
      e.preventDefault();
      const next = APP_ORDER[(index + delta + APP_ORDER.length) % APP_ORDER.length];
      setSelected(next);
      listRef.current?.querySelectorAll('button')[APP_ORDER.indexOf(next)]?.focus();
    }
  };

  return (
    <ul
      ref={listRef}
      aria-label="Desktop"
      className="absolute left-3 top-3 grid grid-flow-col grid-rows-[repeat(auto-fill,96px)] gap-1"
      style={{ maxHeight: 'calc(100% - 120px)' }}
      onClick={(e) => e.stopPropagation()}
    >
      {APP_ORDER.map((id, index) => {
        const app = APP_META[id];
        const isSelected = selected === id;
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => (single ? onLaunch(id) : setSelected(id))}
              onDoubleClick={() => !single && onLaunch(id)}
              onKeyDown={(e) => onKeyDown(e, id, index)}
              className={`flex w-[84px] flex-col items-center gap-1.5 rounded-lg p-2 outline-none transition-colors ${
                isSelected ? 'bg-accent/25 ring-1 ring-accent/50' : 'hover:bg-white/10'
              } focus-visible:ring-2 focus-visible:ring-accent`}
            >
              <AppIcon app={app} size={44} />
              <span
                className={`line-clamp-2 rounded px-1 text-center text-[11.5px] font-medium leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)] ${
                  isSelected ? 'bg-accent/70' : ''
                }`}
              >
                {app.title}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
