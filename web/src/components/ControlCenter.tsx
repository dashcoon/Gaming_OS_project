import type { ReactNode } from 'react';
import {
  Bell,
  BellOff,
  Bluetooth,
  BluetoothOff,
  Gauge,
  Leaf,
  Moon,
  Sun,
  SunDim,
  Trash2,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { ACCENTS } from '@/data/theme';
import { useSettings } from '@/context/SettingsContext';
import { useSystem } from '@/context/SystemContext';
import type { PerformanceMode } from '@/types/settings';

const MODES: { id: PerformanceMode; label: string; icon: LucideIcon }[] = [
  { id: 'power-saver', label: 'Saver', icon: Leaf },
  { id: 'balanced', label: 'Balanced', icon: Gauge },
  { id: 'performance', label: 'Turbo', icon: Zap },
];

/** Windows 11 / macOS-style quick settings panel with notification history. */
export default function ControlCenter() {
  const { settings, updateSettings } = useSettings();
  const { notificationLog, clearNotificationLog, running, games, stopGame } = useSystem();
  const runningGame = running ? games.find((g) => g.id === running.gameId) : undefined;

  return (
    <div className="w-80 space-y-3 p-3 text-slate-200">
      <div className="grid grid-cols-2 gap-2">
        <Tile
          active={settings.wifiEnabled}
          icon={settings.wifiEnabled ? Wifi : WifiOff}
          label="Wi-Fi"
          detail={settings.wifiEnabled ? 'GamerNet 5G' : 'Off'}
          onClick={() => updateSettings({ wifiEnabled: !settings.wifiEnabled })}
        />
        <Tile
          active={settings.bluetoothEnabled}
          icon={settings.bluetoothEnabled ? Bluetooth : BluetoothOff}
          label="Bluetooth"
          detail={settings.bluetoothEnabled ? 'Controller' : 'Off'}
          onClick={() => updateSettings({ bluetoothEnabled: !settings.bluetoothEnabled })}
        />
        <Tile
          active={settings.doNotDisturb}
          icon={settings.doNotDisturb ? BellOff : Moon}
          label="Do Not Disturb"
          detail={settings.doNotDisturb ? 'On' : 'Off'}
          onClick={() => updateSettings({ doNotDisturb: !settings.doNotDisturb })}
        />
        <Tile
          active={settings.nightLight}
          icon={SunDim}
          label="Night Light"
          detail={settings.nightLight ? 'Warm' : 'Off'}
          onClick={() => updateSettings({ nightLight: !settings.nightLight })}
        />
      </div>

      <Section>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Power mode</p>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/30 p-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={settings.performanceMode === m.id}
              onClick={() => updateSettings({ performanceMode: m.id })}
              className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                settings.performanceMode === m.id ? 'bg-accent text-white shadow' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <m.icon className="h-3.5 w-3.5" />
              {m.label}
            </button>
          ))}
        </div>
      </Section>

      <Section>
        <SliderRow
          icon={Sun}
          label="Brightness"
          value={settings.brightness}
          min={30}
          onChange={(v) => updateSettings({ brightness: v })}
        />
        <SliderRow
          icon={settings.muted ? VolumeX : Volume2}
          label="Volume"
          value={settings.muted ? 0 : settings.masterVolume}
          onIconClick={() => updateSettings({ muted: !settings.muted })}
          onChange={(v) => updateSettings({ masterVolume: v, muted: false })}
        />
      </Section>

      <Section>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Accent</span>
          <div className="flex gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-label={a.name}
                title={a.name}
                onClick={() => updateSettings({ accent: a.id })}
                className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${
                  settings.accent === a.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''
                }`}
                style={{ background: `linear-gradient(135deg, rgb(${a.rgb}), rgb(${a.rgb2}))` }}
              />
            ))}
          </div>
        </div>
      </Section>

      {runningGame && (
        <div className={`flex items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r ${runningGame.cover} p-3`}>
          <runningGame.icon className="h-8 w-8 shrink-0 text-white drop-shadow" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">Now playing</p>
            <p className="truncate text-sm font-bold text-white">{runningGame.title}</p>
          </div>
          <button type="button" onClick={stopGame} className="rounded-md bg-black/40 px-2 py-1 text-xs font-semibold text-white hover:bg-black/60">
            Quit
          </button>
        </div>
      )}

      <Section>
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <Bell className="h-3.5 w-3.5" /> Notifications
          </span>
          {notificationLog.length > 0 && (
            <button
              type="button"
              onClick={clearNotificationLog}
              aria-label="Clear notifications"
              className="rounded p-1 text-slate-500 hover:bg-white/10 hover:text-slate-200"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {notificationLog.length === 0 ? (
          <p className="py-2 text-center text-xs text-slate-500">You're all caught up.</p>
        ) : (
          <ul className="scroll-thin max-h-40 space-y-1.5 overflow-y-auto">
            {notificationLog.map((n) => {
              const Icon = n.icon ?? Bell;
              return (
                <li key={n.id} className="flex items-start gap-2 rounded-lg bg-white/5 p-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{n.title}</p>
                    <p className="truncate text-[11px] text-slate-400">{n.body}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-500">
                    {n.time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <div className="space-y-2 rounded-xl bg-white/5 p-3 ring-1 ring-white/5">{children}</div>;
}

function Tile({
  active,
  icon: Icon,
  label,
  detail,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl p-2.5 text-left ring-1 transition-colors ${
        active ? 'bg-accent text-white ring-accent shadow-lg shadow-accent/20' : 'bg-white/5 text-slate-300 ring-white/5 hover:bg-white/10'
      }`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${active ? 'bg-white/20' : 'bg-white/10'}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold">{label}</span>
        <span className={`block truncate text-[11px] ${active ? 'text-white/80' : 'text-slate-500'}`}>{detail}</span>
      </span>
    </button>
  );
}

function SliderRow({
  icon: Icon,
  label,
  value,
  min = 0,
  onChange,
  onIconClick,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  min?: number;
  onChange: (v: number) => void;
  onIconClick?: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={onIconClick}
        disabled={!onIconClick}
        aria-label={label}
        className="rounded p-0.5 text-slate-300 enabled:hover:bg-white/10"
      >
        <Icon className="h-4 w-4" />
      </button>
      <input
        type="range"
        min={min}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="flex-1"
      />
      <span className="w-8 text-right font-mono text-[11px] text-slate-400">{value}</span>
    </div>
  );
}
