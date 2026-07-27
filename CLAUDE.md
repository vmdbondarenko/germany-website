# Project: Germany Website (German-branch real-estate developer site)

Bilingual (German default, English switchable) marketing + CMS site for the
company's **German branch**. Forked from the Polish `v0-real-estate-developer-website`
and adapted: the dane.gov.pl reporting layer was stripped, the whole site was made
per-locale, and all homepage/content is admin-editable.

**German (`de`) is the default locale and renders prefix-free at `/`. English is
served under `/en`.** All public-facing text is either in a message catalog or a
per-locale DB field. Content currently shipped is **placeholder** — real German
company identity, contact details, legal text and the first project are entered by
the client in `/admin`.

## Tech stack

- **Next.js 16** (App Router), **React 19**, TypeScript
- **Prisma 5** → **Postgres (Neon)** — `prisma/schema.prisma`
- **Vercel Blob** for uploads (`@vercel/blob`)
- **Resend** for the contact email (`app/api/contact/route.ts`)
- **Google Maps** via `@vis.gl/react-google-maps`
- **next-intl 4** for i18n
- Tailwind v4, shadcn/ui (Radix), lucide-react, next-themes
- Cookie-based admin auth (`ADMIN_PASSWORD`, bcrypt, rate-limited)

## Commands

```bash
npm install
npm run dev                 # next dev
npx tsc --noEmit            # THE type gate — see note below
# Prisma / next build need env from .env.local (see gotcha):
npx dotenv-cli -e .env.local -- npx next build
npx dotenv-cli -e .env.local -- npx prisma migrate dev --name <name>
npx dotenv-cli -e .env.local -- npx prisma migrate deploy
```

### Critical gotchas
- **`.env.local` + Prisma/Next CLI**: the Neon connection strings contain `&`, which
  breaks shell `source`, and Prisma does **not** auto-load `.env.local` (only `.env`).
  Always run Prisma/`next build` via **`npx dotenv-cli -e .env.local -- <cmd>`**.
- **`next.config.mjs` sets `typescript.ignoreBuildErrors: true`** — `next build` will
  NOT fail on type errors. **Run `npx tsc --noEmit` as the real type gate** before
  trusting a green build. (`.next/types/validator.ts` may show stale errors for
  just-deleted routes; ignore those, a rebuild regenerates them.)
- **Empty DB**: this is a fresh DB. Homepage components must tolerate zero rows —
  guard `array[0]` access (see `ArchitectureSlideshow`, `About`).

## Environment (`.env.local`)

Present: Postgres/Neon (`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, …),
`BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `ADMIN_PASSWORD`, `SESSION_SECRET`,
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

- **`SESSION_SECRET` is REQUIRED** — `lib/auth.ts` throws if unset or <16 chars (signs
  the admin session cookie). Must be set locally **and** in Vercel or admin login breaks.
- `MANAGER_PASSWORD` (optional) enables a limited "manager" role login.

Still to fill: `NEXT_PUBLIC_BASE_URL` (used by sitemap/robots/canonicals — currently
`http://localhost:3000`), `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`, and optionally
`CONTACT_FROM` / `CONTACT_RECIPIENTS` (contact-form email; `CONTACT_FROM` must be a
verified Resend sender — falls back to `onboarding@resend.dev` for dev),
`GOOGLE_MAPS_API_KEY` (server-side geocoding in `lib/geocode.ts`).

## Deployment (Vercel) & Git

- **Live:** `https://germany-website-tau.vercel.app` (Vercel project `germany-website`,
  team `vmdbondarenko-3115s-projects`). Auto-deploys from GitHub `main`.
- **Repo:** `github.com/vmdbondarenko/germany-website`. The build runs
  `prisma generate && node scripts/migrate-deploy-with-retry.mjs && next build` — so
  **migrations run at build time** and the DB env vars must exist in Vercel.
- **`vercel.json` pins `"framework": "nextjs"`** — do NOT remove it. The project was
  imported when the repo was an empty README, so Vercel's auto-detected framework is
  `null` ("Other"), which serves the Next.js build as static → 404s everywhere. The pin
  forces the Next.js builder.
- **Package manager: npm only.** `pnpm-lock.yaml` was deleted (it went stale and broke
  Vercel's frozen pnpm install). Keep `package-lock.json` in sync; don't reintroduce a
  pnpm lockfile.
- **Git remote / SSH:** the machine's default GitHub key is another account
  (`capevbondarenko`, no write access). The remote is set to `git@github:…` (the
  `~/.ssh/config` alias `Host github` → key `~/.ssh/id_vmd` = `vmdbondarenko`). If a push
  is denied, the remote got reset to `git@github.com:…` — put it back to the `github` alias.
- Commit messages end with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## i18n architecture (read this before touching routing)

- **Config**: `i18n/routing.ts` (`locales: ['de','en']`, `defaultLocale: 'de'`,
  `localePrefix: 'as-needed'`), `i18n/navigation.ts` (locale-aware `Link`,
  `redirect`, `usePathname`, `useRouter` — **use these, not `next/link`/`next/navigation`,
  in public components**), `i18n/request.ts` (loads the message catalog).
- **Middleware** is `proxy.ts` (Next 16 renamed `middleware` → `proxy`). It composes
  the next-intl middleware (public routes) with the admin auth gate. `/admin` and
  `/api/admin` are **never localized**; other `/api` is passed through.
- **Layouts**: `app/layout.tsx` (root) renders `<html lang={await getLocale()}>` **and
  the `NextIntlClientProvider`** — the provider is at the ROOT so root-level client
  components (`CookieConsent`, etc.) have translation context. `app/[locale]/layout.tsx`
  validates the locale + `setRequestLocale`.
  - ⚠️ Any client component that uses `useTranslations` and renders **outside**
    `app/[locale]` (i.e. under the root layout — including all of `/admin`) relies on
    that root provider. Don't remove it.
- **Route layout**:
  - `app/[locale]/…` — all **public** pages (home, `inwestycje`, `aktualnosci`,
    `lokalizacja`, `[citySlug]`, `impressum`, `datenschutz`).
  - `app/admin/…`, `app/api/…`, `app/robots.ts`, `app/sitemap.ts` — at the **root**,
    not localized. Admin URLs are unchanged (`/admin/...`).

### Two ways text is localized

1. **Static UI strings** → `messages/de.json` + `messages/en.json`. Namespaces in use:
   `common`, `meta`, `home`, `nav`, `contact`, `footer`, `cookies`, `legal`, `location`,
   `project`, `news`. Read with `useTranslations(ns)` (client) / `getTranslations(ns)`
   (server/`generateMetadata`).
2. **Admin-managed DB content** → per-locale columns. **The existing column holds the
   German (default) value; a parallel `<field>En` nullable column holds the English
   override.** Resolve with **`pick(base, en, locale)`** from `lib/i18n-content.ts`
   (returns the En override when locale is `en` and it's non-empty, else the German
   base). This pattern is applied to: `Project` (location/description/heroSubtitle/
   additionalInfo), `ProjectSection` (label/heading/description), `SectionItem`
   (title/subtitle/description), `GalleryImage` (alt/label), `NewsPost`
   (title/description), `NewsBlock` (content), `Location` (name), `TeamMember` (role),
   `AboutSection` (companyName/description), `UpcomingInvestment` (title/description/
   status), `NewCity` (city/date).

### Homepage content (fully admin-driven)

The otherwise-hardcoded homepage sections are data-driven via **`HomeSection` /
`HomeSectionItem`** (each text field has a DE + EN column) plus code defaults:
- `lib/home-content.ts` — `getHomeContent(locale)` merges DB overrides over neutral
  German placeholder defaults; typed section shapes consumed by the components.
- Components (`Hero`, `Process`, `Distinguishes`, `Services`, `InteriorShowcase`,
  `BuyingProcess`) are props-driven; `app/[locale]/page.tsx` fetches and threads content.
- Edited at **`/admin/home`** (config-driven editor, DE/EN side-by-side).
- `components/dynamic-icon.tsx` maps admin-entered lucide icon names → components.

#### `/admin/home` ("Startseite") — current state & the "constructor" roadmap
The nav link is still labelled **"Startseite"** (German) while the rest of admin is
English — rename to "Homepage" when convenient (`app/admin/layout.tsx`).

Today the editor manages **text only** for a **fixed set of 8 sections** in fixed order:
hero, process (+items), distinguishes (+items), services (+items), interior, and the
headings for buying / buying-help / investor. Config lives in the `SECTIONS` array in
`app/admin/home/page.tsx`.

**Not yet admin-editable (the gap the client asked to close — a homepage "constructor"):**
- **Images** — hero background, `InteriorShowcase` gallery array, investor logo, and
  per-section images are still hardcoded in the components.
- **Contacts** — header dropdowns / footer / contact section read `lib/contact-info.ts`
  (hardcoded placeholder Polish cities); not in admin.
- **Add / remove / reorder blocks** — sections are fixed; no dynamic block list.
- Some content isn't surfaced (individual buying-process steps, investor paragraphs).

Agreed direction (not built): **Tier 1** = wire images + a contacts model into the
existing editor (biggest practical win, ~1 session). **Tier 2** = a curated block library
(~6–8 typed blocks: Hero/RichText/Image/Gallery/FeatureGrid/CTA/Steps/Contact) with
add/reorder/remove — the real "constructor" (~2–3 sessions). **Tier 3** = full page-builder
with layout/columns/preview across all pages (large). Recommendation was Tier 2.

## Admin

`/admin` (cookie auth via `ADMIN_PASSWORD`; roles `admin` / `manager`, enforced in
`proxy.ts`). Sections: `units`, `companies`, `projects` (+ inline section/gallery
editors), `news`, `locations`, `about` (about + upcoming + cities), `team`, `home`.
Most content APIs `PUT`/`PATCH` by spreading the request body, so adding a new En
column often only needs the admin input to send it (a few routes whitelist fields —
`projects/[id]`, `about-section`, `locations`, `sections` create, `news` — update those
explicitly).

The admin back-office UI is **English** (single language — no i18n; the public site
is the bilingual part). Prices in admin format with `de-DE` / `€`.

## What was removed vs the source

dane.gov.pl reporting is fully gone: no `lib/dane-gov`, `/api/dane-gov`, crons, WP
rewrites, `GeneratedFile`/`MonitorResult` models, or `Company` reporting fields. Dual-use
unit price columns (parking/storage/full price) were kept. `lib/seo/landing-copy.ts`
(PL SEO copy) is now largely unused and can be deleted.

## Conventions

- New translatable DB field → add the base column (German) + a `<field>En` column,
  migrate, resolve via `pick()` on the public read, add a DE/EN input in the relevant
  admin editor, and make sure the admin API persists `<field>En`.
- Public pages/components that link internally use `Link` from `@/i18n/navigation`.
- `generateMetadata` should set `alternates.languages = { de: <path>, en: '/en'+<path> }`
  for hreflang (see homepage, news, lokalizacja, city, `buildProjectMetadata`).
- Legal pages `/impressum` + `/datenschutz` are per-locale with clearly-marked
  placeholders — real text is dropped in later.
