# Building for real devices

The comments that used to live in `eas.json` are here instead: EAS validates
that file against a strict schema and rejects `//` keys.

## Why `EXPO_PUBLIC_*` is declared in `eas.json`

Expo inlines `EXPO_PUBLIC_*` into the JS bundle **at build time**. An EAS build
runs on Expo's servers from a git clone, where `client/.env` does not exist —
it is gitignored. Without these values the build succeeds, installs, and then
throws at module load in `src/constants/env.ts`, because `required()` refuses
an undefined `EXPO_PUBLIC_API_URL`. The symptom is an app that dies on its
splash screen with no useful message.

Declaring them is safe: an `EXPO_PUBLIC_` value ships inside the bundle on
every device regardless, so it is public by definition. Anything genuinely
secret belongs in `eas secret:create`, never here.

## Profiles

| profile | what it is | use it for |
|---|---|---|
| `development` | dev client, needs Metro running | day-to-day work on a real device |
| `preview` | standalone, no Metro, Android APK | handing to a tester |
| `production` | store build, auto-increments version | releases |

`preview` builds an APK rather than an AAB so it can be sideloaded instead of
going through Play.

## Commands

```bash
cd client
eas build --profile preview --platform android   # APK you can sideload
eas build --profile preview --platform ios       # needs an Apple team + device UDIDs
```

## Android push

`google-services.json` is gitignored and is not in the repo. `app.config.js`
omits the `googleServicesFile` key when the file is absent, so Android still
builds — it just cannot deliver push. Drop the file in from the Firebase
console to enable it; the build log says which mode it used.

## Push tokens and the project id

Expo push tokens are scoped to an EAS project. Changing `extra.eas.projectId`
invalidates every token issued under the old one, and those devices stop
receiving notifications until they re-register on next launch.
