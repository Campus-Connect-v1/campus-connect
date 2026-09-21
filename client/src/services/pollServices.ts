import { api, request } from "./api";

export interface ApiPollOption {
  option_id: string;
  option_text: string;
  position: number;
  vote_count: number;
}

export interface ApiPoll {
  poll_id: string;
  post_id: string;
  question: string;
  max_selections: number;
  closes_at: string | null;
  allow_change: boolean;
  is_closed: boolean | number;
  visibility: "public" | "connections" | "university";
  created_at: string;
  author: {
    user_id: string;
    first_name: string;
    last_name: string | null;
    profile_picture_url: string | null;
  };
  options: ApiPollOption[];
  total_voters: number;
  user_actions: {
    has_voted: boolean;
    selected_option_ids: string[];
  };
}

/** The server's own bounds; mirrored so the form can stop you before a 400. */
export const MIN_POLL_OPTIONS = 2;
export const MAX_POLL_OPTIONS = 6;

export async function fetchPoll(pollId: string) {
  const result = await request<{ poll: ApiPoll }>(() => api.get(`/polls/${pollId}`));
  return result.success ? { ...result, data: result.data.poll } : result;
}

export interface CreatePollPayload {
  question: string;
  options: string[];
  max_selections?: number;
  closes_at?: string | null;
  allow_change?: boolean;
  visibility?: ApiPoll["visibility"];
}

/**
 * Creating a poll also creates its backing post (media_type 'poll'), so a poll
 * appears in the feed like anything else. There is no separate "post a poll".
 */
export async function createPoll(payload: CreatePollPayload) {
  const result = await request<{ poll: ApiPoll }>(() => api.post("/polls", payload));
  return result.success ? { ...result, data: result.data.poll } : result;
}

export async function votePoll(pollId: string, optionIds: string[]) {
  const result = await request<{ poll?: ApiPoll }>(() =>
    api.post(`/polls/${pollId}/vote`, { option_ids: optionIds })
  );
  return result;
}

export function retractVote(pollId: string) {
  return request(() => api.delete(`/polls/${pollId}/vote`));
}

export function deletePoll(pollId: string) {
  return request(() => api.delete(`/polls/${pollId}`));
}
