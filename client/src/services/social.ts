import { api, request, type ApiResult } from "./api";

/**
 * Social/feed API client. Mirrors server `/api/social` routes (all require
 * auth). Source of truth: server/controllers/social.controller.js.
 */

export interface PostAuthor {
  user_id: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string | null;
  profile_headline?: string | null;
}

export interface Post {
  post_id: string;
  content: string | null;
  media_url: string | null;
  media_type: "text" | "image" | "video" | string;
  visibility: string;
  created_at: string;
  expires_at: string | null;
  author: PostAuthor;
  stats: { like_count: number; comment_count: number };
  user_actions: { has_liked: boolean };
}

export interface Comment {
  comment_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  author: {
    user_id: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string | null;
  };
}

interface FeedResponse {
  message: string;
  count: number;
  posts: Post[];
}

export interface CreatePostInput {
  content?: string;
  media_url?: string;
  media_type?: string;
  visibility?: "connections" | "public" | "private" | string;
  expires_at?: string | null;
}

/** Paginated feed of posts from the user's connections. */
export function getFeed(
  limit = 20,
  offset = 0,
): Promise<ApiResult<Post[]>> {
  return request(async () => {
    const { data } = await api.get<FeedResponse>("/social/posts/feed", {
      params: { limit, offset },
    });
    return { data: data.posts };
  });
}

export function createPost(
  input: CreatePostInput,
): Promise<ApiResult<{ message: string; post: Partial<Post> }>> {
  return request(() => api.post("/social/posts", input));
}

export function likePost(postId: string): Promise<ApiResult<unknown>> {
  return request(() => api.post(`/social/posts/${postId}/like`));
}

export function unlikePost(postId: string): Promise<ApiResult<unknown>> {
  return request(() => api.delete(`/social/posts/${postId}/like`));
}

/** Fetch a single post by id (same shape as a feed item). */
export function getPost(postId: string): Promise<ApiResult<Post>> {
  return request(async () => {
    const { data } = await api.get<{ post: Post }>(`/social/posts/${postId}`);
    return { data: data.post };
  });
}

export function getComments(
  postId: string,
  limit = 50,
  offset = 0,
): Promise<ApiResult<Comment[]>> {
  return request(async () => {
    const { data } = await api.get<{ comments: Comment[] }>(
      `/social/posts/${postId}/comments`,
      { params: { limit, offset } },
    );
    return { data: data.comments };
  });
}

export function addComment(
  postId: string,
  content: string,
  parentCommentId: string | null = null,
): Promise<ApiResult<{ message: string; comment: Comment }>> {
  return request(() =>
    api.post(`/social/posts/${postId}/comments`, {
      content,
      parent_comment_id: parentCommentId,
    }),
  );
}

export function deletePost(postId: string): Promise<ApiResult<unknown>> {
  return request(() => api.delete(`/social/posts/${postId}`));
}
