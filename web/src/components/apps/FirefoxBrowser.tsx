import { useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ExternalLink,
  Globe,
  History,
  Home,
  Lock,
  Plus,
  RotateCw,
  Search,
  ShieldAlert,
  Star,
  Trash2,
  X,
} from 'lucide-react';

const HOME = 'about:home';

interface Tab {
  id: number;
  history: string[];
  index: number;
}

interface HistoryEntry {
  url: string;
  title: string;
  time: Date;
}

const BOOKMARKS: { title: string; url: string }[] = [
  { title: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Video_game' },
  { title: 'Example', url: 'https://example.com' },
  { title: 'Steam Store', url: 'https://store.steampowered.com' },
  { title: 'YouTube', url: 'https://www.youtube.com' },
  { title: 'GitHub', url: 'https://github.com' },
  { title: 'Reddit', url: 'https://www.reddit.com/r/pcgaming' },
  { title: 'Twitch', url: 'https://www.twitch.tv' },
];

/** Sites that send X-Frame-Options / frame-ancestors and therefore can't render in an iframe. */
const BLOCKED_HOSTS = [
  'google.com',
  'youtube.com',
  'github.com',
  'reddit.com',
  'x.com',
  'twitter.com',
  'facebook.com',
  'instagram.com',
  'steampowered.com',
  'steamcommunity.com',
  'twitch.tv',
  'discord.com',
  'amazon.com',
  'netflix.com',
  'linkedin.com',
  'stackoverflow.com',
  'duckduckgo.com',
  'bing.com',
  'epicgames.com',
  'microsoft.com',
  'apple.com',
];

const NEWS = [
  { tag: 'Hardware', title: 'Next-gen GPUs push path tracing into the mainstream', time: '2h ago' },
  { tag: 'Patch notes', title: 'Neon Drift 2.1 fixes shader stutter on first launch', time: '5h ago' },
  { tag: 'Esports', title: 'Velocity League Open qualifiers start this weekend', time: '1d ago' },
  { tag: 'Deals', title: 'Autumn sale: up to 80% off strategy and sim titles', time: '1d ago' },
];

/** Turns URL-bar input into a URL: internal pages, bare domains, or a search. */
export function normalizeUrl(input: string): string {
  const value = input.trim();
  if (!value) return HOME;
  if (value.startsWith('about:')) return value;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value;
  if (/^[^\s]+\.[^\s]{2,}$/.test(value)) return `https://${value}`;
  return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(value)}`;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function isBlocked(url: string): boolean {
  if (/youtube\.com\/embed\//.test(url)) return false;
  const host = hostOf(url);
  return BLOCKED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

function titleFor(url: string): string {
  if (url === HOME) return 'New Tab';
  if (url === 'about:history') return 'History';
  const bookmark = BOOKMARKS.find((b) => b.url === url);
  if (bookmark) return bookmark.title;
  const search = /[?&]search=([^&]+)/.exec(url);
  if (search) return `${decodeURIComponent(search[1].replace(/\+/g, ' '))} – Search`;
  return hostOf(url);
}

let nextTabId = 1;
const newTab = (url = HOME): Tab => ({ id: nextTabId++, history: [url], index: 0 });

/** Firefox-style browser: tabs, URL bar, history, bookmarks and iframe navigation with fallback cards. */
export default function FirefoxBrowser() {
  const [tabs, setTabs] = useState<Tab[]>(() => [newTab()]);
  const [activeId, setActiveId] = useState(tabs[0].id);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [draft, setDraft] = useState<string | null>(null);

  const tab = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const url = tab.history[tab.index];

  const updateTab = (id: number, fn: (t: Tab) => Tab) => setTabs((ts) => ts.map((t) => (t.id === id ? fn(t) : t)));

  const navigate = (raw: string) => {
    const target = normalizeUrl(raw);
    updateTab(tab.id, (t) => ({ ...t, history: [...t.history.slice(0, t.index + 1), target], index: t.index + 1 }));
    if (!target.startsWith('about:')) {
      setHistory((h) => [{ url: target, title: titleFor(target), time: new Date() }, ...h].slice(0, 100));
    }
    setDraft(null);
  };

  const go = (delta: number) =>
    updateTab(tab.id, (t) => ({ ...t, index: Math.min(Math.max(0, t.index + delta), t.history.length - 1) }));

  const addTab = () => {
    const t = newTab();
    setTabs((ts) => [...ts, t]);
    setActiveId(t.id);
    setDraft(null);
  };

  const closeTab = (id: number) => {
    if (tabs.length === 1) {
      const fresh = newTab();
      setTabs([fresh]);
      setActiveId(fresh.id);
      return;
    }
    const index = tabs.findIndex((t) => t.id === id);
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (id === tab.id) setActiveId(remaining[Math.max(0, index - 1)].id);
    setDraft(null);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate(draft ?? url);
  };

  const secure = url.startsWith('https://');
  const bookmarked = BOOKMARKS.some((b) => b.url === url);

  return (
    <div className="flex h-full flex-col bg-[#1c1b22] text-slate-200">
      {/* Tab strip */}
      <div className="flex h-9 shrink-0 items-end gap-1 bg-[#0f0e13] px-2 pt-1">
        {tabs.map((t) => {
          const tUrl = t.history[t.index];
          const active = t.id === tab.id;
          return (
            <div
              key={t.id}
              className={`group flex h-8 min-w-0 max-w-[200px] flex-1 items-center gap-2 rounded-t-md px-2.5 text-xs transition-colors ${
                active ? 'bg-[#2b2a33] text-slate-100' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveId(t.id);
                  setDraft(null);
                }}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                {tUrl.startsWith('about:') ? (
                  <Globe className="h-3.5 w-3.5 shrink-0 text-accent" />
                ) : (
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm bg-accent/30 text-[8px] font-bold uppercase">
                    {hostOf(tUrl)[0]}
                  </span>
                )}
                <span className="truncate">{titleFor(tUrl)}</span>
              </button>
              <button
                type="button"
                aria-label="Close tab"
                onClick={() => closeTab(t.id)}
                className="rounded p-0.5 opacity-60 hover:bg-white/10 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
        <button type="button" onClick={addTab} aria-label="New tab" className="mb-1 rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation bar */}
      <form onSubmit={onSubmit} className="flex h-10 shrink-0 items-center gap-1 bg-[#2b2a33] px-2">
        <NavButton label="Back" disabled={tab.index === 0} onClick={() => go(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </NavButton>
        <NavButton label="Forward" disabled={tab.index >= tab.history.length - 1} onClick={() => go(1)}>
          <ArrowRight className="h-4 w-4" />
        </NavButton>
        <NavButton label="Reload" onClick={() => setReloadKey((k) => k + 1)}>
          <RotateCw className="h-4 w-4" />
        </NavButton>
        <NavButton label="Home" onClick={() => navigate(HOME)}>
          <Home className="h-4 w-4" />
        </NavButton>
        <label className="mx-1 flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md bg-[#1c1b22] px-2.5 ring-accent/60 focus-within:ring-2">
          {url.startsWith('about:') ? (
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          ) : secure ? (
            <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          ) : (
            <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          )}
          <input
            value={draft ?? (url === HOME ? '' : url)}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="Search Wikipedia or enter address"
            aria-label="Address bar"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-slate-100 outline-none placeholder:text-slate-500"
          />
          <Star className={`h-3.5 w-3.5 shrink-0 ${bookmarked ? 'fill-accent text-accent' : 'text-slate-500'}`} />
        </label>
        <NavButton label="History" active={showHistory} onClick={() => setShowHistory((s) => !s)}>
          <History className="h-4 w-4" />
        </NavButton>
      </form>

      {/* Bookmarks bar */}
      <div className="flex h-7 shrink-0 items-center gap-1 overflow-x-auto border-b border-black/40 bg-[#2b2a33] px-2 text-xs">
        {BOOKMARKS.map((b) => (
          <button
            key={b.url}
            type="button"
            onClick={() => navigate(b.url)}
            className="flex shrink-0 items-center gap-1.5 rounded px-2 py-0.5 text-slate-300 hover:bg-white/10"
          >
            <BookOpen className="h-3 w-3 text-slate-500" />
            {b.title}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1 bg-white">
          {url === HOME ? (
            <NewTabPage onNavigate={navigate} />
          ) : url === 'about:history' ? (
            <HistoryPage history={history} onNavigate={navigate} />
          ) : url.startsWith('about:') ? (
            <FallbackCard url={url} reason="unknown" onBack={() => go(-1)} />
          ) : isBlocked(url) ? (
            <FallbackCard url={url} reason="blocked" onBack={() => go(-1)} />
          ) : (
            <>
              <iframe
                key={`${tab.id}-${tab.index}-${reloadKey}`}
                src={url}
                title={titleFor(url)}
                className="h-full w-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                referrerPolicy="no-referrer"
              />
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-slate-900/85 px-3 py-1 text-[11px] text-slate-300 shadow-lg ring-1 ring-white/10 hover:text-white"
              >
                Page blank? Open in a new tab <ExternalLink className="h-3 w-3" />
              </a>
            </>
          )}
        </div>

        {showHistory && (
          <aside className="scroll-thin w-64 shrink-0 overflow-y-auto border-l border-black/40 bg-[#1c1b22]">
            <div className="flex items-center justify-between p-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">History</h2>
              <button
                type="button"
                onClick={() => setHistory([])}
                disabled={history.length === 0}
                className="rounded p-1 text-slate-500 hover:bg-white/10 hover:text-slate-200 disabled:opacity-30"
                aria-label="Clear history"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <HistoryList history={history} onNavigate={navigate} compact />
          </aside>
        )}
      </div>
    </div>
  );
}

function NavButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`rounded p-1.5 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent ${
        active ? 'bg-white/10 text-accent' : 'text-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

function NewTabPage({ onNavigate }: { onNavigate: (url: string) => void }) {
  const [q, setQ] = useState('');
  return (
    <div className="scroll-thin h-full overflow-y-auto bg-gradient-to-b from-[#1c1b22] to-[#15141a] px-6 py-10 text-slate-200">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 shadow-lg">
            <Globe className="h-7 w-7 text-white" />
          </span>
          <span className="text-3xl font-bold tracking-tight">Firefox</span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) onNavigate(q);
          }}
          className="mb-10 flex items-center gap-3 rounded-xl bg-[#2b2a33] px-4 py-3 shadow-lg ring-1 ring-white/5 focus-within:ring-2 focus-within:ring-accent/60"
        >
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Wikipedia or enter address"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
            aria-label="Search"
          />
        </form>

        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Shortcuts</h2>
        <div className="mb-10 grid grid-cols-4 gap-3 sm:grid-cols-7">
          {BOOKMARKS.map((b) => (
            <button
              key={b.url}
              type="button"
              onClick={() => onNavigate(b.url)}
              className="flex flex-col items-center gap-2 rounded-lg p-2 text-xs text-slate-300 hover:bg-white/5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2b2a33] text-lg font-bold uppercase text-accent ring-1 ring-white/5">
                {b.title[0]}
              </span>
              <span className="truncate">{b.title}</span>
            </button>
          ))}
        </div>

        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Gaming news</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {NEWS.map((n) => (
            <button
              key={n.title}
              type="button"
              onClick={() => onNavigate(n.title)}
              className="rounded-xl bg-[#2b2a33] p-4 text-left ring-1 ring-white/5 transition-colors hover:ring-accent/40"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">{n.tag}</span>
              <p className="mt-1 text-sm font-semibold leading-snug">{n.title}</p>
              <p className="mt-2 text-[11px] text-slate-500">{n.time}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FallbackCard({ url, reason, onBack }: { url: string; reason: 'blocked' | 'unknown'; onBack: () => void }) {
  const host = hostOf(url);
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-b from-[#1c1b22] to-[#15141a] p-6 text-slate-200">
      <div className="w-full max-w-md rounded-2xl bg-[#2b2a33] p-6 text-center shadow-2xl ring-1 ring-white/5">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20 text-2xl font-bold uppercase text-accent">
          {host[0] ?? '?'}
        </span>
        <h2 className="text-lg font-semibold">{reason === 'blocked' ? host : 'Page not found'}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {reason === 'blocked'
            ? 'This site does not allow itself to be displayed inside another page, so GamingOS can’t show it here. You can still open it in a real browser tab.'
            : `GamingOS doesn’t have a page called ${url}.`}
        </p>
        <p className="mt-3 truncate rounded bg-black/30 px-2 py-1 font-mono text-[11px] text-slate-500">{url}</p>
        <div className="mt-5 flex justify-center gap-2">
          <button type="button" onClick={onBack} className="btn-ghost ring-1 ring-white/10">
            <ArrowLeft className="h-4 w-4" /> Go back
          </button>
          {reason === 'blocked' && (
            <a href={url} target="_blank" rel="noreferrer" className="btn-accent">
              Open in new tab <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryPage({ history, onNavigate }: { history: HistoryEntry[]; onNavigate: (url: string) => void }) {
  return (
    <div className="scroll-thin h-full overflow-y-auto bg-[#1c1b22] p-6 text-slate-200">
      <h1 className="mb-4 text-xl font-semibold">History</h1>
      <HistoryList history={history} onNavigate={onNavigate} />
    </div>
  );
}

function HistoryList({
  history,
  onNavigate,
  compact,
}: {
  history: HistoryEntry[];
  onNavigate: (url: string) => void;
  compact?: boolean;
}) {
  const items = history;
  if (items.length === 0) return <p className="px-3 text-xs text-slate-500">No pages visited yet.</p>;
  return (
    <ul className={compact ? 'px-1 pb-2' : 'space-y-1'}>
      {items.map((h, i) => (
        <li key={`${h.url}-${i}`}>
          <button
            type="button"
            onClick={() => onNavigate(h.url)}
            className="flex w-full flex-col rounded px-2 py-1.5 text-left hover:bg-white/5"
          >
            <span className="truncate text-[13px] text-slate-200">{h.title}</span>
            <span className="flex justify-between gap-2 text-[10px] text-slate-500">
              <span className="truncate">{hostOf(h.url)}</span>
              <span className="shrink-0">{h.time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
