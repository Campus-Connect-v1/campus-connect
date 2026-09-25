/* global __dirname, process */
const fs = require("fs");
const path = require("path");

const base = require("./app.json").expo;

/**
 * Expo config, wrapped so one optional credential cannot block a build.
 *
 * app.json hard-referenced `./google-services.json`, which is gitignored and
 * has never been committed -- correctly, since it is a Firebase credential.
 * The consequence was that any build from a clean checkout failed at prebuild
 * on a missing file, including CI and any machine that is not the one it was
 * first set up on.
 *
 * Because the files are gitignored, EAS does not upload them either: a cloud
 * build saw them as absent and produced an Android app that could not register
 * with FCM. They are supplied there as secret file environment variables
 * instead, which arrive as an absolute path on the builder. Locally the files
 * sit in this directory. Either way nothing lands in version control.
 *
 *   eas env:create --environment production \
 *     --name GOOGLE_SERVICES_JSON --type file \
 *     --value ./google-services.json --visibility secret
 *
 * The file is only needed for Android push delivery via FCM -- iOS push goes
 * to APNs directly and does not require Firebase. Everything else in the app
 * builds and runs without either file, so a missing credential costs push on
 * Android rather than the entire Android build.
 */
const localAndroid = path.resolve(__dirname, "google-services.json");
const localIos = path.resolve(__dirname, "GoogleService-Info.plist");

const googleServicesAndroid =
  process.env.GOOGLE_SERVICES_JSON ||
  (fs.existsSync(localAndroid) ? "./google-services.json" : null);

const googleServicesIos =
  process.env.GOOGLE_SERVICES_INFO_PLIST ||
  (fs.existsSync(localIos) ? "./GoogleService-Info.plist" : null);

if (!googleServicesAndroid || !googleServicesIos) {
  // Printed during config resolution so the reason is visible in the build log
  // rather than discovered when push silently fails on a device.
  console.warn(
    "[app.config] Firebase config missing — " +
      (googleServicesAndroid ? "" : "google-services.json (Android) ") +
      (googleServicesIos ? "" : "GoogleService-Info.plist (iOS) ") +
      "not found locally or in the build environment. Android push requires " +
      "google-services.json; see the eas env:create note above."
  );
}

module.exports = ({ config }) => {
  // Pulled OUT of the spread rather than overridden after it: Expo validates
  // the path whenever the key exists at all, so leaving it in place and
  // setting it to undefined still fails.
  const { googleServicesFile: _android, ...android } = base.android ?? {};
  const { googleServicesFile: _ios, ...ios } = base.ios ?? {};

  return {
    ...config,
    ...base,
    android: googleServicesAndroid
      ? { ...android, googleServicesFile: googleServicesAndroid }
      : android,
    ios: googleServicesIos
      ? { ...ios, googleServicesFile: googleServicesIos }
      : ios,
  };
};
