# Backend requests (2): message history, and the interests/courses split

> **Status: implemented (2026-09-21).** The API now exposes paginated message
> history at `GET /api/conversations/:conversationId/messages`; conversation
> identities use real names and `profile_picture_url`; interests and courses
> use their normalized tables as the read source through both profile responses
> and dedicated GET endpoints. The participant route was also moved ahead of
> the wildcard conversation route so Express no longer shadows it.

Two gaps found while wiring the remaining features. Both are cases where the
write side exists but the read side does not, so the mobile app can put data in
and then cannot show it.

---

## 1. No endpoint returns message history

**Severity: high.** Messaging is otherwise complete and working.

Messages are written to the Mongo `Message` collection by the `send_message`
socket handler, and `Conversation` tracks `lastMessage` and `unreadCount`. But
nothing reads the messages back:

- `GET /api/conversations` returns conversation metadata only.
- `GET /api/conversations/:conversationId` returns the conversation document
  plus `otherParticipant`. The `Conversation` schema has no messages array, so
  no messages come with it.
- `GET /api/conversations/participant/:participantId` is the same.
- The socket has `get_conversations`, which returns conversations, not messages.

**Effect in the app:** a chat thread opens empty every time and only fills with
messages that arrive while the screen is open. Close it and the history is gone
from view, even though every message is safely in Mongo.

### Suggested endpoint

```
GET /api/conversations/:conversationId/messages?limit=50&before=<ISO timestamp>
```

Both participants of the conversation may read it; everyone else gets 403.
Newest-last (or newest-first with the client reversing, either is fine as long
as it is documented). `before` drives paging as the user scrolls up.

Response, matching the shape `socket.js` already emits so the client can use one
type for both:

```json
{
  "success": true,
  "data": [
    {
      "_id": "…",
      "senderId":   { "_id": "user_1", "username": "…", "email": "…" },
      "receiverId": { "_id": "user_2", "username": "…", "email": "…" },
      "content": "…",
      "status": "read",
      "createdAt": "2026-09-21T18:00:00.000Z"
    }
  ],
  "pagination": { "hasMore": true, "oldest": "2026-09-21T17:00:00.000Z" }
}
```

The query is roughly:

```js
Message.find({
  $or: [
    { senderId: a, receiverId: b },
    { senderId: b, receiverId: a },
  ],
  ...(before ? { createdAt: { $lt: new Date(before) } } : {}),
})
  .sort({ createdAt: -1 })
  .limit(limit)
```

where `a` and `b` are the two `participants[].userId` values on the conversation.

### Smaller, related

`Conversation.participants[].username` is used as the display name in the app. If
the Mongo participant document also carried `first_name` / `last_name`, or if the
controller enriched it the way it already enriches `avatar`, the messages list
could show real names instead of a username or an email local-part.

Also note `getConversations` and `getConversation` read `mysqlUser?.avatar_url`,
but the users table column is `profile_picture_url` — so `otherParticipant.avatar`
is always undefined and every conversation shows a blank avatar. One-word fix.

---

## 2. Interests and courses are written to one place and read from another

**Severity: medium.** This one is a correctness trap rather than a missing route.

`GET /api/user/profile` returns `interests` by reading the **`users.interests`
JSON column**:

```sql
SELECT ..., interests, social_links, privacy_settings, ... FROM users WHERE user_id = ?
```

But `POST/PUT/DELETE /api/user/interests` operate on the **`user_interests`
table**. They are two different stores, and nothing reconciles them.

Consequences:

- An interest added through the API never appears on the profile.
- There is no `GET /api/user/interests`, so the `user_interests` rows cannot be
  listed at all.
- `users.interests` is not in `updateUserProfileModel`'s `allowedFields`, so the
  column the profile actually reads cannot be written through the API either.

Courses have the same shape: `POST /api/user/courses` and
`DELETE /api/user/courses/:courseId` exist, but there is no `GET`, and courses
appear nowhere in any profile response.

**Effect in the app:** I did not build the interests/courses editor, because
every version of it would have been a form that appears to save and then shows
nothing. The profile currently renders `users.interests` read-only.

### Pick one of these

**Option A (preferred) — make the table the source of truth.** Add
`GET /api/user/interests` and `GET /api/user/courses`, and have `getUserProfile`
join `user_interests` and `user_courses` instead of reading the JSON column.
Drop `users.interests` once nothing reads it.

**Option B — make the column the source of truth.** Add `interests` to
`allowedFields` in `updateUserProfileModel` and retire the `/user/interests`
routes and the `user_interests` table.

Option A is the better shape: `interest_type` and `skill_level` are real columns
with enums, and `getConnectionRecommendationsModel` already computes
`match_score` from joins against these tables, so recommendations improve as soon
as the rows are actually populated. Option B would throw that away.

Whichever you pick, the mobile editor is quick to add once one side wins.

---

## Already sent

`BACKEND-REQUEST-poll-id-in-feed.md` covers exposing `poll_id` on post payloads
so polls can be voted on from the feed. Still outstanding.
