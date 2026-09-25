// NativeWind v4 needs three things wired together: the Babel preset (see
// babel.config.js), a CSS entry file, and this Metro transformer. Only the
// first two were present, so `import "./globals.css"` reached a Metro with no
// transformer able to handle it. react-native-css-interop loaded lightningcss
// and then waited forever -- every EAS build sat at "Bundle JavaScript 0.0%"
// until the 45-minute plan limit killed it, reported as `canceled` with no
// error. Nothing about it looked like a bundler problem from the outside.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./app/globals.css" });
