import { Bell, X } from 'lucide-react';
import { useSystem } from '@/context/SystemContext';

/** Toast stack in the top-right corner, below the status bar. */
export default function Notifications() {
  const { notifications, dismissNotification } = useSystem();
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-3 top-11 z-[9600] flex w-80 flex-col gap-2">
      {notifications.map((n) => {
        const Icon = n.icon ?? Bell;
        return (
          <div
            key={n.id}
            className="glass pointer-events-auto flex animate-toast-in items-start gap-3 rounded-xl p-3 shadow-2xl"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-100">{n.title}</p>
              <p className="truncate text-xs text-slate-400">{n.body}</p>
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismissNotification(n.id)}
              className="rounded p-0.5 text-slate-500 hover:bg-white/10 hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
