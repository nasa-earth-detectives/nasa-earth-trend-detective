import { Color } from 'three';

/** Color de una tendencia firmada, independiente del acento de la variable o de su significancia. */
export const HEX_PALETTE = {
  negative: '#5b8eb9',
  neutral: '#aaa99d',
  positive: '#bf6557',
} as const;

export const HEX_PALETTE_GRADIENT =
  `linear-gradient(90deg in srgb, ${HEX_PALETTE.negative} 0%, ${HEX_PALETTE.neutral} 50%, ${HEX_PALETTE.positive} 100%)`;

// Se interpola en sRGB, igual que la leyenda CSS, y se entrega RGB lineal a Three.js.
// Los colores de referencia nunca se modifican; el caller reutiliza target en los buffers.
const negativeSRGB = new Color(HEX_PALETTE.negative).convertLinearToSRGB();
const neutralSRGB = new Color(HEX_PALETTE.neutral).convertLinearToSRGB();
const positiveSRGB = new Color(HEX_PALETTE.positive).convertLinearToSRGB();

/** ±domain siempre representa los extremos; no se reescala con el máximo de cada respuesta. */
export function sampleHexColor(slope: number, domain: number, target: Color): Color {
  if (!Number.isFinite(slope) || !Number.isFinite(domain) || domain <= 0) {
    throw new RangeError('La paleta requiere una pendiente finita y un dominio positivo finito.');
  }
  const magnitude = Math.min(1, Math.abs(slope) / domain);
  return target.copy(neutralSRGB)
    .lerp(slope < 0 ? negativeSRGB : positiveSRGB, magnitude)
    .convertSRGBToLinear();
}
