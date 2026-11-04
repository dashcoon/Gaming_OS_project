import { useEffect, useState } from 'react';

interface BatteryManagerLike extends EventTarget {
  level: number;
  charging: boolean;
}

export interface BatteryInfo {
  level: number;
  charging: boolean;
  /** False when the browser has no Battery API and the values are mock data. */
  supported: boolean;
}

/** Battery level from the Battery Status API, with a mock fallback (desktop PCs report "charging"). */
export function useBattery(): BatteryInfo {
  const [info, setInfo] = useState<BatteryInfo>({ level: 1, charging: true, supported: false });

  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManagerLike> };
    if (!nav.getBattery) return;
    let battery: BatteryManagerLike | null = null;
    const sync = () => battery && setInfo({ level: battery.level, charging: battery.charging, supported: true });
    nav
      .getBattery()
      .then((b) => {
        battery = b;
        sync();
        b.addEventListener('levelchange', sync);
        b.addEventListener('chargingchange', sync);
      })
      .catch(() => undefined);
    return () => {
      battery?.removeEventListener('levelchange', sync);
      battery?.removeEventListener('chargingchange', sync);
    };
  }, []);

  return info;
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}
