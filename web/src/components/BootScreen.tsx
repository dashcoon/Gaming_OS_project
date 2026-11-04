import { useEffect, useState } from 'react';
import { Gamepad2 } from 'lucide-react';

const BOOT_LOG = [
  'Loading gaming kernel 6.18.4…',
  'Starting GPU driver…',
  'Mounting C:/Games…',
  'Starting audio (PipeWire)…',
  'Connecting controllers…',
  'Starting GamingOS shell…',
];

const DURATION = 2600;

/** Startup splash with a progress bar. Any key or click skips it. */
export default function BootScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      setProgress(p);
      if (p < 1) frame = requestAnimationFrame(tick);
      else setLeaving(true);
    };
    frame = requestAnimationFrame(tick);
    const skip = () => setLeaving(true);
    window.addEventListener('keydown', skip);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', skip);
    };
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const id = window.setTimeout(onDone, 450);
    return () => window.clearTimeout(id);
  }, [leaving, onDone]);

  const line = BOOT_LOG[Math.min(BOOT_LOG.length - 1, Math.floor(progress * BOOT_LOG.length))];

  return (
    <div
      onClick={() => setLeaving(true)}
      className={`fixed inset-0 z-[10001] flex cursor-default flex-col items-center justify-center bg-black transition-opacity duration-500 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute left-1/2 top-1/2 h-[50vh] w-[50vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-[120px]" />
      <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-accent via-accent-2 to-slate-900 shadow-[0_0_60px_-10px_rgb(var(--accent))]">
        <Gamepad2 className="h-12 w-12 text-white" strokeWidth={1.6} />
      </div>
      <h1 className="relative mt-6 text-3xl font-extrabold tracking-tight text-white">
        Gaming<span className="text-accent">OS</span>
      </h1>
      <div className="relative mt-8 h-1 w-56 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 shadow-[0_0_12px_rgb(var(--accent))]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p className="relative mt-4 h-4 font-mono text-[11px] text-slate-500">{line}</p>
      <p className="absolute bottom-6 text-[11px] text-slate-600">Press any key to skip</p>
    </div>
  );
}
