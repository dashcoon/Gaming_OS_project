import { APP_META } from '@/data/apps';
import type { AppDefinition, AppId } from '@/types/os';
import AboutApp from './AboutApp';
import FileExplorer from './FileExplorer';
import FirefoxBrowser from './FirefoxBrowser';
import SettingsApp from './SettingsApp';
import SteamClient from './SteamClient';
import TerminalApp from './TerminalApp';

/** Every preinstalled app: metadata plus the component rendered inside its window. */
export const APPS: Record<AppId, AppDefinition> = {
  steam: { ...APP_META.steam, component: SteamClient },
  firefox: { ...APP_META.firefox, component: FirefoxBrowser },
  terminal: { ...APP_META.terminal, component: TerminalApp },
  files: { ...APP_META.files, component: FileExplorer },
  settings: { ...APP_META.settings, component: SettingsApp },
  about: { ...APP_META.about, component: AboutApp },
};
