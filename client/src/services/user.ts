import { api, request, type ApiResult } from "./api";

/**
 * User, profile, and connections API client. Mirrors server `/api/user`
 * (auth required). Source: server/controllers/user.controller.js.
 *
 */

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string | null;
  phone_number?: string | null;
  program?: string | null;
  bio?: string | null;
  year_of_study?: number | null;
  graduation_year?: number | null;
  interests: unknown[];
  social_links: Record<string, string>;
  privacy_settings: Record<string, unknown>;
  is_profile_complete?: boolean;
  university_id: string;
  created_at?: string;
}

export interface UserSummary {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string | null;
  program?: string | null;
  year_of_study?: number | null;
  university_id?: string;
  bio?: string | null;
}

export type ConnectionStatus = "accepted" | "pending" | "declined" | "blocked";

export interface Connection {
  connection_id: string;
  status: ConnectionStatus;
  connection_note: string | null;
  shared_courses: unknown;
  created_at: string;
  updated_at: string;
  receiver: {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string | null;
    profile_headline?: string | null;
    program?: string | null;
  };
  your_role: "requester" | "receiver";
  is_pending_action: boolean;
}

export interface GroupedConnections {
  accepted: Connection[];
  pending: Connection[];
  declined: Connection[];
  blocked: Connection[];
}

// ---- Profile ----

export function getProfile(): Promise<ApiResult<Profile>> {
  return request(async () => {
    const { data } = await api.get<{ user: Profile }>("/user/profile");
    return { data: data.user };
  });
}

export function updateProfile(
  updates: Partial<
    Pick<Profile, "first_name" | "last_name" | "bio" | "program"> & {
      year_of_study: number;
      phone_number: string;
    }
  >,
): Promise<ApiResult<{ message: string; updated: boolean }>> {
  return request(() => api.put("/user/profile", updates));
}

export function getUserStats(): Promise<ApiResult<Record<string, unknown>>> {
  return request(async () => {
    const { data } = await api.get("/user/stats");
    return { data };
  });
}

export function getUserById(userId: string): Promise<ApiResult<Record<string, unknown>>> {
  return request(async () => {
    const { data } = await api.get<{ user: Record<string, unknown> }>(
      `/user/${userId}`,
    );
    return { data: data.user };
  });
}

// ---- Discovery ----

/** Search users by criteria (name, program, year_of_study, etc.). */
export function searchUsers(
  criteria: Record<string, string>,
): Promise<ApiResult<UserSummary[]>> {
  return request(async () => {
    const { data } = await api.get<{ users?: UserSummary[] }>("/user/search", {
      params: criteria,
    });
    return { data: data.users ?? [] }; // server omits `users` when none found
  });
}

// ---- Connections ----

export function getAllConnections(
  status?: ConnectionStatus,
): Promise<ApiResult<GroupedConnections>> {
  return request(async () => {
    const { data } = await api.get<{ connections: Partial<GroupedConnections> }>(
      "/user/connections",
      { params: status ? { status } : undefined },
    );
    return {
      data: {
        accepted: data.connections.accepted ?? [],
        pending: data.connections.pending ?? [],
        declined: data.connections.declined ?? [],
        blocked: data.connections.blocked ?? [],
      },
    };
  });
}

export function sendConnectionRequest(
  receiverId: string,
  note?: string,
): Promise<ApiResult<{ message: string }>> {
  return request(() =>
    api.post("/user/connections/request", {
      receiver_id: receiverId,
      connection_note: note,
    }),
  );
}

export function cancelConnectionRequest(
  connectionId: string,
): Promise<ApiResult<{ message: string }>> {
  return request(() =>
    api.delete(`/user/connections/request/${connectionId}`),
  );
}

/** Accept or decline an incoming connection request. */
export function respondToConnection(
  connectionId: string,
  action: "accept" | "decline",
): Promise<ApiResult<{ message: string; status: string }>> {
  return request(() =>
    api.post("/user/connections/respond", {
      connection_id: connectionId,
      action,
    }),
  );
}
