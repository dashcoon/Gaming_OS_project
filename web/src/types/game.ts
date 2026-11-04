import type { LucideIcon } from 'lucide-react';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface Game {
  id: string;
  title: string;
  genre: string;
  developer: string;
  releaseYear: number;
  sizeGB: number;
  installed: boolean;
  playtimeHours: number;
  lastPlayed: string | null;
  description: string;
  /** Tailwind gradient classes used as cover art. */
  cover: string;
  icon: LucideIcon;
  tags: string[];
  achievements: Achievement[];
}

export type GameStatus = 'idle' | 'installing' | 'launching' | 'running';
