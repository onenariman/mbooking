/**
 * Поддержка суффиксов как у JWT expiresIn: m, h, d (например 15m, 7d, 30d).
 */
export function parseJwtExpiresInToMs(expiresIn: string): number {
  const trimmed = expiresIn.trim();
  const match = /^(\d+)([mhd])$/i.exec(trimmed);
  if (!match) {
    return 30 * 86_400_000;
  }
  const n = Number(match[1]);
  const unit = match[2].toLowerCase();
  const mult =
    unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
  return n * mult;
}

export function expiresInToDate(expiresIn: string): Date {
  return new Date(Date.now() + parseJwtExpiresInToMs(expiresIn));
}
