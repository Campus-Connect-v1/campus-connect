/* global __dirname */
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
 * The file is only needed for Android push delivery via FCM. Everything else
 * in the app builds and runs without it, so a missing credential now costs
 * push on Android rather than the entire Android build. When it is present it
 * is picked up exactly as before.
 */
const googleServices = path.resolve(__dirname, "google-services.json");
const hasGoogleServices = fs.existsSync(googleServices);

if (!hasGoogleServices) {
  // Printed during config resolution so the reason is visible in the build log
  // rather than discovered when push silently fails on a device.
  console.warn(
    "[app.config] google-services.json not found — building without FCM. " +
      "Android push notifications will not be delivered in this build. " +
      "Add the file from the Firebase console to enable them."
  );
}

module.exports = ({ config }) => {
  // Pulled OUT of the spread rather than overridden after it: Expo validates
  // the path whenever the key exists at all, so leaving it in place and
  // setting it to undefined still fails.
  const { googleServicesFile, ...android } = base.android ?? {};

  return {
    ...config,
    ...base,
    android: hasGoogleServices
      ? { ...android, googleServicesFile: "./google-services.json" }
      : android,
  };
};
