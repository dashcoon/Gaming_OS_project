import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import BootScreen from '@/components/BootScreen';
import DesktopContextMenu from '@/components/DesktopContextMenu';
import DesktopIcons from '@/components/DesktopIcons';
import Dock from '@/components/Dock';
import FpsOverlay from '@/components/FpsOverlay';
import LockScreen from '@/components/LockScreen';
import Notifications from '@/components/Notifications';
import Spotlight from '@/components/Spotlight';
import TopBar from '@/components/TopBar';
import Wallpaper from '@/components/Wallpaper';
import Widgets from '@/components/Widgets';
import Window, { snapBounds, type SnapTarget } from '@/components/Window';
import { APPS } from '@/components/apps/registry';
import { useSettings } from '@/context/SettingsContext';
import { WindowManagerContext, type WindowManagerValue } from '@/context/WindowManagerContext';
import { initialWindowsState, windowReducer } from '@/hooks/windowReducer';
import { useViewport } from '@/hooks/useViewport';
import type { AppId } from '@/types/os';

const TOPBAR_HEIGHT = 32;

type SessionPhase = 'boot' | 'lock' | 'desktop';

/** `?session=desktop` (or `lock`) skips the boot animation, e.g. for automated tests. */
function initialPhase(bootAnimation: boolean): SessionPhase {
  const requested = new URLSearchParams(window.location.search).get('session');
  if (requested === 'desktop' || requested === 'lock' || requested === 'boot') return requested;
  return bootAnimation ? 'boot' : 'lock';
}

/** Desktop orchestrator: owns window state and session phase, composes every shell surface. */
export default function Desktop() {
  const { settings } = useSettings();
  const [state, dispatch] = useReducer(windowReducer, initialWindowsState);
  const [phase, setPhase] = useState<SessionPhase>(() => initialPhase(settings.bootAnimation));
  const [bouncing, setBouncing] = useState<Set<AppId>>(new Set());
  const [snapPreview, setSnapPreview] = useState<SnapTarget>(null);
  const [clearToken, setClearToken] = useState(0);
  const [spotlight, setSpotlight] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const viewport = useViewport();
  const area = useMemo(
    () => ({ width: viewport.width, height: viewport.height - TOPBAR_HEIGHT }),
    [viewport.width, viewport.height],
  );

  const windowsRef = useRef(state.windows);
  windowsRef.current = state.windows;

  // The active window is the top-most one that is visible.
  const activeId = useMemo<AppId | null>(() => {
    const visible = state.windows.filter((w) => !w.isMinimized);
    if (visible.length === 0) return null;
    return visible.reduce((top, w) => (w.zIndex > top.zIndex ? w : top)).id;
  }, [state.windows]);

  const bounce = useCallback((id: AppId) => {
    setBouncing((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      setBouncing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 900);
  }, []);

  const openApp = useCallback(
    (id: AppId) => {
      if (!windowsRef.current.some((w) => w.id === id)) bounce(id);
      dispatch({ type: 'open', app: APPS[id], area });
    },
    [area, bounce],
  );

  const lockScreen = useCallback(() => {
    setSpotlight(false);
    setContextMenu(null);
    setPhase('lock');
  }, []);

  const restart = useCallback(() => {
    setSpotlight(false);
    setContextMenu(null);
    dispatch({ type: 'closeAll' });
    setPhase('boot');
  }, []);

  const wm = useMemo<WindowManagerValue>(
    () => ({
      windows: state.windows,
      activeId,
      openApp,
      closeApp: (id) => dispatch({ type: 'close', id }),
      minimizeApp: (id) => dispatch({ type: 'minimize', id }),
      focusApp: (id) => dispatch({ type: 'focus', id }),
      toggleMaximize: (id) => dispatch({ type: 'toggleMaximize', id }),
      minimizeAll: () => dispatch({ type: 'minimizeAll' }),
      closeAll: () => dispatch({ type: 'closeAll' }),
      openSpotlight: () => setSpotlight(true),
      lockScreen,
      restart,
    }),
    [state.windows, activeId, openApp, lockScreen, restart],
  );

  // Global keyboard shortcuts.
  useEffect(() => {
    if (phase !== 'desktop') return;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.code === 'Space' || e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setSpotlight((s) => !s);
      } else if (mod && e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        lockScreen();
      } else if (mod && e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        openApp('terminal');
      } else if (mod && e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        dispatch({ type: 'minimizeAll' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, lockScreen, openApp]);

  /** Dock click: open → restore if minimized → minimize if already focused → otherwise focus. */
  const onDockClick = (id: AppId) => {
    const win = state.windows.find((w) => w.id === id);
    if (!win) return openApp(id);
    if (win.isMinimized) return dispatch({ type: 'focus', id });
    if (activeId === id) return dispatch({ type: 'minimize', id });
    dispatch({ type: 'focus', id });
  };

  const preview = snapPreview ? snapBounds(snapPreview, area) : null;
  const dim = (100 - settings.brightness) / 100;

  return (
    <WindowManagerContext.Provider value={wm}>
      <div className="fixed inset-0 overflow-hidden font-sans">
        <Wallpaper />
        <TopBar />

        <main
          className="absolute inset-x-0 bottom-0"
          style={{ top: TOPBAR_HEIGHT }}
          onClick={() => setClearToken((t) => t + 1)}
          onContextMenu={(e) => {
            if (e.target !== e.currentTarget) return;
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY });
          }}
        >
          <DesktopIcons onLaunch={openApp} clearToken={clearToken} />
          {settings.showWidgets && <Widgets />}

          {preview && (
            <div
              className="pointer-events-none absolute rounded-xl border-2 border-accent/60 bg-accent/15 backdrop-blur-sm transition-all duration-150"
              style={{
                left: preview.x + 6,
                top: preview.y + 6,
                width: preview.width - 12,
                height: preview.height - 12,
                zIndex: state.topZ + 1,
              }}
            />
          )}

          {state.windows.map((win) => (
            <Window
              key={win.id}
              win={win}
              isActive={activeId === win.id}
              area={area}
              areaTop={TOPBAR_HEIGHT}
              minSize={APPS[win.id].minSize}
              onFocus={() => dispatch({ type: 'focus', id: win.id })}
              onClose={() => dispatch({ type: 'close', id: win.id })}
              onMinimize={() => dispatch({ type: 'minimize', id: win.id })}
              onToggleMaximize={() => dispatch({ type: 'toggleMaximize', id: win.id })}
              onMove={(position, release) => dispatch({ type: 'move', id: win.id, position, release })}
              onResize={(position, size) => dispatch({ type: 'resize', id: win.id, position, size })}
              onSnap={(target) =>
                target === 'maximize'
                  ? dispatch({ type: 'setMaximized', id: win.id, value: true })
                  : dispatch({ type: 'snap', id: win.id, zone: target })
              }
              onSnapPreview={setSnapPreview}
            />
          ))}
        </main>

        <FpsOverlay />
        <Notifications />
        <Dock
          windows={state.windows}
          activeId={activeId}
          bouncing={bouncing}
          onAppClick={onDockClick}
          onLauncherClick={() => setSpotlight(true)}
        />

        {contextMenu && <DesktopContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} />}
        {spotlight && phase === 'desktop' && <Spotlight onClose={() => setSpotlight(false)} />}

        {phase === 'lock' && <LockScreen onUnlock={() => setPhase('desktop')} />}
        {phase === 'boot' && <BootScreen onDone={() => setPhase('lock')} />}

        {/* Display filters from Control Center: brightness and night light. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[10002] bg-black transition-opacity duration-300"
          style={{ opacity: dim * 0.75 }}
        />
        <div
          aria-hidden
          className={`pointer-events-none fixed inset-0 z-[10002] bg-orange-400/15 mix-blend-multiply transition-opacity duration-500 ${
            settings.nightLight ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </WindowManagerContext.Provider>
  );
}
