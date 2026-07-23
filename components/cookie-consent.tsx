"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

// Custom event name the footer "Ustawienia cookies" link dispatches to reopen
// the banner. Kept in sync with components/cookie-settings-button.tsx.
export const OPEN_COOKIE_SETTINGS_EVENT = "open-cookie-settings"

// Dispatched the moment the user grants consent, so consent-gated integrations
// (e.g. Ringostat in components/ringostat.tsx) can load without polling.
export const CONSENT_GRANTED_EVENT = "cookie-consent-granted"

const COOKIE_NAME = "cookie_consent"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180 // 180 days

const GRANTED = {
  ad_storage: "granted",
  analytics_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
} as const

const DENIED = {
  ad_storage: "denied",
  analytics_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
} as const

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function readConsentCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|;\s*)cookie_consent=([^;]+)/)
  return match ? match[1] : null
}

function writeConsentCookie(value: "granted" | "denied"): void {
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show only when no choice has been stored yet.
    if (!readConsentCookie()) setVisible(true)

    const reopen = () => setVisible(true)
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen)
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen)
  }, [])

  const accept = () => {
    window.gtag?.("consent", "update", GRANTED)
    writeConsentCookie("granted")
    window.dispatchEvent(new Event(CONSENT_GRANTED_EVENT))
    setVisible(false)
  }

  const reject = () => {
    window.gtag?.("consent", "update", DENIED)
    writeConsentCookie("denied")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Zgoda na pliki cookies"
      className="fixed inset-x-0 bottom-0 z-[9998] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="container mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-7">
        <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
          Pliki cookies
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Używamy plików cookies do celów analitycznych i marketingowych. Możesz
          zaakceptować wszystkie lub odrzucić opcjonalne.{" "}
          <Link
            href="/polityka-prywatnosci"
            className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Polityka prywatności
          </Link>
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={reject}
            className="rounded-full border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Odrzucam
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Akceptuję
          </button>
        </div>
      </div>
    </div>
  )
}
