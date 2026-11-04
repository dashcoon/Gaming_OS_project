import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Download, Gamepad2, Trophy, type LucideIcon } from 'lucide-react';
import { INITIAL_GAMES } from '@/data/games';
import { useSettings } from '@/context/SettingsContext';
import type { Game, GameStatus } from '@/types/game';
import type { PerformanceMode } from '@/types/settings';

export interface SystemStats {
  cpu: number;
  gpu: number;
  ram: number;
  cpuTemp: number;
  gpuTemp: number;
  fps: number;
}

export interface OSNotification {
  id: number;
  title: string;
  body: string;
  icon?: LucideIcon;
}

export interface RunningGame {
  gameId: string;
  status: Extract<GameStatus, 'launching' | 'running'>;
  startedAt: number;
}

interface SystemContextValue {
  stats: SystemStats;
  bootTime: number;
  games: Game[];
  /** Install progress 0–100 for games currently downloading. */
  downloads: Record<string, number>;
  running: RunningGame | null;
  gameStatus: (gameId: string) => GameStatus;
  installGame: (gameId: string) => void;
  uninstallGame: (gameId: string) => void;
  launchGame: (gameId: string) => boolean;
  stopGame: () => void;
  notifications: OSNotification[];
  notify: (n: Omit<OSNotification, 'id'>) => void;
  dismissNotification: (id: number) => void;
}

const SystemContext = createContext<SystemContextValue | null>(null);

const TOTAL_RAM_GB = 32;

const MODE_PROFILE: Record<PerformanceMode, { gpuScale: number; cpuScale: number; fps: number; temp: number }> = {
  'power-saver': { gpuScale: 0.65, cpuScale: 0.7, fps: 60, temp: -8 },
  balanced: { gpuScale: 0.85, cpuScale: 0.85, fps: 120, temp: 0 },
  performance: { gpuScale: 1, cpuScale: 1, fps: 165, temp: 7 },
};

const jitter = (base: number, spread: number) => base + (Math.random() - 0.5) * spread;
const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));
/** Ease previous value toward a target so the meters move smoothly. */
const approach = (prev: number, target: number) => prev + (target - prev) * 0.45;

export function SystemProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [bootTime] = useState(() => Date.now());
  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);
  const [downloads, setDownloads] = useState<Record<string, number>>({});
  const [running, setRunning] = useState<RunningGame | null>(null);
  const [notifications, setNotifications] = useState<OSNotification[]>([]);
  const [stats, setStats] = useState<SystemStats>({ cpu: 9, gpu: 4, ram: 31, cpuTemp: 42, gpuTemp: 38, fps: 0 });
  const nextId = useRef(1);

  const notify = useCallback((n: Omit<OSNotification, 'id'>) => {
    const id = nextId.current++;
    setNotifications((prev) => [...prev.slice(-3), { ...n, id }]);
    window.setTimeout(() => setNotifications((prev) => prev.filter((x) => x.id !== id)), 5000);
  }, []);

  const dismissNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((x) => x.id !== id));
  }, []);

  // --- Live hardware stats -------------------------------------------------
  const isGaming = running?.status === 'running';
  const isLaunching = running?.status === 'launching';
  useEffect(() => {
    const profile = MODE_PROFILE[settings.performanceMode];
    const tick = () => {
      setStats((prev) => {
        const cpuTarget = isGaming ? jitter(62, 18) * profile.cpuScale : isLaunching ? jitter(78, 10) : jitter(11, 8);
        const gpuTarget = isGaming ? jitter(93, 8) * profile.gpuScale : isLaunching ? jitter(40, 20) : jitter(5, 5);
        const ramTarget = isGaming ? jitter(64, 4) : isLaunching ? jitter(52, 4) : jitter(31, 3);
        const fpsTarget = isGaming ? jitter(profile.fps * 0.94, profile.fps * 0.1) : 0;
        const cpu = clamp(approach(prev.cpu, cpuTarget), 2);
        const gpu = clamp(approach(prev.gpu, gpuTarget), 1);
        return {
          cpu,
          gpu,
          ram: clamp(approach(prev.ram, ramTarget), 10),
          cpuTemp: Math.round(38 + cpu * 0.42 + profile.temp),
          gpuTemp: Math.round(34 + gpu * 0.44 + profile.temp),
          fps: isGaming ? Math.round(clamp(fpsTarget, 30, 400)) : 0,
        };
      });
    };
    tick();
    const interval = window.setInterval(tick, 1500);
    return () => window.clearInterval(interval);
  }, [isGaming, isLaunching, settings.performanceMode]);

  // --- Game library ---------------------------------------------------------
  const gamesRef = useRef(games);
  gamesRef.current = games;
  const findGame = useCallback((id: string) => gamesRef.current.find((g) => g.id === id), []);

  const gameStatus = useCallback(
    (gameId: string): GameStatus => {
      if (running?.gameId === gameId) return running.status;
      if (gameId in downloads) return 'installing';
      return 'idle';
    },
    [running, downloads],
  );

  const installGame = useCallback(
    (gameId: string) => {
      const game = findGame(gameId);
      if (!game || game.installed) return;
      setDownloads((prev) => (gameId in prev ? prev : { ...prev, [gameId]: 0 }));
      notify({ title: 'Download started', body: `${game.title} (${game.sizeGB.toFixed(1)} GB)`, icon: Download });
    },
    [notify, findGame],
  );

  // A single interval advances every active download.
  const hasDownloads = Object.keys(downloads).length > 0;
  useEffect(() => {
    if (!hasDownloads) return;
    const interval = window.setInterval(() => {
      setDownloads((prev) => {
        const next: Record<string, number> = {};
        const finished: string[] = [];
        for (const [id, progress] of Object.entries(prev)) {
          const size = findGame(id)?.sizeGB ?? 20;
          const step = Math.max(2.5, 240 / size) * (0.6 + Math.random() * 0.8);
          const value = progress + step;
          if (value >= 100) finished.push(id);
          else next[id] = value;
        }
        if (finished.length > 0) {
          setGames((gs) => gs.map((g) => (finished.includes(g.id) ? { ...g, installed: true } : g)));
          for (const id of finished) {
            const g = findGame(id);
            if (g) notify({ title: 'Ready to play', body: `${g.title} finished installing.`, icon: Download });
          }
        }
        return next;
      });
    }, 400);
    return () => window.clearInterval(interval);
  }, [hasDownloads, notify, findGame]);

  const uninstallGame = useCallback((gameId: string) => {
    setRunning((r) => (r?.gameId === gameId ? null : r));
    setGames((gs) => gs.map((g) => (g.id === gameId ? { ...g, installed: false } : g)));
  }, []);

  const runningRef = useRef(running);
  runningRef.current = running;

  const stopGame = useCallback(() => {
    const current = runningRef.current;
    if (!current) return;
    const hours = (Date.now() - current.startedAt) / 3_600_000;
    setGames((gs) =>
      gs.map((g) =>
        g.id === current.gameId ? { ...g, playtimeHours: g.playtimeHours + hours, lastPlayed: 'Just now' } : g,
      ),
    );
    setRunning(null);
  }, []);

  const launchGame = useCallback(
    (gameId: string): boolean => {
      const game = findGame(gameId);
      if (!game || !game.installed) return false;
      if (runningRef.current?.gameId === gameId) return true;
      if (runningRef.current) stopGame();
      setRunning({ gameId, status: 'launching', startedAt: Date.now() });
      window.setTimeout(() => {
        setRunning((r) => (r?.gameId === gameId ? { ...r, status: 'running' } : r));
        notify({ title: 'Now playing', body: game.title, icon: Gamepad2 });
      }, 2200);
      return true;
    },
    [notify, stopGame, findGame],
  );

  // While a game runs, occasionally unlock an achievement.
  const runningGameId = isGaming ? running?.gameId : undefined;
  useEffect(() => {
    if (!runningGameId) return;
    const interval = window.setInterval(() => {
      if (Math.random() > 0.4) return;
      const game = findGame(runningGameId);
      const locked = game?.achievements.find((a) => !a.unlocked);
      if (!game || !locked) return;
      const today = new Date().toISOString().slice(0, 10);
      setGames((gs) =>
        gs.map((g) =>
          g.id === game.id
            ? {
                ...g,
                achievements: g.achievements.map((a) =>
                  a.id === locked.id ? { ...a, unlocked: true, unlockedAt: today } : a,
                ),
              }
            : g,
        ),
      );
      notify({ title: 'Achievement unlocked', body: `${locked.name} · ${game.title}`, icon: Trophy });
    }, 12000);
    return () => window.clearInterval(interval);
  }, [runningGameId, notify, findGame]);

  const value = useMemo<SystemContextValue>(
    () => ({
      stats,
      bootTime,
      games,
      downloads,
      running,
      gameStatus,
      installGame,
      uninstallGame,
      launchGame,
      stopGame,
      notifications,
      notify,
      dismissNotification,
    }),
    [
      stats,
      bootTime,
      games,
      downloads,
      running,
      gameStatus,
      installGame,
      uninstallGame,
      launchGame,
      stopGame,
      notifications,
      notify,
      dismissNotification,
    ],
  );

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
}

export function useSystem(): SystemContextValue {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error('useSystem must be used inside <SystemProvider>');
  return ctx;
}

export { TOTAL_RAM_GB };
