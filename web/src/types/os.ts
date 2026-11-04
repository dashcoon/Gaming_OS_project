import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

export type AppId = 'steam' | 'firefox' | 'terminal' | 'files' | 'settings' | 'about';

/** Half-screen snap zones (Windows 11 style). Full-screen snap uses `isMaximized`. */
export type SnapZone = 'left' | 'right';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface WindowState {
  id: AppId;
  title: string;
  icon: LucideIcon;
  component: ComponentType;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  /** Set while snapped to half the screen; position/size keep the restore bounds. */
  snap: SnapZone | null;
  zIndex: number;
  /** Free-floating bounds, kept while maximized/snapped so restore returns here. */
  position: Point;
  size: Size;
}

export interface AppMeta {
  id: AppId;
  title: string;
  icon: LucideIcon;
  /** Tailwind gradient classes for the dock/desktop icon tile. */
  tile: string;
  /** Extra names accepted by `launch <app>` in the terminal. */
  aliases: string[];
  defaultSize: Size;
  minSize: Size;
}

export interface AppDefinition extends AppMeta {
  component: ComponentType;
}
