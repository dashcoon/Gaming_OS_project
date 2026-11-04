import { useState } from 'react';
import { Cpu, Gamepad2, HardDrive, MemoryStick, Monitor, MonitorPlay, Thermometer } from 'lucide-react';
import { TOTAL_RAM_GB, useSystem } from '@/context/SystemContext';
import { useClock } from '@/hooks/useClock';

type Tab = 'overview' | 'displays' | 'storage';

const SPECS = [
  { icon: Cpu, label: 'Processor', value: 'AMD Ryzen 9 7950X3D · 16 cores / 32 threads @ 5.7 GHz' },
  { icon: MonitorPlay, label: 'Graphics', value: 'NVIDIA GeForce RTX 4090 · 24 GB GDDR6X' },
  { icon: MemoryStick, label: 'Memory', value: `${TOTAL_RAM_GB} GB DDR5-6000 CL30 (2 × 16 GB)` },
  { icon: HardDrive, label: 'Startup disk', value: 'C: · 2 TB NVMe PCIe 4.0' },
  { icon: Gamepad2, label: 'Serial number', value: 'GOS-2026-OVRDRV-1337' },
];

const DRIVES = [
  { name: 'C: System & Games', used: 1240, total: 2000, color: 'from-accent to-accent-2' },
  { name: 'D: Backups', used: 3.2, total: 4000, color: 'from-sky-500 to-cyan-400' },
];

function formatUptime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

/** "About This PC": OS version, hardware specs, displays and storage. */
export default function AboutApp() {
  const { stats, bootTime } = useSystem();
  const now = useClock();
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="flex h-full flex-col text-slate-200">
      <nav className="flex shrink-0 justify-center gap-1 border-b border-slate-700/50 p-2">
        {(['overview', 'displays', 'storage'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
              tab === t ? 'bg-accent text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-6">
        {tab === 'overview' && (
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-accent via-accent-2 to-slate-900 shadow-2xl shadow-accent/30">
              <Gamepad2 className="h-16 w-16 text-white drop-shadow-lg" strokeWidth={1.5} />
              <span className="absolute inset-0 rounded-3xl ring-1 ring-white/20" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                GamingOS <span className="font-light text-slate-400">Overdrive</span>
              </h1>
              <p className="text-sm text-slate-400">Version 2.0.0 (Build 26.11.04) · Kernel 6.18.4-gaming</p>
              <dl className="mt-5 space-y-2.5">
                {SPECS.map((s) => (
                  <div key={s.label} className="flex gap-3 text-sm">
                    <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <dt className="w-28 shrink-0 font-semibold text-slate-300">{s.label}</dt>
                    <dd className="min-w-0 text-slate-400">{s.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Live label="CPU" value={`${Math.round(stats.cpu)}%`} />
                <Live label="GPU" value={`${Math.round(stats.gpu)}%`} />
                <Live label="GPU temp" value={`${stats.gpuTemp}°C`} icon />
                <Live label="Uptime" value={formatUptime(now.getTime() - bootTime)} />
              </div>
            </div>
          </div>
        )}

        {tab === 'displays' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative flex h-36 w-60 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-950 ring-4 ring-slate-700">
              <Monitor className="h-10 w-10 text-accent" />
              <span className="absolute -bottom-5 h-5 w-16 rounded-b bg-slate-700" />
            </div>
            <div className="pt-4">
              <h2 className="text-lg font-semibold text-white">27″ QHD Gaming Monitor</h2>
              <p className="text-sm text-slate-400">
                {window.screen.width} × {window.screen.height} · 165 Hz · HDR 600 · G-SYNC compatible
              </p>
              <p className="mt-1 text-xs text-slate-500">Browser viewport: {window.innerWidth} × {window.innerHeight}</p>
            </div>
          </div>
        )}

        {tab === 'storage' && (
          <div className="space-y-5">
            {DRIVES.map((d) => (
              <div key={d.name}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <HardDrive className="h-4 w-4 text-slate-400" /> {d.name}
                  </span>
                  <span className="text-slate-400">
                    {(d.total - d.used).toFixed(0)} GB free of {d.total.toLocaleString()} GB
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                  <div className={`h-full rounded-full bg-gradient-to-r ${d.color}`} style={{ width: `${Math.max(1, (d.used / d.total) * 100)}%` }} />
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-500">Games use about 1.1 TB on C:. Manage them in Steam → Library.</p>
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-slate-700/50 p-2 text-center text-[11px] text-slate-500">
        GamingOS is a web demo. Hardware values are simulated.
      </footer>
    </div>
  );
}

function Live({ label, value, icon }: { label: string; value: string; icon?: boolean }) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/5">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {icon && <Thermometer className="h-3 w-3" />}
        {label}
      </p>
      <p className="font-mono text-sm text-slate-100">{value}</p>
    </div>
  );
}
