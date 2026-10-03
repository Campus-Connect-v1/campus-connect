// Builds the public website: landing page, privacy policy, terms, support and
// account deletion. These are the URLs App Store Connect and Google Play ask
// for.
//
//   SUPPORT_EMAIL=you@example.com node build.mjs     -> dist/
//
// No dependencies, no framework. Each page in src/pages is a body fragment
// whose first line is `<!-- title | description -->`; this wraps it in the
// shared layout and writes it to a folder of its own, so URLs read
// /privacy/ rather than /privacy.html.
//
// SUPPORT_EMAIL is required rather than defaulted. Apple and Google both
// reject a listing whose support contact does not work, and a placeholder that
// quietly reaches production is exactly how that happens. It is set as an
// environment variable on the Render static site.

import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const email = process.env.SUPPORT_EMAIL?.trim();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("✗ SUPPORT_EMAIL is not set to an email address. Set it and build again.");
  process.exit(1);
}

const SRC = "src";
const OUT = "dist";
const year = new Date().getFullYear();

const NAV = [
  ["/#features", "Features"],
  ["/support/", "Support"],
  ["/privacy/", "Privacy"],
  ["/terms/", "Terms"],
];

const layout = ({ title, description, body, path }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="/assets/icon-512.png">
<meta name="theme-color" content="#F8F7F4" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#161616" media="(prefers-color-scheme: dark)">
<link rel="icon" type="image/png" href="/assets/favicon.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
<header class="top">
  <div class="wrap top-row">
    <a class="brand" href="/"><img src="/assets/icon-512.png" alt="" width="36" height="36">Campus Connect</a>
    <nav>${NAV.map(([href, label]) =>
      `<a href="${href}"${path === href ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>
  </div>
</header>
<main>
${body}
</main>
<footer class="foot">
  <div class="wrap foot-row">
    <div>
      <a class="brand" href="/"><img src="/assets/icon-512.png" alt="" width="28" height="28">Campus Connect</a>
      <p class="muted">The social app for university students.</p>
    </div>
    <nav>
      <a href="/support/">Support</a>
      <a href="/privacy/">Privacy Policy</a>
      <a href="/terms/">Terms of Service</a>
      <a href="/delete-account/">Delete your account</a>
      <a href="mailto:${email}">${email}</a>
    </nav>
  </div>
  <div class="wrap muted small">© ${year} Campus Connect</div>
</footer>
</body>
</html>
`;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(SRC, "assets"), join(OUT, "assets"), { recursive: true });

for (const file of readdirSync(join(SRC, "pages")).filter((f) => f.endsWith(".html"))) {
  const raw = readFileSync(join(SRC, "pages", file), "utf8");
  const match = raw.match(/^<!--\s*(.+?)\s*\|\s*(.+?)\s*-->\n/);
  if (!match) throw new Error(`${file}: first line must be <!-- title | description -->`);

  const name = file.replace(/\.html$/, "");
  const path = name === "index" ? "/" : `/${name}/`;
  const body = raw.slice(match[0].length).replaceAll("__SUPPORT_EMAIL__", email);
  const dir = name === "index" ? OUT : join(OUT, name);

  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), layout({ title: match[1], description: match[2], body, path }));
  console.log(`  ${path}`);
}

writeFileSync(join(OUT, "404.html"), layout({
  title: "Page not found · Campus Connect",
  description: "This page does not exist.",
  path: "",
  body: `<section class="wrap doc"><h1>Page not found</h1><p>That page does not exist. <a href="/">Go to the home page</a>.</p></section>`,
}));

console.log(`✓ Built to ${OUT}/ with support address ${email}`);
