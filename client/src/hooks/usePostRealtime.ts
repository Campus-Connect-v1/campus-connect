import { useEffect, useRef } from "react";

import {
  joinPost,
  leavePost,
  onPostEvent,
  type PostEventPayload,
} from "../services/socket";

export interface PostRealtimeHandlers {
  /** Fires on every event, carrying the server's authoritative totals. */
  onCounts?: (counts: { like_count: number | null; comment_count: number | null }) => void;
  onCommentAdded?: (payload: PostEventPayload) => void;
  onCommentUpdated?: (payload: PostEventPayload) => void;
  onCommentDeleted?: (payload: PostEventPayload) => void;
  /** Fires for both like and unlike; the payload carries the new total. */
  onCommentLikeChanged?: (payload: PostEventPayload) => void;
  onPostUpdated?: (payload: PostEventPayload) => void;
  onPostDeleted?: (payload: PostEventPayload) => void;
}

/**
 * Subscribe a screen to one post's realtime room for as long as it is mounted.
 *
 * Handlers are held in a ref and read at call time, so a caller passing inline
 * arrows does not tear down and rebuild every listener on each render — which
 * would drop any event landing in the gap.
 *
 * The socket is shared app-wide and the server excludes this client's own
 * writes (via the x-socket-id header), so what arrives here is other people's
 * activity. Counts are absolute rather than deltas: applying them directly is
 * correct even after missing a frame while backgrounded.
 */
export function usePostRealtime(postId: string | undefined, handlers: PostRealtimeHandlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    if (!postId) return;

    joinPost(postId);

    const counts = (payload: PostEventPayload) =>
      ref.current.onCounts?.({
        like_count: payload.like_count,
        comment_count: payload.comment_count,
      });

    const unsubscribers = [
      onPostEvent(postId, "post:liked", counts),
      onPostEvent(postId, "post:unliked", counts),
      onPostEvent(postId, "comment:added", (p) => {
        counts(p);
        ref.current.onCommentAdded?.(p);
      }),
      onPostEvent(postId, "comment:updated", (p) => ref.current.onCommentUpdated?.(p)),
      onPostEvent(postId, "comment:deleted", (p) => {
        counts(p);
        ref.current.onCommentDeleted?.(p);
      }),
      // Comment likes ride the post's room: a viewer is subscribed to the post
      // they have open, and every comment on it shares that subscription.
      onPostEvent(postId, "comment:liked", (p) => ref.current.onCommentLikeChanged?.(p)),
      onPostEvent(postId, "comment:unliked", (p) => ref.current.onCommentLikeChanged?.(p)),
      onPostEvent(postId, "post:updated", (p) => ref.current.onPostUpdated?.(p)),
      onPostEvent(postId, "post:deleted", (p) => ref.current.onPostDeleted?.(p)),
    ];

    return () => {
      for (const off of unsubscribers) off();
      leavePost(postId);
    };
  }, [postId]);
}
