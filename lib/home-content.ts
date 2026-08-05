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
  DEFAULT_STATS,
  DEFAULT_VALUES,
  DEFAULT_BAUWEISE,
  DEFAULT_UPCOMING,
  DEFAULT_NEW_CITIES,
  DEFAULT_TEAM,
  DEFAULT_SINCE_FOUNDING,
  DEFAULT_ERSTE_BAYERISCHE,
  DEFAULT_GALLERY,
  DEFAULT_NEWS,
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
  image: string
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
    ctaHref: string
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
      image: byId.get("hero")?.imageUrl || DEFAULT_HERO.image,
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
      investor: (() => {
        const r = byId.get("investor")
        const body = locale === "en" ? r?.descriptionEn : r?.descriptionDe
        const badge = locale === "en" ? r?.secondaryCtaLabelEn : r?.secondaryCtaLabelDe
        const invCta = cta("investor", "primary", DEFAULT_BUYING.investor.ctaLabel, DEFAULT_BUYING.investor.ctaHref)
        return {
          eyebrow: eyebrow("investor", DEFAULT_BUYING.investor.eyebrow),
          experienceBadge: badge || pick(DEFAULT_BUYING.investor.experienceBadge, locale),
          heading: heading("investor", DEFAULT_BUYING.investor.heading),
          paragraphs: body ? body.split("\n\n").filter(Boolean) : DEFAULT_BUYING.investor.paragraphs.map((p) => pick(p, locale)),
          ctaLabel: invCta.label,
          ctaHref: invCta.href,
        }
      })(),
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// About-page blocks (Phase 2 Group A) — stats, values, Bauweise, and the two
// promo headers. Reuses HomeSection / HomeSectionItem (ids: stats, values,
// bauweise, upcoming, new-cities). Every field falls back per-locale to the
// shared defaults, so the section renders identically before an admin edits it
// and never blanks the English locale.
// ─────────────────────────────────────────────────────────────────────────────

export type AboutContent = {
  stats: { value: string; label: string }[]
  values: { eyebrow: string; heading: string; footnote: string; cards: { title: string; description: string }[] }
  bauweise: { heading: string; paragraphs: string[]; ctaLabel: string; ctaHref: string; image1: string; image2: string }
  upcoming: { line1: string; line2: string; subtitle: string }
  newCities: { heading: string; subtitle: string; noteTitle: string; noteText: string }
  team: { heading: string; description: string }
  sinceFounding: { heading: string; periods: { title: string; lines: string[] }[] }
}

export async function getAboutContent(locale: Locale): Promise<AboutContent> {
  const de = locale !== "en"
  const L = (s: LocalizedText) => (de ? s.de : s.en)
  const rows = await prisma.homeSection.findMany({
    where: { id: { in: ["stats", "values", "bauweise", "upcoming", "new-cities", "team", "since-founding"] } },
    include: { items: { orderBy: { order: "asc" } } },
  })
  const byId = new Map(rows.map((r) => [r.id, r]))

  const statsRow = byId.get("stats")
  const stats =
    statsRow && statsRow.items.length > 0
      ? statsRow.items.map((it) => ({
          value: (de ? it.titleDe : it.titleEn) || "",
          label: (de ? it.descriptionDe : it.descriptionEn) || "",
        }))
      : DEFAULT_STATS.map((s) => ({ value: s.value, label: L(s.label) }))

  const valuesRow = byId.get("values")
  const values = {
    eyebrow: (de ? valuesRow?.eyebrowDe : valuesRow?.eyebrowEn) || L(DEFAULT_VALUES.eyebrow),
    heading: (de ? valuesRow?.headingDe : valuesRow?.headingEn) || L(DEFAULT_VALUES.heading),
    footnote: (de ? valuesRow?.descriptionDe : valuesRow?.descriptionEn) || L(DEFAULT_VALUES.footnote),
    cards:
      valuesRow && valuesRow.items.length > 0
        ? valuesRow.items.map((it) => ({
            title: (de ? it.titleDe : it.titleEn) || "",
            description: (de ? it.descriptionDe : it.descriptionEn) || "",
          }))
        : DEFAULT_VALUES.cards.map((c) => ({ title: L(c.title), description: L(c.description) })),
  }

  const bwRow = byId.get("bauweise")
  const bwDesc = de ? bwRow?.descriptionDe : bwRow?.descriptionEn
  const bauweise = {
    heading: (de ? bwRow?.headingDe : bwRow?.headingEn) || L(DEFAULT_BAUWEISE.heading),
    paragraphs: bwDesc ? bwDesc.split("\n\n").filter(Boolean) : DEFAULT_BAUWEISE.paragraphs.map(L),
    ctaLabel: (de ? bwRow?.primaryCtaLabelDe : bwRow?.primaryCtaLabelEn) || L(DEFAULT_BAUWEISE.ctaLabel),
    ctaHref: bwRow?.primaryCtaHref || DEFAULT_BAUWEISE.ctaHref,
    image1: bwRow?.imageUrl || DEFAULT_BAUWEISE.image1,
    image2: bwRow?.imageUrl2 || DEFAULT_BAUWEISE.image2,
  }

  const upRow = byId.get("upcoming")
  const upcoming = {
    line1: (de ? upRow?.headingDe : upRow?.headingEn) || L(DEFAULT_UPCOMING.line1),
    line2: (de ? upRow?.eyebrowDe : upRow?.eyebrowEn) || L(DEFAULT_UPCOMING.line2),
    subtitle: (de ? upRow?.descriptionDe : upRow?.descriptionEn) || L(DEFAULT_UPCOMING.subtitle),
  }

  const ncRow = byId.get("new-cities")
  const ncItem = ncRow?.items[0]
  const newCities = {
    heading: (de ? ncRow?.headingDe : ncRow?.headingEn) || L(DEFAULT_NEW_CITIES.heading),
    subtitle: (de ? ncRow?.descriptionDe : ncRow?.descriptionEn) || L(DEFAULT_NEW_CITIES.subtitle),
    noteTitle: (de ? ncItem?.titleDe : ncItem?.titleEn) || L(DEFAULT_NEW_CITIES.noteTitle),
    noteText: (de ? ncItem?.descriptionDe : ncItem?.descriptionEn) || L(DEFAULT_NEW_CITIES.noteText),
  }

  const teamRow = byId.get("team")
  const team = {
    heading: (de ? teamRow?.headingDe : teamRow?.headingEn) || L(DEFAULT_TEAM.heading),
    description: (de ? teamRow?.descriptionDe : teamRow?.descriptionEn) || L(DEFAULT_TEAM.description),
  }

  const toLines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean)
  const sfRow = byId.get("since-founding")
  const sinceFounding = {
    heading: (de ? sfRow?.headingDe : sfRow?.headingEn) || L(DEFAULT_SINCE_FOUNDING.heading),
    periods:
      sfRow && sfRow.items.length > 0
        ? sfRow.items.map((it) => ({
            title: (de ? it.titleDe : it.titleEn) || "",
            lines: toLines((de ? it.descriptionDe : it.descriptionEn) || ""),
          }))
        : DEFAULT_SINCE_FOUNDING.periods.map((p) => ({ title: L(p.title), lines: toLines(L(p.description)) })),
  }

  return { stats, values, bauweise, upcoming, newCities, team, sinceFounding }
}

// ─────────────────────────────────────────────────────────────────────────────
// "Erste Bayerische" — the first investment, presented in full on the homepage
// directly after the Bauweise section. Reuses HomeSection "erste-bayerische"
// (eyebrow = project name, heading, description = intro) + kind-discriminated
// HomeSectionItem rows (hero / wide / block:location|nature|see|closing /
// travel / gallery). Every field falls back per-locale to the shared defaults,
// so the section renders identically before an admin edits it.
// ─────────────────────────────────────────────────────────────────────────────

export type EbImage = { image: string; alt: string }
export type EbBlock = { title: string; body: string; image: string; alt: string }
export type ErsteBayerischeContent = {
  projectName: string
  heading: string
  intro: string
  hero: EbImage
  wide: EbImage
  blocks: {
    location: EbBlock
    nature: EbBlock
    see: EbBlock
    closing: { title: string; body: string }
  }
  travelHeading: string
  travel: { icon: string; title: string; description: string; meta: string }[]
  gallery: EbImage[]
}

export async function getErsteBayerischeContent(locale: Locale): Promise<ErsteBayerischeContent> {
  const de = locale !== "en"
  const L = (s: LocalizedText) => (de ? s.de : s.en)
  const D = DEFAULT_ERSTE_BAYERISCHE

  const row = await prisma.homeSection.findUnique({
    where: { id: "erste-bayerische" },
    include: { items: { orderBy: { order: "asc" } } },
  })
  const items = row?.items ?? []
  const one = (kind: string) => items.find((it) => it.kind === kind)
  const many = (kind: string) => items.filter((it) => it.kind === kind)

  const txt = (v: string | null | undefined, fb: string) => (v && v.trim() ? v : fb)
  const tDe = (it: { titleDe: string | null; titleEn: string | null } | undefined) =>
    it ? (de ? it.titleDe : it.titleEn) : null
  const dDe = (it: { descriptionDe: string | null; descriptionEn: string | null } | undefined) =>
    it ? (de ? it.descriptionDe : it.descriptionEn) : null
  const aDe = (it: { imageAltDe: string | null; imageAltEn: string | null } | undefined) =>
    it ? (de ? it.imageAltDe : it.imageAltEn) : null
  const img = (kind: string, fb: { image: string; alt: LocalizedText }): EbImage => {
    const it = one(kind)
    return { image: txt(it?.imageUrl, fb.image), alt: txt(aDe(it), L(fb.alt)) }
  }
  const block = (kind: string, fb: typeof D.blocks.location): EbBlock => {
    const it = one(kind)
    return {
      title: txt(tDe(it), L(fb.title)),
      body: txt(dDe(it), L(fb.body)),
      image: txt(it?.imageUrl, fb.image),
      alt: txt(aDe(it), L(fb.alt)),
    }
  }

  const closingIt = one("block:closing")
  const travelItems = many("travel")
  const galleryItems = many("gallery")

  return {
    projectName: txt(de ? row?.eyebrowDe : row?.eyebrowEn, L(D.projectName)),
    heading: txt(de ? row?.headingDe : row?.headingEn, L(D.heading)),
    intro: txt(de ? row?.descriptionDe : row?.descriptionEn, L(D.intro)),
    hero: img("hero", D.hero),
    wide: img("wide", D.wide),
    blocks: {
      location: block("block:location", D.blocks.location),
      nature: block("block:nature", D.blocks.nature),
      see: block("block:see", D.blocks.see),
      closing: {
        title: txt(de ? closingIt?.titleDe : closingIt?.titleEn, L(D.blocks.closing.title)),
        body: txt(de ? closingIt?.descriptionDe : closingIt?.descriptionEn, L(D.blocks.closing.body)),
      },
    },
    travelHeading: L(D.travelHeading),
    travel:
      travelItems.length > 0
        ? travelItems.map((it) => ({
            icon: it.icon || "Sparkles",
            title: (de ? it.titleDe : it.titleEn) || "",
            description: (de ? it.descriptionDe : it.descriptionEn) || "",
            meta: (de ? it.metaDe : it.metaEn) || "",
          }))
        : D.travel.map((tv) => ({ icon: tv.icon, title: L(tv.title), description: "", meta: L(tv.meta) })),
    gallery:
      galleryItems.length > 0
        ? galleryItems.map((it) => ({ image: it.imageUrl || "", alt: aDe(it) || "" })).filter((g) => g.image)
        : D.gallery.map((g) => ({ image: g.image, alt: L(g.alt) })),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Completed-projects gallery (HomeSection "gallery"). Fully admin-managed and
// bilingual: eyebrow/heading map to their columns, subtitle → description,
// Poland/Ukraine tab labels → primary/secondary CTA labels, visibility →
// HomeSection.enabled. Each image is a HomeSectionItem: kind = "poland"|"ukraine"
// (shared across locales), imageUrl + imageAltDe/En, icon = "lead" for the lead
// image of its country, order = per-country order. Images are shared DE/EN — only
// the labels and alt text differ per locale.
// ─────────────────────────────────────────────────────────────────────────────

export type GalleryImage = { image: string; alt: string }
export type GalleryContent = {
  enabled: boolean
  eyebrow: string
  heading: string
  subtitle: string
  polandLabel: string
  ukraineLabel: string
  poland: GalleryImage[]
  ukraine: GalleryImage[]
}

export async function getGalleryContent(locale: Locale): Promise<GalleryContent> {
  const de = locale !== "en"
  const L = (s: LocalizedText) => (de ? s.de : s.en)
  const D = DEFAULT_GALLERY

  const row = await prisma.homeSection.findUnique({
    where: { id: "gallery" },
    include: { items: { orderBy: { order: "asc" } } },
  })
  const items = row?.items ?? []

  // Per country: keep stored order, but surface the lead image first so the
  // public layout renders it as the large lead photo.
  const byCountry = (country: string): GalleryImage[] => {
    const list = items.filter((it) => it.kind === country && it.imageUrl)
    const lead = list.filter((it) => it.icon === "lead")
    const rest = list.filter((it) => it.icon !== "lead")
    return [...lead, ...rest].map((it) => ({
      image: it.imageUrl as string,
      alt: (de ? it.imageAltDe : it.imageAltEn) || "",
    }))
  }

  return {
    enabled: row?.enabled ?? true,
    eyebrow: (de ? row?.eyebrowDe : row?.eyebrowEn) || L(D.eyebrow),
    heading: (de ? row?.headingDe : row?.headingEn) || L(D.heading),
    // Subtitle is optional: once the row exists its value is authoritative (may
    // be empty); only the very first, unsaved state shows the default text.
    subtitle: row ? ((de ? row.descriptionDe : row.descriptionEn) || "") : L(D.subtitle),
    polandLabel: (de ? row?.primaryCtaLabelDe : row?.primaryCtaLabelEn) || L(D.polandLabel),
    ukraineLabel: (de ? row?.secondaryCtaLabelDe : row?.secondaryCtaLabelEn) || L(D.ukraineLabel),
    poland: byCountry("poland"),
    ukraine: byCountry("ukraine"),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Homepage "Aktuelles" (news) section header — admin-managed and bilingual.
// Reuses HomeSection "news": eyebrow/heading map to their columns, subtitle →
// description, the "all news" button label → primaryCtaLabel. Every field falls
// back per-locale to the shared defaults, so the section renders identically
// before an admin edits it. The article list itself comes from NewsPost.
// ─────────────────────────────────────────────────────────────────────────────

export type NewsSectionContent = {
  enabled: boolean
  eyebrow: string
  heading: string
  subtitle: string
  allNewsLabel: string
}

export async function getNewsContent(locale: Locale): Promise<NewsSectionContent> {
  const de = locale !== "en"
  const L = (s: LocalizedText) => (de ? s.de : s.en)
  const D = DEFAULT_NEWS

  const row = await prisma.homeSection.findUnique({ where: { id: "news" } })
  return {
    enabled: row?.enabled ?? true,
    eyebrow: (de ? row?.eyebrowDe : row?.eyebrowEn) || L(D.eyebrow),
    heading: (de ? row?.headingDe : row?.headingEn) || L(D.heading),
    subtitle: (de ? row?.descriptionDe : row?.descriptionEn) || L(D.subtitle),
    allNewsLabel: (de ? row?.primaryCtaLabelDe : row?.primaryCtaLabelEn) || L(D.allNewsLabel),
  }
}
