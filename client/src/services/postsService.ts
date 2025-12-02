/**
 * Posts Service
 * 
 * Handles all API interactions for posts functionality.
 * Provides clean separation between UI and data fetching logic.
 * 
 * Features:
 * - Paginated post fetching
 * - Post creation, liking, commenting
 * - Error handling with typed responses
 * - Request batching and optimization
 */

import axios, { AxiosError } from 'axios';
import type { PostData, PostAuthor } from '../components/ui/Post';

// API configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// ============================================================================
// Types
// ============================================================================

export interface PaginatedResponse<T> {
  posts: T[];
  count: number;
  hasMore: boolean;
  nextOffset: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreatePostPayload {
  content: string;
  media_url?: string;
  media_type?: 'text' | 'image' | 'video';
  visibility?: 'public' | 'connections' | 'private';
}

export interface PostResponse {
  message: string;
  post: PostData;
}

export interface FeedResponse {
  message: string;
  count: number;
  posts: PostData[];
}

// ============================================================================
// Helper Functions
// ============================================================================

// Set auth token for authenticated requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Handle API errors consistently
const handleApiError = (error: AxiosError): string => {
  if (error.response) {
    // Server responded with error status
    const data = error.response.data as { message?: string };
    return data?.message || `Server error: ${error.response.status}`;
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection.';
  } else {
    // Error setting up request
    return error.message || 'An unexpected error occurred.';
  }
};

// ============================================================================
// Posts API Functions
// ============================================================================

/**
 * Fetch paginated feed posts
 * @param limit Number of posts per page
 * @param offset Pagination offset
 * @returns Paginated posts response
 */
export const getFeedPosts = async (
  limit: number = 20,
  offset: number = 0
): Promise<ApiResponse<PaginatedResponse<PostData>>> => {
  try {
    const response = await api.get<FeedResponse>('/social/posts/feed', {
      params: { limit, offset },
    });

    const posts = response.data.posts;
    const hasMore = posts.length === limit;

    return {
      success: true,
      data: {
        posts,
        count: response.data.count,
        hasMore,
        nextOffset: offset + posts.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error as AxiosError),
    };
  }
};

/**
 * Create a new post
 * @param payload Post content and metadata
 * @returns Created post data
 */
export const createPost = async (
  payload: CreatePostPayload
): Promise<ApiResponse<PostData>> => {
  try {
    const response = await api.post<PostResponse>('/social/posts', payload);
    return {
      success: true,
      data: response.data.post,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error as AxiosError),
    };
  }
};

/**
 * Like a post
 * @param postId Post to like
 */
export const likePost = async (postId: string): Promise<ApiResponse<void>> => {
  try {
    await api.post(`/social/posts/${postId}/like`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error as AxiosError),
    };
  }
};

/**
 * Unlike a post
 * @param postId Post to unlike
 */
export const unlikePost = async (postId: string): Promise<ApiResponse<void>> => {
  try {
    await api.delete(`/social/posts/${postId}/like`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error as AxiosError),
    };
  }
};

/**
 * Get a single post by ID
 * @param postId Post ID to fetch
 */
export const getPost = async (postId: string): Promise<ApiResponse<PostData>> => {
  try {
    const response = await api.get<{ post: PostData }>(`/social/posts/${postId}`);
    return {
      success: true,
      data: response.data.post,
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error as AxiosError),
    };
  }
};

/**
 * Delete a post
 * @param postId Post ID to delete
 */
export const deletePost = async (postId: string): Promise<ApiResponse<void>> => {
  try {
    await api.delete(`/social/posts/${postId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error as AxiosError),
    };
  }
};

// ============================================================================
// Mock Data for Development
// ============================================================================

// Sample posts for development/demo when API is not available
const mockPosts: PostData[] = [
  {
    post_id: '1',
    content: 'Just finished my final exams! 🎉 Time to celebrate with some well-deserved rest. Who else is done for the semester?',
    media_url: null,
    media_type: 'text',
    visibility: 'public',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    author: {
      user_id: 'user_1',
      first_name: 'Sarah',
      last_name: 'Johnson',
      profile_picture_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      profile_headline: 'Computer Science Student',
    },
    stats: {
      like_count: 42,
      comment_count: 8,
    },
    user_actions: {
      has_liked: false,
    },
  },
  {
    post_id: '2',
    content: 'Looking for study group partners for MATH 301 next semester. DM me if interested!',
    media_url: null,
    media_type: 'text',
    visibility: 'connections',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    author: {
      user_id: 'user_2',
      first_name: 'Michael',
      last_name: 'Chen',
      profile_picture_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      profile_headline: 'Math & Physics Major',
    },
    stats: {
      like_count: 15,
      comment_count: 23,
    },
    user_actions: {
      has_liked: true,
    },
  },
  {
    post_id: '3',
    content: 'Just discovered this amazing new study spot on campus - the rooftop garden at the library! 🌿📚 Perfect for focused work sessions.',
    media_url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600',
    media_type: 'image',
    visibility: 'public',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    author: {
      user_id: 'user_3',
      first_name: 'Emily',
      last_name: 'Williams',
      profile_picture_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      profile_headline: 'Environmental Science',
    },
    stats: {
      like_count: 89,
      comment_count: 12,
    },
    user_actions: {
      has_liked: false,
    },
  },
  {
    post_id: '4',
    content: 'Excited to announce that our robotics club won first place at the regional competition! 🤖🏆 Huge thanks to the team!',
    media_url: null,
    media_type: 'text',
    visibility: 'public',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    author: {
      user_id: 'user_4',
      first_name: 'David',
      last_name: 'Rodriguez',
      profile_picture_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      profile_headline: 'Robotics Club President',
    },
    stats: {
      like_count: 156,
      comment_count: 34,
    },
    user_actions: {
      has_liked: true,
    },
  },
  {
    post_id: '5',
    content: 'Pro tip: The campus coffee shop has half-price drinks after 4pm. You are welcome. ☕',
    media_url: null,
    media_type: 'text',
    visibility: 'public',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    author: {
      user_id: 'user_5',
      first_name: 'Jessica',
      last_name: 'Taylor',
      profile_picture_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      profile_headline: 'Coffee Enthusiast & Business Major',
    },
    stats: {
      like_count: 234,
      comment_count: 45,
    },
    user_actions: {
      has_liked: false,
    },
  },
];

/**
 * Get mock feed posts (for development without backend)
 */
export const getMockFeedPosts = async (
  limit: number = 20,
  offset: number = 0
): Promise<ApiResponse<PaginatedResponse<PostData>>> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const paginatedPosts = mockPosts.slice(offset, offset + limit);
  const hasMore = offset + limit < mockPosts.length;

  return {
    success: true,
    data: {
      posts: paginatedPosts,
      count: paginatedPosts.length,
      hasMore,
      nextOffset: offset + paginatedPosts.length,
    },
  };
};

export default {
  getFeedPosts,
  getMockFeedPosts,
  createPost,
  likePost,
  unlikePost,
  getPost,
  deletePost,
  setAuthToken,
};
