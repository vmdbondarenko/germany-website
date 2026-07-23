// Shared email validation for the contact forms (and the /api/contact guard).

export const EMAIL_MAX_LENGTH = 254

export const EMAIL_ERROR_MESSAGE =
  "Podaj poprawny adres e-mail (np. jan@example.com)."

/** Pragmatic email check: one @, non-empty local part, dotted domain, no spaces. */
export function isValidEmail(raw: string): boolean {
  const value = raw.trim()
  if (!value || value.length > EMAIL_MAX_LENGTH) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
