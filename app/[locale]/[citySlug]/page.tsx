import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CityMap } from "@/components/lokalizacja/city-map"
import { prisma } from "@/lib/prisma"
import { pick } from "@/lib/i18n-content"
import type { Locale } from "@/i18n/routing"
import { loadLokalizacjaData } from "@/lib/lokalizacja-points"
import { loadHeaderCities } from "@/lib/locations"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/json-ld"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string }>
}): Promise<Metadata> {
  const { citySlug } = await params
  const locale = (await getLocale()) as Locale
  const location = await prisma.location.findUnique({
    where: { slug: citySlug },
    select: { name: true, nameEn: true },
  })
  if (!location) return { alternates: { canonical: `/${citySlug}` } }

  const t = await getTranslations("location")
  const title = pick(location.name, location.nameEn, locale)
  const description = t("subtitle")
  return {
    title,
    description,
    alternates: {
      canonical: `/${citySlug}`,
      languages: { de: `/${citySlug}`, en: `/en/${citySlug}` },
    },
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
  const locale = (await getLocale()) as Locale
  const t = await getTranslations("location")

  const location = await prisma.location.findUnique({ where: { slug: citySlug } })
  if (!location) notFound()

  const name = pick(location.name, location.nameEn, locale)

  const [{ cities, points }, headerCities] = await Promise.all([
    loadLokalizacjaData(),
    loadHeaderCities(),
  ])
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined

  const breadcrumb = breadcrumbSchema([
    { name: t("home"), path: "/" },
    { name, path: `/${citySlug}` },
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
              <span className="text-sm font-medium">{t("home")}</span>
            </Link>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground" aria-current="page">
              {name}
            </span>
          </nav>

          <h1 className="text-3xl lg:text-4xl font-bold mb-2" style={{ color: "#3E1718" }}>
            {name}
          </h1>
          <p className="text-muted-foreground mb-8">{t("subtitle")}</p>

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
