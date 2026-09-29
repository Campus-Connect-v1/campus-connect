import type { ApiConversation } from "@/src/services/conversationServices";

/**
 * The one line under a name in the conversations list.
 *
 * A story reply is usually a single emoji, and on its own "😂" says nothing
 * about what was found funny. Naming what it answered is the whole value of
 * the row; the quote itself belongs on the message, in the thread.
 *
 * Story replies always travel toward the story's owner, so who sent it is
 * enough to decide whose story it was -- the conversation does not have to
 * carry that separately.
 *
 * Pure and separate from the screen so it can be tested without a socket, two
 * accounts and an unexpired story.
 */
export function conversationPreview(
  conversation: Pick<ApiConversation, "lastMessage">,
  viewerId?: string
): string {
  const last = conversation.lastMessage;

  /**
   * An attachment is named before anything else.
   *
   * An image-only message carries a blank body, so without this the row would
   * read "No messages yet" on a conversation whose last message was a photo.
   */
  if (last?.mediaType) {
    const label = last.mediaType === "video" ? "Video" : "Photo";
    const caption = last.content?.trim();
    return caption ? `${label}: ${caption}` : label;
  }

  if (!last?.content?.trim()) return "No messages yet";
  if (last.contextKind !== "story") return last.content;

  const mine = Boolean(viewerId) && last.senderId === viewerId;
  return `${mine ? "Replied to their story" : "Replied to your story"}: ${last.content}`;
}
