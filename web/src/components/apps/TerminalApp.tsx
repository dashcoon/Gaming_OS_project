import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { APP_META, APP_ORDER, resolveAppId } from '@/data/apps';
import { useSettings } from '@/context/SettingsContext';
import { TOTAL_RAM_GB, useSystem } from '@/context/SystemContext';
import { useWindowManager } from '@/context/WindowManagerContext';
import type { Game } from '@/types/game';
import type { AppId } from '@/types/os';

interface Line {
  id: number;
  kind: 'input' | 'output' | 'error';
  content: ReactNode;
}

const USER = 'player';
const HOST = 'gamingos';

const COMMANDS: Record<string, string> = {
  help: 'Show this help',
  neofetch: 'Show system information',
  clear: 'Clear the screen',
  launch: 'launch <app> — open an app (steam, firefox, terminal, files, settings, about)',
  ps: 'List running processes',
  kill: 'kill <pid|app> — close an app window or quit the running game',
  steam: 'steam [list | play <game> | install <game> | stop] — control the Steam client',
  echo: 'echo <text> — print text',
  whoami: 'Print the current user',
  date: 'Print the date and time',
  uname: 'uname [-a] — print system information',
  uptime: 'Show how long the system has been running',
  history: 'Show command history',
  exit: 'Close the terminal',
};

const ASCII_LOGO = [
  '      ▄▄████████▄▄      ',
  '   ▄██████████████▄   ',
  '  ████  ██████  ▀▀██  ',
  ' ██▀▀    ████  ▄▄  ██ ',
  ' ██▄▄    ████  ▀▀  ██ ',
  '  ████  ██████  ▄▄██  ',
  '   ▀████▀▀  ▀▀████▀   ',
  '     ▀▀        ▀▀     ',
];

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m} min${m === 1 ? '' : 's'}` : `${s} secs`;
}

function findGame(games: Game[], query: string): Game | undefined {
  const q = query.toLowerCase().trim();
  if (!q) return undefined;
  return (
    games.find((g) => g.id === q || g.title.toLowerCase() === q) ??
    games.find((g) => g.title.toLowerCase().startsWith(q) || g.id.startsWith(q)) ??
    games.find((g) => g.title.toLowerCase().includes(q))
  );
}

/** Simulated gaming shell with neofetch, process list and app/game control. */
export default function TerminalApp() {
  const wm = useWindowManager();
  const system = useSystem();
  const { settings } = useSettings();
  const [lines, setLines] = useState<Line[]>(() => [
    { id: 0, kind: 'output', content: <span className="text-slate-400">GamingOS Terminal — type <Cmd>help</Cmd> to get started.</span> },
  ]);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const print = (content: ReactNode, kind: Line['kind'] = 'output') =>
    setLines((ls) => [...ls, { id: nextId.current++, kind, content }]);

  const processes = () => {
    const base = [
      { pid: 1, name: 'systemd', cpu: 0.1, mem: 12 },
      { pid: 402, name: 'gamingos-wm', cpu: 1.2, mem: 186 },
      { pid: 418, name: 'pipewire', cpu: 0.4, mem: 24 },
      { pid: 512, name: 'gamemoded', cpu: 0.0, mem: 6 },
    ];
    const apps = wm.windows.map((w, i) => ({
      pid: 1100 + APP_ORDER.indexOf(w.id) * 37 + i,
      name: w.id === 'steam' ? 'steam' : w.id === 'files' ? 'explorer' : w.id,
      cpu: w.id === 'firefox' ? 3.8 : 0.8,
      mem: w.id === 'firefox' ? 640 : w.id === 'steam' ? 420 : 96,
      app: w.id,
      state: w.isMinimized ? 'S' : 'R',
    }));
    const game = system.running ? system.games.find((g) => g.id === system.running?.gameId) : undefined;
    const gameProc = game
      ? [{ pid: 4242, name: game.title.replace(/[^A-Za-z0-9]/g, '') + '.exe', cpu: Math.round(system.stats.cpu * 10) / 10, mem: 9800 }]
      : [];
    return { base, apps, gameProc };
  };

  const run = (raw: string) => {
    const [cmd = '', ...args] = raw.trim().split(/\s+/);
    const rest = args.join(' ');
    switch (cmd.toLowerCase()) {
      case '':
        return;
      case 'help':
        print(
          <div className="grid grid-cols-[110px_1fr] gap-x-4">
            {Object.entries(COMMANDS).map(([name, desc]) => (
              <div key={name} className="contents">
                <Cmd>{name}</Cmd>
                <span className="text-slate-400">{desc}</span>
              </div>
            ))}
          </div>,
        );
        return;
      case 'clear':
        setLines([]);
        return;
      case 'neofetch':
        print(neofetch());
        return;
      case 'launch':
      case 'open': {
        if (!rest) {
          print(
            <span>
              Usage: launch &lt;app&gt;. Apps: {APP_ORDER.map((id) => <Cmd key={id}>{id} </Cmd>)}
            </span>,
          );
          return;
        }
        const id = resolveAppId(rest);
        if (!id) {
          print(`launch: no such app: ${rest}`, 'error');
          return;
        }
        wm.openApp(id);
        print(<span className="text-emerald-400">Launching {APP_META[id].title}…</span>);
        return;
      }
      case 'ps': {
        const { base, apps, gameProc } = processes();
        const rows = [
          ...base.map((p) => ({ ...p, state: 'S' })),
          ...apps,
          ...gameProc.map((p) => ({ ...p, state: 'R' })),
        ];
        print(
          <table className="border-separate border-spacing-x-4">
            <thead className="text-slate-500">
              <tr>
                <th className="text-right font-normal">PID</th>
                <th className="text-left font-normal">STAT</th>
                <th className="text-right font-normal">%CPU</th>
                <th className="text-right font-normal">MEM</th>
                <th className="text-left font-normal">COMMAND</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.pid} className={p.pid === 4242 ? 'text-accent' : ''}>
                  <td className="text-right">{p.pid}</td>
                  <td>{p.state}</td>
                  <td className="text-right">{p.cpu.toFixed(1)}</td>
                  <td className="text-right">{p.mem}M</td>
                  <td>{p.name}</td>
                </tr>
              ))}
            </tbody>
          </table>,
        );
        return;
      }
      case 'kill': {
        if (!rest) {
          print('Usage: kill <pid|app>', 'error');
          return;
        }
        const { apps, gameProc } = processes();
        const runningId = system.running?.gameId;
        const killsGame =
          gameProc.some((p) => String(p.pid) === rest) ||
          (runningId !== undefined && findGame(system.games, rest)?.id === runningId);
        if (killsGame) {
          system.stopGame();
          print('Game process terminated.');
          return;
        }
        const target = apps.find((p) => String(p.pid) === rest)?.app ?? resolveAppId(rest);
        if (target && wm.windows.some((w) => w.id === target)) {
          if (target === 'terminal') print('kill: refusing to kill the current shell (use exit)', 'error');
          else {
            wm.closeApp(target as AppId);
            print(`Terminated ${APP_META[target as AppId].title}.`);
          }
          return;
        }
        print(`kill: (${rest}) - No such process`, 'error');
        return;
      }
      case 'steam':
        runSteam(args);
        return;
      case 'echo':
        print(rest);
        return;
      case 'whoami':
        print(USER);
        return;
      case 'date':
        print(new Date().toString());
        return;
      case 'uname':
        print(args.includes('-a') ? `GamingOS ${HOST} 6.18.4-gaming #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux` : 'GamingOS');
        return;
      case 'uptime':
        print(`up ${formatUptime(Date.now() - system.bootTime)}, 1 user, load average: ${(system.stats.cpu / 25).toFixed(2)}`);
        return;
      case 'history':
        print(
          <ol className="list-inside list-decimal text-slate-300">
            {cmdHistory.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ol>,
        );
        return;
      case 'sudo':
        print(`${USER} is not in the sudoers file. This incident will be reported to the raid leader.`, 'error');
        return;
      case 'exit':
        wm.closeApp('terminal');
        return;
      default:
        print(`${cmd}: command not found. Type 'help' for a list of commands.`, 'error');
    }
  };

  const runSteam = (args: string[]) => {
    const [sub = '', ...rest] = args;
    const query = rest.join(' ');
    switch (sub.toLowerCase()) {
      case '':
        wm.openApp('steam');
        print(
          <span>
            Steam client started. {system.games.filter((g) => g.installed).length} of {system.games.length} games installed. Try{' '}
            <Cmd>steam list</Cmd>.
          </span>,
        );
        return;
      case 'list':
      case 'ls':
        print(
          <table className="border-separate border-spacing-x-3">
            <tbody>
              {system.games.map((g) => {
                const status = system.gameStatus(g.id);
                return (
                  <tr key={g.id}>
                    <td className="text-slate-500">{g.id}</td>
                    <td>{g.title}</td>
                    <td className={g.installed ? 'text-emerald-400' : 'text-slate-500'}>
                      {status === 'running'
                        ? 'RUNNING'
                        : status === 'installing'
                          ? `INSTALLING ${Math.floor(system.downloads[g.id] ?? 0)}%`
                          : g.installed
                            ? 'installed'
                            : 'not installed'}
                    </td>
                    <td className="text-right text-slate-500">{g.playtimeHours.toFixed(1)}h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>,
        );
        return;
      case 'play':
      case 'run':
      case 'launch': {
        const game = findGame(system.games, query);
        if (!game) return print(`steam: no game matching "${query}"`, 'error');
        if (!game.installed) return print(`steam: ${game.title} is not installed. Run: steam install ${game.id}`, 'error');
        system.launchGame(game.id);
        print(<span className="text-emerald-400">Launching {game.title} (Proton Experimental, {settings.performanceMode} mode)…</span>);
        return;
      }
      case 'install': {
        const game = findGame(system.games, query);
        if (!game) return print(`steam: no game matching "${query}"`, 'error');
        if (game.installed) return print(`${game.title} is already installed.`);
        system.installGame(game.id);
        print(`Queued ${game.title} (${game.sizeGB.toFixed(1)} GB) for download.`);
        return;
      }
      case 'stop':
      case 'quit':
        if (!system.running) return print('No game is running.');
        system.stopGame();
        print('Game stopped.');
        return;
      default:
        print(`steam: unknown subcommand "${sub}". Use list, play, install or stop.`, 'error');
    }
  };

  const complete = () => {
    const parts = input.split(' ');
    if (parts.length === 1) {
      const matches = Object.keys(COMMANDS).filter((c) => c.startsWith(parts[0]));
      if (matches.length === 1) setInput(`${matches[0]} `);
      else if (matches.length > 1) print(matches.join('  '));
      return;
    }
    const last = parts[parts.length - 1].toLowerCase();
    const candidates =
      parts[0] === 'launch' || parts[0] === 'open'
        ? [...APP_ORDER]
        : parts[0] === 'steam' && parts.length === 2
          ? ['list', 'play', 'install', 'stop']
          : parts[0] === 'steam'
            ? system.games.map((g) => g.id)
            : [];
    const matches = candidates.filter((c) => c.startsWith(last));
    if (matches.length === 1) setInput([...parts.slice(0, -1), matches[0]].join(' ') + ' ');
    else if (matches.length > 1) print(matches.join('  '));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = input;
      print(<Prompt>{value}</Prompt>, 'input');
      if (value.trim()) setCmdHistory((h) => [...h, value]);
      setHistoryIndex(null);
      setInput('');
      run(value);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const i = historyIndex === null ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(i);
      setInput(cmdHistory[i]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === null) return;
      const i = historyIndex + 1;
      if (i >= cmdHistory.length) {
        setHistoryIndex(null);
        setInput('');
      } else {
        setHistoryIndex(i);
        setInput(cmdHistory[i]);
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div
      ref={scrollRef}
      onClick={() => window.getSelection()?.isCollapsed && inputRef.current?.focus()}
      className="scroll-thin h-full cursor-text overflow-y-auto bg-black/85 p-3 font-mono text-[13px] leading-relaxed text-slate-200"
    >
      {lines.map((l) => (
        <div key={l.id} className={`whitespace-pre-wrap break-words ${l.kind === 'error' ? 'text-rose-400' : ''}`}>
          {l.content}
        </div>
      ))}
      <div className="flex">
        <Prompt />
        <input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          aria-label="Terminal input"
          className="min-w-0 flex-1 bg-transparent text-slate-100 caret-accent outline-none"
        />
      </div>
    </div>
  );

  /** Snapshot of system info at the moment the command ran. */
  function neofetch() {
    const { stats, games, bootTime } = system;
    const accentName = settings.accent.replace('-', ' ');
    const info: [string, string][] = [
      ['OS', 'GamingOS 2.0 "Overdrive" x86_64'],
      ['Host', 'Custom Gaming Rig (B650E)'],
      ['Kernel', '6.18.4-gaming'],
      ['Uptime', formatUptime(Date.now() - bootTime)],
      ['Packages', `${games.filter((g) => g.installed).length} games (steam), 1337 (rpm)`],
      ['Shell', 'gsh 1.0'],
      ['Resolution', `${window.screen.width}x${window.screen.height} @ 165Hz`],
      ['WM', 'GamingOS WM (glass)'],
      ['Theme', `${accentName} [dark]`],
      ['CPU', `AMD Ryzen 9 7950X3D (32) @ 5.7GHz · ${Math.round(stats.cpu)}%`],
      ['GPU', `NVIDIA GeForce RTX 4090 24GB · ${Math.round(stats.gpu)}%`],
      ['Memory', `${((stats.ram / 100) * TOTAL_RAM_GB * 1024).toFixed(0)}MiB / ${TOTAL_RAM_GB * 1024}MiB`],
      ['Mode', settings.performanceMode],
    ];
    return (
      <div className="flex flex-wrap gap-6 py-1">
        <pre className="bg-gradient-to-b from-accent to-accent-2 bg-clip-text font-mono leading-tight text-transparent">
          {ASCII_LOGO.join('\n')}
        </pre>
        <div>
          <p>
            <span className="font-bold text-accent">{USER}</span>@<span className="font-bold text-accent">{HOST}</span>
          </p>
          <p className="text-slate-600">-----------------</p>
          {info.map(([k, v]) => (
            <p key={k}>
              <span className="font-bold text-accent">{k}</span>: {v}
            </p>
          ))}
          <p className="mt-1 flex gap-0">
            {['bg-slate-900', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-400', 'bg-sky-500', 'bg-fuchsia-500', 'bg-cyan-400', 'bg-slate-200'].map(
              (c) => (
                <span key={c} className={`inline-block h-3.5 w-6 ${c}`} />
              ),
            )}
          </p>
        </div>
      </div>
    );
  }
}

function Prompt({ children }: { children?: ReactNode }) {
  return (
    <span>
      <span className="font-semibold text-emerald-400">
        {USER}@{HOST}
      </span>
      <span className="text-slate-500">:</span>
      <span className="font-semibold text-sky-400">~</span>
      <span className="text-slate-500">$ </span>
      {children}
    </span>
  );
}

function Cmd({ children }: { children: ReactNode }) {
  return <span className="text-accent">{children}</span>;
}
