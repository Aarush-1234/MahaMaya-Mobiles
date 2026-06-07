'use client';

import { useEffect } from 'react';

/**
 * Hook to lock body scroll when a modal or overlay is open.
 * Keeps track of concurrent scroll locks using a data attribute count.
 * Prevents layout shift on desktop and jump resets by capturing scrollY.
 * 
 * @param {boolean} isOpen - Whether the scroll lock is active
 */
export default function useBodyScrollLock(isOpen) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isOpen) return;

    const body = document.body;
    const html = document.documentElement;
    const currentLocks = parseInt(body.getAttribute('data-scroll-locks') || '0', 10);

    const originalScrollY = window.scrollY;

    if (currentLocks === 0) {
      const scrollBarWidth = window.innerWidth - html.clientWidth;
      
      body.setAttribute('data-original-scroll-y', originalScrollY.toString());
      
      // Save current overflow style states
      body.setAttribute('data-original-overflow', body.style.overflow || '');
      html.setAttribute('data-original-overflow', html.style.overflow || '');
      
      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';
      
      if (scrollBarWidth > 0) {
        body.style.paddingRight = `${scrollBarWidth}px`;
      }
    }

    body.setAttribute('data-scroll-locks', (currentLocks + 1).toString());

    return () => {
      const locks = parseInt(body.getAttribute('data-scroll-locks') || '0', 10);
      const newLocks = Math.max(0, locks - 1);

      if (newLocks === 0) {
        const savedScrollY = parseFloat(body.getAttribute('data-original-scroll-y') || '0');
        const origBodyOverflow = body.getAttribute('data-original-overflow') || '';
        const origHtmlOverflow = html.getAttribute('data-original-overflow') || '';

        body.style.overflow = origBodyOverflow;
        html.style.overflow = origHtmlOverflow;
        body.style.paddingRight = '';
        
        body.removeAttribute('data-scroll-locks');
        body.removeAttribute('data-original-scroll-y');
        body.removeAttribute('data-original-overflow');
        html.removeAttribute('data-original-overflow');
        
        // Explicitly restore scroll position
        window.scrollTo(0, savedScrollY);
      } else {
        body.setAttribute('data-scroll-locks', newLocks.toString());
      }
    };
  }, [isOpen]);
}
