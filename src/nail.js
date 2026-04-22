import { LENGTH_MULT, darken } from './theme.js';

// Build the outline polygon of a nail.
// (x, y) is the nail base center; the nail extends upward (toward lower y).
function nailPoints(shape, x, y, w, baseH, lengthKey) {
  const h = baseH * LENGTH_MULT[lengthKey];
  const left = x - w / 2;
  const right = x + w / 2;
  const base = y;
  const tip = y - h;
  const pts = [];

  switch (shape) {
    case 'square': {
      const r = Math.min(w * 0.18, 5);
      pts.push({ x: left, y: base });
      pts.push({ x: left, y: tip + r });
      for (let i = 1; i <= 4; i++) {
        const a = Math.PI + (i / 4) * (Math.PI / 2);
        pts.push({ x: left + r + r * Math.cos(a), y: tip + r + r * Math.sin(a) });
      }
      pts.push({ x: right - r, y: tip });
      for (let i = 1; i <= 4; i++) {
        const a = -Math.PI / 2 + (i / 4) * (Math.PI / 2);
        pts.push({ x: right - r + r * Math.cos(a), y: tip + r + r * Math.sin(a) });
      }
      pts.push({ x: right, y: base });
      break;
    }
    case 'round': {
      const r = w / 2;
      pts.push({ x: left, y: base });
      pts.push({ x: left, y: tip + r });
      const steps = 14;
      for (let i = 0; i <= steps; i++) {
        const a = Math.PI + (i / steps) * Math.PI;
        pts.push({ x: x + r * Math.cos(a), y: tip + r + r * Math.sin(a) });
      }
      pts.push({ x: right, y: base });
      break;
    }
    case 'almond': {
      const steps = 10;
      pts.push({ x: left, y: base });
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const width = Math.cos((t * Math.PI) / 2);
        pts.push({ x: x - (w / 2) * width, y: base - t * h });
      }
      for (let i = steps - 1; i >= 1; i--) {
        const t = i / steps;
        const width = Math.cos((t * Math.PI) / 2);
        pts.push({ x: x + (w / 2) * width, y: base - t * h });
      }
      pts.push({ x: right, y: base });
      break;
    }
    case 'stiletto': {
      pts.push({ x: left, y: base });
      pts.push({ x: left + w * 0.15, y: tip + h * 0.08 });
      pts.push({ x: x, y: tip });
      pts.push({ x: right - w * 0.15, y: tip + h * 0.08 });
      pts.push({ x: right, y: base });
      break;
    }
  }
  return pts;
}

function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect =
      (yi > py) !== (yj > py) &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function drawHeart(g, cx, cy, size, color) {
  g.fillStyle(color, 1);
  const r = size * 0.35;
  g.fillCircle(cx - r * 0.9, cy - r * 0.3, r);
  g.fillCircle(cx + r * 0.9, cy - r * 0.3, r);
  g.fillTriangle(
    cx - r * 1.55, cy + r * 0.15,
    cx + r * 1.55, cy + r * 0.15,
    cx, cy + r * 1.6
  );
}

function drawStar(g, cx, cy, size, color) {
  const outer = size * 0.9;
  const inner = outer * 0.45;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outer : inner;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  g.fillStyle(color, 1);
  g.fillPoints(pts, true);
}

function drawGem(g, cx, cy, size, color) {
  const s = size * 0.9;
  g.fillStyle(color, 1);
  g.fillPoints(
    [
      { x: cx, y: cy - s },
      { x: cx + s * 0.8, y: cy },
      { x: cx, y: cy + s },
      { x: cx - s * 0.8, y: cy },
    ],
    true
  );
  g.fillStyle(0xffffff, 0.75);
  g.fillTriangle(cx - s * 0.3, cy - s * 0.55, cx + s * 0.15, cy - s * 0.55, cx - s * 0.05, cy - s * 0.15);
}

function drawGlitter(g, cx, cy, size, color) {
  g.fillStyle(color, 1);
  const dots = [
    [0, 0, 0.55],
    [-0.9, -0.4, 0.3],
    [0.8, -0.6, 0.35],
    [-0.5, 0.8, 0.3],
    [0.7, 0.7, 0.28],
  ];
  for (const [dx, dy, rs] of dots) {
    g.fillCircle(cx + dx * size, cy + dy * size, size * rs);
  }
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - size * 0.18, cy - size * 0.18, size * 0.15);
}

function drawFlower(g, cx, cy, size, color) {
  const petalR = size * 0.45;
  g.fillStyle(color, 1);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    g.fillCircle(cx + petalR * 1.1 * Math.cos(a), cy + petalR * 1.1 * Math.sin(a), petalR);
  }
  g.fillStyle(0xFFF5BA, 1);
  g.fillCircle(cx, cy, size * 0.3);
}

const DECO_RENDERERS = {
  heart: drawHeart,
  star: drawStar,
  gem: drawGem,
  glitter: drawGlitter,
  flower: drawFlower,
};

export class Nail {
  constructor({ x, y, width, baseHeight }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.baseHeight = baseHeight;
    this.shape = 'round';
    this.lengthKey = 'medium';
    this.color = 0xFFE4EC;     // unpainted base tone
    this.painted = false;
    this.decorations = [];      // { type, rx, ry, size, color }
  }

  outline() {
    return nailPoints(this.shape, this.x, this.y, this.width, this.baseHeight, this.lengthKey);
  }

  isHit(px, py) {
    return pointInPolygon(px, py, this.outline());
  }

  paint(color) {
    this.color = color;
    this.painted = true;
  }

  addDecoration(type, decoColor) {
    if (this.decorations.length >= 3) this.decorations.shift();
    const h = this.baseHeight * LENGTH_MULT[this.lengthKey];
    const rx = (Math.random() - 0.5) * this.width * 0.55;
    const ry = -h * (0.35 + Math.random() * 0.4);
    const size = Math.min(this.width, h) * 0.28;
    this.decorations.push({ type, rx, ry, size, color: decoColor });
  }

  reset() {
    this.color = 0xFFE4EC;
    this.painted = false;
    this.decorations = [];
  }

  render(g) {
    const pts = this.outline();
    const stroke = darken(this.color, 0.25);

    // Soft color halo behind the nail when it's painted — gives polished
    // nails a subtle pop against the skin.
    if (this.painted) {
      g.fillStyle(this.color, 0.35);
      g.fillEllipse(this.x, this.y - this.baseHeight * LENGTH_MULT[this.lengthKey] * 0.45, this.width * 1.6, this.baseHeight * LENGTH_MULT[this.lengthKey] * 1.15);
    }

    g.fillStyle(this.color, 1);
    g.fillPoints(pts, true);
    g.lineStyle(1.5, stroke, 0.9);
    g.strokePoints(pts, true);

    // Lunula — subtle half-moon at the nail base, showing through the polish.
    g.fillStyle(0xFFFFFF, 0.32);
    g.fillEllipse(this.x, this.y - 2, this.width * 0.7, 6);

    // subtle shine arc near the tip
    const h = this.baseHeight * LENGTH_MULT[this.lengthKey];
    g.fillStyle(0xFFFFFF, 0.4);
    g.fillEllipse(this.x - this.width * 0.18, this.y - h * 0.65, this.width * 0.35, h * 0.22);
    // tiny secondary highlight
    g.fillStyle(0xFFFFFF, 0.25);
    g.fillEllipse(this.x + this.width * 0.22, this.y - h * 0.35, this.width * 0.12, h * 0.1);

    for (const d of this.decorations) {
      DECO_RENDERERS[d.type](g, this.x + d.rx, this.y + d.ry, d.size, d.color);
    }
  }

  renderSelection(g) {
    const pts = this.outline();
    g.lineStyle(4, 0xF48FB1, 1);
    g.strokePoints(pts, true);
    g.lineStyle(2, 0xFFFFFF, 0.9);
    g.strokePoints(pts, true);
  }
}
