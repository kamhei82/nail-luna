export const PALETTE = [
  { name: 'pink',       hex: 0xFFD1DC },
  { name: 'coral',      hex: 0xFFABAB },
  { name: 'peach',      hex: 0xFFDAC1 },
  { name: 'cream',      hex: 0xFFF5BA },
  { name: 'mint',       hex: 0xB5EAD7 },
  { name: 'aqua',       hex: 0xAEE1E1 },
  { name: 'periwinkle', hex: 0xC7CEEA },
  { name: 'lavender',   hex: 0xE0BBE4 },
  { name: 'rose',       hex: 0xD291BC },
  { name: 'lilac',      hex: 0x957DAD },
  { name: 'white',      hex: 0xFFFFFF },
  { name: 'nude',       hex: 0xF5CBA7 },
];

export const SHAPES = ['round', 'square', 'almond', 'stiletto'];

export const LENGTH_KEYS = ['short', 'medium', 'long'];
export const LENGTH_MULT = { short: 0.65, medium: 1.0, long: 1.45 };

export const DECORATIONS = ['heart', 'star', 'gem', 'glitter', 'flower'];

export const UI = {
  bg: 0xFFF0F5,
  panel: 0xFFE4EC,
  panelStroke: 0xF8BBD0,
  accent: 0xF48FB1,
  accentDark: 0xC2185B,
  skin: 0xF6C9AE,
  skinShadow: 0xE4A58C,
  text: '#8B3A62',
  textLight: '#ffffff',
};

// Darken a 0xRRGGBB colour by `amount` (0-1) — used for nail outlines/shading.
export function darken(color, amount = 0.2) {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const k = 1 - amount;
  return ((r * k) & 0xff) << 16 | ((g * k) & 0xff) << 8 | ((b * k) & 0xff);
}
