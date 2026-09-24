import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getToken } from "./session";
import { onNotification } from "./socket";
import { fetchConnections } from "./userServices";

interface AttentionValue {
  /** Incoming connection requests you can act on. */
  connectionRequests: number;
  /** True when anything behind the profile tab wants attention. */
  hasAny: boolean;
  refresh: () => Promise<void>;
}

const AttentionContext = createContext<AttentionValue>({
  connectionRequests: 0,
  hasAny: false,
  refresh: async () => {},
});

/**
 * Things waiting on the user that are NOT notifications.
 *
 * Kept separate from `UnreadContext` because the two answer different
 * questions. An unread notification is something that happened; an attention
 * item is something still undone, and it stays until the user acts rather than
 * until they look. Marking notifications read must not clear a pending request.
 *
 * Every counter here has to satisfy two rules, or it should not be a dot:
 *   1. Tapping through reaches the thing that caused it.
 *   2. Acting on that thing clears it.
 * A dot that cannot be cleared trains people to ignore all dots.
 */
export function AttentionProvider({ children }: { children: ReactNode }) {
  const [connectionRequests, setConnectionRequests] = useState(0);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setConnectionRequests(0);
      return;
    }

    const result = await fetchConnections();
    if (!result.success) return;

    // `pending` holds both directions. Only the rows this user can act on
    // count: a request you sent is not waiting on you.
    const pending = result.data.pending ?? [];
    setConnectionRequests(pending.filter((row) => row.is_pending_action).length);
  }, []);

  useEffect(() => {
    void refresh();

    // A connection request arrives as a notification, so the same frame that
    // moves the bell should move this.
    const unsubscribe = onNotification(() => void refresh());
    return unsubscribe;
  }, [refresh]);

  const value = useMemo(
    () => ({
      connectionRequests,
      hasAny: connectionRequests > 0,
      refresh,
    }),
    [connectionRequests, refresh]
  );

  return <AttentionContext.Provider value={value}>{children}</AttentionContext.Provider>;
}

export function useAttention() {
  return useContext(AttentionContext);
}
