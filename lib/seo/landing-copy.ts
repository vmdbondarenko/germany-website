// Optional SEO copy overrides (H1 / <title> / meta description).
//
// The Polish source site shipped per-city / per-project copy here (generated
// from a spreadsheet). For the German site the authoritative project SEO is
// derived from the database per locale (see lib/seo/project-meta.ts and each
// page's generateMetadata); these maps are keyed by slug and only provide an
// optional H1 override. The German launch starts with no per-slug overrides —
// add entries here (or, preferably, manage the copy in the DB/admin) as needed.

export type LandingCopy = {
  /** Visible <h1> on the page. */
  h1: string
  /** <title> and og:title (identical by construction). */
  title: string
  /** <meta name="description"> and og:description. */
  description: string
}

/** Homepage ("/"). Currently unused — the homepage metadata comes from the
 *  `meta` message catalog (messages/de.json). Kept for API compatibility. */
export const HOME_COPY: LandingCopy = {
  h1: 'Neue Häuser vom Bauträger',
  title: 'Neue Häuser vom Bauträger | Immobilienentwickler',
  description:
    'Hochwertige Wohnimmobilien vom Bauträger in Berlin und Brandenburg – durchdachte Grundrisse und sorgfältige Verarbeitung.',
}

/** City-hub landing pages, keyed by Location.slug. No German overrides yet. */
export const LOCATION_COPY: Record<string, LandingCopy> = {}

/** Investment pages, keyed by Project.slug. No German overrides yet. */
export const PROJECT_COPY: Record<string, LandingCopy> = {}
