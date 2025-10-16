import { execSync } from "child_process";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";

console.log("🚀 Setting up your dev environment...");

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

// Step 1: Install dependencies
run(
  "npm install -D eslint prettier husky lint-staged jest @testing-library/react @testing-library/react-native jest-expo @types/jest @testing-library/jest-native --legacy-peer-deps"
);

// Step 2: ESLint + Prettier config
writeFileSync(
  ".eslintrc.json",
  JSON.stringify(
    {
      env: { browser: true, es2021: true, node: true },
      extends: ["eslint:recommended", "plugin:react/recommended", "prettier"],
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      rules: { "react/react-in-jsx-scope": "off" },
    },
    null,
    2
  )
);

writeFileSync(
  ".prettierrc",
  JSON.stringify(
    {
      semi: true,
      singleQuote: false,
      trailingComma: "es5",
      printWidth: 100,
    },
    null,
    2
  )
);

// Step 3: Husky setup
run("npx husky init");
writeFileSync(
  ".husky/pre-commit",
  `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
`
);

// ✅ Node-compatible version
const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
pkg["lint-staged"] = { "*.{js,ts,tsx}": ["eslint --fix", "prettier --write"] };
writeFileSync("package.json", JSON.stringify(pkg, null, 2));

// Step 4: Jest config
writeFileSync(
  "jest.config.js",
  `
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@testing-library/.*|jest-expo)/)"
  ],
};
`
);

// Step 5: GitHub CI/CD
mkdirSync(".github/workflows", { recursive: true });
writeFileSync(
  ".github/workflows/test.yml",
  `
name: Run Tests and Lint

on:
  pull_request:
  push:
    branches: [main, development]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm test
`
);

if (!existsSync("src/components")) mkdirSync("src/components", { recursive: true });

// Step 6: Done
console.log("✅ All set! You now have linting, testing, CI/CD, and hooks enabled!");
console.log("👉 Next: run `npm run test` or commit code to see it in action.");
