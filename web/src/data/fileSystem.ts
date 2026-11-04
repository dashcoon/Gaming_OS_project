import { INITIAL_GAMES } from '@/data/games';

export type FileKind =
  | 'drive'
  | 'folder'
  | 'executable'
  | 'text'
  | 'image'
  | 'video'
  | 'archive'
  | 'config'
  | 'save'
  | 'audio';

export interface FSNode {
  id: string;
  name: string;
  kind: FileKind;
  /** Size in bytes (files only; folder sizes are summed on demand). */
  size?: number;
  modified: string;
  /** Text preview shown in the properties pane. */
  content?: string;
  /** Executables that start a Steam game. */
  gameId?: string;
  children?: FSNode[];
}

const MB = 1024 * 1024;
const GB = 1024 * MB;

let counter = 0;
const uid = (name: string) => `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${counter++}`;

function folder(name: string, children: FSNode[], modified = '2026-10-28 18:42'): FSNode {
  return { id: uid(name), name, kind: 'folder', modified, children };
}

function file(name: string, kind: FileKind, size: number, modified: string, extra: Partial<FSNode> = {}): FSNode {
  return { id: uid(name), name, kind, size, modified, ...extra };
}

const exeName = (title: string) => `${title.replace(/[^A-Za-z0-9]/g, '')}.exe`;

const steamGameFolders = INITIAL_GAMES.filter((g) => g.installed).map((g) =>
  folder(g.title.replace(':', ''), [
    file(exeName(g.title), 'executable', Math.round(g.sizeGB * 0.012 * GB), '2026-10-20 09:12', {
      gameId: g.id,
    }),
    folder('Data', [
      file('assets.pak', 'archive', Math.round(g.sizeGB * 0.82 * GB), '2026-10-20 09:12'),
      file('shaders.cache', 'archive', Math.round(g.sizeGB * 0.04 * GB), '2026-11-01 21:03'),
    ]),
    file('settings.ini', 'config', 4096, '2026-11-02 22:15', {
      content: `[Graphics]\nResolution=2560x1440\nRefreshRate=165\nVSync=Off\nPreset=Ultra\nRayTracing=On\nUpscaler=Quality\n\n[Game]\nTitle=${g.title}`,
    }),
  ]),
);

export const FILE_SYSTEM: FSNode = folder('This PC', [
  {
    ...folder('C:', [
      folder('Games', [
        folder('Steam', [
          file('steam.exe', 'executable', 4.2 * MB, '2026-10-30 08:00'),
          folder('steamapps', [folder('common', steamGameFolders)]),
          folder('screenshots', [
            file('neon_drift_photo_mode.png', 'image', 8.4 * MB, '2026-11-03 23:51'),
            file('ember_rift_boss_kill.png', 'image', 6.1 * MB, '2026-11-01 01:12'),
          ]),
          file('libraryfolders.vdf', 'config', 1200, '2026-10-30 08:00', {
            content: '"libraryfolders"\n{\n  "0"\n  {\n    "path"  "C:\\\\Games\\\\Steam"\n  }\n}',
          }),
        ]),
        folder('Emulators', [file('README.txt', 'text', 812, '2026-06-14 12:00', { content: 'Bring your own BIOS files.' })]),
      ]),
      folder('Users', [
        folder('Player', [
          folder('Downloads', [
            file('GPU_Driver_566.14.exe', 'executable', 712 * MB, '2026-11-02 10:22'),
            file('mod_pack_v3.zip', 'archive', 1.4 * GB, '2026-10-29 16:40'),
            file('controller_layout.png', 'image', 820 * 1024, '2026-10-27 13:05'),
            file('patch_notes_2.1.txt', 'text', 6 * 1024, '2026-10-25 19:30', {
              content:
                'Patch 2.1\n- Improved frame pacing on high refresh displays\n- Fixed shader stutter on first launch\n- Added photo mode filters',
            }),
          ]),
          folder('Documents', [
            folder('My Games', [
              folder('Ember Rift', [
                file('save_slot_1.sav', 'save', 2.3 * MB, '2026-11-02 23:59'),
                file('save_slot_2.sav', 'save', 2.1 * MB, '2026-10-30 21:15'),
              ]),
              folder('Neon Drift', [file('garage.sav', 'save', 640 * 1024, '2026-11-04 00:41')]),
            ]),
            file('tournament_schedule.txt', 'text', 2 * 1024, '2026-10-31 11:11', {
              content: 'Velocity League Open\n- Qualifiers: Nov 8\n- Group stage: Nov 15\n- Finals: Nov 22 (LAN)',
            }),
            file('build_list.txt', 'text', 1024, '2026-09-12 17:45', {
              content: 'Next upgrade:\n- 4 TB NVMe for the backlog\n- 240 Hz OLED monitor\n- Better mic arm',
            }),
          ]),
          folder('Videos', [
            file('clutch_1v4.mp4', 'video', 420 * MB, '2026-11-03 22:10'),
            file('speedrun_pb.mp4', 'video', 1.9 * GB, '2026-10-22 02:44'),
          ]),
          folder('Music', [file('lofi_racing_mix.flac', 'audio', 88 * MB, '2026-08-01 20:00')]),
        ]),
      ]),
      folder('Windows', [file('notepad.exe', 'executable', 360 * 1024, '2026-01-01 00:00')], '2026-01-01 00:00'),
    ]),
    kind: 'drive',
    size: 2 * 1000 * GB,
  },
  {
    ...folder('D:', [folder('Backups', [file('saves_backup_oct.zip', 'archive', 3.2 * GB, '2026-10-01 03:00')])]),
    kind: 'drive',
    size: 4 * 1000 * GB,
  },
]);

/** Sum of the sizes of every file under a node. */
export function nodeSize(node: FSNode): number {
  if (!node.children) return node.size ?? 0;
  return node.children.reduce((sum, c) => sum + nodeSize(c), 0);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[i]}`;
}

/** Path of node ids from the root to the node with `id` (inclusive), or null. */
export function findPath(root: FSNode, id: string): FSNode[] | null {
  if (root.id === id) return [root];
  for (const child of root.children ?? []) {
    const sub = findPath(child, id);
    if (sub) return [root, ...sub];
  }
  return null;
}

/** Finds a node by display path such as "C:/Games/Steam". */
export function findByPath(root: FSNode, path: string): FSNode | null {
  const parts = path.split('/').filter(Boolean);
  let node: FSNode | undefined = root;
  for (const part of parts) {
    node = node?.children?.find((c) => c.name.toLowerCase() === part.toLowerCase());
    if (!node) return null;
  }
  return node ?? null;
}

export function displayPath(nodes: FSNode[]): string {
  const [, ...rest] = nodes; // drop "This PC"
  if (rest.length === 0) return 'This PC';
  return rest.map((n) => n.name).join('/') + (rest.length === 1 ? '/' : '');
}
