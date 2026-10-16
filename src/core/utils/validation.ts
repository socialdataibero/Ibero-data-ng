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

/**
 * Reglas del nombre de una variable canónica, iguales a las del servidor: de 2 a 64
 * caracteres, empieza con letra sin acento y solo lleva letras sin acento, números y `_`.
 * Devuelve el motivo del rechazo o `null` si el nombre es válido.
 */
export function canonicalNameProblem(name: string): string | null {
  if (name.length < 2 || name.length > 64) return 'debe tener entre 2 y 64 caracteres';
  if (!/^[A-Za-z]/.test(name)) return 'debe empezar con una letra sin acento';
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
    return 'solo puede tener letras sin acento, números y guion bajo (_), sin espacios';
  }
  return null;
}

/** Los nombres de variables canónicas no distinguen mayúsculas (`edad` = `EDAD`). */
export function sameCanonicalName(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}
