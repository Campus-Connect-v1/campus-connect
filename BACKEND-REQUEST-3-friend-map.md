# Backend request (3): friend locations for the map

> **Status: implemented (2026-09-23).** `GET /api/geofencing/friends` is live,
> `privacyService.areConnected` is a real check, and precision bucketing with
> server-side coordinate rounding is in place. Kept as the design record.
>
> Correction to the draft below: the column is `receiver_id`, not
> `recipient_id`.

The client-side Snap-style map is built. It renders friends at any distance,
with staleness, coarse-position halos, story rings and a tap sheet. It currently
shows nothing in that layer, because there is no endpoint to feed it.

## Why the existing nearby route cannot do this

`locationService.findNearbyUsers` is a Mongo `$near` with `maxDistance: radius`.
A friend outside that radius is not filtered out of the result — they are never
found. So a persistent friend map needs its own read; no amount of raising the
radius gets there, and raising it would also widen who sees *strangers*.

## The endpoint

```
GET /api/geofencing/friends
```

Authenticated. Returns every **accepted connection** who is currently sharing
location, at any distance.

```json
{
  "success": true,
  "friends": [
    {
      "user_id": "user_12",
      "first_name": "Ama",
      "last_name": "Boateng",
      "profile_picture_url": "https://res.cloudinary.com/…",
      "university_id": "uni_3",
      "latitude": 5.6508,
      "longitude": -0.1869,
      "precision": "exact",
      "last_seen": "2026-09-23T09:12:00.000Z",
      "is_online": true,
      "has_story": false,
      "place_label": "Legon campus"
    }
  ]
}
```

The client already handles 404 and 501 as "empty", so shipping it in stages is
fine — a stub returning `{ success: true, friends: [] }` is a valid first step.

## `precision` is the important field

This is the part worth getting right before it ships, not after.

A friend map means a student's location is visible to someone who is not near
them, potentially in another city, indefinitely. Most users here are 18–22.
Snapchat has taken sustained criticism for exactly this, and the mitigation that
works is **not showing a precise point to people who are far away**.

So the server decides precision, never the client:

| value | meaning | drawn as |
|---|---|---|
| `exact` | within the viewer's own nearby radius | a point |
| `area` | same city or campus, further out | a ~400m halo |
| `city` | anywhere else | a ~3km halo |

The client draws `area` and `city` as a translucent circle rather than a pin, so
the imprecision is **visible** rather than implied. It never shows coordinates or
a street address, even at `exact`.

Suggested rule: `exact` only when the two users are within roughly the viewer's
`custom_radius`; `area` when in the same city; `city` otherwise. Rounding the
coordinates server-side for the coarse buckets (rather than sending exact ones
and trusting the client to blur) is what actually protects the user — a client
that renders a halo around a precise coordinate has still received the precise
coordinate.

## Respect the existing privacy settings

All of these already exist and should gate this endpoint:

- **`incognito`** — excluded entirely. This is Ghost Mode, and the map now has a
  visible toggle wired to `POST /geofencing/incognito`.
- **`profile_visibility: "private"`** — excluded.
- **`show_exact_location: false`** — never `exact`; downgrade to `area` at best.
- **`custom_radius`** — a reasonable basis for the `exact` cutoff.

## One thing that has to be implemented first

`utils/privacyService.js`:

```js
// Placeholder for friendship check
async areConnected(viewerId, profileOwnerId) {
  // TODO: Implement actual friendship/connection check
  return false;
}
```

It returns `false` unconditionally, so `profile_visibility: "friends_only"`
currently denies **everyone, including actual friends**. This endpoint depends on
a real connection check, and so does that visibility mode.

```sql
SELECT 1 FROM connections
WHERE status = 'accepted'
  AND ((requester_id = ? AND receiver_id = ?)
    OR (requester_id = ? AND receiver_id = ?))
LIMIT 1
```

The pair is stored as one directed row, so the check has to be bidirectional.

## Smaller asks

- **`has_story`** — whether the friend has an unexpired story. It drives the pink
  ring on their marker, the same way the story rail works. If it is awkward to
  join, omit it and the ring falls back to their campus colour.
- **`place_label`** — a human name for a coarse position ("Accra", "Legon
  campus"). Shown under the marker instead of a raw distance. Optional.

## Client status

- `src/services/friendMapServices.ts` — typed against the above, degrades to an
  empty list on 404/501.
- `src/features/map/presence.ts` — staleness. Markers fade from 15 minutes and
  drop off the map entirely after 24 hours, so a stale position never reads as a
  live one.
- `src/components/campus/FriendSheet.tsx` — tap sheet: story, message, profile,
  "last seen 2h ago".
- `CampusMap` renders friends above buildings and strangers, dedupes anyone who
  also appears in the nearby result, and draws the precision halo.
