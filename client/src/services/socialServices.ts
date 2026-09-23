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

export interface FeedPage {
  posts: ApiPost[];
  /** Opaque; pass back to get the next page. Null means the end. */
  nextCursor: string | null;
  hasMore: boolean;
  /** "following" or "discovery" — what the server actually served. */
  mode: string | null;
}

/**
 * One page of the feed.
 *
 * Takes a cursor rather than an offset: with an offset, a post arriving
 * between two pages shifts every row down one, so page two repeats the item
 * that was last on page one. The server still accepts offset, so this falls
 * back to it when no cursor has been issued yet — which also means this works
 * unchanged against a server that predates cursors.
 */
export async function fetchFeed(limit = 20, offset = 0, cursor: string | null = null) {
  const result = await request<{
    count: number;
    posts?: ApiPost[];
    next_cursor?: string | null;
    has_more?: boolean;
    mode?: string;
  }>(() =>
    api.get("/social/posts/feed", {
      params: cursor ? { limit, cursor } : { limit, offset },
    })
  );

  if (!result.success) return result;

  const posts = result.data.posts ?? [];
  return {
    ...result,
    data: {
      posts,
      nextCursor: result.data.next_cursor ?? null,
      // An older server sends neither field. A short page is the only honest
      // signal of the end in that case -- claiming more would loop forever,
      // claiming the end would hide posts.
      hasMore:
        result.data.has_more ?? (result.data.next_cursor ? true : posts.length >= limit),
      mode: result.data.mode ?? null,
    } as FeedPage,
  };
}

/**
 * One user's posts, for their profile.
 *
 * This used to fetch a page of the caller's own feed and filter it by author,
 * which could only ever find posts inside that window — and once the feed
 * became graph-scoped it returned nothing at all for anyone the caller did not
 * follow. The server now answers this directly and applies the profile's own
 * visibility rules, so a profile shows that person's posts regardless of who
 * is looking.
 */
export async function fetchPostsByAuthor(userId: string, limit = 50) {
  const result = await request<{ count: number; posts?: ApiPost[] }>(() =>
    api.get(`/user/${userId}/posts`, { params: { limit } })
  );
  return result.success ? { ...result, data: result.data.posts ?? [] } : result;
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

export function updatePost(postId: string, content: string) {
  return request<{ post: { post_id: string; content: string } }>(() =>
    api.patch(`/social/posts/${postId}`, { content })
  );
}

// --- Saved posts (bookmarks) ----------------------------------------------

export function savePost(postId: string) {
  return request(() => api.post(`/social/posts/${postId}/save`));
}

export function unsavePost(postId: string) {
  return request(() => api.delete(`/social/posts/${postId}/save`));
}

/** Ids only — enough to render the bookmark state of a whole feed. */
export async function fetchSavedPostIds() {
  const result = await request<{ count: number; post_ids?: string[] }>(() =>
    api.get("/social/posts/saved/ids")
  );
  return result.success ? { ...result, data: result.data.post_ids ?? [] } : result;
}

/** The saved posts themselves, already shaped like the feed. */
export async function fetchSavedPosts(limit = 50, offset = 0) {
  const result = await request<{ count: number; posts?: ApiPost[] }>(() =>
    api.get("/social/posts/saved", { params: { limit, offset } })
  );
  return result.success ? { ...result, data: result.data.posts ?? [] } : result;
}
