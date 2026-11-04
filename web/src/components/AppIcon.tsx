import type { AppMeta } from '@/types/os';

/** Rounded gradient tile used for app icons on the dock and the desktop. */
export default function AppIcon({ app, size = 48 }: { app: AppMeta; size?: number }) {
  const Icon = app.icon;
  return (
    <div
      className={`relative flex items-center justify-center rounded-[22%] bg-gradient-to-br ${app.tile} shadow-lg ring-1 ring-white/15`}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-[22%] bg-gradient-to-b from-white/25 to-transparent opacity-60" />
      <Icon className="relative text-white drop-shadow" style={{ width: size * 0.52, height: size * 0.52 }} strokeWidth={1.8} />
    </div>
  );
}
