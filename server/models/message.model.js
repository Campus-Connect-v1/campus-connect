// models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, default: "sent" }, // sent, delivered, read
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
