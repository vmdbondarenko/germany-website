"use client"

import { createContext, useContext } from "react"
import type { ResolvedSiteSettings } from "@/lib/site-settings"

// Makes the server-resolved company contact/legal settings available to client
// components (header, contact section) without threading props through every
// page. Fed once from the root layout; the value is already resolved with
// fallbacks, so consumers never see nulls.
const SiteSettingsContext = createContext<ResolvedSiteSettings | null>(null)

export function SiteSettingsProvider({
  value,
  children,
}: {
  value: ResolvedSiteSettings
  children: React.ReactNode
}) {
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings(): ResolvedSiteSettings {
  const value = useContext(SiteSettingsContext)
  if (!value) {
    throw new Error("useSiteSettings must be used within <SiteSettingsProvider> (root layout).")
  }
  return value
}
