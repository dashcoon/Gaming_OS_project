import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Maximize2, Minimize2, Minus, X } from 'lucide-react';
import type { Point, Size, SnapZone, WindowState } from '@/types/os';

/** Space kept free at the bottom for the floating dock when maximized/snapped. */
export const DOCK_RESERVE = 92;
/** Distance (px) from a screen edge that triggers a snap. */
const SNAP_EDGE = 6;
const DRAG_THRESHOLD = 4;

export type SnapTarget = SnapZone | 'maximize' | null;

interface Bounds extends Point, Size {}

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface WindowProps {
  win: WindowState;
  isActive: boolean;
  /** Size of the desktop area below the top bar. */
  area: Size;
  /** Offset of the desktop area from the top of the viewport. */
  areaTop: number;
  minSize: Size;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onMove: (position: Point, release?: boolean) => void;
  onResize: (position: Point, size: Size) => void;
  onSnap: (target: Exclude<SnapTarget, null>) => void;
  onSnapPreview: (target: SnapTarget) => void;
}

/** Bounds a window actually occupies, taking maximize/snap into account. */
export function effectiveBounds(win: WindowState, area: Size): Bounds {
  const fullHeight = Math.max(200, area.height - DOCK_RESERVE);
  if (win.isMaximized) return { x: 0, y: 0, width: area.width, height: fullHeight };
  if (win.snap) {
    const half = Math.round(area.width / 2);
    return { x: win.snap === 'left' ? 0 : half, y: 0, width: area.width - half, height: fullHeight };
  }
  return { ...win.position, ...win.size };
}

const RESIZE_HANDLES: { dir: ResizeDir; className: string }[] = [
  { dir: 'n', className: 'top-0 left-3 right-3 h-1.5 cursor-ns-resize' },
  { dir: 's', className: 'bottom-0 left-3 right-3 h-1.5 cursor-ns-resize' },
  { dir: 'e', className: 'right-0 top-3 bottom-3 w-1.5 cursor-ew-resize' },
  { dir: 'w', className: 'left-0 top-3 bottom-3 w-1.5 cursor-ew-resize' },
  { dir: 'ne', className: 'right-0 top-0 h-3 w-3 cursor-nesw-resize' },
  { dir: 'nw', className: 'left-0 top-0 h-3 w-3 cursor-nwse-resize' },
  { dir: 'se', className: 'right-0 bottom-0 h-3 w-3 cursor-nwse-resize' },
  { dir: 'sw', className: 'left-0 bottom-0 h-3 w-3 cursor-nesw-resize' },
];

export default function Window({
  win,
  isActive,
  area,
  areaTop,
  minSize,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMove,
  onResize,
  onSnap,
  onSnapPreview,
}: WindowProps) {
  const [interacting, setInteracting] = useState(false);
  const snapTarget = useRef<SnapTarget>(null);
  const bounds = effectiveBounds(win, area);
  const Content = win.component;
  const tiled = win.isMaximized || win.snap !== null;

  const detectSnap = useCallback(
    (clientX: number, clientY: number): SnapTarget => {
      if (clientY - areaTop <= SNAP_EDGE) return 'maximize';
      if (clientX <= SNAP_EDGE) return 'left';
      if (clientX >= window.innerWidth - SNAP_EDGE) return 'right';
      return null;
    },
    [areaTop],
  );

  const startDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const start = effectiveBounds(win, area);
    let origin: Point = { x: start.x, y: start.y };
    let moved = false;
    let released = !tiled;

    const onPointerMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      if (!moved) {
        moved = true;
        setInteracting(true);
      }
      let release = false;
      if (!released) {
        // Leaving a maximized/snapped state: keep the cursor at the same relative spot on the title bar.
        released = true;
        release = true;
        const ratio = (startX - start.x) / start.width;
        origin = { x: Math.round(startX - win.size.width * ratio), y: start.y };
      }
      const x = Math.min(Math.max(origin.x + dx, -win.size.width + 120), area.width - 120);
      const y = Math.min(Math.max(origin.y + dy, 0), area.height - 40);
      onMove({ x, y }, release);

      const target = detectSnap(ev.clientX, ev.clientY);
      if (target !== snapTarget.current) {
        snapTarget.current = target;
        onSnapPreview(target);
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      setInteracting(false);
      if (snapTarget.current) onSnap(snapTarget.current);
      snapTarget.current = null;
      onSnapPreview(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const startResize = (dir: ResizeDir) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    setInteracting(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const start = { ...win.position, ...win.size };

    const onPointerMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let { x, y, width, height } = start;
      if (dir.includes('e')) width = Math.max(minSize.width, start.width + dx);
      if (dir.includes('s')) height = Math.max(minSize.height, start.height + dy);
      if (dir.includes('w')) {
        width = Math.max(minSize.width, start.width - dx);
        x = start.x + start.width - width;
      }
      if (dir.includes('n')) {
        height = Math.max(minSize.height, start.height - dy);
        y = start.y + start.height - height;
        if (y < 0) {
          height += y;
          y = 0;
        }
      }
      onResize({ x, y }, { width, height });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      setInteracting(false);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const Icon = win.icon;

  return (
    <section
      role="dialog"
      aria-label={win.title}
      aria-hidden={win.isMinimized}
      onPointerDownCapture={isActive ? undefined : onFocus}
      className={[
        'absolute flex origin-bottom flex-col',
        interacting ? '' : 'transition-[left,top,width,height,opacity,transform] duration-200 ease-out',
        win.isMinimized ? 'pointer-events-none translate-y-[45vh] scale-[0.15] opacity-0' : 'opacity-100',
      ].join(' ')}
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        zIndex: win.zIndex,
      }}
    >
      <div
        className={[
          'glass relative flex h-full w-full animate-window-open flex-col overflow-hidden text-slate-100',
          tiled ? 'rounded-none sm:rounded-lg' : 'rounded-xl',
          isActive
            ? 'shadow-[0_24px_70px_-12px_rgba(0,0,0,0.85)] ring-1 ring-accent/30'
            : 'opacity-[0.97] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]',
        ].join(' ')}
      >
        {/* Title bar: traffic lights on the left (macOS), drag to move, double-click to maximize. */}
        <header
          onPointerDown={startDrag}
          onDoubleClick={(e) => {
            if (!(e.target as HTMLElement).closest('button')) onToggleMaximize();
          }}
          className="group/titlebar relative flex h-10 shrink-0 select-none items-center border-b border-slate-700/50 bg-slate-950/40 px-3"
        >
          <div className="group/lights z-10 flex items-center gap-2">
            <TrafficLight color="bg-[#ff5f57]" hover="group-hover/lights:bg-[#ff5f57]" active={isActive} label="Close" onClick={onClose}>
              <X className="h-2 w-2" strokeWidth={3.5} />
            </TrafficLight>
            <TrafficLight color="bg-[#febc2e]" hover="group-hover/lights:bg-[#febc2e]" active={isActive} label="Minimize" onClick={onMinimize}>
              <Minus className="h-2 w-2" strokeWidth={3.5} />
            </TrafficLight>
            <TrafficLight
              color="bg-[#28c840]"
              hover="group-hover/lights:bg-[#28c840]"
              active={isActive}
              label={win.isMaximized ? 'Restore' : 'Maximize'}
              onClick={onToggleMaximize}
            >
              {win.isMaximized ? (
                <Minimize2 className="h-2 w-2" strokeWidth={3.5} />
              ) : (
                <Maximize2 className="h-2 w-2" strokeWidth={3.5} />
              )}
            </TrafficLight>
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-[13px] font-medium">
            <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-accent' : 'text-slate-500'}`} />
            <span className={isActive ? 'text-slate-200' : 'text-slate-500'}>{win.title}</span>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <Content />
          {/* Stops iframes from swallowing pointer events mid-drag. */}
          {interacting && <div className="absolute inset-0 z-50" />}
        </div>
      </div>

      {!tiled &&
        !win.isMinimized &&
        RESIZE_HANDLES.map((h) => (
          <div key={h.dir} onPointerDown={startResize(h.dir)} className={`absolute z-20 ${h.className}`} />
        ))}
    </section>
  );
}

function TrafficLight({
  color,
  hover,
  active,
  label,
  onClick,
  children,
}: {
  color: string;
  /** Literal hover class so Tailwind can see it (inactive windows light up on hover). */
  hover: string;
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={[
        'flex h-3 w-3 items-center justify-center rounded-full text-black/60 ring-1 ring-black/20 transition-transform hover:scale-110',
        active ? color : `bg-slate-600 ${hover}`,
      ].join(' ')}
    >
      <span className="opacity-0 transition-opacity group-hover/lights:opacity-100">{children}</span>
    </button>
  );
}
