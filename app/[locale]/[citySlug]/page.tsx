import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CityMap } from "@/components/lokalizacja/city-map"
import { prisma } from "@/lib/prisma"
import { loadLokalizacjaData } from "@/lib/lokalizacja-points"
import { loadHeaderCities } from "@/lib/locations"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/json-ld"
import { LOCATION_COPY } from "@/lib/seo/landing-copy"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string }>
}): Promise<Metadata> {
  const { citySlug } = await params
  const location = await prisma.location.findUnique({ where: { slug: citySlug }, select: { name: true } })
  if (!location) return { alternates: { canonical: `/${citySlug}` } }

  // Authored SEO copy (spreadsheet) wins when present; otherwise fall back to
  // the generic per-location title/description.
  const copy = LOCATION_COPY[citySlug]
  const title = copy?.title ?? `${location.name} | Jednopiętrowa Warszawa`
  const description = copy?.description ?? `${location.name} — sprawdź nasze inwestycje na mapie i wybierz dom idealny dla siebie.`
  return {
    title,
    description,
    alternates: { canonical: `/${citySlug}` },
    openGraph: { title, description, url: `/${citySlug}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function CityLandingPage({
  params,
}: {
  params: Promise<{ citySlug: string }>
}) {
  const { citySlug } = await params

  const location = await prisma.location.findUnique({ where: { slug: citySlug } })
  if (!location) notFound()

  // Authored H1 (spreadsheet) wins when present; otherwise the location name.
  const h1 = LOCATION_COPY[citySlug]?.h1 ?? location.name

  const [{ cities, points }, headerCities] = await Promise.all([
    loadLokalizacjaData(),
    loadHeaderCities(),
  ])
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined

  const breadcrumb = breadcrumbSchema([
    { name: "Domy jednorodzinne", path: "/" },
    { name: location.name, path: `/${citySlug}` },
  ])

  return (
    <>
      <JsonLd schema={breadcrumb} />
      <Header cities={headerCities} />
      <main className="pt-20 min-h-screen bg-background">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-muted-foreground mb-8"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Domy jednorodzinne</span>
            </Link>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground" aria-current="page">
              {location.name}
            </span>
          </nav>

          <h1 className="text-3xl lg:text-4xl font-bold mb-2" style={{ color: "#3E1718" }}>
            {h1}
          </h1>
          <p className="text-muted-foreground mb-8">
            Znajdź nasze inwestycje na mapie i wybierz dom idealny dla siebie.
          </p>

          <CityMap
            apiKey={apiKey}
            mapId={mapId}
            cities={cities}
            points={points}
            lockedCitySlug={citySlug}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
