# Backend request (4): expose location sharing state, and resolve the two writers

Two related problems in the same field. The first is a small missing read; the
second is a design collision worth deciding deliberately rather than leaving to
whichever control the user happens to touch last.

---

## 1. Nothing returns `location_sharing_enabled`

`UserLocation.location_sharing_enabled` decides whether you appear in
`/geofencing/nearby` and on the friend map — both queries filter on it. Two
controls in the app write it. **No endpoint reads it back.**

The only place it appears in a response is
`POST /geofencing/location/toggle`, which echoes the value it was just given:

```js
res.json({
  message: `Location sharing ${enabled ? "enabled" : "disabled"} successfully`,
  location_sharing_enabled: enabled,   // the argument, not the stored state
});
```

`GET /geofencing/privacy` returns the MySQL `user_privacy_settings` row only —
`profile_visibility`, `custom_radius`, `show_exact_location`, `visible_fields`.
The sharing flag lives in Mongo and is not in it.

**Effect in the app:** the Ghost Mode switch on the map and the new "Share my
location" row in Privacy both start at "visible" on every launch, whatever the
server actually holds. Go incognito, force-quit, reopen: the app tells you that
you are visible while the server has you hidden. For a control whose entire job
is to say whether people can see where you are, that is the wrong way round.

### Suggested fix

Simplest: extend `GET /geofencing/privacy` to include the Mongo state, since the
client already calls it for exactly this screen.

```json
{
  "message": "Privacy settings retrieved successfully",
  "settings": {
    "profile_visibility": "geofenced",
    "custom_radius": 500,
    "show_exact_location": 0,
    "visible_fields": { "...": true },

    "location_sharing_enabled": true,
    "is_active": true
  }
}
```

Both extra fields come from one `UserLocation.findOne({ user_id })`. A separate
`GET /geofencing/location/state` would do equally well if you would rather not
mix the two stores in one response.

---

## 2. Two endpoints write the same field, in opposite directions

```js
// utils/locationService.js
async toggleIncognitoMode(userId, enabled) {
  ... { location_sharing_enabled: !enabled, is_active: !enabled }
}

async toggleLocationSharing(userId, enabled) {
  ... { location_sharing_enabled: enabled }
}
```

`POST /geofencing/incognito` and `POST /geofencing/location/toggle` both own
`location_sharing_enabled`. Incognito additionally clears `is_active`, which
removes the row from the `$geoNear` index outright rather than just filtering it.

So they are neither the same operation nor cleanly different ones:

| action | `location_sharing_enabled` | `is_active` | effect |
|---|---|---|---|
| `incognito(true)` | false | false | out of the index entirely |
| `location/toggle(false)` | false | **true** | still indexed, filtered out by the query |
| `location/toggle(true)` after incognito | **true** | **false** | flag says sharing, still invisible |

That last row is the problem. Turning sharing back on after incognito leaves
`is_active: false`, so the user is told they are sharing and remains invisible,
with nothing in the API that would let them discover why.

### Pick one

**Option A — one writer.** Drop `/location/toggle` and keep incognito as the
single control. Simplest, and the app already treats them as one flag.

**Option B — make them a real two-level control.** Keep both, but have
`toggleLocationSharing(true)` also restore `is_active: true`. Then "share my
location" genuinely means visible again, and incognito stays the harder, faster
switch.

Option B is the better product if you want a soft and a hard setting; Option A
is less to maintain. Either is fine — what does not work is the current state,
where the combination above is reachable and silently wrong.

---

## Client status

`src/services/LocationSharingContext.tsx` holds one flag behind both controls,
so the map's Ghost Mode and the Privacy row cannot disagree with each other. It
reverts on a failed write.

It cannot seed itself until (1) lands, and it says so in a comment. Once the GET
exists, seeding it is about four lines.
