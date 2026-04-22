/* global Phaser */
import { Hand } from './hand.js';
import { PALETTE, SHAPES, DECORATIONS, LENGTH_KEYS, UI, darken } from './theme.js';

const W = 960;
const H = 640;

const SHAPE_ICON_COLOR = 0xF48FB1;

export class SalonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SalonScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor(UI.bg);

    this.hand = new Hand(W / 2, 230);
    this.selectedNail = this.hand.nails[2];
    this.currentColor = PALETTE[0].hex;
    this.applyToAll = false;

    this.bgGfx = this.add.graphics();     // back-most: decorative blobs + sparkles + towel
    this.uiGfx = this.add.graphics();     // tool panels and buttons
    this.handGfx = this.add.graphics();   // hand + nails (on top of towel)

    this.drawBackdrop();

    this.add.text(W / 2, 30, 'Luna Nail Salon', {
      fontFamily: 'Quicksand, sans-serif',
      fontSize: '32px',
      fontStyle: '700',
      color: UI.text,
    }).setOrigin(0.5);

    this.hintText = this.add.text(W / 2, 60, 'Tap a nail, then file, paint, or decorate ♥', {
      fontFamily: 'Quicksand, sans-serif',
      fontSize: '15px',
      color: UI.text,
    }).setOrigin(0.5);

    this.lengthLabel = this.add.text(105, 336, 'medium', {
      fontFamily: 'Quicksand, sans-serif',
      fontSize: '14px',
      fontStyle: '700',
      color: UI.text,
    }).setOrigin(0.5);

    this.colorLabel = this.add.text(855, 430, `Polish: ${PALETTE[0].name}`, {
      fontFamily: 'Quicksand, sans-serif',
      fontSize: '13px',
      color: UI.text,
    }).setOrigin(0.5);

    this.toggleLabel = this.add.text(720, 555, 'All nails: off', {
      fontFamily: 'Quicksand, sans-serif',
      fontSize: '14px',
      fontStyle: '700',
      color: UI.text,
    }).setOrigin(0.5);

    this.resetLabel = this.add.text(540, 555, 'Reset nail', {
      fontFamily: 'Quicksand, sans-serif',
      fontSize: '14px',
      fontStyle: '700',
      color: UI.textLight,
    }).setOrigin(0.5);

    this.sectionLabels = [
      this.add.text(105, 108, 'Shape', this.labelStyle()).setOrigin(0.5),
      this.add.text(105, 290, 'Length', this.labelStyle()).setOrigin(0.5),
      this.add.text(855, 108, 'Polish', this.labelStyle()).setOrigin(0.5),
      this.add.text(40, 498, 'Decorate', this.labelStyle()).setOrigin(0, 0.5),
    ];

    this.buildHitZones();

    // Hand click — only when the tap isn't inside any of the tool panels.
    this.input.on('pointerdown', (pointer) => {
      if (this.isInPanel(pointer.x, pointer.y)) return;
      const n = this.hand.getNailAt(pointer.x, pointer.y);
      if (n) {
        this.selectedNail = n;
        this.redraw();
      }
    });

    this.redraw();
  }

  labelStyle() {
    return {
      fontFamily: 'Quicksand, sans-serif',
      fontSize: '18px',
      fontStyle: '700',
      color: UI.text,
    };
  }

  // ----- Buttons / hit zones -----

  buildHitZones() {
    // Shape buttons: 2x2 at (60,165), (150,165), (60,240), (150,240)
    this.shapeButtons = SHAPES.map((shape, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 60 + col * 90;
      const y = 165 + row * 75;
      return { shape, x, y, w: 65, h: 65, zone: this.makeButton(x, y, 65, 65, () => this.setShape(shape)) };
    });

    // Length − and +
    this.makeButton(55, 336, 35, 35, () => this.changeLength(-1));
    this.makeButton(155, 336, 35, 35, () => this.changeLength(+1));

    // Polish bottles: 3 cols x 4 rows
    this.colorButtons = [];
    PALETTE.forEach((c, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = 795 + col * 60;
      const y = 175 + row * 62;
      this.colorButtons.push({ color: c, x, y });
      this.makeButton(x, y, 46, 58, () => this.pickColor(c));
    });

    // Decoration buttons (5, centered vertically around y=555)
    this.decoButtons = DECORATIONS.map((type, i) => {
      const x = 70 + i * 80;
      const y = 555;
      return { type, x, y, w: 65, h: 65, zone: this.makeButton(x, y, 65, 65, () => this.stampDecoration(type)) };
    });

    // Reset nail button
    this.makeButton(540, 555, 130, 42, () => this.resetNail());
    // All-nails toggle
    this.makeButton(720, 555, 160, 42, () => this.toggleAll());
  }

  makeButton(cx, cy, w, h, onClick) {
    const zone = this.add.zone(cx, cy, w, h)
      .setOrigin(0.5)
      .setSize(w, h)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => onClick());
    return zone;
  }

  isInPanel(x, y) {
    // Left, right, and bottom panel rectangles.
    return (
      (x >= 15 && x <= 195 && y >= 85 && y <= 455) ||
      (x >= 765 && x <= 945 && y >= 85 && y <= 455) ||
      (x >= 15 && x <= 945 && y >= 485 && y <= 625)
    );
  }

  // ----- Actions -----

  targets() {
    return this.applyToAll ? this.hand.nails : [this.selectedNail];
  }

  setShape(shape) {
    for (const n of this.targets()) n.shape = shape;
    this.redraw();
  }

  changeLength(delta) {
    for (const n of this.targets()) {
      const idx = LENGTH_KEYS.indexOf(n.lengthKey);
      const next = Math.max(0, Math.min(LENGTH_KEYS.length - 1, idx + delta));
      n.lengthKey = LENGTH_KEYS[next];
    }
    this.lengthLabel.setText(this.selectedNail.lengthKey);
    this.redraw();
  }

  pickColor(colorDef) {
    this.currentColor = colorDef.hex;
    this.colorLabel.setText(`Polish: ${colorDef.name}`);
    for (const n of this.targets()) n.paint(colorDef.hex);
    this.redraw();
  }

  stampDecoration(type) {
    for (const n of this.targets()) n.addDecoration(type, this.currentColor);
    this.redraw();
  }

  resetNail() {
    for (const n of this.targets()) n.reset();
    this.redraw();
  }

  toggleAll() {
    this.applyToAll = !this.applyToAll;
    this.toggleLabel.setText(`All nails: ${this.applyToAll ? 'on' : 'off'}`);
    this.redraw();
  }

  // ----- Rendering -----

  drawBackdrop() {
    const g = this.bgGfx;

    // Soft pastel blobs for depth
    g.fillStyle(0xFFC9DF, 0.32);
    g.fillCircle(250, 130, 95);
    g.fillStyle(0xC7CEEA, 0.28);
    g.fillCircle(720, 120, 80);
    g.fillStyle(0xB5EAD7, 0.28);
    g.fillCircle(790, 430, 70);
    g.fillStyle(0xE0BBE4, 0.25);
    g.fillCircle(180, 420, 85);

    // Salon towel / hand rest — the hand sits on this pink folded towel.
    const cx = W / 2;
    const towelY = 458;
    g.fillStyle(0x000000, 0.08);
    g.fillRoundedRect(cx - 190, towelY + 10, 380, 20, 10); // towel shadow
    g.fillStyle(0xFFF0F5, 1);
    g.fillRoundedRect(cx - 185, towelY, 370, 22, 11);
    g.lineStyle(1.2, UI.panelStroke, 0.9);
    g.strokeRoundedRect(cx - 185, towelY, 370, 22, 11);
    // stitching line
    g.lineStyle(0.8, UI.accent, 0.6);
    g.strokeRoundedRect(cx - 178, towelY + 5, 356, 12, 6);
    // little folded-corner hint on the right
    g.fillStyle(UI.panelStroke, 0.6);
    g.fillTriangle(cx + 170, towelY + 2, cx + 185, towelY + 2, cx + 185, towelY + 17);

    // Scattered sparkles — placed in the open areas where they'll be visible.
    const sparkles = [
      [205, 80, 5], [320, 55, 3.5], [450, 75, 3], [560, 55, 4],
      [660, 80, 3.5], [745, 55, 3], [240, 380, 4], [720, 200, 3.5],
      [745, 460, 4], [220, 210, 3.5], [660, 310, 3], [300, 430, 3.5],
      [700, 250, 3], [310, 180, 3],
    ];
    for (const [x, y, s] of sparkles) this.drawSparkle(g, x, y, s);
  }

  drawSparkle(g, cx, cy, size) {
    const longArm = size;
    const shortArm = size * 0.3;
    g.fillStyle(0xFFFFFF, 0.9);
    g.fillPoints([
      { x: cx, y: cy - longArm },
      { x: cx + shortArm, y: cy - shortArm },
      { x: cx + longArm, y: cy },
      { x: cx + shortArm, y: cy + shortArm },
      { x: cx, y: cy + longArm },
      { x: cx - shortArm, y: cy + shortArm },
      { x: cx - longArm, y: cy },
      { x: cx - shortArm, y: cy - shortArm },
    ], true);
    g.fillStyle(0xFFFFFF, 0.5);
    g.fillCircle(cx, cy, size * 0.2);
  }

  redraw() {
    this.uiGfx.clear();
    this.handGfx.clear();

    this.drawPanels();
    this.drawShapeButtons();
    this.drawLengthButtons();
    this.drawColorSwatches();
    this.drawDecorationButtons();
    this.drawBottomButtons();

    this.hand.renderPalm(this.handGfx);
    this.hand.renderNails(this.handGfx);
    if (this.selectedNail) this.selectedNail.renderSelection(this.handGfx);

    this.lengthLabel.setText(this.selectedNail ? this.selectedNail.lengthKey : 'medium');
  }

  drawPanels() {
    const g = this.uiGfx;
    // Left panel
    this.panel(g, 15, 85, 180, 370);
    // Right panel
    this.panel(g, 765, 85, 180, 370);
    // Bottom panel
    this.panel(g, 15, 485, 930, 140);
  }

  panel(g, x, y, w, h) {
    g.fillStyle(UI.panel, 1);
    g.fillRoundedRect(x, y, w, h, 18);
    g.lineStyle(2, UI.panelStroke, 1);
    g.strokeRoundedRect(x, y, w, h, 18);
  }

  drawShapeButtons() {
    const g = this.uiGfx;
    for (const b of this.shapeButtons) {
      const selected = this.selectedNail && this.selectedNail.shape === b.shape;
      this.buttonBg(g, b.x, b.y, b.w, b.h, selected);
      this.drawShapeIcon(g, b.shape, b.x, b.y);
    }
  }

  drawShapeIcon(g, shape, cx, cy) {
    // Draw a small silhouette of the nail shape centered in the button.
    const nailW = 22;
    const nailH = 26;
    const base = cy + nailH / 2;
    const tip = cy - nailH / 2;
    const left = cx - nailW / 2;
    const right = cx + nailW / 2;
    const pts = [];
    switch (shape) {
      case 'square': {
        const r = 4;
        pts.push({ x: left, y: base });
        pts.push({ x: left, y: tip + r });
        pts.push({ x: left + r, y: tip });
        pts.push({ x: right - r, y: tip });
        pts.push({ x: right, y: tip + r });
        pts.push({ x: right, y: base });
        break;
      }
      case 'round': {
        const r = nailW / 2;
        pts.push({ x: left, y: base });
        pts.push({ x: left, y: tip + r });
        for (let i = 0; i <= 10; i++) {
          const a = Math.PI + (i / 10) * Math.PI;
          pts.push({ x: cx + r * Math.cos(a), y: tip + r + r * Math.sin(a) });
        }
        pts.push({ x: right, y: base });
        break;
      }
      case 'almond': {
        const steps = 8;
        pts.push({ x: left, y: base });
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const wf = Math.cos((t * Math.PI) / 2);
          pts.push({ x: cx - (nailW / 2) * wf, y: base - t * nailH });
        }
        for (let i = steps - 1; i >= 1; i--) {
          const t = i / steps;
          const wf = Math.cos((t * Math.PI) / 2);
          pts.push({ x: cx + (nailW / 2) * wf, y: base - t * nailH });
        }
        pts.push({ x: right, y: base });
        break;
      }
      case 'stiletto': {
        pts.push({ x: left, y: base });
        pts.push({ x: left + 2, y: tip + 2 });
        pts.push({ x: cx, y: tip - 2 });
        pts.push({ x: right - 2, y: tip + 2 });
        pts.push({ x: right, y: base });
        break;
      }
    }
    g.fillStyle(SHAPE_ICON_COLOR, 1);
    g.fillPoints(pts, true);
  }

  drawLengthButtons() {
    const g = this.uiGfx;
    this.buttonBg(g, 55, 336, 35, 35, false);
    this.buttonBg(g, 155, 336, 35, 35, false);
    g.lineStyle(3, SHAPE_ICON_COLOR, 1);
    // − icon
    g.beginPath(); g.moveTo(55 - 9, 336); g.lineTo(55 + 9, 336); g.strokePath();
    // + icon
    g.beginPath();
    g.moveTo(155 - 9, 336); g.lineTo(155 + 9, 336);
    g.moveTo(155, 336 - 9); g.lineTo(155, 336 + 9);
    g.strokePath();
  }

  drawColorSwatches() {
    const g = this.uiGfx;
    for (const b of this.colorButtons) {
      const isCurrent = this.currentColor === b.color.hex;
      this.drawPolishBottle(g, b.x, b.y, b.color.hex, isCurrent);
    }
  }

  drawPolishBottle(g, cx, cy, color, selected) {
    // Selection tray behind the bottle
    if (selected) {
      g.fillStyle(UI.accent, 0.3);
      g.fillRoundedRect(cx - 23, cy - 29, 46, 58, 10);
      g.lineStyle(2.5, UI.accentDark, 1);
      g.strokeRoundedRect(cx - 23, cy - 29, 46, 58, 10);
    }

    // Cap — darker pink/rose, slightly wider than the neck
    g.fillStyle(0x6B4E5E, 1);
    g.fillRoundedRect(cx - 10, cy - 26, 20, 11, 3);
    g.lineStyle(1, 0x3D2936, 0.8);
    g.strokeRoundedRect(cx - 10, cy - 26, 20, 11, 3);
    g.fillStyle(0xFFFFFF, 0.18);
    g.fillRect(cx - 8, cy - 24, 16, 2);

    // Neck (glass tone)
    g.fillStyle(darken(color, 0.15), 1);
    g.fillRect(cx - 5, cy - 15, 10, 4);
    g.lineStyle(1, darken(color, 0.4), 0.7);
    g.strokeRect(cx - 5, cy - 15, 10, 4);

    // Bottle body
    g.fillStyle(color, 1);
    g.fillRoundedRect(cx - 14, cy - 12, 28, 34, 5);
    g.lineStyle(1.3, darken(color, 0.4), 0.85);
    g.strokeRoundedRect(cx - 14, cy - 12, 28, 34, 5);

    // Glass shines
    g.fillStyle(0xFFFFFF, 0.55);
    g.fillRoundedRect(cx - 10, cy - 8, 3, 22, 1.5);
    g.fillStyle(0xFFFFFF, 0.35);
    g.fillRoundedRect(cx - 5, cy - 8, 1.5, 10, 0.7);

    // Tiny label band
    g.fillStyle(0xFFFFFF, 0.5);
    g.fillRect(cx - 14, cy + 6, 28, 5);
    g.lineStyle(0.8, darken(color, 0.35), 0.5);
    g.strokeRect(cx - 14, cy + 6, 28, 5);
  }

  drawDecorationButtons() {
    const g = this.uiGfx;
    for (const b of this.decoButtons) {
      this.buttonBg(g, b.x, b.y, b.w, b.h, false);
      // draw the decoration icon using the Nail module's private renderers
      // via a small inline import substitute — we can just call the method
      // by creating a dummy scope. Simpler: re-implement tiny icons here
      // would duplicate code. Instead we reuse Nail.addDecoration+render via
      // drawing a sample directly.
      this.drawDecoIcon(g, b.type, b.x, b.y);
    }
  }

  drawDecoIcon(g, type, cx, cy) {
    const size = 16;
    const color = SHAPE_ICON_COLOR;
    switch (type) {
      case 'heart': {
        g.fillStyle(color, 1);
        const r = size * 0.4;
        g.fillCircle(cx - r * 0.9, cy - r * 0.3, r);
        g.fillCircle(cx + r * 0.9, cy - r * 0.3, r);
        g.fillTriangle(cx - r * 1.55, cy + r * 0.15, cx + r * 1.55, cy + r * 0.15, cx, cy + r * 1.6);
        break;
      }
      case 'star': {
        const outer = size, inner = size * 0.45;
        const pts = [];
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          const r = i % 2 === 0 ? outer : inner;
          pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
        }
        g.fillStyle(color, 1);
        g.fillPoints(pts, true);
        break;
      }
      case 'gem': {
        const s = size;
        g.fillStyle(color, 1);
        g.fillPoints([
          { x: cx, y: cy - s },
          { x: cx + s * 0.8, y: cy },
          { x: cx, y: cy + s },
          { x: cx - s * 0.8, y: cy },
        ], true);
        g.fillStyle(0xFFFFFF, 0.8);
        g.fillTriangle(cx - s * 0.3, cy - s * 0.55, cx + s * 0.15, cy - s * 0.55, cx - s * 0.05, cy - s * 0.15);
        break;
      }
      case 'glitter': {
        g.fillStyle(color, 1);
        g.fillCircle(cx, cy, size * 0.5);
        g.fillCircle(cx - size * 0.8, cy - size * 0.3, size * 0.3);
        g.fillCircle(cx + size * 0.75, cy - size * 0.6, size * 0.35);
        g.fillCircle(cx - size * 0.4, cy + size * 0.7, size * 0.3);
        g.fillCircle(cx + size * 0.6, cy + size * 0.6, size * 0.28);
        break;
      }
      case 'flower': {
        g.fillStyle(color, 1);
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
          g.fillCircle(cx + size * 0.6 * Math.cos(a), cy + size * 0.6 * Math.sin(a), size * 0.4);
        }
        g.fillStyle(0xFFF5BA, 1);
        g.fillCircle(cx, cy, size * 0.28);
        break;
      }
    }
  }

  drawBottomButtons() {
    const g = this.uiGfx;
    // Reset — solid accent button
    g.fillStyle(UI.accent, 1);
    g.fillRoundedRect(540 - 65, 555 - 21, 130, 42, 12);
    g.lineStyle(2, UI.accentDark, 1);
    g.strokeRoundedRect(540 - 65, 555 - 21, 130, 42, 12);

    // Toggle
    g.fillStyle(this.applyToAll ? UI.accent : 0xFFFFFF, 1);
    g.fillRoundedRect(720 - 80, 555 - 21, 160, 42, 12);
    g.lineStyle(2, UI.accentDark, 1);
    g.strokeRoundedRect(720 - 80, 555 - 21, 160, 42, 12);
    this.toggleLabel.setColor(this.applyToAll ? UI.textLight : UI.text);
  }

  buttonBg(g, cx, cy, w, h, selected) {
    g.fillStyle(selected ? UI.accent : 0xFFFFFF, 1);
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
    g.lineStyle(2, selected ? UI.accentDark : UI.panelStroke, 1);
    g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
  }
}
