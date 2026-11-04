import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronRight,
  Download,
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  FolderOpen,
  Gamepad2,
  HardDrive,
  LayoutGrid,
  List,
  Monitor,
  Save,
  Search,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { useSystem } from '@/context/SystemContext';
import { useWindowManager } from '@/context/WindowManagerContext';
import {
  FILE_SYSTEM,
  displayPath,
  findByPath,
  findPath,
  formatBytes,
  nodeSize,
  type FileKind,
  type FSNode,
} from '@/data/fileSystem';

const KIND_ICON: Record<FileKind, LucideIcon> = {
  drive: HardDrive,
  folder: Folder,
  executable: Gamepad2,
  text: FileText,
  image: FileImage,
  video: FileVideo,
  archive: FileArchive,
  config: FileCode,
  save: Save,
  audio: FileAudio,
};

const KIND_COLOR: Record<FileKind, string> = {
  drive: 'text-slate-300',
  folder: 'text-amber-400',
  executable: 'text-accent',
  text: 'text-sky-300',
  image: 'text-pink-400',
  video: 'text-rose-400',
  archive: 'text-orange-300',
  config: 'text-emerald-300',
  save: 'text-cyan-300',
  audio: 'text-violet-300',
};

const KIND_LABEL: Record<FileKind, string> = {
  drive: 'Local Disk',
  folder: 'File folder',
  executable: 'Application',
  text: 'Text Document',
  image: 'Image',
  video: 'Video',
  archive: 'Archive',
  config: 'Configuration file',
  save: 'Game save',
  audio: 'Audio',
};

const QUICK_ACCESS: { label: string; path: string; icon: LucideIcon }[] = [
  { label: 'Steam', path: 'C:/Games/Steam', icon: Gamepad2 },
  { label: 'Downloads', path: 'C:/Users/Player/Downloads', icon: Download },
  { label: 'Documents', path: 'C:/Users/Player/Documents', icon: FileText },
  { label: 'Videos', path: 'C:/Users/Player/Videos', icon: FileVideo },
];

const isContainer = (n: FSNode) => n.kind === 'folder' || n.kind === 'drive';

function NodeIcon({ node, open, className = 'h-4 w-4' }: { node: FSNode; open?: boolean; className?: string }) {
  const Icon = node.kind === 'folder' && open ? FolderOpen : (KIND_ICON[node.kind] ?? File);
  return <Icon className={`${className} shrink-0 ${KIND_COLOR[node.kind]}`} />;
}

/** File explorer with tree navigation, breadcrumb path, search, grid/list views and a properties pane. */
export default function FileExplorer() {
  const { games, launchGame, notify } = useSystem();
  const { openApp } = useWindowManager();
  const [currentId, setCurrentId] = useState(() => findByPath(FILE_SYSTEM, 'C:/Games/Steam')?.id ?? FILE_SYSTEM.id);
  const [back, setBack] = useState<string[]>([]);
  const [forward, setForward] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const path = findPath(FILE_SYSTEM, findByPath(FILE_SYSTEM, 'C:/Games/Steam')?.id ?? '') ?? [];
    return new Set(path.map((n) => n.id));
  });

  const path = useMemo(() => findPath(FILE_SYSTEM, currentId) ?? [FILE_SYSTEM], [currentId]);
  const current = path[path.length - 1];

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? searchUnder(current, q) : (current.children ?? []);
    return [...list].sort((a, b) => Number(isContainer(b)) - Number(isContainer(a)) || a.name.localeCompare(b.name));
  }, [current, query]);

  const selected = selectedId ? (findPath(FILE_SYSTEM, selectedId)?.at(-1) ?? null) : null;

  const navigate = (id: string, record = true) => {
    if (id === currentId) return;
    if (record) {
      setBack((b) => [...b, currentId]);
      setForward([]);
    }
    setCurrentId(id);
    setSelectedId(null);
    setQuery('');
    const p = findPath(FILE_SYSTEM, id) ?? [];
    setExpanded((prev) => new Set([...prev, ...p.map((n) => n.id)]));
  };

  const goBack = () => {
    const prev = back.at(-1);
    if (!prev) return;
    setBack((b) => b.slice(0, -1));
    setForward((f) => [currentId, ...f]);
    navigate(prev, false);
  };

  const goForward = () => {
    const [next, ...rest] = forward;
    if (!next) return;
    setForward(rest);
    setBack((b) => [...b, currentId]);
    navigate(next, false);
  };

  const goUp = () => path.length > 1 && navigate(path[path.length - 2].id);

  const openNode = (node: FSNode) => {
    if (isContainer(node)) return navigate(node.id);
    if (node.kind === 'executable') {
      if (node.name === 'steam.exe') return openApp('steam');
      if (node.gameId) {
        const game = games.find((g) => g.id === node.gameId);
        if (game && launchGame(game.id)) return;
      }
      notify({ title: 'Can’t open file', body: `${node.name} isn’t a GamingOS app.` });
      return;
    }
    setSelectedId(node.id);
  };

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex h-full flex-col bg-slate-950/40 text-slate-200">
      {/* Toolbar */}
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-slate-700/50 px-2">
        <ToolButton label="Back" disabled={back.length === 0} onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Forward" disabled={forward.length === 0} onClick={goForward}>
          <ArrowRight className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Up" disabled={path.length <= 1} onClick={goUp}>
          <ArrowUp className="h-4 w-4" />
        </ToolButton>

        <nav aria-label="Path" className="mx-1 flex h-7 min-w-0 flex-1 items-center overflow-hidden rounded-md bg-slate-900/70 px-2 text-xs ring-1 ring-slate-700/50">
          <Monitor className="mr-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
          {path.map((n, i) => (
            <span key={n.id} className="flex min-w-0 items-center">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-slate-600" />}
              <button type="button" onClick={() => navigate(n.id)} className="truncate rounded px-1 py-0.5 hover:bg-white/10">
                {n.name}
              </button>
            </span>
          ))}
        </nav>

        <label className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${current.name}`}
            aria-label="Search files"
            className="input h-7 w-44 py-0 pl-7 text-xs"
          />
        </label>
        <ToolButton label="List view" active={view === 'list'} onClick={() => setView('list')}>
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Grid view" active={view === 'grid'} onClick={() => setView('grid')}>
          <LayoutGrid className="h-4 w-4" />
        </ToolButton>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="scroll-thin w-52 shrink-0 overflow-y-auto border-r border-slate-700/50 bg-slate-950/30 py-2 text-[13px]">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Quick access</p>
          {QUICK_ACCESS.map((q) => {
            const node = findByPath(FILE_SYSTEM, q.path);
            if (!node) return null;
            return (
              <button
                key={q.path}
                type="button"
                onClick={() => navigate(node.id)}
                className={`flex w-full items-center gap-2 px-3 py-1 text-left hover:bg-white/5 ${
                  currentId === node.id ? 'bg-accent/20 text-white' : 'text-slate-300'
                }`}
              >
                <q.icon className="h-4 w-4 text-accent" />
                {q.label}
                <Star className="ml-auto h-3 w-3 text-slate-600" />
              </button>
            );
          })}
          <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Folders</p>
          <TreeNode
            node={FILE_SYSTEM}
            depth={0}
            currentId={currentId}
            expanded={expanded}
            onToggle={toggleExpanded}
            onSelect={navigate}
          />
        </aside>

        {/* Content */}
        <main
          className="scroll-thin min-w-0 flex-1 overflow-y-auto p-2"
          onClick={(e) => e.target === e.currentTarget && setSelectedId(null)}
        >
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">{query ? `No items match “${query}”.` : 'This folder is empty.'}</p>
          ) : view === 'list' ? (
            <table className="w-full table-fixed text-left text-[13px]">
              <thead className="sticky top-0 bg-slate-900/90 text-[11px] text-slate-500 backdrop-blur">
                <tr>
                  <th className="w-1/2 px-2 py-1.5 font-medium">Name</th>
                  <th className="px-2 py-1.5 font-medium">Date modified</th>
                  <th className="px-2 py-1.5 font-medium">Type</th>
                  <th className="px-2 py-1.5 text-right font-medium">Size</th>
                </tr>
              </thead>
              <tbody>
                {items.map((n) => (
                  <tr
                    key={n.id}
                    onClick={() => setSelectedId(n.id)}
                    onDoubleClick={() => openNode(n)}
                    className={`cursor-default ${selectedId === n.id ? 'bg-accent/25' : 'hover:bg-white/5'}`}
                  >
                    <td className="truncate px-2 py-1">
                      <span className="flex items-center gap-2">
                        <NodeIcon node={n} />
                        <span className="truncate">{n.name}</span>
                      </span>
                    </td>
                    <td className="truncate px-2 py-1 text-slate-400">{n.modified}</td>
                    <td className="truncate px-2 py-1 text-slate-400">{KIND_LABEL[n.kind]}</td>
                    <td className="px-2 py-1 text-right font-mono text-xs text-slate-400">
                      {isContainer(n) ? '' : formatBytes(n.size ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-1">
              {items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSelectedId(n.id)}
                  onDoubleClick={() => openNode(n)}
                  className={`flex flex-col items-center gap-1 rounded-md p-2 text-center text-xs ${
                    selectedId === n.id ? 'bg-accent/25 ring-1 ring-accent/40' : 'hover:bg-white/5'
                  }`}
                >
                  <NodeIcon node={n} className="h-10 w-10" />
                  <span className="line-clamp-2 break-all">{n.name}</span>
                </button>
              ))}
            </div>
          )}
        </main>

        {/* Properties */}
        <Properties node={selected ?? current} isCurrent={!selected} onOpen={openNode} />
      </div>

      <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-slate-700/50 px-3 text-[11px] text-slate-500">
        <span>{items.length} items</span>
        {selected && <span>1 item selected · {formatBytes(nodeSize(selected))}</span>}
        <span className="ml-auto truncate font-mono">{displayPath(path)}</span>
      </footer>
    </div>
  );
}

function searchUnder(node: FSNode, q: string): FSNode[] {
  const out: FSNode[] = [];
  const walk = (n: FSNode) => {
    for (const c of n.children ?? []) {
      if (c.name.toLowerCase().includes(q)) out.push(c);
      walk(c);
    }
  };
  walk(node);
  return out;
}

function TreeNode({
  node,
  depth,
  currentId,
  expanded,
  onToggle,
  onSelect,
}: {
  node: FSNode;
  depth: number;
  currentId: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const folders = (node.children ?? []).filter(isContainer);
  const isOpen = expanded.has(node.id);
  const isRoot = depth === 0;
  return (
    <div>
      <div
        className={`flex items-center gap-1 py-0.5 pr-2 ${currentId === node.id ? 'bg-accent/20 text-white' : 'text-slate-300 hover:bg-white/5'}`}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        <button
          type="button"
          aria-label={isOpen ? 'Collapse' : 'Expand'}
          onClick={() => onToggle(node.id)}
          className={`rounded p-0.5 hover:bg-white/10 ${folders.length === 0 ? 'invisible' : ''}`}
        >
          <ChevronRight className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
        <button type="button" onClick={() => onSelect(node.id)} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
          {isRoot ? <Monitor className="h-4 w-4 shrink-0 text-sky-300" /> : <NodeIcon node={node} open={isOpen} />}
          <span className="truncate">{node.kind === 'drive' ? `Local Disk (${node.name})` : node.name}</span>
        </button>
      </div>
      {isOpen &&
        folders.map((c) => (
          <TreeNode
            key={c.id}
            node={c}
            depth={depth + 1}
            currentId={currentId}
            expanded={expanded}
            onToggle={onToggle}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

function Properties({ node, isCurrent, onOpen }: { node: FSNode; isCurrent: boolean; onOpen: (n: FSNode) => void }) {
  const p = findPath(FILE_SYSTEM, node.id) ?? [node];
  const location = displayPath(p.slice(0, -1));
  const size = nodeSize(node);
  const childCount = node.children?.length ?? 0;
  const capacity = node.kind === 'drive' ? (node.size ?? 0) : 0;

  return (
    <aside className="scroll-thin hidden w-60 shrink-0 overflow-y-auto border-l border-slate-700/50 bg-slate-950/30 p-4 lg:block">
      <div className="flex flex-col items-center text-center">
        <NodeIcon node={node} className="h-14 w-14" />
        <p className="mt-2 break-all text-sm font-semibold">{node.name}</p>
        <p className="text-xs text-slate-500">{isCurrent && node.id === FILE_SYSTEM.id ? 'Computer' : KIND_LABEL[node.kind]}</p>
      </div>
      <dl className="mt-4 space-y-2 text-xs">
        <Prop label="Location" value={location || '—'} />
        <Prop label={capacity ? 'Used' : 'Size'} value={`${formatBytes(size)}${!isContainer(node) ? ` (${size.toLocaleString()} bytes)` : ''}`} />
        {isContainer(node) && <Prop label="Contains" value={`${childCount} item${childCount === 1 ? '' : 's'}`} />}
        <Prop label="Modified" value={node.modified} />
        {node.gameId && <Prop label="Steam app" value={node.gameId} />}
      </dl>

      {capacity > 0 && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-accent" style={{ width: `${Math.max(2, (size / capacity) * 100)}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {formatBytes(capacity - size)} free of {formatBytes(capacity)}
          </p>
        </div>
      )}

      {node.content && (
        <div className="mt-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Preview</p>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-black/40 p-2 font-mono text-[11px] text-slate-300">
            {node.content}
          </pre>
        </div>
      )}

      {!isCurrent && (isContainer(node) || node.kind === 'executable') && (
        <button type="button" onClick={() => onOpen(node)} className="btn-accent mt-4 w-full">
          {node.kind === 'executable' ? 'Run' : 'Open'}
        </button>
      )}
    </aside>
  );
}

function Prop({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-all text-slate-200">{value}</dd>
    </div>
  );
}

function ToolButton({
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
