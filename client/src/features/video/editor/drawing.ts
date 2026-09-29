import type { DrawingStroke, Point } from "../types";

let counter = 0;

export function createStroke(color: string, brushSize: number): DrawingStroke {
  counter += 1;
  return { id: `stroke_${Date.now()}_${counter}`, color, brushSize, points: [] };
}

/** Builds an SVG path `d` string from unit-space points, scaled to the
 * canvas pixel size it is being rendered at. Points are smoothed with
 * quadratic mid-points rather than straight segments, which is the
 * difference between a shaky-looking line and a natural stroke at typical
 * finger-tracking sample rates. */
export function strokeToPath(stroke: DrawingStroke, width: number, height: number): string {
  const pts = stroke.points.map((p: Point) => ({ x: p.x * width, y: p.y * height }));
  if (pts.length === 0) return "";
  if (pts.length === 1) {
    const { x, y } = pts[0];
    return `M ${x} ${y} L ${x} ${y}`;
  }

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mid = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
    d += ` Q ${pts[i].x} ${pts[i].y} ${mid.x} ${mid.y}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}
