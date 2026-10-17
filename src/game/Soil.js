export const clamp = value => Math.max(0, Math.min(100, value));
export function createSoil(index = 0) {
  return { fertility: 60 + (index * 7 + 13) % 26, moisture: 50 + (index * 11 + 19) % 31 };
}
