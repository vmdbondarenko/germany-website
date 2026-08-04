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
  // Background photo (shared DE/EN) — HomeSection.imageUrl overrides this.
  image: "/images/hero-main.jpg",
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
    ctaHref: "#kontakt",
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

// ── About-page blocks (Phase 2 Group A) — reused via HomeSection/HomeSectionItem.
// Brick colors for the value cards are presentational and stay in the component.

export const DEFAULT_STATS: { value: string; label: LocalizedText }[] = [
  { value: "10+", label: t("Jahre Erfahrung", "years of experience") },
  { value: "900+", label: t("gebaute Häuser", "houses built") },
  { value: "96 %", label: t("der Bauprojekte termingerecht übergeben", "of construction projects delivered on time") },
]

export const DEFAULT_VALUES = {
  eyebrow: t("Unsere Werte", "Our values"),
  heading: t("Das Fundament unseres Handelns", "The foundation of what we do"),
  cards: [
    { title: t("Unsere Mission", "Our mission"), description: t("Wir sind überzeugt, dass ein eigenes Haus oder eine Wohnung mit eigenem Grundstück kein unerreichbarer Luxus sein sollte, sondern eine realistische Möglichkeit für viele Menschen. Unser Anspruch ist es, hochwertigen Wohnraum zu schaffen und das Vertrauen unserer Kunden durch Qualität, Transparenz und Verlässlichkeit zu gewinnen. Der größte Maßstab unseres Erfolgs sind zufriedene Eigentümer.", "We are convinced that owning a house or an apartment with its own plot of land should not be an unattainable luxury but a realistic option for many people. Our aim is to create high-quality living space and to earn our customers' trust through quality, transparency and reliability. The greatest measure of our success is satisfied owners.") },
    { title: t("Unsere Vision", "Our vision"), description: t("Wir möchten unseren Kunden genau das bieten, was wir selbst von einem Projektentwickler erwarten würden: sichere und transparente Prozesse, hochwertige Baumaterialien sowie ein überzeugendes Preis-Leistungs-Verhältnis.", "We want to offer our customers exactly what we would expect from a property developer ourselves: secure and transparent processes, high-quality building materials and a compelling price-performance ratio.") },
    { title: t("Unsere Strategie", "Our strategy"), description: t("Wir setzen auf langfristige Kundenbeziehungen und effiziente und termingerechte Umsetzung unserer Projekte. Dabei legen wir großen Wert auf Termintreue, Qualität und eine sorgfältige Planung. So entstehen Wohnräume, die Komfort, Funktionalität und zeitlose Architektur miteinander verbinden.", "We focus on long-term customer relationships and the efficient, on-time delivery of our projects. We place great value on meeting deadlines, quality and careful planning. This creates living spaces that combine comfort, functionality and timeless architecture.") },
    { title: t("Unser Stil", "Our style"), description: t("Ein charakteristisches Merkmal unserer Häuser ist das Fassadenmauerwerk im bayerischen Stil. Die unterschiedlichen Farbtöne der Ziegel verleihen jedem Gebäude eine individuelle Ausstrahlung und schaffen ein harmonisches Gesamtbild, das auch über viele Jahre hinweg seinen zeitlosen Charakter bewahrt.", "A characteristic feature of our houses is the Bavarian-style facade brickwork. The varying shades of the bricks give each building an individual character and create a harmonious overall look that retains its timeless character over many years.") },
  ],
}

export const DEFAULT_BAUWEISE = {
  heading: t("Bauweise und Entwicklung", "Construction and development"),
  ctaLabel: t("Kontakt aufnehmen", "Get in touch"),
  ctaHref: "#kontakt",
  // Section photos (shared DE/EN) — HomeSection.imageUrl / imageUrl2 override these.
  image1: "/images/tech-house-main.jpg",
  image2: "/images/tech-houses-twin.jpg",
  paragraphs: [
    t("Wir entwickeln unsere Bauweise kontinuierlich weiter und verbinden moderne Technologien mit traditioneller Handwerkskunst. Unser Ziel ist es, nicht nur komfortable Häuser zu schaffen, sondern Lebensräume, in denen Träume Wirklichkeit werden können. Dabei begleiten wir unsere Kunden zuverlässig durch alle Phasen der Projektentwicklung – von der Planung bis zur Fertigstellung.", "We continually refine our construction methods, combining modern technology with traditional craftsmanship. Our goal is not only to create comfortable houses but living spaces in which dreams can come true. We reliably accompany our customers through every phase of the development — from planning to completion."),
    t("Die Idee, Häuser im Stil des Bayerischen Mauerwerks mit handgeformten Ziegeln zu errichten, entstand aus dem Wunsch, Wohnraum mit einem unverwechselbaren architektonischen Charakter zu schaffen. Die Kombination aus exklusiven Materialien und sorgfältiger Ausführung verleiht jedem Gebäude eine individuelle Ausstrahlung und eine dauerhaft hohe Wertigkeit.", "The idea of building houses in the style of Bavarian brickwork with hand-formed bricks arose from the desire to create living space with a distinctive architectural character. The combination of exclusive materials and careful execution gives each building an individual character and lasting high value."),
    t("Unter der Marke „Einstöckiges Kiew“ entwickelte sich unser Unternehmen innerhalb weniger Jahre zu einem der führenden Anbieter im Segment hochwertiger Einfamilienhäuser in der Ukraine. Diese Entwicklung bildete die Grundlage für unsere Expansion nach Polen.", "Under the brand “Einstöckiges Kiew”, our company became one of the leading providers in the high-quality single-family home segment in Ukraine within a few years. This development formed the basis for our expansion into Poland."),
    t("Mit „Einstöckige Warschau“ konnten wir dank unserer langjährigen Erfahrung, unseres hohen Qualitätsanspruchs und einer konsequenten Kundenorientierung das Vertrauen zahlreicher Kunden gewinnen.", "With “Einstöckige Warschau”, thanks to our many years of experience, our high quality standards and a consistent customer focus, we won the trust of numerous customers."),
    t("Heute setzen wir diesen Weg in Deutschland fort. Mit unserer Erfahrung aus mehreren europäischen Märkten, hohen Qualitätsstandards und einer klaren architektonischen Handschrift entwickeln wir Wohnprojekte, die Ästhetik, Langlebigkeit und moderne Bauqualität auf überzeugende Weise miteinander verbinden.", "Today we are continuing this path in Germany. With our experience from several European markets, high quality standards and a clear architectural signature, we develop residential projects that convincingly combine aesthetics, durability and modern build quality."),
  ],
}

// First real investment presented in full on the homepage, directly after the
// Bauweise section. Reuses HomeSection "erste-bayerische" (eyebrow = project
// name, heading, description = intro) + kind-discriminated HomeSectionItem rows
// (hero / wide / block:* / travel / gallery). All images fall back to existing
// in-repo photos (thematically the Bavarian "bawarska" set) until real project
// photos are uploaded in admin.
export const DEFAULT_ERSTE_BAYERISCHE = {
  projectName: t("Erste Bayerische", "Erste Bayerische"),
  heading: t(
    "Wohnen im Grünen – nur wenige Minuten von Berlin entfernt",
    "Living surrounded by nature — just minutes from Berlin",
  ),
  intro: t(
    "Unser neues Wohnprojekt „Erste Bayerische“ entsteht in Königs Wusterhausen, Ortsteil Niederlehme – einer attraktiven Wohnlage im südöstlichen Berliner Umland. Das moderne Doppelhaus verbindet naturnahes Wohnen mit einer hervorragenden Anbindung an die Hauptstadt.",
    "Our new residential project “Erste Bayerische” is being built in Königs Wusterhausen, in the Niederlehme district — an attractive residential location in the south-eastern surroundings of Berlin. The modern semi-detached house combines living close to nature with excellent connections to the capital.",
  ),
  hero: {
    image: "/images/bawarska-hero.jpg",
    alt: t(
      "Modernes Doppelhaus im bayerischen Stil des Projekts Erste Bayerische",
      "Modern Bavarian-style semi-detached house of the Erste Bayerische project",
    ),
  },
  wide: {
    image: "/images/bawarska-przestrzen-wide.jpg",
    alt: t(
      "Grüne Umgebung mit Seen und Wäldern rund um Niederlehme",
      "Green surroundings with lakes and forests around Niederlehme",
    ),
  },
  blocks: {
    location: {
      title: t("Grüne Ruhe mit bester Anbindung", "Green calm with excellent connections"),
      body: t(
        "Hier genießen Sie die Ruhe einer grünen Umgebung, ohne auf die Vorteile einer gut ausgebauten Infrastruktur verzichten zu müssen. Dank der Nähe zur Autobahn A10 und der guten Verkehrsanbindung dauert die Fahrt nach Berlin nur wenige Minuten – ideal für Berufspendler und alle, die die Nähe zur Metropole mit einer hohen Wohnqualität verbinden möchten.",
        "Here you enjoy the calm of green surroundings without giving up the advantages of well-developed infrastructure. Thanks to the proximity to the A10 motorway and good transport connections, the drive to Berlin takes only a few minutes — ideal for commuters and everyone who wants to combine closeness to the metropolis with a high quality of living.",
      ),
      image: "/images/bawarska-gallery-1.jpg",
      alt: t(
        "Wohnhaus mit gepflegtem Garten in ruhiger Lage",
        "Residential house with a well-kept garden in a quiet location",
      ),
    },
    nature: {
      title: t("Seen, Wälder und die Dahme", "Lakes, forests and the Dahme"),
      body: t(
        "Die Umgebung zeichnet sich durch zahlreiche Seen, die Wasserlandschaft der Dahme sowie weitläufige Waldgebiete aus. Spazier- und Radwege laden zu vielfältigen Freizeitaktivitäten direkt vor der Haustür ein.",
        "The surroundings are characterised by numerous lakes, the water landscape of the Dahme river and expansive forest areas. Walking and cycling paths invite you to a wide range of leisure activities right on your doorstep.",
      ),
      image: "/images/bawarska-gallery-2.jpg",
      alt: t(
        "Wald- und Wasserlandschaft der Dahme",
        "Forest and water landscape of the Dahme",
      ),
    },
    see: {
      title: t("Zeuthener See & Marina", "Zeuthener See & marina"),
      body: t(
        "Nur wenige Minuten entfernt liegt der Zeuthener See mit seiner modernen Marina und Liegeplätzen für Segel- und Motorboote – ein attraktiver Ort für Erholung und Wassersport.",
        "Just a few minutes away lies Zeuthener See with its modern marina and berths for sailing and motor boats — an attractive place for recreation and water sports.",
      ),
      image: "/images/bawarska-przestrzen.jpg",
      alt: t(
        "Marina am Zeuthener See mit Bootsliegeplätzen",
        "Marina at Zeuthener See with boat berths",
      ),
    },
    closing: {
      title: t("", ""),
      body: t(
        "So verbindet das Projekt eine ruhige Wohnlage im Grünen mit einer ausgezeichneten Erreichbarkeit Berlins und einer modernen Infrastruktur.",
        "In this way, the project combines a quiet residential location surrounded by greenery with excellent access to Berlin and a modern infrastructure.",
      ),
    },
  },
  travelHeading: t(
    "Auch im Alltag profitieren Sie von kurzen Wegen",
    "Short distances in everyday life, too",
  ),
  travel: [
    { icon: "Train", title: t("Bahnhof Niederlehme", "Niederlehme railway station"), meta: t("ca. 4–5 Minuten mit dem Auto", "approx. 4–5 minutes by car") },
    { icon: "Route", title: t("Anschluss an die Autobahn A10", "A10 motorway access"), meta: t("ca. 2–3 Minuten", "approx. 2–3 minutes") },
    { icon: "ShoppingCart", title: t("Supermärkte und Einkaufsmöglichkeiten", "Supermarkets and shopping"), meta: t("in unmittelbarer Nähe", "in the immediate vicinity") },
    { icon: "Plane", title: t("Flughafen Berlin Brandenburg (BER)", "Berlin Brandenburg Airport (BER)"), meta: t("ca. 20–25 Minuten mit dem Auto", "approx. 20–25 minutes by car") },
  ],
  gallery: [
    { image: "/images/bawarska-gallery-3.jpg", alt: t("Fassade im bayerischen Mauerwerksstil", "Facade in Bavarian brickwork style") },
    { image: "/images/bawarska-gallery-4.jpg", alt: t("Außenansicht des Wohnprojekts Erste Bayerische", "Exterior of the Erste Bayerische residential project") },
    { image: "/images/bawarska-gallery-5.jpg", alt: t("Wohnumgebung im Grünen bei Niederlehme", "Green residential setting near Niederlehme") },
  ],
}

export const DEFAULT_UPCOMING = {
  line1: t("Bald beginnen wir mit dem Bau", "We will soon begin building"),
  line2: t("weiterer Projekte!", "further projects!"),
  subtitle: t("Neue Standorte, neue Entwicklungsphasen und weitere Projekte an sorgfältig ausgewählten Orten.", "New locations, new development phases and further projects in carefully selected places."),
}

export const DEFAULT_NEW_CITIES = {
  heading: t("Wir bauen bald in weiteren Städten!", "We will soon be building in more cities!"),
  subtitle: t("Wir erweitern unsere Tätigkeit auf neue Märkte", "We are expanding into new markets"),
  noteTitle: t("Häuser in Kiew, Lwiw und Baku", "Houses in Kyiv, Lviv and Baku"),
  noteText: t("In unserem Angebot finden Sie außerdem freistehende Häuser, Doppelhäuser und Reihenhäuser in Kiew, Lwiw und Baku!", "Our portfolio also includes detached houses, semi-detached houses and terraced houses in Kyiv, Lviv and Baku!"),
}

// Presentational brick colors for the value cards (index-aligned with cards).
export const VALUE_BRICK_COLORS = ["#6E2E2A", "#5A2A1C", "#3E1718", "#120A0A"]

// ── Team section (heading/description reuse HomeSection id "team"; members reuse
// the TeamMember model). Fallback used until admin edits / DB is seeded.
export const DEFAULT_TEAM = {
  heading: t("Wer wir sind?", "Who we are?"),
  description: t(
    "Als Team möchten wir unseren Kunden genau das bieten, was wir selbst von einem Bauträger erwarten würden: sichere Abläufe, hochwertige Baumaterialien und attraktive Preise.",
    "As a team, we want to offer our customers exactly what we would expect from a developer ourselves: secure processes, high-quality building materials and attractive prices.",
  ),
}

// ── "Seit unserer Gründung" — figures by period (reuses HomeSection id
// "since-founding" + one HomeSectionItem per period; item.description holds the
// two country lines separated by a newline).
export const DEFAULT_SINCE_FOUNDING = {
  heading: t("Seit unserer Gründung", "Since our founding"),
  periods: [
    {
      title: t("Seit Unternehmensgründung", "Since the company was founded"),
      description: t(
        "Ukraine: 820 Familien haben sich für ein Haus von uns entschieden.\nPolen: 83 Familien haben sich für ein Haus von uns entschieden.",
        "Ukraine: 820 families have chosen a home from us.\nPoland: 83 families have chosen a home from us.",
      ),
    },
    {
      title: t("Erstes Halbjahr 2026 (1. und 2. Quartal)", "First half of 2026 (Q1 and Q2)"),
      description: t(
        "Ukraine: 91 Familien haben sich für ein Haus von uns entschieden.\nPolen: 34 Familien haben sich für ein Haus von uns entschieden.",
        "Ukraine: 91 families have chosen a home from us.\nPoland: 34 families have chosen a home from us.",
      ),
    },
    {
      title: t("Geschäftsjahr 2025", "Financial year 2025"),
      description: t(
        "Ukraine: 188 Familien haben sich für ein Haus von uns entschieden.\nPolen: 19 Familien haben sich für ein Haus von uns entschieden.",
        "Ukraine: 188 families have chosen a home from us.\nPoland: 19 families have chosen a home from us.",
      ),
    },
  ],
}

export type TeamMemberDefault = { name: string; role: LocalizedText; image: string; order: number }

export const DEFAULT_TEAM_MEMBERS: TeamMemberDefault[] = [
  { name: "Serhii Mohylenko", role: t("Bauträger, Investor", "Developer, Investor"), image: "/team/Sergiej Mogylenko.jpg", order: 0 },
  { name: "Maryna Monastyretska", role: t("Vorstandsmitglied, Geschäftsführerin", "Board member, Managing Director"), image: "/team/Maryna Monastyretska.jpg", order: 1 },
  { name: "Vitalina Kalinichenko", role: t("Stellvertretende Geschäftsführerin", "Deputy Managing Director"), image: "/team/Vitalina Kalinichenko.jpg", order: 2 },
  { name: "Kristina Stepanchuk", role: t("Office Manager", "Office Manager"), image: "/team/KristinaStepanchuk.jpg", order: 3 },
  { name: "Olena Bilan", role: t("Niederlassungsleiterin Breslau", "Branch Manager Wrocław"), image: "/team/Olena Bilan.jpg", order: 4 },
]
