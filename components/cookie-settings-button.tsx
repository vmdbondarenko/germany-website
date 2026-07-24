"use client"

import { useTranslations } from "next-intl"
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/components/cookie-consent"

export function CookieSettingsButton({ className }: { className?: string }) {
  const t = useTranslations("cookies")
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
      className={className}
    >
      {t("settings")}
    </button>
  )
}
