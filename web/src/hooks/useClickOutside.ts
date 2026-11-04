import { useEffect, type RefObject } from 'react';

/** Calls `handler` on a pointer press outside `ref` while `active` is true. */
export function useClickOutside(ref: RefObject<HTMLElement>, active: boolean, handler: () => void) {
  useEffect(() => {
    if (!active) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && handler();
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [ref, active, handler]);
}
