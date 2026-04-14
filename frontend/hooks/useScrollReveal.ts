'use client';

import { useEffect, useRef } from 'react';

export function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold }
    );

    const current = ref.current;
    if (current) {
      const revealables = current.querySelectorAll('.reveal-on-scroll');
      revealables.forEach((el) => observer.observe(el));
    }

    return () => {
      if (current) {
        const revealables = current.querySelectorAll('.reveal-on-scroll');
        revealables.forEach((el) => observer.unobserve(el));
      }
    };
  }, [threshold]);

  return ref;
}
