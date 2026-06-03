// ── Collegiate Editorial palette ──────────────────────────────────────────
// Warm parchment canvas, deep-teal ink, a brass accent, hairline rules.
// Every screen reads from Colors.light.*, so this is the single source of the
// app's visual identity.

// ── Creams & Blues ──
const navy = "#012A4A"; // deepest blue — primary / ink-on-cream headers
const teal = "#013A63"; // brand deep blue-teal
const blue = "#2C7DA0"; // mid azure — accent / interactive
const skyTint = "#A9D6E5"; // pale sky — soft fills, focus rings
const ink = "#13242E"; // primary text — cool near-black
const paper = "#FBF5E9"; // warm cream canvas (app background)
const paperDeep = "#F2E9D6"; // deeper cream — recessed surfaces
const warmWhite = "#FFFDF6"; // card surface — warm white
const line = "#E7DBC4"; // warm hairline rule / border
const slateGray = "#5C6B72"; // muted blue-gray — secondary text
const fadedGray = "#9AA7AD"; // timestamps / tertiary

export default {
  light: {
    primary: navy,
    secondary: teal,
    accent: blue,
    text: ink,
    textSecondary: slateGray,
    inputBackground: warmWhite,
    background: paper,
    card: warmWhite,
    border: line,
    tint: navy,
    tabIconDefault: slateGray,
    tabIconSelected: navy,
    lightGray: paperDeep,
    gray: slateGray,
    sky: skyTint,
    like: "#C1492E", // brick red
    link: blue,
    caption: "#46555C",
    username: ink,
    timestamp: fadedGray,
    success: "#3E7C8A", // teal-leaning success
    warning: "#C8922E", // amber, kept warm
    error: "#C1492E",
    notification: blue,
  },
};
