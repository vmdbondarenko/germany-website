import Link from "next/link"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CityMap } from "@/components/lokalizacja/city-map"
import { loadLokalizacjaData } from "@/lib/lokalizacja-points"
import { loadHeaderCities } from "@/lib/locations"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/json-ld"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  alternates: { canonical: "/lokalizacja" },
}

export default async function LokalizacjaPage() {
  const [{ cities, points }, headerCities] = await Promise.all([
    loadLokalizacjaData(),
    loadHeaderCities(),
  ])
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined

  const breadcrumb = breadcrumbSchema([
    { name: "Domy jednorodzinne", path: "/" },
    { name: "Lokalizacje inwestycji", path: "/lokalizacja" },
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
              Lokalizacje inwestycji
            </span>
          </nav>

          <h1 className="text-3xl lg:text-4xl font-bold mb-2" style={{ color: "#3E1718" }}>
            Lokalizacje inwestycji
          </h1>
          <p className="text-muted-foreground mb-8">
            Znajdź nasze inwestycje na mapie w wybranym mieście.
          </p>

          <CityMap apiKey={apiKey} mapId={mapId} cities={cities} points={points} />
        </div>
      </main>
      <Footer />
    </>
  )
}
