import { useSettings } from '@/context/SettingsContext';
import { useSystem } from '@/context/SystemContext';

/** In-game performance overlay shown while a game runs (toggle in Settings → Performance). */
export default function FpsOverlay() {
  const { settings } = useSettings();
  const { stats, running } = useSystem();
  if (!settings.showFpsOverlay || running?.status !== 'running') return null;
  const color = stats.fps >= 100 ? 'text-emerald-400' : stats.fps >= 55 ? 'text-amber-300' : 'text-rose-400';
  return (
    <div className="pointer-events-none fixed left-1/2 top-10 z-[9400] -translate-x-1/2 rounded-md bg-black/60 px-2.5 py-1 font-mono text-[11px] leading-tight text-slate-300 ring-1 ring-white/10">
      <span className={`text-sm font-bold ${color}`}>{stats.fps}</span> FPS · GPU {Math.round(stats.gpu)}% {stats.gpuTemp}°C · CPU{' '}
      {Math.round(stats.cpu)}%
    </div>
  );
}
