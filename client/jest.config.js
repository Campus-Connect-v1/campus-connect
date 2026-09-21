module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],
  // NOTE: no `transformIgnorePatterns` override. The jest-expo preset ships a
  // pattern that covers the whole Expo package graph; the previous hand-written
  // list omitted expo-modules-core, which made every test file fail to load.
};
