import { Nail } from './nail.js';
import { UI } from './theme.js';

// Layout defines each finger: nail base position (relative to hand center),
// finger width, finger length (how far down the finger extends from nail base),
// and nail dimensions.
const FINGERS = [
  // thumb — offset left and lower
  { key: 'thumb',  baseX: -150, baseY:  30, fingerW: 44, fingerLen: 150, nailW: 32, nailH: 38 },
  { key: 'index',  baseX:  -75, baseY: -30, fingerW: 36, fingerLen: 180, nailW: 26, nailH: 36 },
  { key: 'middle', baseX:    0, baseY: -55, fingerW: 38, fingerLen: 200, nailW: 28, nailH: 40 },
  { key: 'ring',   baseX:   75, baseY: -35, fingerW: 36, fingerLen: 185, nailW: 26, nailH: 36 },
  { key: 'pinky',  baseX:  140, baseY:  10, fingerW: 32, fingerLen: 160, nailW: 22, nailH: 32 },
];

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
    // Palm — a soft rounded pad behind the fingers.
    g.fillStyle(UI.skinShadow, 1);
    g.fillRoundedRect(this.cx - 175, this.cy + 95, 350, 155, 70);
    g.fillStyle(UI.skin, 1);
    g.fillRoundedRect(this.cx - 170, this.cy + 90, 340, 145, 65);

    // Fingers — draw each as a rounded column from below the nail down into the palm.
    for (const f of this.fingers) {
      const x = this.cx + f.baseX;
      const top = this.cy + f.baseY; // nail base — finger starts a little above so it peeks under the nail
      const bottom = top + f.fingerLen;
      const halfW = f.fingerW / 2;

      g.fillStyle(UI.skinShadow, 1);
      g.fillRoundedRect(x - halfW - 2, top - 4, f.fingerW + 4, bottom - top + 8, halfW + 2);
      g.fillStyle(UI.skin, 1);
      g.fillRoundedRect(x - halfW, top - 2, f.fingerW, bottom - top + 2, halfW);

      // soft highlight down the left side of each finger
      g.fillStyle(0xFFE0CC, 0.5);
      g.fillRoundedRect(x - halfW + 3, top + 6, 5, f.fingerLen - 20, 3);
    }
  }

  renderNails(g) {
    for (const nail of this.nails) nail.render(g);
  }
}
