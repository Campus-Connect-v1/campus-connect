# API coverage

> **Backend gap update (2026-09-21):** the five interests/courses blockers,
> message-history endpoint, feed `poll_id`, connection-response route, complete
> profile fields, and push-token endpoints are now implemented. Production also
> returns 404 for both geofencing debug routes. The route counts below preserve
> the original client audit rather than mixing backend additions into its
> historical totals.

> **Updated.** Messaging, delete account, event detail/edit/delete, password
> reset and facilities are now wired. Coverage went 67 -> **83 of 125**.
>
> Of the 42 still unwired, 21 are the admin web app, 3 are operator-only and 2
> are debug, leaving **16 mobile-relevant routes** — and 5 of those are blocked
> on the backend, not on the app. The remaining sections below are kept as the
> original audit; the "Suggested order" at the bottom is now done except where
> noted.

## Current state

| | count |
|---|---|
| Server routes | 125 |
| Wired | 83 |
| Admin web app (not mobile) | 21 |
| Operator-only moderation | 3 |
| Debug (should not ship) | 2 |
| **Mobile-relevant, still unwired** | **16** |

### Blocked on the backend, not on the app (5)

`POST/DELETE /api/user/interests`, `PUT /api/user/interests/:id`,
`POST/DELETE /api/user/courses` — these write to the `user_interests` and
`user_courses` tables, but `GET /api/user/profile` reads the `users.interests`
JSON column instead, and there is no `GET` for either table. An editor built on
these would save into something nothing reads. Written up in
`BACKEND-REQUEST-2-messages-and-interests.md`.

### Deliberately left (11)

| Route | Why |
|---|---|
| `GET /api/polls/:poll_id/results` | `GET /polls/:poll_id` already returns the counts. |
| `GET /api/stories/:story_id` | The story feed returns whole stories. |
| `GET /api/study-group/:groupId/members` | No member list screen yet. |
| `GET /api/university/facilities/:facilityId` | The list row shows everything the detail would. |
| `GET /api/user/connections/:status` | The client fetches all and groups them itself. |
| `GET /api/geofencing/location/history` | No UI for it. |
| `GET/POST/DELETE /api/moderation/preferences` | "See less" writes its own signal; explicit preference management has no screen. |
| `GET /api/auth/google/url` | Not needed; the client uses expo-auth-session. |
| `POST /api/auth/google/test` | Test-only. |

---

## Original audit

125 routes on the server. **67 wired** into the mobile client, **58 not**.

Of the 58, 21 belong to the admin web app and 2 are debug endpoints, so the real
mobile gap is **35 routes**, and they cluster into four features.

---

## Not wired, and it matters

### Messaging (5 routes) — the biggest hole

```
GET    /api/conversations
POST   /api/conversations
GET    /api/conversations/:conversationId
DELETE /api/conversations/:conversationId
GET    /api/conversations/participant/:participantId
```

There is no messaging UI at all, and `socket.js` on the server already does
realtime. The Connect flow ends at "Request sent" with no way to then talk to
the person. This is the one gap a user would actually notice.

Needs: a conversations list, a thread screen, and a Socket.IO client. The
`message.model.js` and `verifySocketToken.js` pieces exist server-side.

### Profile completeness (5 routes)

```
POST   /api/user/interests
PUT    /api/user/interests/:interest_id
DELETE /api/user/interests/:interestId
POST   /api/user/courses
DELETE /api/user/courses/:courseId
```

The profile screen *displays* interests but offers no way to add, edit or remove
one, and courses are not surfaced anywhere. Both feed discovery and connection
recommendations (`match_score` is partly built on them), so an empty interest
list quietly weakens recommendations.

### Account deletion (1 route)

```
DELETE /api/user/profile
```

Settings has a "Delete account" row that is wired to nothing. This is usually a
store-review requirement, so it is worth closing before submission.

### Event detail and management (3 routes)

```
GET    /api/events/:eventId
PUT    /api/events/:eventId
DELETE /api/events/:eventId
```

Events can be created and RSVP'd but never opened, edited or deleted. Groups got
an edit screen this round; events did not. There is no event detail screen, so
`event_description`, attendee lists and the virtual link are collected at
creation and then never shown.

---

## Not wired, lower value

| Route | Note |
|---|---|
| `GET /api/user/connections/:status` | The client fetches all connections and groups them client-side. Fine for now. |
| `GET /api/study-group/:groupId/members` | No member list screen. |
| `GET /api/stories/:story_id` | The feed returns whole stories, so single fetch is unused. |
| `GET /api/polls/:poll_id/results` | `GET /polls/:poll_id` already carries counts. |
| `GET /api/geofencing/location/history` | No UI for it. |
| `GET/POST/DELETE /api/moderation/preferences` | The "see less" signal is written via its own route; explicit preference management has no screen. |
| `POST /api/auth/reset-password` | Forgot-password is wired, but the screen that consumes the emailed token is missing, so the flow dead-ends. |
| `GET /api/auth/google/url` | Not needed: the client uses expo-auth-session. |
| `POST /api/auth/google/test` | Test-only. |

### Campus buildings and facilities (6 routes)

```
GET /api/university/:university_id/buildings/search
GET /api/university/:university_id/facilities/search
GET /api/university/:university_id/facilities/type
GET /api/university/:university_id/facilities/reservable
GET /api/university/buildings/:buildingId
GET /api/university/buildings/:buildingId/facilities
GET /api/university/facilities/:facilityId
```

Only the plain buildings list is used, to place map pins. There is no building
detail sheet and facilities are entirely unused — no way to find a free study
room or a reservable space, which is a real campus-app feature sitting finished
on the server.

---

## Deliberately not wired

**Admin (21 routes)** — `/api/admin/*` is the operator web app in `app/`, not the
student client. It has its own auth (`POST /api/admin/auth/login`,
`adminAuth.js`). Nothing here belongs in the mobile app.

**Operator moderation (3 routes)** — `GET /api/moderation/reports`,
`GET /api/moderation/reports/stats`, `PATCH /api/moderation/reports/:report_id`
are behind `requireOperator`. Students file reports; operators triage them in the
admin app.

**Debug (2 routes)** — `GET /api/geofencing/debug/locations` and
`POST /api/geofencing/debug/set-test-location`. CORRECTION: an earlier version
of this file called these unauthenticated. They are not —
`routes/location.routes.js` applies `router.use(authenticate)` above them.

They are still a privacy problem: `/debug/locations` returns `sample_locations`,
the raw coordinates of five arbitrary users, to ANY signed-in caller, bypassing
`user_privacy_settings` entirely. `show_exact_location` does not apply. They
should not ship to production.

---

## Blocked, not unwired

`GET /api/social/posts/feed` is wired, but it does not return `poll_id`, so polls
cannot be voted on from the feed. The client is already written against it. See
`BACKEND-REQUEST-poll-id-in-feed.md`.

---

## Suggested order — status

1. ~~**Messaging**~~ — done. Conversations list, chat thread, shared Socket.IO
   client. **History is not loadable**: no endpoint returns past messages, so a
   thread starts empty and fills live. See
   `BACKEND-REQUEST-2-messages-and-interests.md`.
2. ~~**Delete account**~~ — done. Two gates (password plus typing DELETE), then
   the session is cleared.
3. ~~**Event detail screen**~~ — done, plus edit and cancel for the host.
4. **Interests and courses editing** — NOT done, deliberately. Blocked on the
   read/write split described above.
5. ~~**Password reset**~~ — done, including the forgot-password entry point that
   was missing, so the flow no longer dead-ends.
6. ~~**Facilities**~~ — done. Search plus filters for bookable, study rooms,
   libraries, labs, cafes and gyms.
