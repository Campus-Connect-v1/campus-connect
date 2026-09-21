import { api, request } from "./api";

export interface ApiComment {
  comment_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
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
