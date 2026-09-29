import type { IconName } from "@/src/components/ui";
import { culture } from "@/src/styles/theme";

/**
 * The home screen's category rail.
 *
 * Two of these are not topic filters, and that is deliberate:
 *
 *  - Trending is the ranked feed itself -- affinity, then preference, then
 *    recency. It is the default view, so it filters nothing.
 *  - Events opens the events tab, where real Event rows live with times,
 *    places and RSVPs. A post tagged "events" would be a worse version of
 *    something the app already does properly.
 *
 * The rest carry a `topic` that matches POST_TOPICS on the server. Keep the
 * two lists in step; the server validates against its own copy, so a chip
 * added here without one there filters to nothing.
 */
export interface FeedCategory {
  label: string;
  icon: IconName;
  color: string;
  /** The server-side topic to filter by. Absent on Trending and Events. */
  topic?: string;
  route?: "/(tabs)/events";
}

export const FEED_CATEGORIES: FeedCategory[] = [
  { label: "Trending", icon: "trending", color: culture.pink },
  { label: "Events", icon: "events", color: culture.yellow, route: "/(tabs)/events" },
  { label: "Sports", icon: "sports", color: culture.lime, topic: "sports" },
  { label: "Academic", icon: "academic", color: culture.violet, topic: "academic" },
  { label: "Music", icon: "entertainment", color: culture.pink, topic: "music" },
  { label: "Food", icon: "food", color: culture.yellow, topic: "food" },
];

/** The topics a composer may choose. Trending and Events are not topics. */
export const COMPOSER_TOPICS = FEED_CATEGORIES.filter(
  (category): category is FeedCategory & { topic: string } => Boolean(category.topic)
);

export const topicFor = (label: string): string | null =>
  FEED_CATEGORIES.find((category) => category.label === label)?.topic ?? null;
