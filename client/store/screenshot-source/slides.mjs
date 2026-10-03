// Renders the store screenshots from shots.html.
//
//   node slides.mjs            iPhone 6.9"  1320x2868  -> out/iphone/
//   node slides.mjs ipad       iPad 13"     2064x2752  -> out/ipad-13/
//                              iPad 12.9"   2048x2732  -> out/ipad-12.9/
//
// Set CHROMIUM to a Chromium binary if Playwright's own is not installed.
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const NAMES = ["01-home", "02-events", "03-connect", "04-campus-map", "05-group-chat", "06-profile"];

// [folder, CSS width, CSS height, device scale factor, hash]
const TARGETS = process.argv[2] === "ipad"
  ? [["ipad-13", 1032, 1376, 2, "#ipad-1032x1376"], ["ipad-12.9", 1024, 1366, 2, "#ipad-1024x1366"]]
  : [["iphone", 440, 956, 3, ""]];

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
for (const [folder, width, height, scale, hash] of TARGETS) {
  mkdirSync(`out/${folder}`, { recursive: true });
  const p = await b.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await p.goto("file://" + process.cwd() + "/shots.html" + hash);
  await p.evaluate(() => document.fonts.ready);
  if (hash) await p.waitForSelector("body[data-ready]");
  await p.waitForLoadState("networkidle");
  await p.waitForTimeout(500);
  for (let i = 1; i <= NAMES.length; i++) {
    await p.locator("#s" + i).screenshot({ path: `out/${folder}/${NAMES[i - 1]}.png` });
  }
  await p.close();
}
await b.close();
