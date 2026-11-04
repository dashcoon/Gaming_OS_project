import Desktop from '@/components/Desktop';
import { SettingsProvider } from '@/context/SettingsContext';
import { SystemProvider } from '@/context/SystemContext';

/** Root desktop mount: global providers wrap the desktop/window manager. */
export default function Index() {
  return (
    <SettingsProvider>
      <SystemProvider>
        <Desktop />
      </SystemProvider>
    </SettingsProvider>
  );
}
