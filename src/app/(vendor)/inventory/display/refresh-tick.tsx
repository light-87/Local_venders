'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function RefreshTick({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [lastTick, setLastTick] = useState<Date>(new Date());

  useEffect(() => {
    const tick = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      router.refresh();
      setLastTick(new Date());
    };
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return (
    <span className="text-xs text-gray-400 tabular-nums">
      Updated {lastTick.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}
