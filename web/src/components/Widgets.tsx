import { Activity, Gamepad2, Play, Square, Users } from 'lucide-react';
import Sparkline from '@/components/Sparkline';
import { TOTAL_RAM_GB, useSystem } from '@/context/SystemContext';
import { useWindowManager } from '@/context/WindowManagerContext';

const FRIENDS = [
  { name: 'NovaByte', status: 'Playing Velocity League', color: 'bg-emerald-400' },
  { name: 'pixelwitch', status: 'Playing Pixel Pioneers', color: 'bg-emerald-400' },
  { name: 'Grimshaw', status: 'Online', color: 'bg-sky-400' },
  { name: 'kaiju_main', status: 'Away', color: 'bg-amber-400' },
];

/** Desktop widgets: live system monitor, continue playing, friends. They sit under all windows. */
export default function Widgets() {
  const { stats, history, games, running, launchGame, stopGame, gameStatus } = useSystem();
  const { openApp } = useWindowManager();
  const next = running
    ? games.find((g) => g.id === running.gameId)
    : [...games].filter((g) => g.installed).sort((a, b) => b.playtimeHours - a.playtimeHours)[0];
  const status = next ? gameStatus(next.id) : 'idle';

  return (
    <aside aria-label="Widgets" className="absolute right-4 top-4 hidden w-72 flex-col gap-3 xl:flex" onClick={(e) => e.stopPropagation()}>
      {/* System monitor */}
      <section className="glass rounded-2xl p-4 shadow-xl">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Activity className="h-3.5 w-3.5 text-accent" /> System
          </h2>
          <span className="font-mono text-[11px] text-slate-500">
            {stats.cpuTemp}°C · {stats.gpuTemp}°C
          </span>
        </header>
        <div className="space-y-3">
          <Meter label="CPU" value={stats.cpu} values={history.cpu} />
          <Meter label="GPU" value={stats.gpu} values={history.gpu} color="rgb(var(--accent-2))" />
          <Meter
            label="RAM"
            value={stats.ram}
            values={history.ram}
            detail={`${((stats.ram / 100) * TOTAL_RAM_GB).toFixed(1)} GB`}
            color="rgb(56 189 248)"
          />
        </div>
      </section>

      {/* Continue playing */}
      {next && (
        <section className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${next.cover} p-4 shadow-xl ring-1 ring-white/10`}>
          <next.icon className="absolute -bottom-6 -right-6 h-32 w-32 text-white/20" strokeWidth={1.2} />
          <p className="relative text-[10px] font-semibold uppercase tracking-wider text-white/80">
            {running ? 'Now playing' : 'Continue playing'}
          </p>
          <p className="relative mt-0.5 text-lg font-bold leading-tight text-white drop-shadow">{next.title}</p>
          <p className="relative text-xs text-white/75">{next.playtimeHours.toFixed(0)} hours played</p>
          <div className="relative mt-3 flex gap-2">
            {status === 'running' ? (
              <button type="button" onClick={stopGame} className="btn bg-black/40 px-3 py-1 text-xs text-white hover:bg-black/60">
                <Square className="h-3.5 w-3.5 fill-current" /> Quit
              </button>
            ) : (
              <button
                type="button"
                disabled={status === 'launching'}
                onClick={() => launchGame(next.id)}
                className="btn bg-white px-3 py-1 text-xs font-bold text-slate-900 hover:bg-white/90"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> {status === 'launching' ? 'Launching…' : 'Play'}
              </button>
            )}
            <button type="button" onClick={() => openApp('steam')} className="btn bg-black/25 px-3 py-1 text-xs text-white hover:bg-black/40">
              <Gamepad2 className="h-3.5 w-3.5" /> Library
            </button>
          </div>
        </section>
      )}

      {/* Friends */}
      <section className="glass rounded-2xl p-4 shadow-xl">
        <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Users className="h-3.5 w-3.5 text-accent" /> Friends online
        </h2>
        <ul className="space-y-2">
          {FRIENDS.map((f) => (
            <li key={f.name} className="flex items-center gap-2.5">
              <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-[11px] font-bold uppercase text-slate-200">
                {f.name[0]}
                <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-slate-900 ${f.color}`} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-slate-200">{f.name}</span>
                <span className="block truncate text-[11px] text-slate-500">{f.status}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

function Meter({
  label,
  value,
  values,
  detail,
  color,
}: {
  label: string;
  value: number;
  values: number[];
  detail?: string;
  color?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="font-mono tabular-nums text-slate-200">
          {detail ? <span className="mr-1.5 text-slate-500">{detail}</span> : null}
          {Math.round(value)}%
        </span>
      </div>
      <Sparkline values={values} color={color} className="mt-1 h-8 w-full" />
    </div>
  );
}
