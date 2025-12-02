/**
 * usePosts Hook
 * 
 * A custom hook for managing posts state and operations.
 * Provides clean separation between UI and data logic with:
 * - Paginated data fetching
 * - Infinite scroll support
 * - Pull-to-refresh
 * - Error handling
 * - Loading states
 * - Optimistic updates for likes
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { PostData } from '../components/ui/Post';
import {
  getMockFeedPosts,
  getFeedPosts,
  likePost,
  unlikePost,
  ApiResponse,
  PaginatedResponse,
} from '../services/postsService';

// Configuration
const POSTS_PER_PAGE = 10;
const USE_MOCK_DATA = true; // Set to false to use real API

interface UsePostsReturn {
  /** Array of posts */
  posts: PostData[];
  /** Whether initial data is loading */
  isLoading: boolean;
  /** Whether more posts are being loaded (pagination) */
  isLoadingMore: boolean;
  /** Whether refresh is in progress */
  isRefreshing: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether there are more posts to load */
  hasMore: boolean;
  /** Fetch initial posts */
  fetchPosts: () => Promise<void>;
  /** Load more posts (pagination) */
  loadMore: () => Promise<void>;
  /** Refresh posts (pull-to-refresh) */
  refresh: () => Promise<void>;
  /** Toggle like on a post */
  toggleLike: (postId: string, currentlyLiked: boolean) => Promise<void>;
}

export const usePosts = (): UsePostsReturn => {
  // State for posts data
  const [posts, setPosts] = useState<PostData[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  
  // Prevent duplicate requests
  const isLoadingRef = useRef(false);

  /**
   * Fetch posts from API/mock data
   * @param offset Pagination offset
   * @param append Whether to append to existing posts (for infinite scroll)
   */
  const fetchPostsInternal = useCallback(
    async (offset: number = 0, append: boolean = false) => {
      // Use mock data or real API based on configuration
      const fetchFn = USE_MOCK_DATA ? getMockFeedPosts : getFeedPosts;
      const response = await fetchFn(POSTS_PER_PAGE, offset);

      if (response.success && response.data) {
        const { posts: newPosts, hasMore: more, nextOffset } = response.data;
        
        setPosts((prev) => (append ? [...prev, ...newPosts] : newPosts));
        setHasMore(more);
        offsetRef.current = nextOffset;
        setError(null);
      } else {
        setError(response.error || 'Failed to load posts');
      }
    },
    []
  );

  /**
   * Initial fetch of posts
   */
  const fetchPosts = useCallback(async () => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      await fetchPostsInternal(0, false);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [fetchPostsInternal]);

  /**
   * Load more posts (for infinite scroll)
   */
  const loadMore = useCallback(async () => {
    // Don't load if already loading, no more posts, or initial load not done
    if (isLoadingRef.current || !hasMore || isLoading) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);

    try {
      await fetchPostsInternal(offsetRef.current, true);
    } finally {
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [fetchPostsInternal, hasMore, isLoading]);

  /**
   * Refresh posts (for pull-to-refresh)
   */
  const refresh = useCallback(async () => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsRefreshing(true);
    offsetRef.current = 0;

    try {
      await fetchPostsInternal(0, false);
    } finally {
      setIsRefreshing(false);
      isLoadingRef.current = false;
    }
  }, [fetchPostsInternal]);

  /**
   * Toggle like on a post with optimistic update
   * @param postId Post ID to toggle like on
   * @param currentlyLiked Current like state
   */
  const toggleLike = useCallback(
    async (postId: string, currentlyLiked: boolean) => {
      // Optimistic update - immediately update UI
      setPosts((prev) =>
        prev.map((post) => {
          if (post.post_id === postId) {
            return {
              ...post,
              user_actions: { ...post.user_actions, has_liked: !currentlyLiked },
              stats: {
                ...post.stats,
                like_count: currentlyLiked
                  ? post.stats.like_count - 1
                  : post.stats.like_count + 1,
              },
            };
          }
          return post;
        })
      );

      // Make API call
      const response = currentlyLiked
        ? await unlikePost(postId)
        : await likePost(postId);

      // Revert if API call failed
      if (!response.success) {
        setPosts((prev) =>
          prev.map((post) => {
            if (post.post_id === postId) {
              return {
                ...post,
                user_actions: { ...post.user_actions, has_liked: currentlyLiked },
                stats: {
                  ...post.stats,
                  like_count: currentlyLiked
                    ? post.stats.like_count + 1
                    : post.stats.like_count - 1,
                },
              };
            }
            return post;
          })
        );
      }
    },
    []
  );

  // Fetch posts on mount
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    hasMore,
    fetchPosts,
    loadMore,
    refresh,
    toggleLike,
  };
};

export default usePosts;
