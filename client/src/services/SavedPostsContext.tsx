import AsyncStorage from "@react-native-async-storage/async-storage";
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

import { fetchSavedPostIds, savePost, unsavePost } from "./socialServices";
import { getToken } from "./session";

const SAVED_KEY = "cc.saved.posts";

interface SavedPostsValue {
  ids: Set<string>;
  isSaved: (postId: string) => boolean;
  toggle: (postId: string) => void;
  /** Re-reads the server copy; the saved screen calls this on focus. */
  refresh: () => Promise<void>;
  ready: boolean;
}

const SavedPostsContext = createContext<SavedPostsValue | null>(null);

/**
 * Bookmarks, stored server-side with a device-local cache in front.
 *
 * These used to live only in AsyncStorage, because /api/social had no
 * bookmarks route — so they were lost on reinstall and never appeared on a
 * second device. The server is now authoritative (saved_posts); storage is
 * kept purely so the bookmark state paints correctly on a cold start before
 * the first request returns, and so the screen still works offline.
 */
export function SavedPostsProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  // Guards against a slow refresh landing after a newer local toggle and
  // resurrecting a bookmark the user just removed.
  const pending = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!getToken()) return;
    const result = await fetchSavedPostIds();
    if (!result.success) return;
    setIds((current) => {
      const next = new Set(result.data);
      // Anything mid-flight keeps its optimistic value until it settles.
      for (const id of pending.current) {
        if (current.has(id)) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(SAVED_KEY)
      .then((stored) => {
        if (!stored) return;
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) setIds(new Set(parsed.filter((v) => typeof v === "string")));
      })
      .catch(() => {})
      .finally(() => {
        setReady(true);
        void refresh();
      });
  }, [refresh]);

  /**
   * Optimistic: the bookmark flips immediately and is reverted only if the
   * request fails. A bookmark is cheap to get wrong and expensive to feel
   * slow, so the UI leads and the server catches up.
   */
  const toggle = useCallback((postId: string) => {
    let nowSaved = false;
    setIds((current) => {
      const next = new Set(current);
      if (next.has(postId)) next.delete(postId);
      else { next.add(postId); nowSaved = true; }
      return next;
    });

    if (!getToken()) return;

    pending.current.add(postId);
    void (nowSaved ? savePost(postId) : unsavePost(postId))
      .then((result) => {
        if (result.success) return;
        setIds((current) => {
          const next = new Set(current);
          if (nowSaved) next.delete(postId);
          else next.add(postId);
          return next;
        });
      })
      .finally(() => pending.current.delete(postId));
  }, []);

  // Persisting is driven by the committed value rather than by the handler, so
  // what reaches storage is always what the UI actually rendered.
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(SAVED_KEY, JSON.stringify([...ids])).catch(() => {});
  }, [ids, ready]);

  const value = useMemo(
    () => ({ ids, isSaved: (postId: string) => ids.has(postId), toggle, refresh, ready }),
    [ids, toggle, refresh, ready]
  );

  return <SavedPostsContext.Provider value={value}>{children}</SavedPostsContext.Provider>;
}

export function useSavedPosts() {
  const value = useContext(SavedPostsContext);
  if (!value) throw new Error("useSavedPosts must be used inside <SavedPostsProvider>");
  return value;
}
