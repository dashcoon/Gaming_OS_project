import type { AppDefinition, AppId, Point, Size, SnapZone, WindowState } from '@/types/os';

export interface WindowsState {
  windows: WindowState[];
  topZ: number;
}

export type WindowAction =
  | { type: 'open'; app: AppDefinition; area: Size }
  | { type: 'close'; id: AppId }
  | { type: 'minimize'; id: AppId }
  | { type: 'focus'; id: AppId }
  | { type: 'toggleMaximize'; id: AppId }
  | { type: 'setMaximized'; id: AppId; value: boolean }
  | { type: 'snap'; id: AppId; zone: SnapZone }
  | { type: 'move'; id: AppId; position: Point; release?: boolean }
  | { type: 'resize'; id: AppId; position: Point; size: Size }
  | { type: 'minimizeAll' }
  | { type: 'closeAll' };

export const initialWindowsState: WindowsState = { windows: [], topZ: 10 };

const CASCADE = 28;

function update(state: WindowsState, id: AppId, patch: (w: WindowState) => Partial<WindowState>): WindowsState {
  return { ...state, windows: state.windows.map((w) => (w.id === id ? { ...w, ...patch(w) } : w)) };
}

function bringToFront(state: WindowsState, id: AppId, patch: Partial<WindowState> = {}): WindowsState {
  const topZ = state.topZ + 1;
  return { topZ, windows: state.windows.map((w) => (w.id === id ? { ...w, ...patch, zIndex: topZ } : w)) };
}

export function windowReducer(state: WindowsState, action: WindowAction): WindowsState {
  switch (action.type) {
    case 'open': {
      const existing = state.windows.find((w) => w.id === action.app.id);
      if (existing) return bringToFront(state, existing.id, { isMinimized: false, isOpen: true });

      const { app, area } = action;
      const width = Math.min(app.defaultSize.width, area.width - 40);
      const height = Math.min(app.defaultSize.height, area.height - 40);
      const offset = (state.windows.length % 6) * CASCADE;
      const topZ = state.topZ + 1;
      const win: WindowState = {
        id: app.id,
        title: app.title,
        icon: app.icon,
        component: app.component,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        snap: null,
        zIndex: topZ,
        position: {
          x: Math.max(8, Math.round((area.width - width) / 2) - 80 + offset),
          y: Math.max(8, Math.round((area.height - height) / 2) - 50 + offset),
        },
        size: { width, height },
      };
      return { topZ, windows: [...state.windows, win] };
    }
    case 'close':
      return { ...state, windows: state.windows.filter((w) => w.id !== action.id) };
    case 'minimize':
      return update(state, action.id, () => ({ isMinimized: true }));
    case 'focus':
      return bringToFront(state, action.id, { isMinimized: false });
    case 'toggleMaximize':
      return bringToFront(state, action.id, {
        isMaximized: !state.windows.find((w) => w.id === action.id)?.isMaximized,
        snap: null,
        isMinimized: false,
      });
    case 'setMaximized':
      return bringToFront(state, action.id, { isMaximized: action.value, snap: null });
    case 'snap':
      return bringToFront(state, action.id, { snap: action.zone, isMaximized: false });
    case 'move':
      // `release` leaves any maximized/snapped state when a drag starts.
      return update(state, action.id, () => ({
        position: action.position,
        ...(action.release ? { isMaximized: false, snap: null } : {}),
      }));
    case 'resize':
      return update(state, action.id, () => ({ position: action.position, size: action.size }));
    case 'minimizeAll':
      return { ...state, windows: state.windows.map((w) => ({ ...w, isMinimized: true })) };
    case 'closeAll':
      return { ...state, windows: [] };
    default:
      return state;
  }
}
