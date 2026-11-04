import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, BatteryCharging, Gamepad2, Wifi } from 'lucide-react';
import { useClock } from '@/hooks/useClock';
import { useSystem } from '@/context/SystemContext';

/** Sign-in screen with a large clock. Any password signs in. */
export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const now = useClock();
  const { games } = useSystem();
  const [revealed, setRevealed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [password, setPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const lastPlayed = games.find((g) => g.installed && g.lastPlayed);

  useEffect(() => {
    if (revealed) inputRef.current?.focus();
  }, [revealed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (revealed || e.metaKey || e.ctrlKey || e.altKey) return;
      // The key that reveals the sign-in form must not also submit it (Enter) or type into it.
      e.preventDefault();
      setRevealed(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [revealed]);

  useEffect(() => {
    if (!leaving) return;
    const id = window.setTimeout(onUnlock, 500);
    return () => window.clearTimeout(id);
  }, [leaving, onUnlock]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setLeaving(true);
  };

  return (
    <div
      role="dialog"
      aria-label="Lock screen"
      onClick={() => setRevealed(true)}
      className={`fixed inset-0 z-[10000] flex flex-col items-center overflow-hidden bg-slate-950/40 backdrop-blur-2xl transition-all duration-500 ease-in ${
        leaving ? 'pointer-events-none -translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="absolute right-5 top-4 flex items-center gap-3 text-slate-300">
        <Wifi className="h-4 w-4" />
        <BatteryCharging className="h-4 w-4" />
      </div>

      <div
        className={`flex flex-col items-center transition-all duration-500 ${
          revealed ? 'mt-[12vh] scale-75 opacity-80' : 'mt-[22vh]'
        }`}
      >
        <p className="text-lg font-medium text-slate-200 drop-shadow">
          {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <p className="text-[clamp(4rem,12vw,8.5rem)] font-bold leading-none tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
          {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {revealed ? (
        <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="mt-6 flex animate-fade-in flex-col items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-accent via-accent-2 to-slate-900 shadow-[0_0_40px_-8px_rgb(var(--accent))] ring-4 ring-white/10">
            <Gamepad2 className="h-11 w-11 text-white" />
          </div>
          <p className="mt-3 text-xl font-semibold text-white">Player</p>
          <div className="mt-4 flex items-center gap-2 rounded-full bg-white/10 p-1 pl-4 ring-1 ring-white/15 focus-within:ring-2 focus-within:ring-accent/70">
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter any password"
              aria-label="Password"
              className="w-52 bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              aria-label="Sign in"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white transition hover:brightness-110"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-400">Demo account · any password works</p>
        </form>
      ) : (
        <div className="mt-auto mb-16 flex flex-col items-center gap-4">
          {lastPlayed && (
            <div className="glass-light flex items-center gap-3 rounded-2xl px-4 py-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${lastPlayed.cover}`}>
                <lastPlayed.icon className="h-5 w-5 text-white" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Continue playing</p>
                <p className="text-sm font-semibold text-white">{lastPlayed.title}</p>
              </div>
            </div>
          )}
          <p className="animate-pulse text-sm text-slate-300">Click or press any key to sign in</p>
        </div>
      )}
    </div>
  );
}
