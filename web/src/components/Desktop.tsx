import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import Dock from '@/components/Dock';
import DesktopIcons from '@/components/DesktopIcons';
import FpsOverlay from '@/components/FpsOverlay';
import Notifications from '@/components/Notifications';
import TopBar from '@/components/TopBar';
import Wallpaper from '@/components/Wallpaper';
import Window, { DOCK_RESERVE, type SnapTarget } from '@/components/Window';
import { APPS } from '@/components/apps/registry';
import { WindowManagerContext, type WindowManagerValue } from '@/context/WindowManagerContext';
import { initialWindowsState, windowReducer } from '@/hooks/windowReducer';
import { useViewport } from '@/hooks/useViewport';
import type { AppId } from '@/types/os';

const TOPBAR_HEIGHT = 32;

/** Desktop orchestrator: owns window state and composes wallpaper, icons, windows, dock and top bar. */
export default function Desktop() {
  const [state, dispatch] = useReducer(windowReducer, initialWindowsState);
  const [bouncing, setBouncing] = useState<Set<AppId>>(new Set());
  const [snapPreview, setSnapPreview] = useState<SnapTarget>(null);
  const [clearToken, setClearToken] = useState(0);
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
    }),
    [state.windows, activeId, openApp],
  );

  /** Dock click: open → restore if minimized → minimize if already focused → otherwise focus. */
  const onDockClick = (id: AppId) => {
    const win = state.windows.find((w) => w.id === id);
    if (!win) return openApp(id);
    if (win.isMinimized) return dispatch({ type: 'focus', id });
    if (activeId === id) return dispatch({ type: 'minimize', id });
    dispatch({ type: 'focus', id });
  };

  const half = Math.round(area.width / 2);
  const previewHeight = area.height - DOCK_RESERVE;

  return (
    <WindowManagerContext.Provider value={wm}>
      <div className="fixed inset-0 overflow-hidden font-sans">
        <Wallpaper />
        <TopBar />

        <main
          className="absolute inset-x-0 bottom-0"
          style={{ top: TOPBAR_HEIGHT }}
          onClick={() => setClearToken((t) => t + 1)}
        >
          <DesktopIcons onLaunch={openApp} clearToken={clearToken} />

          {snapPreview && (
            <div
              className="pointer-events-none absolute rounded-xl border-2 border-accent/60 bg-accent/15 backdrop-blur-sm transition-all duration-150"
              style={{
                left: snapPreview === 'right' ? half + 6 : 6,
                top: 6,
                width: (snapPreview === 'maximize' ? area.width : half) - 12,
                height: previewHeight - 12,
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
        <Dock windows={state.windows} activeId={activeId} bouncing={bouncing} onAppClick={onDockClick} />
      </div>
    </WindowManagerContext.Provider>
  );
}
