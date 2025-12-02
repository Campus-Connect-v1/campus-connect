"use client";

import { useState, useCallback, useRef } from "react";
import useSWRInfinite from "swr/infinite";
import { api } from "@/src/services/authServices";

/**
 * usePosts Hook
 * 
 * A custom hook that provides paginated, infinite-scroll feed functionality
 * with clean separation of data-fetching logic from UI components.
 * 
 * Features:
 * - Paginated loading with infinite scroll support
 * - Pull-to-refresh
 * - Error handling
 * - Loading states (initial, more, refreshing)
 * - Optimized batched API calls
 * - Automatic data deduplication
 */

const PAGE_SIZE = 10;

interface Post {
  post_id: string;
  content: string;
  media_url?: string;
  media_type?: string;
  visibility: string;
  created_at: string;
  author: {
    user_id: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
  };
  stats: {
    like_count: number;
    comment_count: number;
  };
  user_actions?: {
    has_liked: boolean;
  };
}

interface PostsResponse {
  posts: Post[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Fetcher function for SWR that handles pagination
const fetchPosts = async (url: string): Promise<PostsResponse> => {
  const response = await api.get<PostsResponse>(url);
  return response.data;
};

// Key generator for SWR Infinite
const getKey = (pageIndex: number, previousPageData: PostsResponse | null) => {
  // If we got no posts on the previous page, we've reached the end
  if (previousPageData && previousPageData.posts.length === 0) return null;
  
  // If we got fewer posts than PAGE_SIZE, we've reached the end
  if (previousPageData && previousPageData.posts.length < PAGE_SIZE) return null;

  // Calculate offset based on page index
  const offset = pageIndex * PAGE_SIZE;
  return `/social/posts/feed?limit=${PAGE_SIZE}&offset=${offset}`;
};

interface UsePostsReturn {
  posts: Post[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: Error | null;
  hasMore: boolean;
  isEmpty: boolean;
  loadMore: () => void;
  refresh: () => Promise<void>;
  mutate: () => Promise<void>;
}

export function usePosts(): UsePostsReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isLoadingMoreRef = useRef(false);

  const {
    data,
    error,
    size,
    setSize,
    isValidating,
    mutate,
    isLoading,
  } = useSWRInfinite<PostsResponse>(getKey, fetchPosts, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
    dedupingInterval: 2000, // Prevent duplicate requests within 2 seconds
    persistSize: true, // Remember the page count during revalidation
  });

  // Flatten posts from all pages
  const posts = data ? data.flatMap((page) => page.posts) : [];

  // Check if we've loaded all posts
  const hasMore = data
    ? data[data.length - 1]?.posts?.length === PAGE_SIZE
    : true;

  // Check if feed is empty
  const isEmpty = data?.[0]?.posts?.length === 0;

  // Loading states
  const isLoadingInitial = isLoading;
  const isLoadingMore = isLoadingMoreRef.current && isValidating && size > 1;

  /**
   * Load more posts (for infinite scroll)
   * Uses a ref to track loading state to prevent multiple concurrent requests
   */
  const loadMore = useCallback(() => {
    if (!isValidating && hasMore && !isLoadingMoreRef.current) {
      isLoadingMoreRef.current = true;
      setSize(size + 1).finally(() => {
        isLoadingMoreRef.current = false;
      });
    }
  }, [isValidating, hasMore, setSize, size]);

  /**
   * Refresh posts (pull-to-refresh)
   * Resets to first page and revalidates
   */
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Reset to first page and revalidate
      await mutate();
    } finally {
      setIsRefreshing(false);
    }
  }, [mutate]);

  /**
   * Mutate/revalidate posts data
   * Useful for updating after actions like creating a new post
   */
  const mutateData = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    posts,
    isLoading: isLoadingInitial,
    isLoadingMore,
    isRefreshing,
    error: error || null,
    hasMore,
    isEmpty,
    loadMore,
    refresh,
    mutate: mutateData,
  };
}

/**
 * Helper function to transform raw post data to FeedCard format
 * Note: The username is derived from first_name if no username field exists on the author.
 * This is a display-only value for UI purposes, not used for unique identification.
 */
export function transformPostToFeedCard(post: Post, currentUserId: string | null) {
  // Generate display username from first name (lowercase) as fallback
  // The actual unique identifier is post.author.user_id, not the username
  const displayUsername = post.author?.first_name?.toLowerCase() ?? "user";
  
  return {
    post: {
      id: post.post_id,
      user: {
        fullName: `${post.author?.first_name ?? ""} ${post.author?.last_name ?? ""}`.trim(),
        username: displayUsername,
        avatar: post.author?.profile_picture_url ?? "",
      },
      content: post.content,
      image: post.media_url,
      timestamp: new Date(post.created_at).toLocaleDateString(),
      stats: {
        comments: post.stats?.comment_count ?? 0,
        reposts: 0,
        likes: post.stats?.like_count ?? 0,
      },
      settings: {
        allowComments: true,
        allowReposts: true,
        allowShares: true,
      },
      isLiked: post.user_actions?.has_liked ?? false,
    },
    isOwnPost: currentUserId === post.author?.user_id,
  };
}

export type { Post, PostsResponse };
