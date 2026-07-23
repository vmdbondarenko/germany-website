// Helpers for pushing events to the Google Tag Manager dataLayer.
// GTM itself is injected in app/layout.tsx via @next/third-parties.
//
// Privacy: never push personal data (name, email, phone, message) here — only
// the event name and non-personal context. Lead details stay server-side in the
// /api/contact handler.

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

/** Safely push an arbitrary payload to the GTM dataLayer (no-op during SSR). */
export function pushToDataLayer(data: Record<string, unknown>): void {
  if (typeof window === "undefined") return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(data)
}

/**
 * Fire a `form_submit` event after a successful contact-form submission.
 * `formName` identifies which form fired it (e.g. "contact_section"); `params`
 * may carry non-personal context only (e.g. subject/project).
 */
export function trackFormSubmit(
  formName: string,
  params: Record<string, unknown> = {},
): void {
  pushToDataLayer({ event: "form_submit", form_name: formName, ...params })
}
