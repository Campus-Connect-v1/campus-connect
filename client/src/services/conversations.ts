import { api, request, type ApiResult } from "./api";

/**
 * Conversations REST client (`/api/conversations`, auth required). These return
 * Mongo conversation docs. Realtime messaging itself goes over Socket.io
 * (see services/socket.ts) — there is currently NO message-history endpoint
 * on the server, so a chat thread is realtime-first. Flagged for Codex.
 */

export interface ConversationParticipant {
  userId: string;
  email?: string;
  username?: string;
}

export interface Conversation {
  _id: string;
  participants: ConversationParticipant[];
  lastMessage?: {
    content?: string;
    senderId?: string;
    timestamp?: string;
  };
  unreadCounts?: Record<string, number>;
  updatedAt?: string;
}

/** A persisted message from the history endpoint (senderId/receiverId are ids). */
export interface HistoryMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  status?: string;
  createdAt: string;
}

/** Message history between the current user and a participant (oldest first). */
export function getMessagesWith(
  participantId: string,
  limit = 50,
): Promise<ApiResult<HistoryMessage[]>> {
  return request(async () => {
    const { data } = await api.get<{ messages?: HistoryMessage[] }>(
      `/conversations/participant/${participantId}/messages`,
      { params: { limit } },
    );
    return { data: data.messages ?? [] };
  });
}

export function getConversations(
  page = 1,
  limit = 20,
): Promise<ApiResult<Conversation[]>> {
  return request(async () => {
    const { data } = await api.get<{ conversations?: Conversation[] } | Conversation[]>(
      "/conversations",
      { params: { page, limit } },
    );
    const list = Array.isArray(data) ? data : (data.conversations ?? []);
    return { data: list };
  });
}

export function getConversationByParticipant(
  participantId: string,
): Promise<ApiResult<Conversation | null>> {
  return request(async () => {
    const { data } = await api.get<{ conversation?: Conversation } | Conversation>(
      `/conversations/participant/${participantId}`,
    );
    const conv = (data as { conversation?: Conversation }).conversation ?? (data as Conversation);
    return { data: conv ?? null };
  });
}

/** Resolve the "other" participant in a 1:1 conversation. */
export function otherParticipant(
  conv: Conversation,
  myId: string,
): ConversationParticipant | undefined {
  return conv.participants?.find((p) => p.userId !== myId);
}
