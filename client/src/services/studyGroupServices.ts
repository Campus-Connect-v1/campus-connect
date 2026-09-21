import { api, request } from "./api";

/** Exactly what GET /study-group returns in `data`. */
export interface ApiStudyGroup {
  group_id: string;
  university_id: string;
  created_by: string;
  group_name: string;
  description: string | null;
  course_code: string | null;
  course_name: string | null;
  group_type: string | null;
  max_members: number | null;
  meeting_frequency: string | null;
  is_active: boolean | number;
  created_at: string;
  /** From the JOIN on users — the creator. */
  first_name?: string;
  last_name?: string;
  university_name?: string;
  /** COUNT(group_members) — arrives as a string from MySQL. */
  member_count?: number | string;
}

export async function fetchStudyGroups(params?: { university_id?: string; limit?: number }) {
  const result = await request<{ success: boolean; count: number; data: ApiStudyGroup[] }>(() =>
    api.get("/study-group", { params: { limit: 50, ...params } })
  );
  return result.success ? { ...result, data: result.data.data ?? [] } : result;
}

export async function fetchMyStudyGroups() {
  const result = await request<{ success: boolean; data: ApiStudyGroup[] }>(() =>
    api.get("/study-group/user")
  );
  return result.success ? { ...result, data: result.data.data ?? [] } : result;
}

export function joinStudyGroup(groupId: string) {
  return request(() => api.post(`/study-group/${groupId}/join`));
}

export function leaveStudyGroup(groupId: string) {
  return request(() => api.post(`/study-group/${groupId}/leave`));
}

export interface CreateStudyGroupPayload {
  university_id: string;
  group_name: string;
  description?: string;
  course_code?: string;
  course_name?: string;
  group_type?: "public" | "private" | "invite_only";
  max_members?: number;
  meeting_frequency?: "weekly" | "biweekly" | "monthly" | "custom";
  preferred_location_type?: "virtual" | "campus" | "hybrid";
}

export function createStudyGroup(payload: CreateStudyGroupPayload) {
  return request<{ data: ApiStudyGroup }>(() => api.post("/study-group", payload));
}

export async function fetchStudyGroup(groupId: string) {
  const result = await request<{ success: boolean; data: ApiStudyGroup }>(() =>
    api.get(`/study-group/${groupId}`)
  );
  return result.success ? { ...result, data: result.data.data } : result;
}

/**
 * Only the creator or an admin may update a group; anyone else gets a 403.
 * The response echoes the PRE-update row, so callers refetch rather than
 * trusting what comes back.
 */
export function updateStudyGroup(
  groupId: string,
  patch: Partial<Omit<CreateStudyGroupPayload, "university_id">>
) {
  return request<{ success: boolean }>(() => api.put(`/study-group/${groupId}`, patch));
}
