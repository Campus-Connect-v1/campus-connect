import { useCallback, useEffect, useState } from "react";
import {
  getFeed,
  likePost,
  unlikePost,
  type Post,
} from "../services/social";

const PAGE_SIZE = 20;

interface FeedState {
  posts: Post[];
  loading: boolean; // initial load
  refreshing: boolean; // pull-to-refresh
  loadingMore: boolean; // pagination
  error: string | null;
  hasMore: boolean;
  refresh: () => void;
  loadMore: () => void;
  toggleLike: (post: Post) => void;
}

/**
 * Manages the paginated social feed: initial load, pull-to-refresh,
 * infinite scroll, and optimistic like toggling (reverts on failure).
 */
export function useFeed(): FeedState {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (offset: number, mode: "initial" | "refresh" | "more") => {
    if (mode === "refresh") setRefreshing(true);
    else if (mode === "more") setLoadingMore(true);
    else setLoading(true);

    const result = await getFeed(PAGE_SIZE, offset);

    if (result.success) {
      setError(null);
      setHasMore(result.data.length === PAGE_SIZE);
      setPosts((prev) => (mode === "more" ? [...prev, ...result.data] : result.data));
    } else if (mode !== "more") {
      setError(result.error.message);
    }

    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    void load(0, "initial");
  }, [load]);

  const refresh = useCallback(() => {
    void load(0, "refresh");
  }, [load]);

  const loadMore = useCallback(() => {
    if (loading || refreshing || loadingMore || !hasMore) return;
    void load(posts.length, "more");
  }, [load, loading, refreshing, loadingMore, hasMore, posts.length]);

  const toggleLike = useCallback((post: Post) => {
    const wasLiked = post.user_actions.has_liked;

    // Optimistic update.
    setPosts((prev) =>
      prev.map((p) =>
        p.post_id === post.post_id
          ? {
              ...p,
              user_actions: { has_liked: !wasLiked },
              stats: {
                ...p.stats,
                like_count: p.stats.like_count + (wasLiked ? -1 : 1),
              },
            }
          : p,
      ),
    );

    const call = wasLiked ? unlikePost : likePost;
    void call(post.post_id).then((result) => {
      if (!result.success) {
        // Revert on failure.
        setPosts((prev) =>
          prev.map((p) =>
            p.post_id === post.post_id
              ? {
                  ...p,
                  user_actions: { has_liked: wasLiked },
                  stats: { ...p.stats, like_count: post.stats.like_count },
                }
              : p,
          ),
        );
      }
    });
  }, []);

  return {
    posts,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    toggleLike,
  };
}
