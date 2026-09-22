import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { fetchUnreadCount } from "./notificationServices";
import { getToken } from "./session";
import { onNotification } from "./socket";

interface UnreadValue {
  count: number;
  /** Re-reads the server total; call after marking things read. */
  refresh: () => Promise<void>;
  /** Drop to zero locally, for "mark all read" without a round trip. */
  clear: () => void;
}

const UnreadContext = createContext<UnreadValue>({
  count: 0,
  refresh: async () => {},
  clear: () => {},
});

/**
 * The unread notification count, shared app-wide.
 *
 * fetchUnreadCount() existed but nothing called it, and the tab bar had no
 * badge — so notifications were only ever visible by opening the notifications
 * screen. The count lives here rather than in that screen so the badge is live
 * everywhere, which is the whole point of a badge.
 *
 * The socket increments optimistically and a refresh reconciles: a frame tells
 * us something arrived, but not whether it was de-duplicated server-side
 * (notify() suppresses a repeat inside its 60s window), so the server total
 * stays authoritative.
 */
export function UnreadProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (!getToken()) return;
    const result = await fetchUnreadCount();
    if (result.success) setCount(Number(result.data ?? 0));
  }, []);

  const clear = useCallback(() => setCount(0), []);

  useEffect(() => {
    void refresh();

    const unsubscribe = onNotification(() => {
      // Move immediately so the badge feels instant...
      setCount((current) => current + 1);
      // ...then reconcile, debounced, because a fan-out arrives as a burst and
      // one request per frame would hammer the API for the same number.
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void refresh(), 600);
    });

    return () => {
      if (timer.current) clearTimeout(timer.current);
      unsubscribe();
    };
  }, [refresh]);

  const value = useMemo(() => ({ count, refresh, clear }), [count, refresh, clear]);
  return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>;
}

export function useUnread() {
  return useContext(UnreadContext);
}
