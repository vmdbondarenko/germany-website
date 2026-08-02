import { prisma } from "@/lib/prisma"
import type { Locale } from "@/i18n/routing"
import {
  type LocalizedText,
  type LocalizedItem as Item,
  HERO_PRIMARY_HREF,
  HERO_SECONDARY_HREF,
  DEFAULT_HERO,
  DEFAULT_PROCESS,
  DEFAULT_DISTINGUISHES,
  DEFAULT_SERVICES,
  DEFAULT_INTERIOR,
  DEFAULT_BUYING,
} from "@/lib/content-defaults"

// ─────────────────────────────────────────────────────────────────────────────
// Homepage content — admin-managed, per-locale.
//
// The getter below merges the shared code defaults (from lib/content-defaults.ts —
// the single source, also used by the seed script) with any overrides stored in
// the HomeSection / HomeSectionItem tables, so the site is fully functional before
// an admin has entered anything, and each field can be overridden per locale.
// ─────────────────────────────────────────────────────────────────────────────

export type HeroContent = {
  eyebrow: string
  title: string
  subtitle: string
  primaryCta: { label: string; href: string }
  secondaryCta: { label: string; href: string }
}
export type FeatureSection = {
  eyebrow?: string
  heading: string
  description: string
  items: { icon: string; title: string; description: string }[]
}
export type BuyingContent = {
  heading: string
  steps: { title: string }[]
  helpHeading: string
  help: { icon: string; text: string }[]
  investor: {
    eyebrow: string
    experienceBadge: string
    heading: string
    paragraphs: string[]
    ctaLabel: string
  }
}
export type InteriorContent = { heading: string; description: string }

export type LocalizedHome = {
  hero: HeroContent
  process: FeatureSection
  distinguishes: FeatureSection
  services: FeatureSection
  interior: InteriorContent
  buying: BuyingContent
}


// ── Getter: defaults merged with DB overrides ────────────────────────────────

function pick(text: LocalizedText, locale: Locale): string {
  return locale === "en" ? text.en : text.de
}

/**
 * Localized homepage content for the active locale. Reads HomeSection /
 * HomeSectionItem overrides where present, otherwise falls back to the code
 * defaults above. Safe to call with an empty database.
 */
export async function getHomeContent(locale: Locale): Promise<LocalizedHome> {
  const rows = await prisma.homeSection.findMany({
    include: { items: { orderBy: { order: "asc" } } },
  })
  const byId = new Map(rows.map((r) => [r.id, r]))

  const heading = (id: string, fallback: LocalizedText) => {
    const r = byId.get(id)
    const v = locale === "en" ? r?.headingEn : r?.headingDe
    return v || pick(fallback, locale)
  }
  const description = (id: string, fallback: LocalizedText) => {
    const r = byId.get(id)
    const v = locale === "en" ? r?.descriptionEn : r?.descriptionDe
    return v || pick(fallback, locale)
  }
  const eyebrow = (id: string, fallback: LocalizedText) => {
    const r = byId.get(id)
    const v = locale === "en" ? r?.eyebrowEn : r?.eyebrowDe
    return v || pick(fallback, locale)
  }
  // Items: use DB items when the section has any, else the code defaults.
  const items = (id: string, fallback: Item[]) => {
    const r = byId.get(id)
    if (r && r.items.length > 0) {
      return r.items.map((it) => ({
        icon: it.icon || "Sparkles",
        title: (locale === "en" ? it.titleEn : it.titleDe) || "",
        description: (locale === "en" ? it.descriptionEn : it.descriptionDe) || "",
      }))
    }
    return fallback.map((it) => ({
      icon: it.icon,
      title: pick(it.title, locale),
      description: pick(it.description, locale),
    }))
  }
  const cta = (id: string, which: "primary" | "secondary", fallbackLabel: LocalizedText, fallbackHref: string) => {
    const r = byId.get(id)
    const label = which === "primary"
      ? (locale === "en" ? r?.primaryCtaLabelEn : r?.primaryCtaLabelDe)
      : (locale === "en" ? r?.secondaryCtaLabelEn : r?.secondaryCtaLabelDe)
    const href = which === "primary" ? r?.primaryCtaHref : r?.secondaryCtaHref
    return { label: label || pick(fallbackLabel, locale), href: href || fallbackHref }
  }

  return {
    hero: {
      eyebrow: eyebrow("hero", DEFAULT_HERO.eyebrow),
      title: heading("hero", DEFAULT_HERO.title),
      subtitle: description("hero", DEFAULT_HERO.subtitle),
      primaryCta: cta("hero", "primary", DEFAULT_HERO.primaryCta, HERO_PRIMARY_HREF),
      secondaryCta: cta("hero", "secondary", DEFAULT_HERO.secondaryCta, HERO_SECONDARY_HREF),
    },
    process: {
      heading: heading("process", DEFAULT_PROCESS.heading),
      description: description("process", DEFAULT_PROCESS.description),
      items: items("process", DEFAULT_PROCESS.items),
    },
    distinguishes: {
      eyebrow: eyebrow("distinguishes", DEFAULT_DISTINGUISHES.eyebrow),
      heading: heading("distinguishes", DEFAULT_DISTINGUISHES.heading),
      description: description("distinguishes", DEFAULT_DISTINGUISHES.description),
      items: items("distinguishes", DEFAULT_DISTINGUISHES.items),
    },
    services: {
      heading: heading("services", DEFAULT_SERVICES.heading),
      description: description("services", DEFAULT_SERVICES.description),
      items: items("services", DEFAULT_SERVICES.items),
    },
    interior: {
      heading: heading("interior", DEFAULT_INTERIOR.heading),
      description: description("interior", DEFAULT_INTERIOR.description),
    },
    buying: {
      heading: heading("buying", DEFAULT_BUYING.heading),
      steps: DEFAULT_BUYING.steps.map((s) => ({ title: pick(s, locale) })),
      helpHeading: heading("buying-help", DEFAULT_BUYING.helpHeading),
      help: DEFAULT_BUYING.help.map((h) => ({ icon: h.icon, text: pick(h.text, locale) })),
      investor: {
        eyebrow: pick(DEFAULT_BUYING.investor.eyebrow, locale),
        experienceBadge: pick(DEFAULT_BUYING.investor.experienceBadge, locale),
        heading: heading("investor", DEFAULT_BUYING.investor.heading),
        paragraphs: DEFAULT_BUYING.investor.paragraphs.map((p) => pick(p, locale)),
        ctaLabel: pick(DEFAULT_BUYING.investor.ctaLabel, locale),
      },
    },
  }
}
