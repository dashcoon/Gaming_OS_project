export type WallpaperId = 'nebula' | 'synthwave' | 'aurora' | 'midnight';
export type AccentId = 'cyberpunk-purple' | 'neon-cyan' | 'emerald';
export type PerformanceMode = 'power-saver' | 'balanced' | 'performance';
export type IconClickMode = 'single' | 'double';

export interface Settings {
  wallpaper: WallpaperId;
  accent: AccentId;
  animatedWallpaper: boolean;
  performanceMode: PerformanceMode;
  showFpsOverlay: boolean;
  iconClickMode: IconClickMode;
  masterVolume: number;
  gameVolume: number;
  chatVolume: number;
  muted: boolean;
  spatialAudio: boolean;
}
