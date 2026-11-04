import { useCallback, useRef, type ReactNode } from 'react';
import { Eye, Image, LayoutGrid, Monitor, RefreshCw, Search, Settings, SquareTerminal, type LucideIcon } from 'lucide-react';
import { WALLPAPERS } from '@/data/theme';
import { useSettings } from '@/context/SettingsContext';
import { useWindowManager } from '@/context/WindowManagerContext';
import { useClickOutside } from '@/hooks/useClickOutside';

/** Right-click menu for the desktop background. */
export default function DesktopContextMenu({ x, y, onClose }: { x: number; y: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => onClose(), [onClose]);
  useClickOutside(ref, true, close);
  const { settings, updateSettings } = useSettings();
  const wm = useWindowManager();

  // Keep the menu on screen.
  const left = Math.min(x, window.innerWidth - 240);
  const top = Math.min(y, window.innerHeight - 340);

  const act = (fn: () => void) => () => {
    fn();
    onClose();
  };

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Desktop menu"
      style={{ left, top }}
      className="glass-strong fixed z-[9700] w-56 animate-fade-in rounded-xl p-1 text-[13px] shadow-2xl"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Item icon={Search} label="Search…" hint="Ctrl Space" onClick={act(wm.openSpotlight)} />
      <Item icon={SquareTerminal} label="Open Terminal" hint="Ctrl Alt T" onClick={act(() => wm.openApp('terminal'))} />
      <Item icon={Eye} label="Show Desktop" onClick={act(wm.minimizeAll)} />
      <Divider />
      <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Wallpaper</p>
      <div className="grid grid-cols-4 gap-1.5 px-2.5 pb-2">
        {WALLPAPERS.map((w) => (
          <button
            key={w.id}
            type="button"
            title={w.name}
            aria-label={`Wallpaper ${w.name}`}
            onClick={act(() => updateSettings({ wallpaper: w.id }))}
            className={`aspect-video rounded ${w.base} ring-2 ${settings.wallpaper === w.id ? 'ring-accent' : 'ring-white/10 hover:ring-white/30'}`}
          />
        ))}
      </div>
      <Item
        icon={LayoutGrid}
        label={settings.showWidgets ? 'Hide Widgets' : 'Show Widgets'}
        onClick={act(() => updateSettings({ showWidgets: !settings.showWidgets }))}
      />
      <Item icon={Image} label="Personalize…" onClick={act(() => wm.openApp('settings'))} />
      <Divider />
      <Item icon={Monitor} label="About This PC" onClick={act(() => wm.openApp('about'))} />
      <Item icon={Settings} label="System Settings" onClick={act(() => wm.openApp('settings'))} />
      <Item icon={RefreshCw} label="Restart…" onClick={act(wm.restart)} />
    </div>
  );
}

function Item({ icon: Icon, label, hint, onClick }: { icon: LucideIcon; label: ReactNode; hint?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-slate-200 hover:bg-accent hover:text-white"
    >
      <Icon className="h-4 w-4 opacity-80" />
      <span className="flex-1">{label}</span>
      {hint && <span className="text-[10px] opacity-60">{hint}</span>}
    </button>
  );
}

function Divider() {
  return <div className="mx-2 my-1 h-px bg-slate-700/60" />;
}
