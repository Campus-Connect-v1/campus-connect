import { db } from "../config/db.js";

/**
 * Turns a client-supplied reply reference into a trustworthy quote.
 *
 * The client sends `{ kind: "story", refId }` and nothing else. Everything
 * shown in the quoted block is read here, from the row, because a preview the
 * client could set is a preview the client could forge -- a message could
 * otherwise quote words the other person never wrote and render as if they
 * had.
 *
 * Returns null when the reference does not check out, and the message is then
 * sent as an ordinary one rather than being rejected: a reply that loses its
 * quote is a much better failure than a reply that does not send.
 */
export const resolveMessageContext = async (context, { senderId, receiverId }) => {
  if (!context || context.kind !== "story" || !context.refId) return null;

  try {
    const [[story]] = await db.execute(
      `SELECT story_id, user_id, media_url, content, story_type
         FROM stories
        WHERE story_id = ? AND is_active = 1`,
      [String(context.refId)]
    );

    if (!story) return null;

    /**
     * You may only quote a story back to the person whose story it is.
     *
     * Without this, a story id -- which every viewer has -- becomes a way to
     * put someone else's private story into a conversation they are not part
     * of.
     */
    if (story.user_id !== receiverId || receiverId === senderId) return null;

    return {
      kind: "story",
      refId: story.story_id,
      authorId: story.user_id,
      mediaUrl: story.media_url ?? null,
      // A text story has no media, so its words are the preview; an image
      // story's caption is, when it has one.
      text: story.content ? String(story.content).slice(0, 140) : null,
    };
  } catch (error) {
    console.error("resolveMessageContext failed:", error.message);
    return null;
  }
};
