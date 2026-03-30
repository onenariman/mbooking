const NORMALIZED_PHONE_REGEX = /^7\d{10}$/;

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return `7${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }

  if (digits.length === 11 && digits.startsWith("7")) {
    return digits;
  }

  return "";
}

export function isNormalizedPhone(value: string): boolean {
  return NORMALIZED_PHONE_REGEX.test(value);
}

export function formatPhoneDisplay(value: string): string {
  const normalized = normalizePhone(value);

  if (!normalized) {
    return value.trim();
  }

  const digits = normalized.slice(1);

  return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
}
