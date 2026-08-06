"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { MAPS_CONSENT_EVENT, revokeMapsConsent } from "@/lib/maps-consent"

// Custom event the footer "Cookie-Einstellungen" link dispatches to reopen the
// banner. Kept in sync with components/cookie-settings-button.tsx.
export const OPEN_COOKIE_SETTINGS_EVENT = "open-cookie-settings"

const COOKIE_NAME = "cookie_consent"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180 // 180 days

function readConsentCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|;\s*)cookie_consent=([^;]+)/)
  return match ? match[1] : null
}

function writeConsentCookie(value: "granted" | "denied"): void {
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

export function CookieConsent() {
  const t = useTranslations("cookies")
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show only when no choice has been stored yet.
    if (!readConsentCookie()) setVisible(true)

    const reopen = () => setVisible(true)
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen)
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen)
  }, [])

  // Accept optional services → Google Maps is allowed to load.
  const acceptAll = () => {
    writeConsentCookie("granted")
    window.dispatchEvent(new Event(MAPS_CONSENT_EVENT))
    setVisible(false)
  }

  // Necessary only → keep Google Maps blocked until the visitor separately
  // clicks "Google Maps laden" on a map placeholder.
  const necessaryOnly = () => {
    writeConsentCookie("denied")
    revokeMapsConsent()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("ariaLabel")}
      className="fixed inset-x-0 bottom-0 z-[9998] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="container mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-7">
        <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
          {t("title")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("body")}{" "}
          <Link
            href="/datenschutz"
            className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
          >
            {t("privacyLink")}
          </Link>
        </p>
        {/* Both options share the same size and solid styling → equal prominence. */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={necessaryOnly}
            className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90"
          >
            {t("reject")}
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  )
}
