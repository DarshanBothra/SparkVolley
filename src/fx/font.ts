export const PIXEL_FONT = '"Press Start 2P", monospace';

/** Press Start 2P reads small; map authoring sizes to a 12px body floor. */
const SIZE_MAP: Record<number, number> = {
  8: 12,
  10: 14,
  12: 16,
  14: 18,
  16: 20,
  18: 22,
  22: 26,
  28: 32,
  32: 36,
};

export function px(size: number): string {
  return `${SIZE_MAP[size] ?? size}px ${PIXEL_FONT}`;
}
