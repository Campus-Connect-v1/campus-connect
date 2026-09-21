# Backend request: expose `poll_id` on post payloads

> **Status: implemented (2026-09-21).** Feed, single-post, and create-post
> responses now include `poll_id` (`null` for non-poll posts).

**Why:** polls work end to end on the server, but the mobile app cannot render a
votable poll, because the endpoint that lists posts never returns the poll's id.

`createPollModel` already inserts a backing row in `posts` with
`media_type = 'poll'` and the question as `content`, so a poll *does* reach the
feed. What arrives is:

```json
{ "post_id": "post_…", "content": "Where should the party be?", "media_type": "poll" }
```

The client can see that the post is a poll and can show the question, but it has
no `poll_id`, so it cannot call `GET /api/polls/:poll_id` for the options, and it
cannot call `POST /api/polls/:poll_id/vote`. The poll renders as plain text.

There is also no `GET /api/polls` index, so a poll is unreachable by any other
route.

## The change

Two files. Both are additive: nothing existing changes shape, and non-poll posts
get `poll_id: null`.

### 1. `server/models/social.model.js`

**`getFeedPostsModel`** — add the column and the join:

```diff
         u.profile_headline,
+        pl.poll_id,
         ${feedPreferenceScoreSql()} AS preference_score
       FROM posts p
       JOIN users u ON p.user_id = u.user_id
+      -- A poll post carries media_type 'poll' but the id lives on the polls
+      -- table. Without this the client can read the question but has no id to
+      -- fetch options with or vote on.
+      LEFT JOIN polls pl ON pl.post_id = p.post_id
       WHERE p.is_active = 1
```

**`getPostByIdModel`** — same, but `pl` is already taken by `post_likes` there,
so the alias differs:

```diff
         ) as has_liked,
+        pol.poll_id
       FROM posts p
       JOIN users u ON p.user_id = u.user_id
       LEFT JOIN post_likes pl ON p.post_id = pl.post_id
       LEFT JOIN post_comments pc ON p.post_id = pc.post_id AND pc.is_active = 1
+      -- Aliased pol, because pl is already post_likes above.
+      LEFT JOIN polls pol ON pol.post_id = p.post_id
       WHERE p.post_id = ? AND p.is_active = 1
       GROUP BY p.post_id
```

> Watch the backticks: these queries are template literals, so a SQL comment
> containing `` `pl` `` terminates the string. Keep comments backtick-free.

### 2. `server/controllers/social.controller.js`

In the post serializers (`getFeedPosts`, `getPost`, and `createPost` — all three
build the same object), add one line after `media_type`:

```diff
         media_type: post.media_type,
+        poll_id: post.poll_id || null,
```

## How to check it worked

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "$API/api/social/posts/feed?limit=50" \
  | jq '.posts[] | select(.media_type=="poll") | {post_id, poll_id, content}'
```

Every poll post should come back with a non-null `poll_id`.

## Client status

The app is already written against this. `ApiPost.poll_id` is typed, the feed
adapter carries it through as `pollId`, and `PollCard` renders options, voting,
multi-select, change-your-vote and live results off it.

Until this ships, `poll_id` is undefined, the poll card does not render, and a
poll post falls back to showing its question as an ordinary text post. Nothing
breaks; polls simply are not votable in the app.

## Second, smaller ask

A `GET /api/polls` index (the caller's visible polls, newest first) would let the
app show a polls section outside the feed. Not needed for the above to work.
