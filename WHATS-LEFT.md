# What's left

Findings from a read of the client and server as they stand. Nothing here is
speculative — each item names the file or route it came from.

---

## 1. Blocker: a connection request can never be accepted

**This breaks the core social loop.** You can send a request and cancel one.
Nobody can accept one, so the graph never forms an edge, and everything built on
`connections` (the `connections` feed visibility rule, `match_score`, the
"Connections" privacy setting) can never come into play.

The controller exists and is complete — `respondToConnection` in
`server/controllers/user.controller.js:357`. It validates accept/decline, calls
`updateConnectionStatus`, and even sends the acceptance notification.

It is **never imported and never routed**. `server/routes/user.routes.js` imports
16 controller functions; this is not one of them.

**Server fix:** add it to the import block and add a route, e.g.

```js
router.post("/connections/respond", respondToConnection);
```

Body: `{ connection_id, action: "accept" | "decline" }`.

**Client fix (mine, once the route exists):** there is no connections screen at
all. `fetchConnections` and `cancelConnectionRequest` are wired in
`userServices.ts` and called from nothing. Needs a screen listing incoming,
sent and accepted, with accept/decline on incoming.

---

## 2. Push notifications cannot be delivered

`expo-notifications` is in `package.json` and is **never imported anywhere** in
`src/` or `app/`. No permission prompt, no `getExpoPushTokenAsync`, no token
ever sent to the server.

So the "Push notifications" switch in Settings writes `notification_push` to the
users row correctly, and nothing can act on it, because the server has no device
token to push to. The preference is real; the delivery does not exist.

Needs: token registration at a sensible moment (after the first value moment,
not on launch), an endpoint to store the token per device, and the server side
that sends. `src/services/notifications.ts` is a 0-byte placeholder.

---

## 3. Unread message counts never clear

`markMessageRead` exists in `src/services/socket.ts` and is called from nowhere.
The socket handler on the server (`mark_message_read`) resets the conversation's
unread count, so the plumbing is there on both ends — the chat screen just never
emits it. Open a thread, read everything, and the badge stays.

One-line fix in `app/messages/[id].tsx` once message history exists (see below),
since right now there are no historical messages to mark.

---

## 4. Already sent to the backend (3 docs)

| Doc | Effect while outstanding |
|---|---|
| `BACKEND-REQUEST-poll-id-in-feed.md` | Polls are not votable. A poll post renders as plain text. |
| `BACKEND-REQUEST-2-messages-and-interests.md` (part 1) | Chat has no scrollback. A thread opens empty and fills only with messages that arrive while it is open. |
| `BACKEND-REQUEST-2-messages-and-interests.md` (part 2) | Interests and courses cannot be edited. Writes go to one store, reads come from another. |

Also in that second doc: `getConversations` reads `mysqlUser?.avatar_url`, but
the column is `profile_picture_url`, so every conversation avatar is blank.

---

## 4b. Profile editing (DONE, with two caveats)

`app/settings/edit-profile.tsx` now edits the nine fields that round-trip:
first and last name, headline, bio, programme, graduation year, date of birth,
phone, LinkedIn and website. Client validation mirrors the server's Joi rules so
a bad value lands next to its field instead of as a flat 400.

Two things worth knowing:

- It seeds from `GET /user/:userId`, not `GET /user/profile`. The latter does
  NOT return `profile_headline`, `linkedin_url` or `website_url`, even though
  PUT accepts all three, so seeding from it would show those blank on every
  visit and look like the save had failed. Worth fixing server-side by adding
  the three fields to `getProfile`'s response.
- **`year_of_study` still cannot be set.** The profile displays it as
  "Level 300", but it is absent from `updateUserProfileModel`'s `allowedFields`,
  so no API call can write it. Add it there to make it editable.

Also fixed while here: `show_location_preference` and `show_status_preference`
are audience enums (`friends` / `university` / `none`), not booleans. The
privacy screen was sending `true`/`false`, which the server rejects with a 400.

## 5. Capability wired, no UI for it

These services exist and work; nothing calls them from a screen.

| What | Missing |
|---|---|
| `searchUsers` | No people-search screen. Explore's search bar is **decorative** — it has no `onPress` at all. |
| `fetchMyEvents` | No "events I'm going to" view. |
| `fetchStoryViewers` | You cannot see who viewed your story. |
| `fetchHiddenPosts` / `unhidePost` | Hiding a post is irreversible from the app. |
| `deleteNotification` / `clearNotifications` | No swipe-to-delete, no clear-all. |
| `deleteConversation` | Cannot delete a chat. |
| `deletePoll` | Cannot delete your own poll. |
| `fetchBuilding` / `searchBuildings` | No building detail screen; map search covers rooms only via facilities. |

---

## 6. Explore is a placeholder

`app/(tabs)/explore.tsx` is eight hardcoded Unsplash tiles and a fake search
bar. Zero API calls. Three tiles route into other tabs; the rest (Sports, Food,
Opportunities, Marketplace) go nowhere. It is the one screen still built
entirely from invented content.

It is not in the tab bar any more, so this is lower priority than it looks — but
it is reachable from Campus and the drawer.

---

## 7. Release readiness

- **No `eas.json`.** No build profiles, no submit config. Nothing can be built
  for TestFlight or Play as things stand.
- **Splash flashes.** `app.json` sets the splash background to `#ffffff` /
  `#000000`, but the app's grounds are warm white `#F8F7F4` and ink `#161616`.
  Cold start shows a visible colour jump.
- **Zero tests.** Jest is configured in `jest.config.js`; there are no test
  files. The adapters (`adaptPost`, `adaptEvent`, `adaptProfile`,
  `adaptStudyGroup`, `adaptNearby`, `foregroundOn`) are pure functions and the
  obvious place to start.
- **Three dead files**: `src/services/firestore.ts`, `notifications.ts` and
  `storage.ts` are 0 bytes. Firebase is still a dependency and is now unused —
  uploads went to Cloudinary.
- **`BYPASS_AUTH`** still exists in `src/constants/env.ts` and `app/index.tsx`.
  It is `__DEV__`-guarded so it cannot fire in production, but it should go
  before release.

---

## 8. Server-side privacy leak

`GET /api/geofencing/debug/locations` and
`POST /api/geofencing/debug/set-test-location`.

These ARE authenticated — `routes/location.routes.js` has
`router.use(authenticate)` above them. (An earlier note of mine in
`API-COVERAGE.md` said they were not; that was wrong and is corrected.)

They are still a problem: `/debug/locations` returns `sample_locations`, the raw
coordinates of five arbitrary users, to any signed-in caller. It bypasses
`user_privacy_settings` completely — `show_exact_location` and
`profile_visibility` do not apply. Should be deleted or dev-gated before
production.

---

## 9. Never verified on a device

Nothing in this app has been run. Everything is typecheck-clean and lint-clean,
which says nothing about runtime. Specifically unverified:

- Every screen built in this session, rendered at all.
- The stretching fix (`flexGrow: 0` on horizontal rails) — a layout change
  reasoned about from code only.
- Cloudinary upload against a configured server.
- Socket connection and live message delivery.
- Story viewer timing, tap zones, video playback.
- The date/time pickers on both platforms.
- Map camera animation and the building sheet over a live map.
- Lottie empty state.
- Keyboard behaviour, splash transition, 1.3x font scale, Android edge-to-edge.

---

## Suggested order

1. **Connection accept** — one server route plus a connections screen. Without
   it the product's main verb does not complete.
2. **Run it on a device** and walk the main flows. Highest information per
   minute of anything on this list.
3. **Push registration** — turns an existing, already-correct setting into a
   working feature.
4. The three backend requests, as they come back.
5. `eas.json` and the splash colours, when you are close to shipping.
6. Explore, or delete it.
