"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Script from "next/script"
import { CONSENT_GRANTED_EVENT } from "@/components/cookie-consent"

// Ringostat call-tracking loader. Only mounted once cookie consent is granted
// (Consent Mode default is denied — see the consent-mode-default Script and
// components/cookie-consent.tsx).
const RINGOSTAT_SRC =
  "https://script.ringostat.com/v4/81/81e2df8f713aca4ef28f66f8007043282d0c9c40.js"

declare global {
  interface Window {
    ringostatAnalytics?: { sendHit: (event: string) => void }
  }
}

function hasConsent(): boolean {
  if (typeof document === "undefined") return false
  return document.cookie.includes("cookie_consent=granted")
}

// The tracker attaches window.ringostatAnalytics asynchronously after the
// external script loads. Poll (as Ringostat's own snippet does) until it's
// ready, then send the pageview.
function sendPageview(): void {
  const tick = () => {
    if (typeof window.ringostatAnalytics === "undefined") {
      setTimeout(tick, 100)
    } else {
      window.ringostatAnalytics.sendHit("pageview")
    }
  }
  tick()
}

export function Ringostat() {
  const [consented, setConsented] = useState(false)
  const pathname = usePathname()

  // Never load call tracking in the admin panel.
  const isAdmin = pathname?.startsWith("/admin") ?? false

  // Gate loading on consent: check the stored cookie on mount, and listen for
  // the grant event so we start tracking immediately when the user accepts.
  useEffect(() => {
    if (hasConsent()) {
      setConsented(true)
      return
    }
    const onGrant = () => setConsented(true)
    window.addEventListener(CONSENT_GRANTED_EVENT, onGrant)
    return () => window.removeEventListener(CONSENT_GRANTED_EVENT, onGrant)
  }, [])

  // Fire a pageview on the first load after consent and on every client-side
  // route change (App Router navigations don't reload the page). Skip admin.
  useEffect(() => {
    if (!consented || isAdmin) return
    sendPageview()
  }, [consented, isAdmin, pathname])

  if (!consented || isAdmin) return null

  return <Script src={RINGOSTAT_SRC} strategy="afterInteractive" />
}
