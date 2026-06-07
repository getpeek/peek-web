// Invert the shader's coord() y-remap so a desired top-down fraction renders at
// that exact line regardless of aspect. coord() only remaps y in portrait, so
// landscape passes the bottom-up fraction straight through.
export function centerYFromTopFraction(topFraction: number, width: number, height: number) {
  const fragFromBottom = 1 - topFraction;
  if (width >= height) {
    return fragFromBottom;
  }
  return fragFromBottom * (height / width) + (width - height) / (2 * width);
}

export function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number) {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

export function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
