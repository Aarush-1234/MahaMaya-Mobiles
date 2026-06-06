'use client';

import { useEffect, useRef } from 'react';

/**
 * Reusable hook to handle closing overlays/drawers/modals with the mobile/browser back button.
 * 
 * @param {Object} params
 * @param {boolean} params.isOpen - Whether the overlay is currently open
 * @param {Function} params.onClose - Callback to close the overlay
 * @param {string} params.stateKey - Unique key representing the state in history
 */
export default function useBackButtonClose({ isOpen, onClose, stateKey }) {
  const isPopStateRef = useRef(false);
  const hasPushedRef = useRef(false);
  const isOpenRef = useRef(isOpen);
  const onCloseRef = useRef(onClose);

  // Sync refs with the latest prop values to avoid re-triggering the main effect
  useEffect(() => {
    isOpenRef.current = isOpen;
    onCloseRef.current = onClose;
  }, [isOpen, onClose]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isOpen) {
      isPopStateRef.current = false;

      // Avoid duplicate pushState calls
      const currentState = window.history.state;
      if (!currentState || currentState.modal !== stateKey) {
        // Merge the current history state to preserve Next.js internal router state
        const nextJsState = currentState || {};
        window.history.pushState({ ...nextJsState, modal: stateKey }, '');
        hasPushedRef.current = true;
      } else {
        hasPushedRef.current = true;
      }

      const handlePopState = (event) => {
        if (isOpenRef.current) {
          const state = event.state;
          // If the new history state doesn't have this modal's stateKey,
          // it means the user navigated back and we need to close this modal.
          if (!state || state.modal !== stateKey) {
            isPopStateRef.current = true;
            onCloseRef.current?.();
          }
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    } else {
      // If we are closed, make sure the browser history is cleaned up.
      // If we pushed state, and user closed programmatically (not via popstate/back button),
      // we navigate back in history to remove the state.
      if (hasPushedRef.current) {
        if (!isPopStateRef.current) {
          const currentState = window.history.state;
          if (currentState && currentState.modal === stateKey) {
            window.history.back();
          }
        }
        hasPushedRef.current = false;
      }
      isPopStateRef.current = false;

      // Clean up stale history states if we mount and find the history state has our key
      // but we are not open (e.g. user navigated back to a page where a modal was once open).
      const currentState = window.history.state;
      if (currentState && currentState.modal === stateKey) {
        const { modal, ...nextJsState } = currentState;
        window.history.replaceState(nextJsState, '');
      }
    }
  }, [isOpen, stateKey]);
}
