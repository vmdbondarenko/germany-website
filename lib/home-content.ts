import { prisma } from "@/lib/prisma"
import type { Locale } from "@/i18n/routing"

// ─────────────────────────────────────────────────────────────────────────────
// Homepage content — admin-managed, per-locale.
//
// Every otherwise-hardcoded homepage section reads its copy from here. The
// getter merges the code defaults below (German + English placeholders) with any
// overrides stored in the HomeSection / HomeSectionItem tables, so the site is
// fully functional before an admin has entered anything, and each field can be
// overridden per locale in the admin panel.
//
// NOTE: the German copy here is neutral PLACEHOLDER marketing text — it makes no
// factual claims about the business. Real content is entered in admin. The
// Poland-specific selling points from the source site (MSWiA permits, Polish
// government programs) have been intentionally dropped.
// ─────────────────────────────────────────────────────────────────────────────

type LocalizedText = { de: string; en: string }
type Item = { icon: string; title: LocalizedText; description: LocalizedText }

const t = (de: string, en: string): LocalizedText => ({ de, en })

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

// ── Code defaults (DE placeholder + EN) ──────────────────────────────────────

const DEFAULT_HERO = {
  eyebrow: t("Immobilienentwickler", "Property developer"),
  title: t("Neue Häuser vom Bauträger", "New homes from the developer"),
  subtitle: t(
    "Wir schaffen hochwertige Wohnimmobilien mit Charakter — durchdachte Grundrisse, sorgfältige Verarbeitung und ein Zuhause zum Wohlfühlen.",
    "We build high-quality homes with character — thoughtful layouts, careful craftsmanship and a place to feel at home.",
  ),
  primaryCta: t("Projekte ansehen", "View projects"),
  secondaryCta: t("Über uns", "About us"),
}

const DEFAULT_PROCESS = {
  heading: t("Warum Sie uns wählen sollten", "Why choose us"),
  description: t(
    "Wir schaffen moderne Wohnprojekte in grüner Umgebung — mit Blick auf Alltagskomfort, Architektur und Ausführungsqualität.",
    "We create modern developments in green surroundings — focused on everyday comfort, architecture and build quality.",
  ),
  items: [
    { icon: "MapPin", title: t("Attraktive Lage", "Attractive location"), description: t("Sorgfältig gewählte Standorte verbinden Wohnkomfort mit guter Anbindung an die städtische Infrastruktur.", "Carefully chosen locations combine living comfort with easy access to city infrastructure.") },
    { icon: "Home", title: t("Privater Freiraum", "Private space"), description: t("Jedes Haus bietet einen eigenen Garten für Komfort, Erholung und tägliche Nähe zur Natur.", "Every home offers its own garden for comfort, relaxation and daily contact with nature.") },
    { icon: "Trees", title: t("Grüne Umgebung", "Green surroundings"), description: t("Unsere Projekte entstehen in ruhigen, grünen Wohnlagen — ideal für Familien.", "Our projects are set in quiet, green residential areas — ideal for families.") },
    { icon: "Settings", title: t("Komfort und Funktion", "Comfort and function"), description: t("Durchdachte Raumaufteilungen, Stellplätze und moderne Lösungen für den Alltag.", "Thoughtful layouts, parking spaces and modern solutions for everyday living.") },
  ],
}

const DEFAULT_DISTINGUISHES = {
  eyebrow: t("Unser Angebot", "Our offer"),
  heading: t("Was uns auszeichnet", "What sets us apart"),
  description: t(
    "Wir achten auf jedes Detail — von der Materialauswahl bis zur individuellen Planung.",
    "We care about every detail — from material selection to individual planning.",
  ),
  items: [
    { icon: "Layers", title: t("Hochwertige Materialien", "High-quality materials"), description: t("Wir setzen auf langlebige, sorgfältig ausgewählte Baumaterialien für dauerhafte Qualität.", "We rely on durable, carefully selected building materials for lasting quality.") },
    { icon: "PenLine", title: t("Planung und Gestaltung", "Design and planning"), description: t("Wir realisieren eigene Projekte auf eigenen Grundstücken — mit Raum für individuelle Anpassungen.", "We build our own projects on our own plots — with room for individual adjustments.") },
    { icon: "ArrowUpToLine", title: t("Lichtdurchflutete Räume", "Light-filled rooms"), description: t("Großzügige Raumhöhen und große Fenster bringen viel Tageslicht in die Wohnräume.", "Generous ceiling heights and large windows bring plenty of daylight into the living spaces.") },
  ],
}

const DEFAULT_SERVICES = {
  heading: t("Wie wir zusätzlich helfen", "How else we help"),
  description: t(
    "Umfassende Unterstützung in jeder Phase von Kauf und Ausbau Ihrer Immobilie.",
    "Comprehensive support at every stage of buying and finishing your property.",
  ),
  items: [
    { icon: "HandCoins", title: t("Finanzierungsberatung", "Financing support"), description: t("Wir vermitteln bei Bedarf eine unabhängige Finanzierungsberatung.", "We can connect you with independent financing advice.") },
    { icon: "Hammer", title: t("Ausbau-Partner", "Finishing partners"), description: t("Wir empfehlen erfahrene und geprüfte Ausbau- und Handwerksteams.", "We recommend experienced, vetted finishing and trade teams.") },
    { icon: "KeyRound", title: t("Schlüsselfertig", "Turnkey"), description: t("Auf Wunsch übergeben wir Ihre Immobilie schlüsselfertig — ohne zusätzliche Arbeiten.", "On request we hand over your property turnkey — with no extra work needed.") },
  ],
}

const DEFAULT_INTERIOR = {
  heading: t("Innenräume schlüsselfertig", "Turnkey interiors"),
  description: t(
    "Wir gestalten bezugsfertige Innenräume — funktional, ästhetisch und bis ins Detail durchdacht.",
    "We create move-in-ready interiors — functional, elegant and considered down to the detail.",
  ),
}

const DEFAULT_BUYING = {
  heading: t("So kaufen Sie Ihre Wunschimmobilie", "How to buy your dream home"),
  steps: [
    t("Kontakt mit dem Vertrieb und Terminvereinbarung vor Ort.", "Contact our sales team and arrange a viewing on site."),
    t("Besichtigung vor Ort und Gespräch über das Angebot.", "On-site visit and a conversation about the offer."),
    t("Unterzeichnung der Reservierungsvereinbarung.", "Sign the reservation agreement."),
    t("Beratung zur Finanzierung.", "Financing consultation."),
    t("Unterzeichnung des Kaufvertrags.", "Sign the purchase contract."),
    t("Übergabe der fertigen Immobilie.", "Handover of the finished property."),
    t("Unterzeichnung des Eigentumsübertrags.", "Sign the transfer of ownership."),
  ],
  helpHeading: t("Wie wir zusätzlich helfen", "How else we help"),
  help: [
    { icon: "HandCoins", text: t("Wir vermitteln bei Bedarf eine unabhängige Finanzierungsberatung.", "We can connect you with independent financing advice.") },
    { icon: "Hammer", text: t("Wir empfehlen erfahrene und geprüfte Ausbauteams.", "We recommend experienced, vetted finishing teams.") },
    { icon: "KeyRound", text: t("Auf Wunsch übergeben wir Ihre Immobilie schlüsselfertig.", "On request we hand over your property fully turnkey.") },
  ],
  investor: {
    eyebrow: t("Über das Unternehmen", "About the company"),
    experienceBadge: t("Erfahrener Bauträger", "Experienced developer"),
    heading: t("Ihr Bauträger", "Your developer"),
    paragraphs: [
      t(
        "[Platzhalter] Wir sind ein Immobilienentwickler mit Fokus auf hochwertige Wohnhäuser. Ersetzen Sie diesen Text im Admin-Bereich durch Ihre Unternehmensgeschichte.",
        "[Placeholder] We are a property developer focused on high-quality homes. Replace this text in the admin panel with your company story.",
      ),
      t(
        "[Platzhalter] Beschreiben Sie hier Ihre Werte, Ihre Erfahrung und was Ihr Unternehmen auszeichnet.",
        "[Placeholder] Describe your values, your experience and what makes your company stand out here.",
      ),
    ],
    ctaLabel: t("Kontakt", "Contact"),
  },
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
      primaryCta: cta("hero", "primary", DEFAULT_HERO.primaryCta, "#w-sprzedazy"),
      secondaryCta: cta("hero", "secondary", DEFAULT_HERO.secondaryCta, "#o-firmie"),
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
