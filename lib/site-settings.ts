import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { company, primaryContact, headquarters } from "@/lib/contact-info"

// ─────────────────────────────────────────────────────────────────────────────
// Company contact + legal identity, admin-managed via the SiteSettings singleton
// (id "main"). Every field falls back to lib/contact-info.ts, and the DB read is
// wrapped in try/catch, so the public site renders correctly even if the row is
// missing or the table has not been migrated yet. Server-only (imports prisma).
// ─────────────────────────────────────────────────────────────────────────────

export type SocialLink = { platform: "instagram" | "youtube" | "facebook" | "linkedin"; url: string }
export type SiteContact = { city: string; phone: string; phoneHref: string; email: string }

export type ResolvedSiteSettings = {
  companyName: string
  managingDirector: string
  phone: string
  phoneHref: string
  email: string
  street: string
  postalCode: string
  city: string
  country: string
  addressOneLine: string
  registerCourt: string
  registrationNumber: string
  vatId: string
  mapEmbedSrc: string
  mapHref: string
  logoUrl: string | null
  showLanguageSwitcher: boolean
  socials: SocialLink[]
  contacts: SiteContact[]
}

type SiteSettingsRow = {
  companyName: string | null; managingDirector: string | null; phone: string | null; email: string | null
  street: string | null; postalCode: string | null; city: string | null; country: string | null
  registerCourt: string | null; registrationNumber: string | null; vatId: string | null
  mapEmbedSrc: string | null; mapHref: string | null
  instagramUrl: string | null; youtubeUrl: string | null; facebookUrl: string | null; linkedinUrl: string | null
  logoUrl: string | null
  showLanguageSwitcher: boolean | null
} | null

function telHref(phone: string): string {
  return "tel:" + phone.replace(/[^\d+]/g, "")
}

export function resolveSiteSettings(row: SiteSettingsRow): ResolvedSiteSettings {
  const phone = row?.phone || company.phone
  const email = row?.email || company.email
  const street = row?.street || company.street
  const postalCode = row?.postalCode || company.postalCode
  const city = row?.city || company.city
  const phoneHref = row?.phone ? telHref(row.phone) : primaryContact.phoneHref

  const socials: SocialLink[] = []
  if (row?.instagramUrl) socials.push({ platform: "instagram", url: row.instagramUrl })
  if (row?.youtubeUrl) socials.push({ platform: "youtube", url: row.youtubeUrl })
  if (row?.facebookUrl) socials.push({ platform: "facebook", url: row.facebookUrl })
  if (row?.linkedinUrl) socials.push({ platform: "linkedin", url: row.linkedinUrl })

  return {
    companyName: row?.companyName || company.name,
    managingDirector: row?.managingDirector || company.managingDirector,
    phone,
    phoneHref,
    email,
    street,
    postalCode,
    city,
    country: row?.country || company.countryName,
    addressOneLine: `${street}, ${postalCode} ${city}`,
    registerCourt: row?.registerCourt || company.registerCourt,
    registrationNumber: row?.registrationNumber || company.registrationNumber,
    vatId: row?.vatId || company.vatId, // "" when still pending — never invented
    mapEmbedSrc: row?.mapEmbedSrc || headquarters.mapEmbedSrc,
    mapHref: row?.mapHref || headquarters.mapHref,
    logoUrl: row?.logoUrl || null,
    showLanguageSwitcher: row?.showLanguageSwitcher ?? true,
    socials,
    contacts: [{ city, phone, phoneHref, email }],
  }
}

/** Resolved site settings for the active request (DB row merged over fallback).
 *  Cached per-request so multiple consumers (layout, footer, impressum, …) share
 *  a single query. Falls back to lib/contact-info.ts if the table/row is absent. */
export const getSiteSettings = cache(async (): Promise<ResolvedSiteSettings> => {
  let row: SiteSettingsRow = null
  try {
    row = (await prisma.siteSettings.findUnique({ where: { id: "main" } })) as SiteSettingsRow
  } catch {
    row = null // table not migrated yet or DB unavailable → use code fallback
  }
  return resolveSiteSettings(row)
})
