import { useState, type ReactNode } from 'react';
import {
  Check,
  Gauge,
  Info,
  Leaf,
  Monitor,
  MousePointerClick,
  Palette,
  RotateCcw,
  Volume2,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { ACCENTS, WALLPAPERS, glowColor } from '@/data/theme';
import { useSettings } from '@/context/SettingsContext';
import { useWindowManager } from '@/context/WindowManagerContext';
import type { PerformanceMode } from '@/types/settings';

type Section = 'appearance' | 'desktop' | 'performance' | 'sound';

const SECTIONS: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'desktop', label: 'Desktop & Dock', icon: Monitor },
  { id: 'performance', label: 'Performance', icon: Gauge },
  { id: 'sound', label: 'Sound', icon: Volume2 },
];

const MODES: { id: PerformanceMode; label: string; icon: LucideIcon; description: string }[] = [
  { id: 'power-saver', label: 'Power Saver', icon: Leaf, description: '60 FPS cap, quieter fans, static wallpaper.' },
  { id: 'balanced', label: 'Balanced', icon: Gauge, description: 'Good frame rates with sensible thermals.' },
  { id: 'performance', label: 'Performance', icon: Zap, description: 'Unlocked clocks for maximum FPS.' },
];

/** System settings: wallpaper, accent color, desktop behavior, performance mode and audio. */
export default function SettingsApp() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { openApp } = useWindowManager();
  const [section, setSection] = useState<Section>('appearance');

  return (
    <div className="flex h-full text-slate-200">
      <aside className="flex w-52 shrink-0 flex-col border-r border-slate-700/50 bg-slate-950/40 p-2">
        <ul className="space-y-0.5">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSection(s.id)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                  section === s.id ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => openApp('about')}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] text-slate-300 hover:bg-white/5"
            >
              <Info className="h-4 w-4" />
              About This PC
            </button>
          </li>
        </ul>
        <button type="button" onClick={resetSettings} className="btn-ghost mt-auto justify-start text-xs text-slate-400">
          <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
        </button>
      </aside>

      <main className="scroll-thin min-w-0 flex-1 overflow-y-auto p-6">
        {section === 'appearance' && (
          <>
            <Heading title="Appearance" subtitle="Wallpaper and accent color for the whole system." />
            <Group title="Wallpaper">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {WALLPAPERS.map((wp) => (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => updateSettings({ wallpaper: wp.id })}
                    className="group text-left"
                    aria-pressed={settings.wallpaper === wp.id}
                  >
                    <span
                      className={`relative block aspect-video overflow-hidden rounded-lg ${wp.base} ring-2 transition ${
                        settings.wallpaper === wp.id ? 'ring-accent' : 'ring-transparent group-hover:ring-slate-600'
                      }`}
                    >
                      {wp.glows.map((g, i) => (
                        <span
                          key={i}
                          className="absolute h-1/2 w-1/2 rounded-full blur-xl"
                          style={{ background: glowColor(g, 0.6), left: `${i * 30}%`, top: `${(i % 2) * 40}%` }}
                        />
                      ))}
                      {settings.wallpaper === wp.id && (
                        <Check className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full bg-accent p-0.5 text-white" />
                      )}
                    </span>
                    <span className="mt-1.5 block text-xs text-slate-300">{wp.name}</span>
                  </button>
                ))}
              </div>
              <Toggle
                label="Animated ambient glow"
                description="Slowly drifting light behind the desktop. Off in Power Saver."
                checked={settings.animatedWallpaper}
                onChange={(v) => updateSettings({ animatedWallpaper: v })}
              />
            </Group>
            <Group title="Accent color">
              <div className="flex flex-wrap gap-3">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => updateSettings({ accent: a.id })}
                    aria-pressed={settings.accent === a.id}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ring-1 transition ${
                      settings.accent === a.id ? 'bg-white/10 ring-white/30' : 'ring-slate-700/60 hover:bg-white/5'
                    }`}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{
                        background: `linear-gradient(135deg, rgb(${a.rgb}), rgb(${a.rgb2}))`,
                        boxShadow: `0 0 14px rgb(${a.rgb} / 0.6)`,
                      }}
                    >
                      {settings.accent === a.id && <Check className="h-3.5 w-3.5 text-white" />}
                    </span>
                    {a.name}
                  </button>
                ))}
              </div>
            </Group>
          </>
        )}

        {section === 'desktop' && (
          <>
            <Heading title="Desktop & Dock" subtitle="How desktop icons and windows behave." />
            <Group title="Desktop icons">
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ['double', 'Double-click to open', 'Click once to select, twice to launch (macOS / Windows default).'],
                    ['single', 'Single-click to open', 'Launch apps with one click, like links.'],
                  ] as const
                ).map(([id, label, description]) => (
                  <OptionCard
                    key={id}
                    icon={MousePointerClick}
                    label={label}
                    description={description}
                    selected={settings.iconClickMode === id}
                    onClick={() => updateSettings({ iconClickMode: id })}
                  />
                ))}
              </div>
            </Group>
            <Group title="Window snapping">
              <p className="text-sm leading-relaxed text-slate-400">
                Drag a window to the top edge to maximize it, or to the left or right edge to snap it to half the
                screen. Double-click a title bar to maximize or restore. Dragging a snapped window restores its size.
              </p>
            </Group>
          </>
        )}

        {section === 'performance' && (
          <>
            <Heading title="Performance" subtitle="Power profile used by games and the system." />
            <Group title="Power mode">
              <div className="grid gap-2 md:grid-cols-3">
                {MODES.map((m) => (
                  <OptionCard
                    key={m.id}
                    icon={m.icon}
                    label={m.label}
                    description={m.description}
                    selected={settings.performanceMode === m.id}
                    onClick={() => updateSettings({ performanceMode: m.id })}
                  />
                ))}
              </div>
            </Group>
            <Group title="Overlay">
              <Toggle
                label="Show FPS overlay in games"
                description="Frame rate, GPU and CPU load at the top of the screen while a game runs."
                checked={settings.showFpsOverlay}
                onChange={(v) => updateSettings({ showFpsOverlay: v })}
              />
            </Group>
          </>
        )}

        {section === 'sound' && (
          <>
            <Heading title="Sound" subtitle="Output levels for the system, games and voice chat." />
            <Group title="Volume">
              <Toggle label="Mute all sound" checked={settings.muted} onChange={(v) => updateSettings({ muted: v })} />
              <Slider label="Master" value={settings.masterVolume} disabled={settings.muted} onChange={(v) => updateSettings({ masterVolume: v })} />
              <Slider label="Games" value={settings.gameVolume} disabled={settings.muted} onChange={(v) => updateSettings({ gameVolume: v })} />
              <Slider label="Voice chat" value={settings.chatVolume} disabled={settings.muted} onChange={(v) => updateSettings({ chatVolume: v })} />
            </Group>
            <Group title="Output">
              <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                <span>Output device</span>
                <span className="text-slate-400">Gaming Headset (USB) · 7.1</span>
              </div>
              <Toggle
                label="Spatial audio"
                description="Virtual surround for headphones."
                checked={settings.spatialAudio}
                onChange={(v) => updateSettings({ spatialAudio: v })}
              />
            </Group>
          </>
        )}
      </main>
    </div>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <p className="text-sm text-slate-400">{subtitle}</p>
    </header>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-7 space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

function OptionCard({
  icon: Icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-start gap-3 rounded-lg p-3 text-left ring-1 transition ${
        selected ? 'bg-accent/15 ring-accent/60' : 'ring-slate-700/60 hover:bg-white/5'
      }`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${selected ? 'text-accent' : 'text-slate-400'}`} />
      <span>
        <span className="block text-sm font-semibold text-slate-100">{label}</span>
        <span className="block text-xs leading-snug text-slate-400">{description}</span>
      </span>
    </button>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg bg-white/5 px-3 py-2.5">
      <span>
        <span className="block text-sm text-slate-100">{label}</span>
        {description && <span className="block text-xs text-slate-400">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-slate-600'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
        />
      </button>
    </label>
  );
}

function Slider({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className={`flex items-center gap-4 rounded-lg bg-white/5 px-3 py-2.5 ${disabled ? 'opacity-50' : ''}`}>
      <span className="w-24 shrink-0 text-sm">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
        aria-label={`${label} volume`}
      />
      <span className="w-10 text-right font-mono text-xs text-slate-400">{value}%</span>
    </div>
  );
}
