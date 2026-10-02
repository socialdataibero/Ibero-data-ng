const SLUG_RE = /^[a-z0-9-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidSlug(value: string): boolean {
  return SLUG_RE.test(value);
}

export function looksLikeUrl(value: string): boolean {
  return /^(https?:\/\/|www\.)/i.test(value.trim());
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isValidYear(value: string, min = 1900, max = 2100): boolean {
  if (!/^\d+$/.test(value)) return false;
  const year = Number(value);
  return year >= min && year <= max;
}
