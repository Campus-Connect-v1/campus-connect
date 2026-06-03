import { api, request, type ApiResult } from "./api";

export interface StatusAuthor {
  user_id: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string | null;
}

export interface UserStatus {
  status_id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: "text" | "image" | "video" | string;
  created_at: string;
  expires_at: string | null;
  author: StatusAuthor;
}

interface StatusesResponse {
  message: string;
  count: number;
  statuses: UserStatus[];
}

export interface CreateStatusInput {
  content?: string;
  media_url?: string;
  media_type?: string;
  expires_at?: string | null;
}

export function getStatuses(limit = 30): Promise<ApiResult<UserStatus[]>> {
  return request(async () => {
    const { data } = await api.get<StatusesResponse>("/social/statuses", {
      params: { limit },
    });
    return { data: data.statuses };
  });
}

export function getUserStatuses(userId: string): Promise<ApiResult<UserStatus[]>> {
  return request(async () => {
    const { data } = await api.get<StatusesResponse>(
      `/social/statuses/users/${userId}`,
    );
    return { data: data.statuses };
  });
}

export function createStatus(
  input: CreateStatusInput,
): Promise<ApiResult<{ message: string; status: Partial<UserStatus> }>> {
  return request(() => api.post("/social/statuses", input));
}
