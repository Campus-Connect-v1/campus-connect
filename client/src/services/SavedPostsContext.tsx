import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const SAVED_KEY = "cc.saved.posts";

interface SavedPostsValue {
  ids: Set<string>;
  isSaved: (postId: string) => boolean;
  toggle: (postId: string) => void;
  ready: boolean;
}

const SavedPostsContext = createContext<SavedPostsValue | null>(null);

/**
 * Bookmarks, stored on the device.
 *
 * /api/social has no bookmarks route and `posts` has no saved column, so there
 * is nothing to sync to. Device-local is the honest implementation of the save
 * button rather than a no-op that resets on refresh; when the endpoint exists,
 * this becomes the local cache in front of it and the stored ids migrate.
 */
export function SavedPostsProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SAVED_KEY)
      .then((stored) => {
        if (!stored) return;
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) setIds(new Set(parsed.filter((v) => typeof v === "string")));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const toggle = useCallback((postId: string) => {
    setIds((current) => {
      const next = new Set(current);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }, []);

  // Persisting is driven by the committed value rather than by the handler, so
  // what reaches storage is always what the UI actually rendered.
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(SAVED_KEY, JSON.stringify([...ids])).catch(() => {});
  }, [ids, ready]);

  const value = useMemo(
    () => ({ ids, isSaved: (postId: string) => ids.has(postId), toggle, ready }),
    [ids, toggle, ready]
  );

  return <SavedPostsContext.Provider value={value}>{children}</SavedPostsContext.Provider>;
}

export function useSavedPosts() {
  const value = useContext(SavedPostsContext);
  if (!value) throw new Error("useSavedPosts must be used inside <SavedPostsProvider>");
  return value;
}
