/**
 * Regenerates the app icon, splash mark and Android launcher assets from one
 * source logo.
 *
 *   node scripts/generate-brand-assets.mjs
 *
 * The source is a 447x447 opaque PNG with the mark floating in white space,
 * which suits none of the targets as it stands:
 *
 *   icon.png          iOS wants 1024x1024 and REJECTS an alpha channel, so
 *                     this one stays opaque on a white ground.
 *   splash-icon.png   drawn over the app's own background colour, so the white
 *                     ground has to go or it shows as a square.
 *   android-icon-*    the launcher crops an adaptive icon to a circle or
 *                     squircle, so the mark must sit inside the 66% safe zone.
 *
 * Each target gets its own trim, scale and ground rather than one resized file.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";

const SOURCE = "assets/images/logo.png";

/** Anything this close to white is background, not art. */
const isWhite = (r, g, b) => r >= 248 && g >= 248 && b >= 248;

/** Bounding box of the non-white pixels, so the dead margin can be discarded. */
function contentBox({ width, height, data }) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] > 8 && !isWhite(data[i], data[i + 1], data[i + 2])) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error(`${SOURCE} appears to be blank`);
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/**
 * Bilinear sample of a source rect into a square of `size`.
 *
 * The mark is flat colour behind heavy black outlines, which survives an
 * upscale far better than a photograph would -- but this is still an upscale
 * from 447px and it cannot invent detail the source does not have.
 */
function resample(src, box, size) {
  const out = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sx = box.x + ((x + 0.5) / size) * box.w - 0.5;
      const sy = box.y + ((y + 0.5) / size) * box.h - 0.5;
      const x0 = Math.max(0, Math.min(src.width - 1, Math.floor(sx)));
      const y0 = Math.max(0, Math.min(src.height - 1, Math.floor(sy)));
      const x1 = Math.min(src.width - 1, x0 + 1);
      const y1 = Math.min(src.height - 1, y0 + 1);
      const fx = sx - x0;
      const fy = sy - y0;
      const o = (y * size + x) * 4;
      for (let c = 0; c < 4; c++) {
        const p00 = src.data[(y0 * src.width + x0) * 4 + c];
        const p10 = src.data[(y0 * src.width + x1) * 4 + c];
        const p01 = src.data[(y1 * src.width + x0) * 4 + c];
        const p11 = src.data[(y1 * src.width + x1) * 4 + c];
        const top = p00 + (p10 - p00) * fx;
        const bottom = p01 + (p11 - p01) * fx;
        out.data[o + c] = Math.round(top + (bottom - top) * fy);
      }
    }
  }
  return out;
}

/** Centres `mark` on a `size` canvas, covering `fill` of the edge. */
function compose(mark, size, fill, ground) {
  const canvas = new PNG({ width: size, height: size });
  for (let i = 0; i < canvas.data.length; i += 4) {
    canvas.data[i] = ground ? ground[0] : 0;
    canvas.data[i + 1] = ground ? ground[1] : 0;
    canvas.data[i + 2] = ground ? ground[2] : 0;
    canvas.data[i + 3] = ground ? 255 : 0;
  }
  const inner = Math.round(size * fill);
  const offset = Math.round((size - inner) / 2);
  const scaled = resample(mark, { x: 0, y: 0, w: mark.width, h: mark.height }, inner);

  for (let y = 0; y < inner; y++) {
    for (let x = 0; x < inner; x++) {
      const s = (y * inner + x) * 4;
      const d = ((y + offset) * size + (x + offset)) * 4;
      const a = scaled.data[s + 3] / 255;
      if (a === 0) continue;
      for (let c = 0; c < 3; c++) {
        canvas.data[d + c] = Math.round(scaled.data[s + c] * a + canvas.data[d + c] * (1 - a));
      }
      canvas.data[d + 3] = Math.max(canvas.data[d + 3], scaled.data[s + 3]);
    }
  }
  return canvas;
}

/**
 * Drops the white ground so the mark can sit on any background.
 *
 * Flood fill inward from the edges, NOT a blanket "every white pixel is
 * transparent" pass. The mark has white counters inside it -- the wedge bitten
 * out of the pink circle, the gap in the purple shape -- and those are part of
 * the drawing. Clearing them too would punch holes through the logo, which
 * looks identical on a white splash and falls apart on a dark one.
 */
function cutout(png) {
  const out = new PNG({ width: png.width, height: png.height });
  png.data.copy(out.data);

  const { width, height } = out;
  const seen = new Uint8Array(width * height);
  const stack = [];

  for (let x = 0; x < width; x++) {
    stack.push(x, 0, x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    stack.push(0, y, width - 1, y);
  }

  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const p = y * width + x;
    if (seen[p]) continue;
    const i = p * 4;
    if (!isWhite(out.data[i], out.data[i + 1], out.data[i + 2])) continue;
    seen[p] = 1;
    out.data[i + 3] = 0;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
  return out;
}

/**
 * `opaque` writes RGB with no alpha channel at all. That is not a size
 * optimisation: the App Store rejects an icon that carries one, and pngjs
 * writes RGBA by default even when every pixel is fully opaque.
 */
const write = (path, png, opaque = false) => {
  writeFileSync(path, PNG.sync.write(png, opaque ? { colorType: 2 } : undefined));
  console.log(`  ${path}  ${png.width}x${png.height}${opaque ? "  (no alpha)" : ""}`);
};

const src = PNG.sync.read(readFileSync(SOURCE));
const box = contentBox(src);
console.log(`${SOURCE} ${src.width}x${src.height}, mark ${box.w}x${box.h}`);

// Square the crop around the mark's centre, so a non-square mark is not
// stretched by the fixed-aspect targets below.
const side = Math.max(box.w, box.h);
const square = {
  x: Math.round(box.x + box.w / 2 - side / 2),
  y: Math.round(box.y + box.h / 2 - side / 2),
  w: side,
  h: side,
};
const mark = cutout(resample(src, square, 768));

// iOS: opaque, no alpha, mark at 72% -- the OS adds its own corner mask and a
// mark run to the edge loses its corners to it.
write("assets/images/icon.png", compose(mark, 1024, 0.72, [255, 255, 255]), true);

// Splash: transparent, drawn over the themed background set in app.json.
write("assets/images/splash-icon.png", compose(mark, 1024, 1.0, null));

// Android adaptive: inside the documented 66% safe zone the launcher keeps.
write("assets/images/android-icon-foreground.png", compose(mark, 1024, 0.62, null));

// Themed (monochrome) icon: same geometry, flattened to a single colour.
const mono = compose(mark, 1024, 0.62, null);
for (let i = 0; i < mono.data.length; i += 4) {
  if (mono.data[i + 3] > 0) {
    mono.data[i] = mono.data[i + 1] = mono.data[i + 2] = 0;
    mono.data[i + 3] = 255;
  }
}
write("assets/images/android-icon-monochrome.png", mono);

write("assets/images/favicon.png", compose(mark, 96, 0.86, null));
