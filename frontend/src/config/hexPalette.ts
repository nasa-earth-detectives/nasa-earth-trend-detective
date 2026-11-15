import { Color } from 'three';

/** Color of a signed trend, independent of the variable accent or its significance. */
export const HEX_PALETTE = {
  negative: '#5b8eb9',
  neutral: '#aaa99d',
  positive: '#bf6557',
} as const;

export const HEX_PALETTE_GRADIENT =
  `linear-gradient(90deg in srgb, ${HEX_PALETTE.negative} 0%, ${HEX_PALETTE.neutral} 50%, ${HEX_PALETTE.positive} 100%)`;

// Interpolated in sRGB, matching the CSS legend, and returned as linear RGB to Three.js.
// Reference colors are never mutated; the caller reuses target across buffers.
const negativeSRGB = new Color(HEX_PALETTE.negative).convertLinearToSRGB();
const neutralSRGB = new Color(HEX_PALETTE.neutral).convertLinearToSRGB();
const positiveSRGB = new Color(HEX_PALETTE.positive).convertLinearToSRGB();

/** ±domain always represents the endpoints; it does not rescale to the maximum of each response. */
export function sampleHexColor(slope: number, domain: number, target: Color): Color {
  if (!Number.isFinite(slope) || !Number.isFinite(domain) || domain <= 0) {
    throw new RangeError('The palette requires a finite slope and a finite positive domain.');
  }
  const magnitude = Math.min(1, Math.abs(slope) / domain);
  return target.copy(neutralSRGB)
    .lerp(slope < 0 ? negativeSRGB : positiveSRGB, magnitude)
    .convertSRGBToLinear();
}
