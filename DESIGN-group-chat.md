# Group chat: scope

Messaging today is strictly one-to-one. Study groups and events have members and
no way to talk, which is the largest gap between this and a social app — a study
group you cannot talk in is a list of names.

This is what it takes, what it breaks, and the three decisions that are yours.

---

## The central problem: messages are not linked to conversations

```js
// models/message.model.js
{ senderId, receiverId, content, status }
```

There is no `conversationId`. A message belongs to a conversation only by
implication — the pair of users on it. Every read works backwards from that:

```js
Message.find({ $or: [
  { senderId: a, receiverId: b },
  { senderId: b, receiverId: a },
]})
```

For a group there is no pair, so there is nothing to work backwards from. **Every
other change here is small; this one is structural.**

## A bug that group chat would introduce on day one

```js
// conversation.model.js
conversation = await this.findOne({
  "participants.userId": { $all: [userId1, userId2] },
});
```

`$all` means "contains both", not "is exactly these two". The moment a group
exists containing A and B, opening a direct message between A and B returns **the
group**, and their private messages go into it.

This must be fixed in the same change, not after.

---

## Schema

### `Message`

```js
{
  conversationId: { type: String, required: true, index: true },  // NEW
  senderId:   { type: String, required: true },
  receiverId: { type: String },        // now optional: direct messages only
  content:    { type: String, required: true },
  status:     { type: String, default: "sent" },
}
```

`receiverId` is kept rather than dropped, so existing direct-message code and
the `mark_message_read` handler keep working unchanged.

Index: `{ conversationId: 1, createdAt: -1 }` — the history endpoint's only query.

### `Conversation`

```js
{
  type:      { type: String, enum: ["direct", "group"], default: "direct" },  // NEW
  title:     { type: String },          // NEW, groups only
  createdBy: { type: String },          // NEW, groups only
  // Links the chat to the thing it belongs to, so a study group has one
  // conversation rather than accumulating several.
  contextType: { type: String, enum: ["study_group", "event"] },              // NEW
  contextId:   { type: String, index: true },                                 // NEW

  participants: [...],   // already an array; no change needed
  lastMessage:  {...},
  unreadCount:  Map,     // already keyed by user; works for N
}
```

`participants` and `unreadCount` already generalise. Only the lookups assume two.

### Migration

Existing messages need a `conversationId`. One pass:

```js
for (const conv of await Conversation.find({}).lean()) {
  const [a, b] = conv.participants.map((p) => p.userId);
  await Message.updateMany(
    { conversationId: { $exists: false },
      $or: [{ senderId: a, receiverId: b }, { senderId: b, receiverId: a }] },
    { $set: { conversationId: conv._id.toString() } }
  );
}
```

Messages with no matching conversation are orphans from before the conversation
system existed; they can be left, or swept into a conversation created for the
pair. Worth checking the count first.

---

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/conversations` | Extend: accepts `participantIds[]` and `title`. Two ids with no title stays a direct conversation. |
| `GET` | `/api/conversations` | Already returns both once `type` exists. `otherParticipant` is meaningless for a group — return `title` and a participant count instead. |
| `GET` | `/api/conversations/:id/messages` | Already exists. Query by `conversationId` instead of the pair. |
| `POST` | `/api/conversations/:id/participants` | Add people. Creator or existing member. |
| `DELETE` | `/api/conversations/:id/participants/:userId` | Remove, or leave when it is yourself. |
| `PATCH` | `/api/conversations/:id` | Rename. |

`getOtherParticipant()` must stop being called for groups — it returns the first
non-self participant, which for a group is simply whoever happens to be first.

---

## Socket

`send_message` currently takes `{ receiverId, content }` and delivers to one
socket id from the `onlineUsers` map.

New form, with the old one kept:

```js
socket.on("send_message", async ({ conversationId, receiverId, content }) => {
  // conversationId wins; receiverId still resolves a direct conversation.
});
```

**Fan-out uses the existing per-user rooms, not a new conversation room.**
`realtime.js` already addresses `userRoom(userId)`, which accumulates every
socket a person has open — so a phone and a tablet both receive. Emitting to
each participant's user room needs no join/leave bookkeeping and stays correct
when someone is added to or removed from a group mid-session:

```js
for (const p of conversation.participants) {
  if (p.userId !== senderId) emitToUser(p.userId, "receive_message", payload);
}
```

A conversation room would need every member to join on connect and re-join on
membership change, and would silently drop messages for anyone who missed it.

`onlineUsers` in socket.js maps one user to one socket id, so a second device
evicts the first. The room approach sidesteps that too; the existing direct-message
path could move to it in the same change.

---

## Three decisions

**1. Does a study group get a chat automatically, or on request?**

Automatic means every group has a thread from creation, and joining a group joins
its chat. Simple, and the chat is never empty of members. It also means creating
a group you never use leaves a dead thread in everyone's message list.

On request means a "Start group chat" action. Fewer dead threads, one more step,
and the feature is less discoverable.

I would go automatic for study groups (the whole point is working together) and
on request for events (most events need an announcement, not a conversation).

**2. Can anyone add people, or only the creator?**

`study_groups` already has a `group_type` of `public | private | invite_only`
and `group_members` has a `role`. The chat could inherit that rather than
inventing its own rule — a member can add for a public group, only creator or
admin otherwise.

**3. What happens to the chat when someone leaves the group?**

Leaving the group should leave the chat. The reverse is less obvious: leaving the
chat while staying in the group is a reasonable thing to want, and needs a flag
rather than removing the participant, or they get re-added by the next sync.

---

## Client

- Conversation list already exists; needs a group row (title, member count, a
  stacked avatar or a group glyph instead of one face).
- Chat thread mostly works as is. Needs the sender's name and avatar on each
  bubble in a group — a column of unattributed bubbles is unreadable past two
  people.
- A group info screen: members, add, leave, rename.
- Entry points from the study group card and the event detail screen.

## Sizing

Roughly: schema and migration half a day, endpoints a day, socket half a day,
client two days. The migration is the only irreversible part and should be
rehearsed against a copy.
