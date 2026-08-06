// Consent gate for Google Maps. Google Maps (iframe embeds and the JS API) must
// not load — and must send no request to Google — until the visitor consents.
//
// Consent is granted either by:
//   • accepting optional services in the cookie banner  → cookie_consent=granted
//   • clicking "Google Maps laden" on a map placeholder → maps_consent=granted
//
// Choosing "necessary only" (cookie_consent=denied) keeps maps blocked until the
// visitor separately clicks "Google Maps laden". Both signals are remembered as
// first-party cookies so the choice persists across pages and reloads.

export const MAPS_CONSENT_EVENT = "maps-consent-changed"
const MAPS_COOKIE = "maps_consent"
const MAX_AGE = 60 * 60 * 24 * 180 // 180 days — same horizon as cookie_consent

export function hasMapsConsent(): boolean {
  if (typeof document === "undefined") return false
  const c = document.cookie
  return (
    /(?:^|;\s*)cookie_consent=granted(?:;|$)/.test(c) ||
    /(?:^|;\s*)maps_consent=granted(?:;|$)/.test(c)
  )
}

export function grantMapsConsent(): void {
  if (typeof document === "undefined") return
  document.cookie = `${MAPS_COOKIE}=granted; path=/; max-age=${MAX_AGE}; SameSite=Lax`
  window.dispatchEvent(new Event(MAPS_CONSENT_EVENT))
}

// Used when the visitor chooses "necessary only": keeps Google Maps blocked
// until they separately opt in via the placeholder button.
export function revokeMapsConsent(): void {
  if (typeof document === "undefined") return
  document.cookie = `${MAPS_COOKIE}=; path=/; max-age=0; SameSite=Lax`
  window.dispatchEvent(new Event(MAPS_CONSENT_EVENT))
}
