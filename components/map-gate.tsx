"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { MapPin } from "lucide-react"
import { hasMapsConsent, grantMapsConsent, MAPS_CONSENT_EVENT } from "@/lib/maps-consent"

// Wraps any Google Maps embed/JS-API map. Until the visitor consents, the map is
// NOT rendered (so no request reaches Google) and a placeholder with the
// "Google Maps laden" button is shown in its place. Consent is picked up live
// from the cookie banner ("accept optional") or the button itself, and is
// remembered via lib/maps-consent. `className` styles the placeholder so it fills
// the same box as the map (e.g. "absolute inset-0"), preserving the layout.
export function MapGate({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const t = useTranslations("maps")
  const [consented, setConsented] = useState(false)

  useEffect(() => {
    if (hasMapsConsent()) {
      setConsented(true)
      return
    }
    const onChange = () => setConsented(hasMapsConsent())
    window.addEventListener(MAPS_CONSENT_EVENT, onChange)
    return () => window.removeEventListener(MAPS_CONSENT_EVENT, onChange)
  }, [])

  if (consented) return <>{children}</>

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 bg-muted p-6 text-center ${className ?? ""}`}
    >
      <MapPin className="h-10 w-10 text-muted-foreground" aria-hidden />
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        {t("placeholder")}
      </p>
      <button
        type="button"
        onClick={() => {
          grantMapsConsent()
          setConsented(true)
        }}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        {t("loadButton")}
      </button>
    </div>
  )
}
