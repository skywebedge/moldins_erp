'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (
        target &&
        target.href &&
        target.href.startsWith(window.location.origin) &&
        !target.target &&
        target.pathname !== window.location.pathname
      ) {
        setLoading(true);
        setProgress(40);
      }
    };

    window.addEventListener('mousedown', handlePointerDown, { passive: true });
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    setLoading(true);
    setProgress((prev) => (prev > 0 ? Math.max(prev, 75) : 35));

    const timer1 = setTimeout(() => {
      setProgress(100);
    }, 90);

    const timer2 = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 280);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none bg-brand"
      style={{
        width: `${progress}%`,
        opacity: progress === 100 ? 0 : 1,
        transition: 'width 0.18s ease-out, opacity 0.2s ease-in',
      }}
    />
  );
}

export default NavigationProgress;
