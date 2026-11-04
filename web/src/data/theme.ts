import type { AccentId, WallpaperId } from '@/types/settings';

export interface AccentOption {
  id: AccentId;
  name: string;
  /** RGB triplets written into the --accent / --accent-2 CSS variables. */
  rgb: string;
  rgb2: string;
}

export const ACCENTS: AccentOption[] = [
  { id: 'cyberpunk-purple', name: 'Cyberpunk Purple', rgb: '168 85 247', rgb2: '236 72 153' },
  { id: 'neon-cyan', name: 'Neon Cyan', rgb: '34 211 238', rgb2: '59 130 246' },
  { id: 'emerald', name: 'Emerald', rgb: '16 185 129', rgb2: '132 204 22' },
];

export interface WallpaperOption {
  id: WallpaperId;
  name: string;
  /** Base background (Tailwind gradient classes). */
  base: string;
  /** Colors of the three ambient glow orbs. `accent` uses the active accent color. */
  glows: [string, string, string];
}

export const WALLPAPERS: WallpaperOption[] = [
  {
    id: 'nebula',
    name: 'Nebula',
    base: 'bg-gradient-to-br from-slate-950 via-[#0b0620] to-[#020617]',
    glows: ['accent', 'rgb(59 130 246)', 'rgb(236 72 153)'],
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    base: 'bg-gradient-to-b from-[#12002b] via-[#2a0845] to-[#0a0014]',
    glows: ['rgb(236 72 153)', 'rgb(249 115 22)', 'accent'],
  },
  {
    id: 'aurora',
    name: 'Aurora',
    base: 'bg-gradient-to-tr from-[#00110f] via-[#021b2b] to-[#020617]',
    glows: ['rgb(16 185 129)', 'accent', 'rgb(34 211 238)'],
  },
  {
    id: 'midnight',
    name: 'Midnight',
    base: 'bg-gradient-to-b from-black via-slate-950 to-zinc-950',
    glows: ['accent', 'rgb(30 41 59)', 'rgb(71 85 105)'],
  },
];

export function glowColor(value: string, alpha: number): string {
  if (value === 'accent') return `rgb(var(--accent) / ${alpha})`;
  return value.replace(')', ` / ${alpha})`);
}
