# Shipping Campus Connect to the App Store

Everything needed to get the iOS app from this repo into App Store review.
Build and upload go through EAS; the listing is filled in by hand in App Store
Connect.

## What is already in place

| item | value | where |
|---|---|---|
| Bundle ID | `com.lesliepaulajayi.campusconnect` | `app.json` → `ios.bundleIdentifier` |
| App Store Connect app | `6816054262` | `eas.json` → `submit.production.ios.ascAppId` |
| Version / build | `1.0.0`; build number auto-increments on EAS | `app.json`, `eas.json` (`appVersionSource: remote`) |
| Export compliance | `ITSAppUsesNonExemptEncryption: false`, so no prompt on upload | `app.json` |
| Display name | `Campus Connect` (was `campus-connect`) | `app.json` → `name` |
| Devices | iPhone only (`supportsTablet: false`): no iPad screenshots or iPad review | `app.json` |
| Account deletion | in-app, Settings → Account → Delete account (guideline 5.1.1(v)) | `app/settings/delete-account.tsx` |
| Report content | Report post, with reasons (guideline 1.2) | `src/components/feed/PostOptionsSheet.tsx` |
| Terms and privacy | in-app screens | `app/legal/` |
| Screenshots | 6.9" and 6.5" sets | `store/screenshots/` |

## Fix before submitting

These are the likely rejection reasons, most likely first.

1. **Blocking users (guideline 1.2).** An app with user-generated content and
   chat must let a user block another user. The app can report and hide posts,
   but it cannot block a person. Add "Block" to the profile overflow menu
   (`app/person/[id].tsx`) and to the chat header. A blocked user should
   disappear from the feed, Connect and messages immediately. The
   `ConnectionStatus` type already has a `"blocked"` state to build on.
2. **Deploy the website.** `site/` is a static site holding the URLs App
   Store Connect needs, and `render.yaml` deploys it as
   `campus-connect-site`. In Render, open Blueprints, sync the repo and set
   `SUPPORT_EMAIL`; the build fails without it. Once it is live, use these:
   - Marketing URL: `https://<site>.onrender.com/`
   - Support URL: `https://<site>.onrender.com/support/`
   - Privacy Policy URL: `https://<site>.onrender.com/privacy/`
   - Terms (EULA): `https://<site>.onrender.com/terms/`
   - Account deletion (Google Play asks for this): `https://<site>.onrender.com/delete-account/`
3. **Refresh the review accounts.** `server/scripts/seedReviewAccounts.js`
   creates two verified accounts (`appreview1@example.com`,
   `appreview2@example.com`) with connections, chats, study groups, upcoming
   events and a fresh feed. Events and posts are dated from when the script
   runs, so run it again just before you submit (see step 8).
4. **API cold starts.** The API runs on Render's free tier and sleeps after
   15 minutes. A reviewer who waits ~50 s on a blank screen will reject the app
   under guideline 2.1. Set `API_HEALTH_URL` so `.github/workflows/keep-awake.yml`
   actually pings the service, or move to a paid instance for the review window.
5. **Sign in with Apple (guideline 4.8).** This is fine as long as the Google
   button stays hidden in production. It renders only when the
   `EXPO_PUBLIC_GOOGLE_*` values are set, and `eas.json` doesn't set them. If you
   turn Google sign-in on later, you must also offer Sign in with Apple.

## Step by step

### 1. Accounts (one-time)

- An Apple Developer Program membership ($99/year) at
  developer.apple.com/programs, under the Apple ID that owns app `6816054262`.
- An Expo account that can access the project owner `lesliepaul-23`.
- `npm i -g eas-cli`, then `eas login`.

### 2. Build

```bash
cd client
eas build --platform ios --profile production
```

On the first run, EAS asks to log in to your Apple account. Answer **yes** to
each of these:
- generate a Distribution Certificate
- generate a Provisioning Profile
- set up Push Notifications (this creates the APNs key that `expo-notifications`
  needs)

EAS stores the credentials, so later builds don't ask again.

Push in production: on an EAS build the entitlement becomes
`aps-environment = production` automatically. The `development` value in the
local `ios/` folder is from a dev build and is gitignored.

### 3. Upload to App Store Connect

```bash
eas submit --platform ios --profile production --latest
```

You can also do both steps at once with
`eas build -p ios --profile production --auto-submit`. Processing takes 5 to 30
minutes. After that, the build appears under TestFlight.

### 4. TestFlight (recommended)

Install from TestFlight on a real iPhone and run through sign-up, email
verification, posting with a photo, location permission, push notifications,
chat and account deletion. Check that it works on a cold API.

### 5. Fill in the listing in App Store Connect

Go to **App Store → iOS App 1.0** and fill in the following.

| field | value |
|---|---|
| Name (30) | `Campus Connect`. If the name is taken, use `Campus Connect: Student Life` |
| Subtitle (30) | `Events, friends & campus map` |
| Category | Primary **Social Networking**, secondary **Education** |
| Promotional text (170) | `Freshers' Week is here. Find every event, meet people on your course and never get lost on campus again.` |
| Keywords (100) | `university,college,student,events,classmates,study group,map,freshers,social,chat,clubs,hall` |
| Support URL | your support page (see "Fix before submitting", item 2) |
| Marketing URL | optional |
| Privacy Policy URL | your public privacy policy (see "Fix before submitting", item 2) |
| Copyright | `2026 <your name or company>` |
| Screenshots | upload `store/screenshots/iphone-6.9/` in order 01 → 06 |

**Description:**

```
Campus Connect is the social app for your university. Everything happening on
campus, and everyone you want to meet, in one place.

SEE WHAT'S HAPPENING
A feed of posts, photos, polls and stories from students on your campus, plus
the week's big moments up front.

NEVER MISS AN EVENT
Parties, games, talks, club nights and study sessions. Tap Going, see who else
is going, and get a reminder before it starts.

MEET YOUR PEOPLE
Find students on your course, in your hall and with your interests. Send a
connection request and start chatting.

FIND YOUR WAY
A campus map with every building. Search for a room, see what's inside each
building, and get directions.

CHAT AND STUDY TOGETHER
Direct messages and group chats with photos, polls and reactions. Built for
study groups, clubs and flatmates.

YOUR PROFILE, YOUR WAY
Show your course, year, interests and best moments.

Safe by design: report any post, control who sees your location, and delete
your account at any time from Settings.
```

### 6. App Privacy (nutrition label)

Go to **App Privacy → Get Started** and declare the data below. All of it is
**linked to the user** and **not used for tracking**. Purpose is **App
Functionality** unless noted.

| data type | why |
|---|---|
| Contact Info → Name, Email Address | account |
| Location → Precise Location | nearby students, campus map |
| User Content → Photos or Videos | posts, stories, profile picture |
| User Content → Emails or Text Messages | in-app chat |
| User Content → Other User Content | posts, polls, comments, bio, interests |
| Identifiers → User ID | account |
| Identifiers → Device ID | push notification token |

If you later add analytics or crash reporting, add **Usage Data** and
**Diagnostics** to the list.

### 7. Age rating

Answer the questionnaire honestly: user-generated content **yes**, messaging or
chat **yes**, unrestricted web access **no**. Apple calculates the rating from
your answers.

### 8. App Review Information

Refresh the accounts first:

```bash
cd server
REVIEW_PASSWORD='<the password you keep>' node scripts/seedReviewAccounts.js
```

- **Sign-in required:** yes. Username `appreview1@example.com` and the
  password above.
- **Notes** (paste and edit):

```
Campus Connect is a social app for university students.
Demo account: appreview1@example.com / <password>
Second account, to test messaging and connecting from both sides:
appreview2@example.com / <same password>.
Both are verified and already have connections, chats and events.
- Report a post: tap ••• on any post → Report post.
- Block a user: open a profile → ••• → Block.
- Delete account: You tab → menu → Settings → Account → Delete account.
Location is used only while the app is open, to show nearby students and the
campus map. It is optional and can be turned off in Settings → Privacy.
```

### 9. Submit

Pick the build under **Build**, set **Release** to manual or automatic, then
**Add for Review → Submit**. The first review usually takes 24 to 48 hours.

## Updates after launch

- **JS-only changes:** `eas update --channel production` reaches users without
  review. `runtimeVersion` uses the fingerprint policy, so an update is only
  delivered to binaries with matching native code.
- **Native changes or a new version:** bump `version` in `app.json` (1.0.1, …),
  then build and submit again. The build number increments by itself.

## Screenshots

- `store/screenshots/iphone-6.9/`: 1320 × 2868. This is the only size App Store
  Connect requires; it scales these down for smaller iPhones.
- `store/screenshots/iphone-6.5/`: 1284 × 2778, in case App Store Connect asks
  for that slot separately.
- `store/screenshots/ipad-13/`: 2064 × 2752, and `store/screenshots/ipad-12.9/`:
  2048 × 2732. App Store Connect asks for these only while the build in it
  supports iPad. Build 10 (28 Sept) was made before `supportsTablet` was set
  to `false`, so it still counts as an iPad app. Upload these to clear the
  requirement, or upload a new build, which drops it.

The screens are mockups styled to match the app's design system, not captures
from a device. Apple requires screenshots to show the app accurately
(guideline 2.3.3), so check that each one still matches the shipping UI. Swap in
real simulator captures if any part has drifted. The photos are from Unsplash,
whose licence allows commercial use.

To edit the copy or screens, change `store/screenshot-source/shots.html`, then
re-render:

```bash
cd client/store/screenshot-source
npm i playwright-core && npx playwright install chromium
node slides.mjs        # iPhone   -> out/iphone/
node slides.mjs ipad   # iPad     -> out/ipad-13/ and out/ipad-12.9/
```
