import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  HardDrive,
  LayoutGrid,
  Loader2,
  Lock,
  Play,
  Search,
  Square,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import { useSystem } from '@/context/SystemContext';
import type { Game, GameStatus } from '@/types/game';

type Filter = 'all' | 'installed' | 'not-installed';
type Tab = 'library' | 'achievements';

const formatHours = (h: number) => (h < 1 ? `${Math.round(h * 60)} min` : `${h.toFixed(1)} hrs`);
const unlockedCount = (g: Game) => g.achievements.filter((a) => a.unlocked).length;

/** Steam-style game client: library, search, install/play simulation and achievements. */
export default function SteamClient() {
  const { games, downloads, gameStatus, installGame, uninstallGame, launchGame, stopGame } = useSystem();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [tab, setTab] = useState<Tab>('library');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return games
      .filter((g) => (filter === 'all' ? true : filter === 'installed' ? g.installed : !g.installed))
      .filter((g) => !q || g.title.toLowerCase().includes(q) || g.genre.toLowerCase().includes(q) || g.tags.some((t) => t.toLowerCase().includes(q)))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [games, query, filter]);

  const selected = games.find((g) => g.id === selectedId) ?? null;
  const installedCount = games.filter((g) => g.installed).length;

  const actions = {
    play: (g: Game) => launchGame(g.id),
    install: (g: Game) => installGame(g.id),
    stop: stopGame,
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#1b2838] to-[#0e141b] text-slate-200">
      {/* Top navigation */}
      <nav className="flex h-11 shrink-0 items-center gap-5 border-b border-black/40 bg-[#171d25] px-4 text-sm font-bold uppercase tracking-wide">
        {(['library', 'achievements'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              if (t === 'achievements') setSelectedId(null);
            }}
            className={`h-full border-b-2 uppercase transition-colors ${
              tab === t ? 'border-accent text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-2 text-xs font-medium normal-case tracking-normal text-slate-400">
          <Users className="h-3.5 w-3.5" /> 12 friends online
        </span>
      </nav>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar game list */}
        <aside className="flex w-60 shrink-0 flex-col border-r border-black/40 bg-[#1e2329]/80">
          <div className="space-y-2 p-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search games, genres…"
                className="input w-full py-1 pl-8 text-xs"
                aria-label="Search library"
              />
            </label>
            <div className="flex gap-1 text-[11px]">
              {(
                [
                  ['all', `All (${games.length})`],
                  ['installed', `Installed (${installedCount})`],
                  ['not-installed', 'Not installed'],
                ] as [Filter, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`rounded px-1.5 py-0.5 transition-colors ${
                    filter === id ? 'bg-accent/30 text-white' : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <ul className="scroll-thin min-h-0 flex-1 overflow-y-auto pb-2">
            <li>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setTab('library');
                }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wide ${
                  !selected && tab === 'library' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Home
              </button>
            </li>
            {visible.map((g) => (
              <SidebarItem
                key={g.id}
                game={g}
                status={gameStatus(g.id)}
                active={selectedId === g.id}
                onClick={() => {
                  setSelectedId(g.id);
                  setTab('library');
                }}
              />
            ))}
            {visible.length === 0 && <li className="px-3 py-4 text-xs text-slate-500">No games match “{query}”.</li>}
          </ul>
        </aside>

        {/* Main pane */}
        <main className="scroll-thin min-w-0 flex-1 overflow-y-auto">
          {tab === 'achievements' ? (
            <AchievementsOverview games={games} onOpen={(id) => { setSelectedId(id); setTab('library'); }} />
          ) : selected ? (
            <GameDetail
              game={selected}
              status={gameStatus(selected.id)}
              progress={downloads[selected.id]}
              onBack={() => setSelectedId(null)}
              onPlay={() => actions.play(selected)}
              onInstall={() => actions.install(selected)}
              onStop={actions.stop}
              onUninstall={() => uninstallGame(selected.id)}
            />
          ) : (
            <LibraryGrid
              games={visible}
              statusOf={gameStatus}
              downloads={downloads}
              onSelect={setSelectedId}
              onPlay={actions.play}
              onInstall={actions.install}
              onStop={actions.stop}
            />
          )}
        </main>
      </div>

      <DownloadBar games={games} downloads={downloads} />
    </div>
  );
}

function SidebarItem({ game, status, active, onClick }: { game: Game; status: GameStatus; active: boolean; onClick: () => void }) {
  const Icon = game.icon;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors ${
          active ? 'bg-accent/25 text-white' : 'hover:bg-white/5'
        } ${game.installed ? 'text-slate-200' : 'text-slate-500'}`}
      >
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gradient-to-br ${game.cover}`}>
          <Icon className="h-3 w-3 text-white" />
        </span>
        <span className="truncate">{game.title}</span>
        {status === 'running' && <span className="ml-auto text-[10px] font-bold uppercase text-emerald-400">Running</span>}
        {status === 'launching' && <Loader2 className="ml-auto h-3 w-3 animate-spin text-accent" />}
        {status === 'installing' && <Download className="ml-auto h-3 w-3 text-sky-400" />}
      </button>
    </li>
  );
}

function PrimaryButton({
  game,
  status,
  progress,
  onPlay,
  onInstall,
  onStop,
  large,
}: {
  game: Game;
  status: GameStatus;
  progress?: number;
  onPlay: () => void;
  onInstall: () => void;
  onStop: () => void;
  large?: boolean;
}) {
  const size = large ? 'px-8 py-2.5 text-base' : 'px-3 py-1 text-xs';
  if (status === 'running')
    return (
      <button type="button" onClick={onStop} className={`btn bg-sky-600 font-bold uppercase text-white hover:bg-sky-500 ${size}`}>
        <Square className="h-4 w-4 fill-current" /> Stop
      </button>
    );
  if (status === 'launching')
    return (
      <button type="button" disabled className={`btn bg-emerald-700 font-bold uppercase text-white ${size}`}>
        <Loader2 className="h-4 w-4 animate-spin" /> Launching
      </button>
    );
  if (status === 'installing')
    return (
      <button type="button" disabled className={`btn bg-slate-700 font-bold uppercase text-white ${size}`}>
        <Download className="h-4 w-4" /> {Math.floor(progress ?? 0)}%
      </button>
    );
  if (game.installed)
    return (
      <button
        type="button"
        onClick={onPlay}
        className={`btn bg-gradient-to-r from-emerald-500 to-green-600 font-bold uppercase text-white shadow-lg shadow-emerald-900/40 hover:brightness-110 ${size}`}
      >
        <Play className="h-4 w-4 fill-current" /> Play
      </button>
    );
  return (
    <button type="button" onClick={onInstall} className={`btn bg-accent font-bold uppercase text-white hover:bg-accent/85 ${size}`}>
      <Download className="h-4 w-4" /> Install
    </button>
  );
}

function LibraryGrid({
  games,
  statusOf,
  downloads,
  onSelect,
  onPlay,
  onInstall,
  onStop,
}: {
  games: Game[];
  statusOf: (id: string) => GameStatus;
  downloads: Record<string, number>;
  onSelect: (id: string) => void;
  onPlay: (g: Game) => void;
  onInstall: (g: Game) => void;
  onStop: () => void;
}) {
  const recent = games.filter((g) => g.installed && g.lastPlayed).slice(0, 3);
  return (
    <div className="space-y-6 p-5">
      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Jump back in</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {recent.map((g) => {
              const Icon = g.icon;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onSelect(g.id)}
                  className={`group relative h-28 overflow-hidden rounded-lg bg-gradient-to-br ${g.cover} p-3 text-left ring-1 ring-white/10 transition-transform hover:-translate-y-0.5`}
                >
                  <Icon className="absolute -bottom-3 -right-3 h-24 w-24 text-white/20 transition-transform group-hover:scale-110" />
                  <p className="relative text-sm font-bold text-white drop-shadow">{g.title}</p>
                  <p className="relative text-[11px] text-white/80">Last played {g.lastPlayed}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">All games ({games.length})</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
          {games.map((g) => {
            const Icon = g.icon;
            const status = statusOf(g.id);
            return (
              <article key={g.id} className="group flex flex-col">
                <button
                  type="button"
                  onClick={() => onSelect(g.id)}
                  className={`relative aspect-[3/4] overflow-hidden rounded-md bg-gradient-to-br ${g.cover} shadow-lg ring-1 ring-white/10 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-accent/30 group-hover:ring-accent/60 ${
                    g.installed ? '' : 'saturate-[0.35]'
                  }`}
                >
                  <Icon className="absolute left-1/2 top-[38%] h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-white/85 drop-shadow-lg" strokeWidth={1.5} />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2.5 pt-8 text-left">
                    <span className="block text-sm font-bold leading-tight text-white">{g.title}</span>
                    <span className="text-[11px] text-white/70">{g.genre}</span>
                  </span>
                  {g.installed && (
                    <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-emerald-400 drop-shadow" aria-label="Installed" />
                  )}
                  {status === 'installing' && (
                    <span className="absolute inset-x-0 top-0 h-1 bg-black/40">
                      <span className="block h-full bg-sky-400 transition-all" style={{ width: `${downloads[g.id] ?? 0}%` }} />
                    </span>
                  )}
                </button>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    <Trophy className="mr-1 inline h-3 w-3" />
                    {unlockedCount(g)}/{g.achievements.length}
                  </span>
                  <PrimaryButton
                    game={g}
                    status={status}
                    progress={downloads[g.id]}
                    onPlay={() => onPlay(g)}
                    onInstall={() => onInstall(g)}
                    onStop={onStop}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function GameDetail({
  game,
  status,
  progress,
  onBack,
  onPlay,
  onInstall,
  onStop,
  onUninstall,
}: {
  game: Game;
  status: GameStatus;
  progress?: number;
  onBack: () => void;
  onPlay: () => void;
  onInstall: () => void;
  onStop: () => void;
  onUninstall: () => void;
}) {
  const Icon = game.icon;
  const unlocked = unlockedCount(game);
  const pct = game.achievements.length ? Math.round((unlocked / game.achievements.length) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <div className={`relative h-56 overflow-hidden bg-gradient-to-br ${game.cover}`}>
        <Icon className="absolute -right-6 -top-6 h-72 w-72 text-white/15" strokeWidth={1} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b2838] via-[#1b2838]/30 to-transparent" />
        <button type="button" onClick={onBack} className="btn-ghost absolute left-3 top-3 bg-black/30 text-xs">
          <ArrowLeft className="h-3.5 w-3.5" /> Library
        </button>
        <div className="absolute bottom-4 left-6 right-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg">{game.title}</h1>
          <p className="text-sm text-white/80">
            {game.developer} · {game.releaseYear} · {game.genre}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 border-b border-black/40 bg-[#1b2838]/80 px-6 py-4">
        <PrimaryButton game={game} status={status} progress={progress} onPlay={onPlay} onInstall={onInstall} onStop={onStop} large />
        <Stat icon={Clock} label="Play time" value={formatHours(game.playtimeHours)} />
        <Stat icon={Clock} label="Last played" value={game.lastPlayed ?? 'Never'} />
        <Stat icon={HardDrive} label={game.installed ? 'Size on disk' : 'Download size'} value={`${game.sizeGB.toFixed(1)} GB`} />
        <Stat icon={Trophy} label="Achievements" value={`${unlocked} / ${game.achievements.length}`} />
        {game.installed && status === 'idle' && (
          <button type="button" onClick={onUninstall} className="btn-ghost ml-auto text-xs text-slate-400" title="Uninstall">
            <Trash2 className="h-3.5 w-3.5" /> Uninstall
          </button>
        )}
      </div>

      {status === 'installing' && (
        <div className="px-6 pt-4">
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-gradient-to-r from-sky-500 to-accent transition-all" style={{ width: `${progress ?? 0}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Downloading… {((game.sizeGB * (progress ?? 0)) / 100).toFixed(1)} of {game.sizeGB.toFixed(1)} GB
          </p>
        </div>
      )}

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">About</h2>
          <p className="text-sm leading-relaxed text-slate-300">{game.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {game.tags.map((t) => (
              <span key={t} className="rounded bg-white/10 px-2 py-0.5 text-[11px] text-slate-300">
                {t}
              </span>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Achievements</h2>
            <span className="text-xs text-slate-400">{pct}% complete</span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <ul className="space-y-1.5">
            {game.achievements.map((a) => (
              <li
                key={a.id}
                className={`flex items-center gap-3 rounded-md p-2 ${a.unlocked ? 'bg-accent/10 ring-1 ring-accent/20' : 'bg-black/20'}`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded ${
                    a.unlocked ? 'bg-gradient-to-br from-amber-300 to-amber-600 text-amber-950' : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  {a.unlocked ? <Trophy className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${a.unlocked ? 'text-slate-100' : 'text-slate-400'}`}>{a.name}</p>
                  <p className="truncate text-xs text-slate-500">{a.description}</p>
                </div>
                {a.unlockedAt && <span className="text-[10px] text-slate-500">{a.unlockedAt}</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-slate-500" />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-sm text-slate-200">{value}</p>
      </div>
    </div>
  );
}

function AchievementsOverview({ games, onOpen }: { games: Game[]; onOpen: (id: string) => void }) {
  const total = games.reduce((n, g) => n + g.achievements.length, 0);
  const unlocked = games.reduce((n, g) => n + unlockedCount(g), 0);
  const perfect = games.filter((g) => g.achievements.length > 0 && unlockedCount(g) === g.achievements.length).length;
  return (
    <div className="space-y-5 p-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          ['Unlocked', `${unlocked} / ${total}`],
          ['Completion', `${total ? Math.round((unlocked / total) * 100) : 0}%`],
          ['Perfect games', String(perfect)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-black/25 p-4 ring-1 ring-white/5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>
      <ul className="space-y-2">
        {[...games]
          .sort((a, b) => unlockedCount(b) / b.achievements.length - unlockedCount(a) / a.achievements.length)
          .map((g) => {
            const pct = Math.round((unlockedCount(g) / g.achievements.length) * 100);
            const Icon = g.icon;
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => onOpen(g.id)}
                  className="flex w-full items-center gap-3 rounded-lg bg-black/20 p-2.5 text-left transition-colors hover:bg-white/5"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gradient-to-br ${g.cover}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100">{g.title}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="w-16 text-right text-xs text-slate-400">
                    {unlockedCount(g)}/{g.achievements.length}
                  </span>
                </button>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

function DownloadBar({ games, downloads }: { games: Game[]; downloads: Record<string, number> }) {
  const ids = Object.keys(downloads);
  if (ids.length === 0) return null;
  const first = games.find((g) => g.id === ids[0]);
  return (
    <footer className="flex h-9 shrink-0 items-center gap-3 border-t border-black/40 bg-[#171d25] px-4 text-xs">
      <Download className="h-3.5 w-3.5 animate-pulse text-sky-400" />
      <span className="truncate text-slate-300">
        Downloading {first?.title}
        {ids.length > 1 ? ` and ${ids.length - 1} more` : ''}
      </span>
      <span className="ml-auto h-1.5 w-40 overflow-hidden rounded-full bg-slate-800">
        <span className="block h-full bg-sky-400 transition-all" style={{ width: `${downloads[ids[0]]}%` }} />
      </span>
      <span className="w-9 text-right font-mono text-slate-400">{Math.floor(downloads[ids[0]])}%</span>
    </footer>
  );
}
