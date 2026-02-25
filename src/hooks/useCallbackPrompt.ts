import { useCallback } from "react";
import { useBlocker } from "react-router-dom";

/**
 * Hook that shows a navigation-blocking prompt when `when` is true.
 * Returns [showPrompt, confirmNavigation, cancelNavigation].
 *
 * Rewritten to use React Router v6's built-in useBlocker (the old
 * implementation relied on `navigator.block()` from the `history`
 * library, which was removed in React Router 6.4+).
 */
export function useCallbackPrompt(when: boolean): [boolean, () => void, () => void] {
  const blocker = useBlocker(when);

  const confirmNavigation = useCallback(() => {
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  }, [blocker]);

  const cancelNavigation = useCallback(() => {
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }, [blocker]);

  return [blocker.state === "blocked", confirmNavigation, cancelNavigation];
}
