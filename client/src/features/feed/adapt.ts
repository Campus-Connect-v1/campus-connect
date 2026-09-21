import type { ApiPost } from "@/src/services/socialServices";

import type { FeedPost } from "./types";

/** Minutes/hours/days since, in the compact form the feed shows. */
function since(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/**
 * Maps the API's post shape onto what the feed components render.
 *
 * Kept as its own function rather than reshaping inside the screen: the server
 * uses snake_case and nests stats, the UI wants flat camelCase, and mixing the
 * two in a component is how half-migrated field names end up on screen.
 */
export function adaptPost(post: ApiPost): FeedPost {
  const name = [post.author.first_name, post.author.last_name].filter(Boolean).join(" ");

  return {
    id: post.post_id,
    author: {
      id: post.author.user_id,
      name,
      handle: post.author.user_id,
      avatar: post.author.profile_picture_url ?? "",
      hall: post.author.profile_headline ?? "",
    },
    postedAt: since(post.created_at),
    caption: post.content,
    image: post.media_url ?? undefined,
    pollId: post.poll_id ?? undefined,
    likes: post.stats.like_count,
    comments: post.stats.comment_count,
    liked: post.user_actions.has_liked,
    saved: false,
  };
}
