// Shared phone-number validation for the contact forms (and the /api/contact
// guard). Framework-agnostic so it can run on the client and the server.

/** Max characters accepted in the national-number field (digits + separators). */
export const PHONE_MAX_LENGTH = 20

/** Polish validation message shown when a phone number is rejected. */
export const PHONE_ERROR_MESSAGE =
  "Podaj poprawny numer telefonu (np. 123 456 789)."

/**
 * Validate the national part of a phone number for a chosen country dial code.
 * `expected`, when provided, pins the exact national digit count(s); otherwise a
 * generic 6–14 national / 8–15 total (E.164) range is enforced.
 */
export function isValidNationalNumber(
  dial: string,
  national: string,
  expected?: number | number[],
): boolean {
  if (national.length > PHONE_MAX_LENGTH) return false
  if (!/^[\d\s().-]+$/.test(national.trim())) return false
  const nat = national.replace(/\D/g, "")
  if (!nat) return false
  if (expected != null) {
    const lengths = Array.isArray(expected) ? expected : [expected]
    return lengths.includes(nat.length)
  }
  if (nat.length < 6 || nat.length > 14) return false
  const total = dial.replace(/\D/g, "").length + nat.length
  return total >= 8 && total <= 15
}

/**
 * Accepts Polish and international numbers: an optional leading "+" followed by
 * digits and common separators (spaces, hyphens, dots, parentheses). Requires
 * 9–15 digits total (E.164 maximum) and rejects anything longer than
 * PHONE_MAX_LENGTH characters or containing unexpected characters.
 */
export function isValidPhone(raw: string): boolean {
  const value = raw.trim()
  if (!value || value.length > PHONE_MAX_LENGTH) return false
  if (!/^\+?[\d\s().-]+$/.test(value)) return false
  const digits = value.replace(/\D/g, "")
  return digits.length >= 9 && digits.length <= 15
}
