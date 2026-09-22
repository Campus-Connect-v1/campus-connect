import { useEffect, useRef } from "react";

import {
  joinPost,
  leavePost,
  onPostEvent,
  type PostEventPayload,
} from "../services/socket";

export interface FeedRealtimeHandlers {
  /** Authoritative totals for one post, after someone else acted on it. */
  onCounts?: (
    postId: string,
    counts: { like_count: number | null; comment_count: number | null }
  ) => void;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (postId: string, content: string | undefined) => void;
}

/**
 * Keep a list of posts live for as long as it is on screen.
 *
 * usePostRealtime covers the one post a detail screen has open; a feed is
 * showing twenty at once, and each is its own room. Joining them individually
 * is cheap — a room is a set membership on the server, not a connection — and
 * it means a like on the third row moves that row rather than waiting for the
 * next refresh.
 *
 * Membership is diffed rather than torn down and rebuilt on every render:
 * paginating a feed appends ids, and re-joining the first twenty each time
 * would churn the socket for no reason.
 *
 * The listeners are registered once, not per post, because a single shared
 * socket delivers every room's traffic anyway — the payload's post_id is what
 * routes it. Twenty rooms therefore cost twenty joins and three listeners.
 */
export function useFeedRealtime(postIds: string[], handlers: FeedRealtimeHandlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  // Sorted + joined so the effect re-runs on membership change, not on a
  // re-ordering of the same posts.
  const key = [...postIds].sort().join(",");

  useEffect(() => {
    const ids = key ? key.split(",") : [];
    if (ids.length === 0) return;

    const known = new Set(ids);
    for (const id of ids) joinPost(id);

    const counts = (payload: PostEventPayload) => {
      if (!known.has(payload.post_id)) return;
      ref.current.onCounts?.(payload.post_id, {
        like_count: payload.like_count,
        comment_count: payload.comment_count,
      });
    };

    // onPostEvent filters by a single post id, so the feed subscribes with its
    // own handlers and does the membership check itself.
    const unsubscribers = ids.flatMap((id) => [
      onPostEvent(id, "post:liked", counts),
      onPostEvent(id, "post:unliked", counts),
      onPostEvent(id, "comment:added", counts),
      onPostEvent(id, "comment:deleted", counts),
      onPostEvent(id, "post:deleted", () => ref.current.onPostDeleted?.(id)),
      onPostEvent(id, "post:updated", (p) => ref.current.onPostUpdated?.(id, p.content)),
    ]);

    return () => {
      for (const off of unsubscribers) off();
      for (const id of ids) leavePost(id);
    };
  }, [key]);
}
