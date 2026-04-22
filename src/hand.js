import { Nail } from './nail.js';
import { UI, darken } from './theme.js';

// Each finger: nail-base offset from hand centre, nail dimensions,
// finger width (base + tip for taper), finger length, and a slight
// outward lean so the fingers fan naturally instead of running parallel.
const FINGERS = [
  { key: 'thumb',  baseX: -148, baseY:  35, baseW: 54, tipW: 44, fingerLen: 145, nailW: 32, nailH: 38, lean:  0.22 },
  { key: 'index',  baseX:  -72, baseY: -28, baseW: 42, tipW: 34, fingerLen: 175, nailW: 26, nailH: 36, lean:  0.04 },
  { key: 'middle', baseX:    0, baseY: -52, baseW: 44, tipW: 36, fingerLen: 195, nailW: 28, nailH: 40, lean:  0.00 },
  { key: 'ring',   baseX:   72, baseY: -32, baseW: 42, tipW: 34, fingerLen: 180, nailW: 26, nailH: 36, lean: -0.04 },
  { key: 'pinky',  baseX:  138, baseY:  12, baseW: 36, tipW: 28, fingerLen: 155, nailW: 22, nailH: 32, lean: -0.09 },
];

// Build the outline polygon of a finger: a tapered tube with a rounded dome tip.
// `x` is the x position of the tip; `top` is the y where the dome bulges.
// The finger extends downward and leans sideways per `lean` (dx per unit dy).
function fingerPolygon(x, top, length, baseW, tipW, lean) {
  const halfBase = baseW / 2;
  const halfTip = tipW / 2;
  const tipRadius = halfTip;
  const domeCenterY = top + tipRadius;
  const bottomY = top + length;
  const bottomShiftX = lean * length;

  const pts = [];
  // Left edge: from bottom-left up to where the dome starts.
  pts.push({ x: x + bottomShiftX - halfBase, y: bottomY });
  pts.push({ x: x - halfTip, y: domeCenterY });
  // Half-circle dome (left to right across the top).
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI + (i / steps) * Math.PI;
    pts.push({ x: x + tipRadius * Math.cos(a), y: domeCenterY + tipRadius * Math.sin(a) });
  }
  // Right edge back down.
  pts.push({ x: x + halfTip, y: domeCenterY });
  pts.push({ x: x + bottomShiftX + halfBase, y: bottomY });
  return pts;
}

export class Hand {
  constructor(cx, cy) {
    this.cx = cx;
    this.cy = cy;
    this.nails = FINGERS.map(f => new Nail({
      x: cx + f.baseX,
      y: cy + f.baseY,
      width: f.nailW,
      baseHeight: f.nailH,
    }));
    this.fingers = FINGERS;
  }

  getNailAt(px, py) {
    for (const nail of this.nails) {
      if (nail.isHit(px, py)) return nail;
    }
    return null;
  }

  renderPalm(g) {
    const { cx, cy } = this;

    // Soft cast shadow onto the towel underneath
    g.fillStyle(0x000000, 0.13);
    g.fillEllipse(cx + 4, cy + 238, 330, 18);

    // Palm polygon — wider at the knuckle line, narrower toward the wrist,
    // with a little thumb-pad bump on the left.
    const palmTop = cy + 55;
    const palmBot = cy + 230;
    const palmPts = [
      { x: cx - 165, y: palmTop + 25 },       // top-left (under index)
      { x: cx - 190, y: palmTop + 55 },       // thumb-pad bulge out to the left
      { x: cx - 175, y: palmTop + 110 },      // thumb muscle dip
      { x: cx - 150, y: palmBot },            // wrist-left
      { x: cx - 110, y: palmBot + 18 },       // wrist bottom-left
      { x: cx + 110, y: palmBot + 18 },       // wrist bottom-right
      { x: cx + 150, y: palmBot },            // wrist-right
      { x: cx + 175, y: palmTop + 95 },       // right side
      { x: cx + 165, y: palmTop + 30 },       // top-right (under pinky)
      { x: cx + 110, y: palmTop + 12 },       // between ring and pinky
      { x: cx + 40,  y: palmTop + 0 },        // between middle and ring
      { x: cx - 40,  y: palmTop + 0 },        // between index and middle
      { x: cx - 110, y: palmTop + 15 },       // between thumb and index
    ];

    // Palm shadow (same polygon, nudged down and right)
    g.fillStyle(UI.skinShadow, 1);
    g.fillPoints(palmPts.map(p => ({ x: p.x + 3, y: p.y + 4 })), true);
    // Palm fill
    g.fillStyle(UI.skin, 1);
    g.fillPoints(palmPts, true);

    // Palm highlight — soft lighter region in the centre
    g.fillStyle(0xFFE3D0, 0.45);
    g.fillEllipse(cx - 5, cy + 135, 140, 75);

    // Thumb-pad crease — arc separating thumb muscle from the rest of the palm
    g.lineStyle(2, UI.skinShadow, 0.55);
    g.beginPath();
    g.moveTo(cx - 110, cy + 70);
    g.lineTo(cx - 95, cy + 155);
    g.strokePath();

    // Fingers
    for (const f of this.fingers) {
      const tipX = cx + f.baseX;
      const tipY = cy + f.baseY - 6; // dome rises a touch above the nail base
      const pts = fingerPolygon(tipX, tipY, f.fingerLen, f.baseW, f.tipW, f.lean);

      // Finger shadow (offset copy)
      g.fillStyle(UI.skinShadow, 1);
      g.fillPoints(pts.map(p => ({ x: p.x + 2, y: p.y + 3 })), true);
      // Finger fill
      g.fillStyle(UI.skin, 1);
      g.fillPoints(pts, true);

      // Knuckle creases — two subtle darker ellipses across the finger.
      const tipRadius = f.tipW / 2;
      const L = f.fingerLen;
      const knucklePositions = [0.38, 0.72];
      for (const t of knucklePositions) {
        const ky = (tipY + tipRadius) + (L - tipRadius) * t;
        const kx = tipX + f.lean * (L * t);
        const widthAtT = f.tipW + (f.baseW - f.tipW) * t;
        g.fillStyle(UI.skinShadow, 0.5);
        g.fillEllipse(kx, ky, widthAtT * 0.85, 2.5);
        g.fillStyle(0xFFE3D0, 0.35);
        g.fillEllipse(kx, ky - 2.5, widthAtT * 0.6, 1.5);
      }

      // Soft highlight down the left side of the finger
      g.fillStyle(0xFFE3D0, 0.45);
      const highlightTop = tipY + tipRadius + 4;
      const highlightBot = tipY + L - 10;
      const highlightX1 = tipX - f.tipW * 0.4;
      const highlightX2 = tipX - f.baseW * 0.4 + f.lean * L;
      g.fillPoints([
        { x: highlightX1,     y: highlightTop },
        { x: highlightX1 + 4, y: highlightTop },
        { x: highlightX2 + 4, y: highlightBot },
        { x: highlightX2,     y: highlightBot },
      ], true);
    }
  }

  renderNails(g) {
    for (const nail of this.nails) nail.render(g);
  }
}
