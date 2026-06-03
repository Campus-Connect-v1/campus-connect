import { api, request, type ApiResult } from "./api";

/**
 * Study Groups API client. Mirrors server `/api/study-group` (auth required,
 * `{ success, data }` envelope). Source: studyGroup.controller.js.
 */

export type GroupRole = "creator" | "member" | string;

export interface StudyGroup {
  group_id: string;
  university_id: string;
  group_name: string;
  description: string | null;
  course_code: string | null;
  course_name: string | null;
  group_type: "public" | "private" | string;
  max_members: number;
  meeting_frequency: string;
  preferred_location_type: string;
  created_by: string;
  is_active?: boolean;
  // Aggregates the model may surface:
  member_count?: number;
  is_member?: boolean;
  user_role?: GroupRole | null;
}

export interface GroupMember {
  user_id: string;
  role: GroupRole;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string | null;
}

export interface StudyGroupFilters {
  university_id?: string;
  course_code?: string;
  group_type?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateStudyGroupInput {
  university_id: string;
  group_name: string;
  description?: string;
  course_code?: string;
  course_name?: string;
  group_type?: "public" | "private";
  max_members?: number;
  meeting_frequency?: string;
  preferred_location_type?: string;
}

export function getStudyGroups(
  filters: StudyGroupFilters = {},
): Promise<ApiResult<StudyGroup[]>> {
  return request(async () => {
    const { data } = await api.get<{ data: StudyGroup[] }>("/study-group", {
      params: filters,
    });
    return { data: data.data };
  });
}

export function getMyStudyGroups(): Promise<ApiResult<StudyGroup[]>> {
  return request(async () => {
    const { data } = await api.get<{ data: StudyGroup[] }>("/study-group/user");
    return { data: data.data };
  });
}

export function getStudyGroup(groupId: string): Promise<ApiResult<StudyGroup>> {
  return request(async () => {
    const { data } = await api.get<{ data: StudyGroup }>(
      `/study-group/${groupId}`,
    );
    return { data: data.data };
  });
}

export function getGroupMembers(
  groupId: string,
): Promise<ApiResult<GroupMember[]>> {
  return request(async () => {
    const { data } = await api.get<{ data: GroupMember[] }>(
      `/study-group/${groupId}/members`,
    );
    return { data: data.data };
  });
}

export function joinStudyGroup(
  groupId: string,
): Promise<ApiResult<{ success: boolean; message: string }>> {
  return request(() => api.post(`/study-group/${groupId}/join`));
}

export function leaveStudyGroup(
  groupId: string,
): Promise<ApiResult<{ success: boolean; message: string }>> {
  return request(() => api.post(`/study-group/${groupId}/leave`));
}

export function createStudyGroup(
  input: CreateStudyGroupInput,
): Promise<ApiResult<{ message: string; data: StudyGroup }>> {
  return request(() => api.post("/study-group", input));
}
