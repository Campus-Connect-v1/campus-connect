import { api, request } from "./api";

export interface ApiComment {
  comment_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  /** Absent on a comment echoed straight back from addComment. */
  like_count?: number;
  has_liked?: boolean | 0 | 1;
  author: {
    user_id: string;
    first_name: string;
    last_name: string | null;
    profile_picture_url: string | null;
  };
}

export async function fetchComments(postId: string, limit = 50, offset = 0) {
  const result = await request<{ count: number; comments?: ApiComment[] }>(() =>
    api.get(`/social/posts/${postId}/comments`, { params: { limit, offset } })
  );
  return result.success ? { ...result, data: result.data.comments ?? [] } : result;
}

export async function addComment(postId: string, content: string, parentCommentId?: string) {
  const result = await request<{ comment: ApiComment }>(() =>
    api.post(`/social/posts/${postId}/comments`, {
      content,
      parent_comment_id: parentCommentId ?? null,
    })
  );
  return result.success ? { ...result, data: result.data.comment } : result;
}

export function updateComment(postId: string, commentId: string, content: string) {
  return request<{ comment: { comment_id: string; content: string } }>(() =>
    api.patch(`/social/posts/${postId}/comments/${commentId}`, { content })
  );
}

/** Allowed for the comment's author and for the author of the post it is on. */
export function deleteComment(postId: string, commentId: string) {
  return request(() => api.delete(`/social/posts/${postId}/comments/${commentId}`));
}

export function likeComment(commentId: string) {
  return request<{ like: { comment_id: string; like_count: number; has_liked: boolean } }>(() =>
    api.post(`/social/comments/${commentId}/like`)
  );
}

export function unlikeComment(commentId: string) {
  return request<{ like: { comment_id: string; like_count: number; has_liked: boolean } }>(() =>
    api.delete(`/social/comments/${commentId}/like`)
  );
}
