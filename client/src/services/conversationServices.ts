import { api, request } from "./api";

/** A participant, as the Mongo conversation document stores it. */
export interface ApiParticipant {
  userId: string;
  email: string;
  username: string;
  lastReadAt?: string;
  /** Added by the controller from the MySQL row. */
  avatar?: string | null;
  isOnline?: boolean;
  lastSeen?: string | null;
}

export interface ApiConversation {
  _id: string;
  participants: ApiParticipant[];
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: string;
  };
  /** Already narrowed to the caller's own count by the controller. */
  unreadCount: number;
  otherParticipant: ApiParticipant;
  createdAt: string;
  updatedAt: string;
}

export async function fetchConversations(page = 1, limit = 30) {
  const result = await request<{ success: boolean; data?: ApiConversation[] }>(() =>
    api.get("/conversations", { params: { page, limit } })
  );
  return result.success ? { ...result, data: result.data.data ?? [] } : result;
}

export async function fetchConversation(conversationId: string) {
  const result = await request<{ success: boolean; data: ApiConversation }>(() =>
    api.get(`/conversations/${conversationId}`)
  );
  return result.success ? { ...result, data: result.data.data } : result;
}

/**
 * The conversation with one person, if one exists.
 *
 * Returns 404 when they have never spoken, which is not an error — it is the
 * normal case for a first message, so callers treat it as "no thread yet".
 */
export async function fetchConversationWith(participantId: string) {
  const result = await request<{ success: boolean; data: ApiConversation }>(() =>
    api.get(`/conversations/participant/${participantId}`)
  );
  return result.success ? { ...result, data: result.data.data } : result;
}

export async function createConversation(participantId: string) {
  const result = await request<{ success: boolean; data: ApiConversation }>(() =>
    api.post("/conversations", { participantId })
  );
  return result.success ? { ...result, data: result.data.data } : result;
}

export function deleteConversation(conversationId: string) {
  return request(() => api.delete(`/conversations/${conversationId}`));
}
