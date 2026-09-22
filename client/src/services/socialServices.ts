import { api, request } from "./api";

/** Exactly the shape GET /social/posts/feed returns. */
export interface ApiPost {
  post_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  /** Non-null only when media_type is "poll". */
  poll_id: string | null;
  visibility: "public" | "connections" | "private";
  created_at: string;
  expires_at: string | null;
  author: {
    user_id: string;
    first_name: string;
    last_name: string | null;
    profile_picture_url: string | null;
    profile_headline: string | null;
  };
  stats: { like_count: number; comment_count: number };
  user_actions: { has_liked: boolean };
}

type ApiCreatedPost = Pick<
  ApiPost,
  "post_id" | "content" | "media_url" | "media_type" | "poll_id" | "created_at"
> & {
  visibility: string;
  expires_at: string | null;
};

export async function fetchFeed(limit = 20, offset = 0) {
  const result = await request<{ count: number; posts?: ApiPost[] }>(() =>
    api.get("/social/posts/feed", { params: { limit, offset } })
  );
  return result.success ? { ...result, data: result.data.posts ?? [] } : result;
}

/** The feed endpoint has no "posts by user" filter, so this narrows client-side. */
export async function fetchPostsByAuthor(userId: string, limit = 50) {
  const result = await fetchFeed(limit, 0);
  return result.success
    ? { ...result, data: result.data.filter((post) => post.author.user_id === userId) }
    : result;
}

export async function fetchPost(postId: string) {
  const result = await request<{ post: ApiPost }>(() => api.get(`/social/posts/${postId}`));
  return result.success ? { ...result, data: result.data.post } : result;
}

export function likePost(postId: string) {
  return request(() => api.post(`/social/posts/${postId}/like`));
}

export function unlikePost(postId: string) {
  return request(() => api.delete(`/social/posts/${postId}/like`));
}

export function createPost(content: string, mediaUrl?: string) {
  return request<{ post: ApiCreatedPost }>(() =>
    api.post("/social/posts", {
      content,
      media_url: mediaUrl,
      media_type: mediaUrl ? "image" : "text",
    })
  );
}

export function deletePost(postId: string) {
  return request(() => api.delete(`/social/posts/${postId}`));
}
