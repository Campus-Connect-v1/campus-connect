# Campus Connect — Design Commitments

Read this before any UI decision. These are commitments, not suggestions; a
screen that departs from them drifts into looking like a different app.

## App Read

```
APP READ: consumer social for university students, photo-forward editorial
language, leaning NativeWind 4 + Expo Router 6 + Reanimated 4.
platforms: iOS first-class · Android first-class · web best-effort
posture: unified-brand (one look everywhere, native nav chrome underneath)
dials: DESIGN_EXPRESSION 7 · MOTION_INTENSITY 5 · VISUAL_DENSITY 4
```

The product layer is warm white and near-black. Photography carries most of the
visual energy, while a controlled violet, pink, yellow and lime system gives
events, categories and campus campaigns a recognizable voice. The balance is
70% calm product UI and 30% expressive campus culture.

## Design System

Tokens: `src/styles/tokens.json` (data) → `src/styles/theme.ts` (types, type
scale, elevation, motion) → `src/styles/useTheme.ts` (mode resolution).
`tailwind.config.js` reads the same JSON, so NativeWind classes and StyleSheet
values cannot disagree.

**Colour.** Campus Connect has an original editorial palette: violet `#6C3BFF`,
pink `#FF3D81`, yellow `#FFD84D`, lime `#B8FF5A`, warm white `#F8F7F4`, and ink
`#161616`. These colours appear through the centralized `culture` tokens and
are reserved for categories, campaigns, stickers and active discovery states.
They should punctuate the interface, never flood every surface.

**Glass.** `expo-blur` is confined to overlays that sit on media: the tab bar
and the map cards. Not on list rows or content cards, where it costs
compositing work and buys nothing. Any blurred container needs
`overflow: "hidden"` on a wrapper or Android ignores its border radius.

**Graphic texture.** Flat promotional colour blocks may use the code-native
`GraphicOverlay` patterns (`orbit`, `dots`, `rays`) at low opacity. These are
decorative layers, never containers or extra UI chrome. Discovery cards prefer
photography with one restrained pattern over empty solid-colour rectangles.

**Maps.** Buildings are pins; facilities are not. `campus_facilities` stores a
`building_id`, a floor and a room number but no coordinates, so a room cannot
honestly be placed on the map. Tapping a building pin opens `BuildingSheet`,
which lists the rooms inside it, and the map search covers buildings AND rooms,
selecting the building that contains the chosen room. Facilities can also be
opened from `app/facilities.tsx`, which pushes `/(tabs)/connect?building=<id>`.

`react-native-maps` with `PROVIDER_DEFAULT` (Apple on iOS, Google on
Android) — forcing Google on iOS would require an API key for no gain. The two
platforms go dark by different means: Apple honours `userInterfaceStyle`,
Google needs `customMapStyle` (`DARK_MAP_STYLE` in `features/campus/types.ts`).
The map centres on the buildings it was given and only falls back to
`CAMPUS_CENTER` when none have loaded yet.

**Type.** Two families by role. Blackbold is the temporary brand face and appears
in the `wordmark`, `poster`, and page-level `title` tokens. Gilroy carries
everything a user actually reads until the final typography set arrives. Scale:
`wordmark · poster · display · title · heading · body · label · caption · micro`.
No `fontSize` literals in screens — `<Text variant>` only. Dynamic Type is
bounded on chrome (≤1.3×) and unbounded on body and caption.

**Shape lock.** `sm 8` inputs · `md 14` media tiles · `lg 22` sheets · `full`
CTAs, tags, avatars — always.

**Elevation.** Two levels, each an iOS shadow + Android `elevation` pair. Dark
mode substitutes a hairline, because a shadow against `#071219` reads as nothing.
Default grouping is whitespace and `StyleSheet.hairlineWidth`, not a stack of
shadowed cards.

**Icons.** Hugeicons, via the single `<Icon name="...">` component in
`src/components/ui/Icon.tsx`. Screens name icons by ROLE, never by glyph.
Icons are imported by subpath (`@hugeicons/core-free-icons/Home01Icon`), never
from the barrel — Metro does not tree-shake named exports, and the barrel form
costs 7 MB of bundle.

**Motion (5).** Press-scale spring on every touchable via `PressableScale`;
native stack transitions untouched; first-4-rows stagger in lists (guarded —
recycled cells replay unguarded animations). NO parallax on main screens and no
spring on the tab bar's own layout: both overshoot, and the result reads as
wobble. Springs are for things the finger is touching. The auth collage drift
is the one ambient loop, and it stops under reduced motion.

**Haptics.** Selection → tab switch. Light impact → like, save, primary actions.
Notification → async outcomes. Never on plain navigation.

### RISK register

| #   | Risk taken                                             | Cost being carried                                                                                                                               |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Type sits directly on photography, no card chrome      | Legibility depends on user uploads. `<Media scrim>` is mandatory under any text. Gradients are scrims over media only: `Media`, plus the auth collage in `AuthShell` and `auth/index`. Nothing else may add one. |
| 2   | Accent inverts between modes rather than staying fixed | Two accent values to reason about; screenshots differ by mode.                                                                                   |
| 3   | Blackbold kept as a display face                       | A novelty face must never leak into body, labels or controls. Confined to the `wordmark` token.                                                  |
| 4   | Near-monochrome palette                                | Nothing but photography carries colour, so a screen with no media reads austere. Intentional — use whitespace and type scale for interest there. |

## Interactive state cycle

Every data screen owes: loading, empty (composed, with the action that populates
it), error (inline — `Alert` is for destructive confirmations only), and
`RefreshControl` on feeds.

## Navigation

Five tabs: **Home · Connect · Events · Campus · You**. Each one is a place with
its own data. Create is an action, not a destination, so it lives in the Home
header and the drawer; Explore is a grid of links into the other tabs, so it is
reachable from Campus and the drawer rather than holding a slot.

Pushed routes: `post/[id]` (the post, then its comments), `person/[id]`,
`stories/[userId]` (the viewer), `stories/compose`, `notifications`,
`group/[id]/edit`, `compose/post`, `compose/poll`, `compose/event`,
`compose/group`, `settings/*`, `legal/*`.

A mid-path dynamic segment (`/group/[id]/edit`) must be pushed in object form -
`router.push({ pathname: "/group/[id]/edit", params: { id } })`. The template
string form does not typecheck, because Expo Router can only infer
`SingleRoutePart` for a trailing segment.

Events and groups have their own full-form screens (`compose/event`,
`compose/group`) rather than sharing the one-field `compose/[type]` box, which
now handles posts only. A static route wins over the dynamic one, so
`/compose/event` resolves to the form.

## State ownership

Four providers wrap the navigator, in this order: `PreferencesProvider` (device
theme choice), `NetworkProvider` (connectivity), `SessionProvider` (the signed-in
user and their profile), `SavedPostsProvider` (device-local bookmarks). Screens
read the session through `useSession()`, never `getUser()` — the latter is a
module variable and does not re-render, which is how a screen ends up showing
the previously signed-in account.

Loading a data screen shows a skeleton that mirrors its real layout
(`components/ui/Skeleton.tsx`), never a bare spinner. Empty and error states go
through `EmptyState`, which carries the Lottie in `assets/animations/empty.json` for
BOTH tones. An error on these screens is nearly always "nothing came back", and
a hazard glyph overstates it; the copy is what separates empty from failed.

Study groups have no image column, so a group card is a colour block with a
`GraphicOverlay` pattern rather than a stock photo standing in for a cover the
creator never chose.

## Media

Uploads go **straight from the device to Cloudinary**; the bytes never pass
through the API. `POST /api/upload/signature` returns a short-lived signed
request, the device posts the file to Cloudinary, and only the resulting
`secure_url` is sent on to the API. The server rejects a `media_url` that is
not from its own cloud, so a local `file://` URI can never be stored.

`GET /api/upload/status` is unauthenticated and says whether the server has
credentials at all; `useUploadsEnabled()` reads it and screens hide the attach
controls when it is false rather than failing at the point of use.

## Notifications

The bell in the Home header carries an unread count from
`/api/notifications/unread-count` and opens `app/notifications.tsx`. A row's
unread state is a tinted ground plus a dot, not a dot alone: the whole row is
the thing that has not been dealt with. Rows route by `resource_type`, and a
type with no screen yet renders unpressable rather than as a link into nothing.

## Stories

Text, image, video and repost, expiring after 24 hours. The rail on Home is the
real `/api/stories/feed`: a coloured ring means unseen, a hairline ring means
all seen, and that colour IS the unread state rather than decoration. The
viewer advances on tap, goes back on a left-third tap, and pauses on hold.

## Known gaps

- `src/services/{firestore,notifications,storage}.ts` are empty files.
- **Polls are built but not votable in the feed.** Creating, voting, multi-select
  and results all work, but the feed never returns `poll_id`, so `PollCard`
  cannot render and a poll falls back to showing its question as text. The
  two-file server fix is written up in `BACKEND-REQUEST-poll-id-in-feed.md` at
  the repo root. There is also no `GET /api/polls` index.
- **No bookmarks endpoint.** Saved posts are device-local ids in
  `SavedPostsContext`; they do not sync between devices.
- The legal screens in `app/legal/` are drafts written against what the app
  actually does. They have not had a legal review.
- Notification preferences are two columns (`notification_push`,
  `notification_email`). Per-topic controls need a preferences table first.
- The splash background is still `#ffffff`/`#000000` rather than the app's warm
  white and ink, so a cold start flashes.
- **Server blockers for sign-up** (both outside the app):
  1. `GET /api/university/domains` filters on `is_verified = 1` and returns zero
     rows, so the sign-up picker has no `university_id` to offer.
  2. OTP email delivery fails on the deployed API (`emailSent: false`,
     `/auth/resend-otp` → 500), and login refuses an unverified account with 403.
- The auth flow is pinned dark via `app/auth/_layout.tsx`; the rest of the app
  follows the appearance preference, then the system scheme.
