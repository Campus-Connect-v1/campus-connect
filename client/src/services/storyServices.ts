import { api, request } from "./api";

export type StoryType = "image" | "video" | "text" | "repost";
export type StoryVisibility = "public" | "connections" | "university";

export interface ApiRepostedPost {
  post_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  author: {
    user_id: string;
    first_name: string;
    last_name: string | null;
    profile_picture_url: string | null;
  };
}

export interface ApiStory {
  story_id: string;
  story_type: StoryType;
  media_url: string | null;
  content: string | null;
  background_color: string | null;
  visibility: StoryVisibility;
  created_at: string;
  expires_at: string;
  has_viewed: boolean;
  reposted_post: ApiRepostedPost | null;
}

/** One author's stories, as the feed groups them. */
export interface ApiStoryGroup {
  author: {
    user_id: string;
    first_name: string;
    last_name: string | null;
    profile_picture_url: string | null;
  };
  story_count: number;
  unseen_count: number;
  all_viewed: boolean;
  is_own: boolean;
  latest_story_at: string;
  stories: ApiStory[];
}

export async function fetchStoryFeed(limit = 20, offset = 0) {
  const result = await request<{ count: number; groups?: ApiStoryGroup[] }>(() =>
    api.get("/stories/feed", { params: { limit, offset } })
  );
  return result.success ? { ...result, data: result.data.groups ?? [] } : result;
}

export async function fetchUserStories(userId: string) {
  const result = await request<{ stories?: ApiStory[] }>(() => api.get(`/stories/user/${userId}`));
  return result.success ? { ...result, data: result.data.stories ?? [] } : result;
}

export interface CreateStoryPayload {
  story_type: StoryType;
  /** Required for image and video, rejected on text. Must be a Cloudinary URL. */
  media_url?: string;
  /** Required for text. */
  content?: string;
  /** Text stories only, hex like #1a2b3c. */
  background_color?: string;
  /** Repost stories only. */
  repost_post_id?: string;
  visibility?: StoryVisibility;
  duration_hours?: number;
}

export async function createStory(payload: CreateStoryPayload) {
  const result = await request<{ story: ApiStory }>(() => api.post("/stories", payload));
  return result.success ? { ...result, data: result.data.story } : result;
}

/** Marks a story seen. Fire-and-forget: a failed view is not worth an error. */
export function viewStory(storyId: string) {
  return request(() => api.post(`/stories/${storyId}/view`));
}

export function deleteStory(storyId: string) {
  return request(() => api.delete(`/stories/${storyId}`));
}

export async function fetchStoryViewers(storyId: string) {
  const result = await request<{
    viewers?: {
      user_id: string;
      first_name: string;
      last_name: string | null;
      profile_picture_url: string | null;
      viewed_at: string;
    }[];
  }>(() => api.get(`/stories/${storyId}/viewers`));
  return result.success ? { ...result, data: result.data.viewers ?? [] } : result;
}
