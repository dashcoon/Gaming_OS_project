import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Cpu,
  Gamepad2,
  MemoryStick,
  MonitorPlay,
  Thermometer,
  Volume1,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { APP_META } from '@/data/apps';
import { useSettings } from '@/context/SettingsContext';
import { TOTAL_RAM_GB, useSystem } from '@/context/SystemContext';
import { useWindowManager } from '@/context/WindowManagerContext';
import { useBattery, useOnline } from '@/hooks/useBattery';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useClock } from '@/hooks/useClock';

type MenuId = 'logo' | 'stats' | 'volume' | null;

function meterColor(value: number) {
  if (value >= 85) return 'bg-rose-500';
  if (value >= 60) return 'bg-amber-400';
  return 'bg-accent';
}

function StatChip({ icon: Icon, label, value }: { icon: typeof Cpu; label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5" title={`${label} ${Math.round(value)}%`}>
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      <span className="hidden text-[11px] text-slate-400 lg:inline">{label}</span>
      <span className="relative h-1.5 w-8 overflow-hidden rounded-full bg-slate-700/70">
        <span
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${meterColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="w-7 text-right font-mono text-[11px] tabular-nums text-slate-200">{Math.round(value)}%</span>
    </span>
  );
}

/** Top status bar: system menu + active app on the left, live stats and indicators on the right. */
export default function TopBar() {
  const { windows, activeId, openApp, minimizeAll, closeAll } = useWindowManager();
  const { stats, running, games, stopGame } = useSystem();
  const { settings, updateSettings } = useSettings();
  const battery = useBattery();
  const online = useOnline();
  const now = useClock();
  const [menu, setMenu] = useState<MenuId>(null);
  const barRef = useRef<HTMLElement>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  useClickOutside(barRef, menu !== null, closeMenu);

  const toggle = (id: MenuId) => setMenu((m) => (m === id ? null : id));
  const activeTitle = activeId ? APP_META[activeId].title : 'Desktop';
  const runningGame = running ? games.find((g) => g.id === running.gameId) : undefined;

  const volume = settings.muted ? 0 : settings.masterVolume;
  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
  const BatteryIcon = battery.charging
    ? BatteryCharging
    : battery.level > 0.7
      ? BatteryFull
      : battery.level > 0.3
        ? BatteryMedium
        : BatteryLow;

  const item = 'rounded px-2 py-0.5 transition-colors hover:bg-white/10';

  return (
    <header
      ref={barRef}
      className="glass-strong fixed inset-x-0 top-0 z-[9500] flex h-8 select-none items-center justify-between border-x-0 border-t-0 px-2 text-[13px] text-slate-200"
    >
      {/* Left: system menu + active app */}
      <div className="flex min-w-0 items-center gap-1">
        <div className="relative">
          <button type="button" onClick={() => toggle('logo')} className={`${item} flex items-center gap-1.5 font-bold`}>
            <Gamepad2 className="h-4 w-4 text-accent drop-shadow-[0_0_6px_rgb(var(--accent))]" />
            <span className="hidden sm:inline">GamingOS</span>
          </button>
          {menu === 'logo' && (
            <Menu>
              <MenuItem
                onClick={() => {
                  openApp('about');
                  closeMenu();
                }}
              >
                About This PC
              </MenuItem>
              <MenuItem
                onClick={() => {
                  openApp('settings');
                  closeMenu();
                }}
              >
                System Settings…
              </MenuItem>
              <MenuDivider />
              <MenuItem
                disabled={windows.length === 0}
                onClick={() => {
                  minimizeAll();
                  closeMenu();
                }}
              >
                Show Desktop
              </MenuItem>
              <MenuItem
                disabled={windows.length === 0}
                onClick={() => {
                  closeAll();
                  closeMenu();
                }}
              >
                Close All Windows
              </MenuItem>
              <MenuDivider />
              <MenuItem
                onClick={() => {
                  window.location.reload();
                }}
              >
                Restart…
              </MenuItem>
            </Menu>
          )}
        </div>
        <span className="truncate px-2 font-semibold">{activeTitle}</span>
        {runningGame && (
          <span className="ml-1 hidden items-center gap-1.5 rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-medium text-accent md:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            {running?.status === 'launching' ? 'Launching' : 'Playing'} {runningGame.title}
          </span>
        )}
      </div>

      {/* Right: stats + indicators */}
      <div className="flex items-center gap-1">
        <div className="relative">
          <button type="button" onClick={() => toggle('stats')} className={`${item} flex items-center gap-3`}>
            <StatChip icon={Cpu} label="CPU" value={stats.cpu} />
            <span className="hidden sm:contents">
              <StatChip icon={MonitorPlay} label="GPU" value={stats.gpu} />
            </span>
            <span className="hidden md:contents">
              <StatChip icon={MemoryStick} label="RAM" value={stats.ram} />
            </span>
          </button>
          {menu === 'stats' && (
            <Menu align="right" width="w-72">
              <div className="space-y-3 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Performance</p>
                <StatRow label="CPU" detail={`${stats.cpuTemp}°C`} value={stats.cpu} />
                <StatRow label="GPU" detail={`${stats.gpuTemp}°C`} value={stats.gpu} />
                <StatRow
                  label="Memory"
                  detail={`${((stats.ram / 100) * TOTAL_RAM_GB).toFixed(1)} / ${TOTAL_RAM_GB} GB`}
                  value={stats.ram}
                />
                <div className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1.5 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Thermometer className="h-3.5 w-3.5" /> Mode
                  </span>
                  <span className="font-medium capitalize text-slate-200">{settings.performanceMode.replace('-', ' ')}</span>
                </div>
                {runningGame && (
                  <div className="flex items-center justify-between rounded-md bg-accent/15 px-2 py-1.5 text-xs">
                    <span className="truncate text-slate-200">{runningGame.title}</span>
                    <button type="button" onClick={stopGame} className="font-semibold text-rose-300 hover:text-rose-200">
                      Quit game
                    </button>
                  </div>
                )}
              </div>
            </Menu>
          )}
        </div>

        <span className={`${item} hidden sm:block`} title={online ? 'Connected' : 'Offline'}>
          {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4 text-rose-400" />}
        </span>

        <div className="relative">
          <button type="button" onClick={() => toggle('volume')} className={item} aria-label="Volume">
            <VolumeIcon className="h-4 w-4" />
          </button>
          {menu === 'volume' && (
            <Menu align="right" width="w-60">
              <div className="space-y-2 p-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Sound</span>
                  <span className="font-mono">{volume}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateSettings({ muted: !settings.muted })}
                    className="rounded p-1 hover:bg-white/10"
                    aria-label={settings.muted ? 'Unmute' : 'Mute'}
                  >
                    <VolumeIcon className="h-4 w-4" />
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.masterVolume}
                    onChange={(e) => updateSettings({ masterVolume: Number(e.target.value), muted: false })}
                    className="w-full"
                    aria-label="Master volume"
                  />
                </div>
              </div>
            </Menu>
          )}
        </div>

        <span
          className={`${item} flex items-center gap-1`}
          title={battery.supported ? `Battery ${Math.round(battery.level * 100)}%` : 'AC power'}
        >
          <BatteryIcon className="h-4 w-4" />
          <span className="hidden font-mono text-[11px] sm:inline">{Math.round(battery.level * 100)}%</span>
        </span>

        <span className="px-2 font-medium tabular-nums">
          <span className="hidden md:inline">
            {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
          </span>
          {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </header>
  );
}

function StatRow({ label, detail, value }: { label: string; detail: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono text-slate-400">
          {Math.round(value)}% · {detail}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/70">
        <div className={`h-full rounded-full transition-all duration-700 ${meterColor(value)}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Menu({
  children,
  align = 'left',
  width = 'w-56',
}: {
  children: ReactNode;
  align?: 'left' | 'right';
  width?: string;
}) {
  return (
    <div
      role="menu"
      className={`glass-strong absolute top-7 ${align === 'right' ? 'right-0' : 'left-0'} ${width} animate-fade-in rounded-lg py-1 shadow-2xl`}
    >
      {children}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className="mx-1 block w-[calc(100%-0.5rem)] rounded px-3 py-1 text-left text-[13px] text-slate-200 hover:bg-accent hover:text-white disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function MenuDivider() {
  return <div className="mx-3 my-1 h-px bg-slate-700/60" />;
}
