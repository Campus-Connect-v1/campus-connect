// scripts/verifyStoryReply.js
//
// Verifies the story-reply path WITHOUT a socket, two phones or a live story
// on screen.
//
//   node scripts/verifyStoryReply.js <senderUserId> <storyOwnerUserId>
//   node scripts/verifyStoryReply.js --dry <senderUserId> <storyOwnerUserId>
//
// It runs the same server code the socket handler runs -- resolveMessageContext,
// Message.create, Conversation.findOrCreate, updateLastMessage -- so a pass
// here means the path works and anything still wrong is on the wire or in the
// app. --dry resolves and prints without writing anything.
//
// Both accounts must exist, and the owner must have an active story.
import mongoose from "mongoose";
import dotenv from "dotenv";

import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import { findById } from "../models/user.model.js";
import { resolveMessageContext } from "../utils/messageContext.js";
import { db } from "../config/db.js";

dotenv.config();

const REACTION = "😂";

const name = (user) =>
  [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
  user?.email?.split("@")[0] ||
  "Campus user";

/** Mirrors client/src/features/messages/preview.ts, to show what the list renders. */
const preview = (lastMessage, viewerId) => {
  if (!lastMessage?.content) return "No messages yet";
  if (lastMessage.contextKind !== "story") return lastMessage.content;
  const mine = lastMessage.senderId === viewerId;
  return `${mine ? "Replied to their story" : "Replied to your story"}: ${lastMessage.content}`;
};

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const [senderId, ownerId] = args.filter((a) => a !== "--dry");

  if (!senderId || !ownerId) {
    console.error("usage: node scripts/verifyStoryReply.js [--dry] <senderUserId> <storyOwnerUserId>");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const [sender, owner] = await Promise.all([findById(senderId), findById(ownerId)]);
  if (!sender) throw new Error(`sender ${senderId} not found in MySQL`);
  if (!owner) throw new Error(`story owner ${ownerId} not found in MySQL`);
  console.log(`sender : ${name(sender)}  (${senderId})`);
  console.log(`owner  : ${name(owner)}  (${ownerId})\n`);

  const [stories] = await db.execute(
    `SELECT story_id, media_url, content, expires_at
       FROM stories
      WHERE user_id = ? AND is_active = 1
      ORDER BY created_at DESC
      LIMIT 5`,
    [ownerId]
  );

  if (!stories.length) {
    console.error(
      `✗ ${name(owner)} has no active story, so there is nothing to reply to.\n` +
        `  Post one from that account first -- this is the step that cannot be faked,\n` +
        `  because the server reads the quote from the stories row.`
    );
    process.exit(1);
  }

  console.log(`${name(owner)} has ${stories.length} active story(ies):`);
  for (const s of stories) {
    console.log(`  ${s.story_id}  expires ${new Date(s.expires_at).toISOString()}`);
  }
  const story = stories[0];
  console.log();

  // The real resolver, including its ownership check.
  const context = await resolveMessageContext(
    { kind: "story", refId: story.story_id },
    { senderId, receiverId: ownerId }
  );

  if (!context) {
    console.error(
      "✗ resolveMessageContext returned null, so the reply would send WITHOUT a quote.\n" +
        "  It refuses unless the story is active AND belongs to the recipient."
    );
    process.exit(1);
  }
  console.log("✓ context resolved server-side:");
  console.log(`    ${JSON.stringify(context, null, 2).replace(/\n/g, "\n    ")}\n`);

  if (dry) {
    console.log("--dry: nothing written.");
    await mongoose.disconnect();
    await db.end?.();
    return;
  }

  const message = await Message.create({
    senderId,
    receiverId: ownerId,
    content: REACTION,
    context,
  });
  console.log(`✓ message written: ${message._id}`);

  const conversation = await Conversation.findOrCreate(
    { userId: senderId, email: sender.email, username: name(sender) },
    { userId: ownerId, email: owner.email, username: name(owner) }
  );
  await conversation.updateLastMessage(message);
  await conversation.incrementUnread(ownerId);

  const fresh = await Conversation.findById(conversation._id).lean();
  console.log(`✓ conversation updated: ${conversation._id}`);
  console.log(`    lastMessage: ${JSON.stringify(fresh.lastMessage)}\n`);

  if (fresh.lastMessage?.contextKind !== "story") {
    console.error(
      "✗ contextKind did NOT reach the conversation. The list will show a bare emoji.\n" +
        "  This is the field to check first if the app looks wrong."
    );
    process.exit(1);
  }

  console.log("What each side should now see in the conversations list:");
  console.log(`  ${name(owner)} sees : ${preview(fresh.lastMessage, ownerId)}`);
  console.log(`  ${name(sender)} sees: ${preview(fresh.lastMessage, senderId)}`);
  console.log(`\n✓ all server-side steps passed. Open Messages on ${name(owner)}'s account.`);

  await mongoose.disconnect();
  await db.end?.();
}

main().catch(async (error) => {
  console.error("✗", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
