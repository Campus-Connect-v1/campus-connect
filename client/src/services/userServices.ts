import { api, request } from "./api";

/**
 * GET /user/profile — the signed-in user's own record.
 *
 * Field names mirror the server's `user` object exactly. It is NOT the same
 * shape as GET /user/:userId (see `ApiPublicUser`): the private view returns
 * `interests` and `courses` come from their normalized profile tables.
 */
export interface ApiInterest {
  interest_id: string;
  interest_type: "academic" | "hobby" | "career" | "sports" | "arts";
  interest_name: string;
  name?: string;
  skill_level: "beginner" | "intermediate" | "advanced" | "expert";
  created_at?: string;
}

export interface ApiCourse {
  user_course_id: number;
  course_code: string;
  course_name: string;
  department_id: string | null;
  semester: string | null;
  academic_year: number | null;
  is_current: boolean | number;
  created_at?: string;
}

export interface ApiProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string | null;
  profile_picture_url: string | null;
  profile_headline: string | null;
  phone_number: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  program: string | null;
  bio: string | null;
  date_of_birth: string | null;
  gender: string | null;
  year_of_study: "1" | "2" | "3" | "4" | "5+" | "graduate" | null;
  graduation_year: number | null;
  interests: ApiInterest[];
  courses: ApiCourse[];
  social_links: Record<string, string>;
  privacy_settings: Record<string, unknown>;
  is_profile_complete: boolean | number;
  university_id: string;
  created_at: string;
}

/** GET /user/:userId — the public view of somebody else. */
export interface ApiPublicUser {
  user_id: string;
  university_id: string;
  email: string;
  first_name: string;
  last_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  profile_picture_url: string | null;
  profile_headline: string | null;
  bio: string | null;
  program: string | null;
  graduation_year: number | null;
  year_of_study: ApiProfile["year_of_study"];
  phone_number: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  university_name: string | null;
  university_domain: string | null;
  interests: ApiInterest[];
  social_links: string | Record<string, string> | null;
  created_at: string;
  connection: ApiConnectionSummary | null;
}

export type ConnectionStatus = "pending" | "accepted" | "declined" | "blocked";

export interface ApiConnectionSummary {
  connection_id: string;
  status: ConnectionStatus;
  your_role: "requester" | "receiver";
}

export interface ApiStats {
  connections: number;
  groups: number;
  events: number;
  total_engagement: number;
}

/** A row from /user/search or /user/recommendations. */
export interface ApiUserCard {
  user_id: string;
  first_name: string;
  last_name: string | null;
  profile_picture_url: string | null;
  profile_headline?: string | null;
  program: string | null;
  year_of_study?: ApiProfile["year_of_study"];
  graduation_year?: number | null;
  university_id?: string;
  bio?: string | null;
  match_percentage?: number;
}

/**
 * Every one of these unwraps the server's envelope at the service boundary.
 *
 * The API nests its payload under a different key per endpoint (`user`,
 * `stats`, `users`, `recommendations`) and screens should not have to know
 * which. Unwrapping here also means a renamed key breaks in one file rather
 * than silently rendering `undefined` across four screens.
 */
export async function fetchProfile() {
  const result = await request<{ user: ApiProfile }>(() => api.get("/user/profile"));
  return result.success ? { ...result, data: result.data.user } : result;
}

export async function fetchStats() {
  const result = await request<{ stats: ApiStats }>(() => api.get("/user/stats"));
  return result.success ? { ...result, data: result.data.stats } : result;
}

export async function fetchUserById(userId: string) {
  const result = await request<{ user: ApiPublicUser }>(() => api.get(`/user/${userId}`));
  return result.success ? { ...result, data: result.data.user } : result;
}

/**
 * PUT /user/profile answers with `{ message, updated: true }` and NOT the saved
 * row, so there is nothing here to merge into state. Callers that need the new
 * values re-read the profile afterwards (SessionContext.refresh).
 */
export function updateProfile(patch: Partial<ApiProfile>) {
  return request<{ message: string; updated: boolean }>(() => api.put("/user/profile", patch));
}

/**
 * The server answers "no matches" with 200 and NO `users` key at all, rather
 * than an empty array — so the fallback here is load-bearing, not defensive
 * habit. Same for `recommendations` below.
 */
export async function searchUsers(query: string) {
  const result = await request<{ users?: (Omit<ApiUserCard, "user_id"> & { id: string })[] }>(() =>
    api.get("/user/search", { params: { q: query } })
  );
  return result.success
    ? {
        ...result,
        data: (result.data.users ?? []).map(({ id, ...user }) => ({
          ...user,
          user_id: id,
        })),
      }
    : result;
}

export async function fetchRecommendations(limit = 10) {
  const result = await request<{ recommendations?: ApiUserCard[] }>(() =>
    api.get("/user/recommendations", { params: { limit } })
  );
  return result.success ? { ...result, data: result.data.recommendations ?? [] } : result;
}

export interface ApiConnection {
  connection_id: string;
  status: ConnectionStatus;
  connection_note: string | null;
  shared_courses: string | null;
  created_at: string;
  updated_at: string;
  receiver: {
    id: string;
    first_name: string;
    last_name: string | null;
    profile_picture_url: string | null;
    profile_headline: string | null;
    program: string | null;
  };
  your_role: "requester" | "receiver";
  is_pending_action: boolean;
}

/** Returns connections grouped by status (`accepted`, `pending`, `sent`). */
export async function fetchConnections() {
  const result = await request<{ connections?: Record<string, ApiConnection[]> }>(() =>
    api.get("/user/connections")
  );
  return result.success ? { ...result, data: result.data.connections ?? {} } : result;
}

/**
 * Permanently deletes the account.
 *
 * The password is optional on the server but always sent here: an irreversible
 * action behind a single tap is how people delete accounts by accident.
 */
export function deleteAccount(password: string, reason?: string) {
  return request<{ message: string }>(() =>
    api.delete("/user/profile", { data: { password, deletion_reason: reason || undefined } })
  );
}

export function sendConnectionRequest(userId: string) {
  return request<{ message: string; connection_id: string }>(() =>
    api.post("/user/connections/request", { receiver_id: userId })
  );
}

export function cancelConnectionRequest(connectionId: string) {
  return request(() => api.delete(`/user/connections/request/${connectionId}`));
}

export function respondToConnection(connectionId: string, action: "accept" | "decline") {
  return request<{ message: string; status: ConnectionStatus }>(() =>
    api.post("/user/connections/respond", { connection_id: connectionId, action })
  );
}

export async function fetchInterests() {
  const result = await request<{ interests?: ApiInterest[] }>(() => api.get("/user/interests"));
  return result.success ? { ...result, data: result.data.interests ?? [] } : result;
}

export function addInterest(
  interest: Pick<ApiInterest, "interest_type" | "interest_name" | "skill_level">
) {
  return request<{ message: string; interest: ApiInterest }>(() =>
    api.post("/user/interests", interest)
  );
}

export function updateInterest(
  interestId: string,
  patch: Partial<Pick<ApiInterest, "interest_type" | "interest_name" | "skill_level">>
) {
  return request<{ message: string; interest: ApiInterest }>(() =>
    api.put(`/user/interests/${interestId}`, patch)
  );
}

export function removeInterest(interestId: string) {
  return request(() => api.delete(`/user/interests/${interestId}`));
}

export async function fetchCourses() {
  const result = await request<{ courses?: ApiCourse[] }>(() => api.get("/user/courses"));
  return result.success ? { ...result, data: result.data.courses ?? [] } : result;
}

export function addCourse(
  course: Pick<ApiCourse, "course_code" | "course_name"> &
    Partial<Pick<ApiCourse, "department_id" | "semester" | "academic_year" | "is_current">>
) {
  return request<{ message: string; course: ApiCourse }>(() => api.post("/user/courses", course));
}

export function removeCourse(courseId: number) {
  return request(() => api.delete(`/user/courses/${courseId}`));
}
