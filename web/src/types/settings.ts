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
  showWidgets: boolean;
  bootAnimation: boolean;
  masterVolume: number;
  gameVolume: number;
  chatVolume: number;
  muted: boolean;
  spatialAudio: boolean;
  /** Quick settings (Control Center). */
  wifiEnabled: boolean;
  bluetoothEnabled: boolean;
  doNotDisturb: boolean;
  nightLight: boolean;
  /** Display brightness, 30–100. */
  brightness: number;
}
