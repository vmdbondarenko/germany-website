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
  title: t("Neue Häuser direkt vom Bauträger zum Verkauf", "New homes from the developer"),
  subtitle: t(
    "Seit über 10 Jahren bauen wir einzigartige Immobilien im charakteristischen Stil des Bayerischen Mauerwerks aus handgeformten Ziegeln.",
    "We build high-quality homes with character — thoughtful layouts, careful craftsmanship and a place to feel at home.",
  ),
  primaryCta: t("Projekte ansehen", "View projects"),
  secondaryCta: t("Über uns", "About us"),
}

const DEFAULT_PROCESS = {
  heading: t("Warum wir?", "Why choose us"),
  description: t(
    "Wir schaffen moderne Wohnprojekte in grüner Umgebung — mit Blick auf Alltagskomfort, Architektur und Ausführungsqualität.",
    "We create modern developments in green surroundings — focused on everyday comfort, architecture and build quality.",
  ),
  items: [
    { icon: "ShieldCheck", title: t("Vertrauen und Zuverlässigkeit", "Trust and reliability"), description: t("Seit zehn Jahren stehen wir für Verlässlichkeit, Transparenz und eine partnerschaftliche Zusammenarbeit. Ohne einen einzigen Rechtsstreit.", "For ten years we have stood for reliability, transparency and partnership. Without a single legal dispute.") },
    { icon: "Award", title: t("Erfahrung", "Experience"), description: t("Langjährige Erfahrung, hohe Fachkompetenz und eine persönliche Betreuung ermöglichen eine effiziente und zuverlässige Umsetzung unserer Projekte.", "Long-standing experience, deep expertise and personal support enable the efficient and reliable delivery of our projects.") },
    { icon: "Gem", title: t("Qualität", "Quality"), description: t("Wir entwickeln moderne Wohnprojekte in naturnaher Umgebung und legen besonderen Wert auf Wohnkomfort, architektonische Ästhetik und höchste Bauqualität.", "We develop modern residential projects in natural surroundings, with particular emphasis on living comfort, architectural aesthetics and the highest build quality.") },
    { icon: "MapPin", title: t("Attraktive Lage", "Attractive location"), description: t("Unsere Standorte werden mit großer Sorgfalt ausgewählt. Sie verbinden die Ruhe des Wohnens im Grünen mit einer ausgezeichneten Anbindung an die städtische Infrastruktur.", "Our locations are selected with great care. They combine the calm of living amid greenery with excellent access to urban infrastructure.") },
    { icon: "Home", title: t("Privater Wohnbereich", "Private living space"), description: t("Jede Wohneinheit verfügt über ein eigenes Grundstück, das zusätzlichen Freiraum für Erholung, Familie und Freizeit bietet.", "Every home has its own plot, offering additional space for relaxation, family and leisure.") },
    { icon: "Trees", title: t("Leben im Grünen", "Living amid greenery"), description: t("Unsere Projekte entstehen in ruhigen Wohnlagen in der Nähe von Wäldern, Seen und Wasserlandschaften. Ein idealer Ort für Familien mit Kindern und alle, die Ruhe, frische Luft und Weite schätzen.", "Our projects are set in quiet residential areas near forests, lakes and waterways. An ideal place for families with children and anyone who values calm, fresh air and open space.") },
    { icon: "Settings", title: t("Komfort und Funktionalität", "Comfort and functionality"), description: t("Durchdachte Grundrisse, Stellplätze direkt am Haus und moderne technische Lösungen sorgen für ein komfortables und funktionales Wohnen im Alltag.", "Thoughtful layouts, parking right by the house and modern technical solutions ensure comfortable, functional everyday living.") },
  ],
}

const DEFAULT_DISTINGUISHES = {
  eyebrow: t("Unser Angebot", "Our offer"),
  heading: t("Was uns auszeichnet", "What sets us apart"),
  description: t(
    "Wir legen Wert auf jedes Detail – von der Auswahl hochwertiger Materialien bis hin zur individuellen Planung und sorgfältigen Ausführung jedes einzelnen Hauses.",
    "We care about every detail — from material selection to individual planning.",
  ),
  items: [
    { icon: "Layers", title: t("Handgeformte Ziegel", "Hand-formed bricks"), description: t("Für unsere Fassaden verwenden wir exklusive handgeformte Ziegel, bei denen jeder Stein eine individuelle Struktur und Oberfläche aufweist. Dadurch erhält jedes Gebäude seinen eigenen Charakter und eine zeitlose, hochwertige Optik. Neben ihrer besonderen Ästhetik überzeugen diese Ziegel durch ihre Langlebigkeit und Widerstandsfähigkeit.", "For our facades we use exclusive hand-formed bricks in which every stone has an individual structure and surface. This gives each building its own character and a timeless, high-quality look. Beyond their distinctive aesthetics, these bricks impress with their durability and resilience.") },
    { icon: "PenLine", title: t("Individuelle Planung", "Individual planning"), description: t("Wir realisieren ausschließlich eigene Projekte auf unseren eigenen Grundstücken. Solange sich das Bauvorhaben in der Planungs- oder Bauphase befindet, haben Käufer die Möglichkeit, den Grundriss an ihre persönlichen Bedürfnisse und ihren Lebensstil anzupassen.", "We build exclusively our own projects on our own plots. As long as the project is in the planning or construction phase, buyers can adapt the floor plan to their personal needs and lifestyle.") },
    { icon: "ArrowUpToLine", title: t("Raumhöhen bis zu 6 Metern", "Ceiling heights of up to 6 metres"), description: t("Auf Wunsch realisieren wir Wohnbereiche mit Deckenhöhen von bis zu sechs Metern. Diese architektonische Lösung ermöglicht den Einbau von Panoramafenstern, lässt die Räume mit Tageslicht durchfluten und schafft ein Gefühl von Großzügigkeit, Behaglichkeit und moderner Eleganz.", "On request we create living areas with ceiling heights of up to six metres. This architectural solution allows for panoramic windows, floods the rooms with daylight and creates a sense of spaciousness, comfort and modern elegance.") },
    { icon: "KeyRound", title: t("Schlüsselfertige Innenausstattung", "Turnkey interiors"), description: t("Wir realisieren schlüsselfertige Innenausstattungen, die bezugsfertig übergeben werden. Funktionale Grundrisse, hochwertige Materialien und ein durchdachtes Gestaltungskonzept schaffen Wohnräume, die Komfort, Ästhetik und Alltagstauglichkeit miteinander verbinden.", "We deliver turnkey interiors ready to move into. Functional layouts, high-quality materials and a considered design concept create living spaces that combine comfort, aesthetics and everyday practicality.") },
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
  heading: t("Wie kaufen Sie Ihre Traumimmobilie?", "How to buy your dream home"),
  steps: [
    t("Kontakt mit unserem Vertrieb aufnehmen und einen Termin auf der Baustelle vereinbaren.", "Contact our sales team and arrange an appointment on site."),
    t("Besichtigung des Projekts und Beratung.", "Viewing of the project and consultation."),
    t("Beratung durch einen Finanzierungsexperten.*", "Consultation with a financing expert.*"),
    t("Vertragsunterzeichnung.", "Signing of the contract."),
    t("Übergabe der Immobilie.", "Handover of the property."),
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
    heading: t("Wer wir sind", "Who we are"),
    paragraphs: [
      t(
        "Als Projektentwickler möchten wir unseren Kunden genau das bieten, was wir selbst von einem Bauträger erwarten würden: transparente und sichere Abläufe, hochwertige Baumaterialien sowie attraktive Preise.",
        "As a property developer, we want to offer our customers exactly what we would expect from a developer ourselves: transparent and secure processes, high-quality building materials and attractive prices.",
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
      primaryCta: cta("hero", "primary", DEFAULT_HERO.primaryCta, "#verkauf"),
      secondaryCta: cta("hero", "secondary", DEFAULT_HERO.secondaryCta, "#unternehmen"),
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
