// models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, default: "sent" }, // sent, delivered, read
    /**
     * What this message is a reply to, for the quoted block above the bubble.
     *
     * The PREVIEW IS RESOLVED SERVER-SIDE, never taken from the client. The
     * sender supplies only a kind and an id; if the preview text and image
     * came from the client, anyone could send a message quoting words the
     * other person never wrote, and it would render as though they had.
     *
     * Denormalised on purpose: a story is deleted after 24 hours, and the
     * reply to it has to keep making sense afterwards. Re-reading the story at
     * render time would leave every older reply quoting nothing.
     */
    context: {
      kind: { type: String, enum: ["story"] },
      refId: String,
      authorId: String,
      mediaUrl: String,
      text: String,
      /** So the chat can show an expired story as expired without asking. */
      expiresAt: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
