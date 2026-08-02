// ─────────────────────────────────────────────────────────────────────────────
// Shared content defaults — the SINGLE SOURCE for the homepage section copy and
// the About company identity shown before an admin has entered anything.
//
// Pure data only: NO prisma, NO React, NO "@/" path aliases — so this module can
// be imported by the server getter (lib/home-content.ts), the client component
// (components/about.tsx) AND the standalone seed script (scripts/seed-home-content.ts,
// via a relative import) without any resolver/runtime coupling. Keeping it here
// means the seed can never drift from what the site actually renders.
// ─────────────────────────────────────────────────────────────────────────────

export type LocalizedText = { de: string; en: string }
export type LocalizedItem = { icon: string; title: LocalizedText; description: LocalizedText }

export const t = (de: string, en: string): LocalizedText => ({ de, en })

// Hero section anchor targets (kept here so the getter and the seed agree).
export const HERO_PRIMARY_HREF = "#verkauf"
export const HERO_SECONDARY_HREF = "#unternehmen"

export const DEFAULT_HERO = {
  eyebrow: t("Immobilienentwickler", "Property developer"),
  title: t("Neue Häuser direkt vom Bauträger zum Verkauf", "New homes from the developer"),
  subtitle: t(
    "Seit über 10 Jahren bauen wir einzigartige Immobilien im charakteristischen Stil des Bayerischen Mauerwerks aus handgeformten Ziegeln.",
    "We build high-quality homes with character — thoughtful layouts, careful craftsmanship and a place to feel at home.",
  ),
  primaryCta: t("Projekte ansehen", "View projects"),
  secondaryCta: t("Über uns", "About us"),
}

export const DEFAULT_PROCESS = {
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

export const DEFAULT_DISTINGUISHES = {
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

export const DEFAULT_SERVICES = {
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

export const DEFAULT_INTERIOR = {
  heading: t("Innenräume schlüsselfertig", "Turnkey interiors"),
  description: t(
    "Wir gestalten bezugsfertige Innenräume — funktional, ästhetisch und bis ins Detail durchdacht.",
    "We create move-in-ready interiors — functional, elegant and considered down to the detail.",
  ),
}

export const DEFAULT_BUYING = {
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

// ── About section (company identity shown until an admin overrides it) ────────
export const DEFAULT_COMPANY_NAME = "Projektentwicklung Einstöckiges Berlin GmbH"

export const DEFAULT_ABOUT_DESCRIPTION = [
  "Seit 2026 sind wir unter dem Namen Projektentwicklung Einstöckiges Berlin GmbH als Projektentwickler in Berlin tätig. Dieser Schritt ist die konsequente Fortsetzung eines langjährigen Weges, der auf Erfahrung, Qualität und dem Vertrauen unserer Kunden basiert.",
  "Unsere Geschichte begann 2016 in der Ukraine. Unter dem Namen „Einstöckiges Kiew“ realisierten wir hochwertige Einfamilienhäuser aus Ziegeln im charakteristischen Stil des Bayerischen Mauerwerks. Ein besonderes Merkmal unserer Projekte ist der Einsatz exklusiver handgeformter Ziegel. Diese werden heute ausschließlich für unsere Bauvorhaben produziert und direkt nach dem Brennvorgang aus dem Ziegelwerk geliefert. So können wir eine gleichbleibend hohe Qualität und die unverwechselbare Optik jedes einzelnen Hauses gewährleisten.",
  "Ausgehend von Kiew erweiterten wir unsere Tätigkeit kontinuierlich und realisierten erfolgreich Projekte auch in Lwiw, Tscherniwzi und Dnipro.",
  "Im Jahr 2022 traten wir unter dem Namen „Einstöckige Warschau“ in den europäischen Markt ein. Den Auftakt bildete ein Doppelhaus in einem Vorort der polnischen Hauptstadt. In den darauffolgenden vier Jahren wuchs das Unternehmen deutlich und erweiterte seine Projektentwicklung auf weitere Städte wie Breslau, Krakau und Posen.",
  "2025 erschlossen wir einen weiteren Markt und begannen mit der Entwicklung neuer Wohnprojekte im Umland von Baku in Aserbaidschan. Damit setzten wir unseren internationalen Wachstumskurs konsequent fort.",
  "Heute entwickeln und realisieren wir erfolgreich Projekte in allen Ländern, in denen wir vertreten sind.",
  "Unabhängig vom Land folgen alle unsere Häuser derselben Philosophie: zeitlose Architektur, hochwertige Materialien, durchdachte Grundrisse und eine präzise Ausführung bis ins kleinste Detail.",
].join("\n\n")

// Fallback company photos (local /public paths) used until admin uploads photos.
export const DEFAULT_ABOUT_PHOTOS = [
  "/images/house-main.jpg",
  "/images/house-balcony.jpg",
  "/images/house-terrace.jpg",
]
