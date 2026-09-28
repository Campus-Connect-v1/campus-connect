import type { ApiStoryGroup } from "@/src/services/storyServices";

/**
 * The story groups the rail is already holding, so the viewer can paint on its
 * first frame.
 *
 * Opening a story used to show black for as long as the network took. The rail
 * navigates with a user id alone, and the viewer then re-fetched the whole
 * story feed it had just come from, so every tap paid for a round trip to
 * learn something the previous screen already knew -- and on a cold API that
 * is not a flicker, it is seconds.
 *
 * A module-level map rather than context: the only thing that needs this is
 * one screen reading it synchronously during its first render, and a provider
 * would re-render every subscriber each time the feed refreshed.
 *
 * Treated as a hint, never as truth. The viewer still fetches, and replaces
 * this the moment real data lands -- these entries can be stale, and a story
 * may have expired since the rail drew it.
 */
const groups = new Map<string, ApiStoryGroup>();

/** Called wherever a story feed arrives, so any later viewer can start warm. */
export function primeStoryGroups(incoming: ApiStoryGroup[] | null | undefined) {
  if (!incoming?.length) return;
  for (const group of incoming) {
    if (group?.author?.user_id) groups.set(group.author.user_id, group);
  }
}

export function cachedStoryGroup(userId: string | undefined): ApiStoryGroup | undefined {
  return userId ? groups.get(userId) : undefined;
}

/** Cleared on sign-out: these carry another account's stories. */
export function clearStoryGroups() {
  groups.clear();
}
