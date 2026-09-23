import { api, request } from "./api";

/** Mirrors REPORT_REASONS on the server; a value outside this list is a 400. */
export const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "misinformation", label: "False information" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Something else" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

/** Hides a post for this viewer only. It stays visible to everyone else. */
export function hidePost(postId: string) {
  return request(() => api.post(`/moderation/posts/${postId}/hide`));
}

export function unhidePost(postId: string) {
  return request(() => api.delete(`/moderation/posts/${postId}/hide`));
}

export function reportPost(postId: string, reason: ReportReason, details?: string) {
  return request(() =>
    api.post(`/moderation/posts/${postId}/report`, {
      reason,
      // The server caps this at 500 characters and 400s past it.
      details: details?.trim().slice(0, 500) || null,
    })
  );
}

/** Feeds a negative ranking signal without hiding the post outright. */
export function seeLessLikePost(postId: string) {
  return request(() => api.post(`/moderation/posts/${postId}/see-less`));
}

export async function fetchHiddenPosts() {
  const result = await request<{
    hidden_posts?: {
      post_id: string;
      hidden_at: string;
      content: string | null;
      media_url: string | null;
      media_type: string | null;
      created_at: string;
      is_active: boolean;
    }[];
  }>(() => api.get("/moderation/hidden"));
  // The server sends `hidden_posts`, not `posts` — reading the wrong key here
  // returned an empty list unconditionally.
  return result.success ? { ...result, data: result.data.hidden_posts ?? [] } : result;
}
