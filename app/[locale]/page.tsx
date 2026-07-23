import { HeaderServer } from "@/components/header-server"
import { Hero } from "@/components/hero"
import { ArchitectureSlideshow } from "@/components/architecture-slideshow"
import { About } from "@/components/about"
import { Investments } from "@/components/investments"
import { CompletedInvestments } from "@/components/completed-investments"
import { CityMap } from "@/components/lokalizacja/city-map"
import { loadLokalizacjaData } from "@/lib/lokalizacja-points"
import { Process } from "@/components/process"
import { Distinguishes } from "@/components/distinguishes"
import { Team } from "@/components/team"
import { Services } from "@/components/services"
import { InteriorShowcase } from "@/components/interior-showcase"
import { BuyingProcess } from "@/components/buying-process"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"
import { NewsScroll } from "@/components/news-scroll"
import { prisma } from "@/lib/prisma"
import { getLocale, getTranslations } from "next-intl/server"
import { getHomeContent } from "@/lib/home-content"
import type { Locale } from "@/i18n/routing"
import { HOME_COPY } from "@/lib/seo/landing-copy"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: HOME_COPY.title,
  description: HOME_COPY.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: HOME_COPY.title,
    description: HOME_COPY.description,
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_COPY.title,
    description: HOME_COPY.description,
  },
}

export default async function HomePage() {
  const locale = (await getLocale()) as Locale
  const home = await getHomeContent(locale)
  const th = await getTranslations("home")
  const mapCopy = { heading: th("mapHeading"), subtitle: th("mapSubtitle") }

  const STATUS_LABELS: Record<string, string> = {
    active: "W sprzedaży",
    planned: "Wkrótce",
    completed: "Zakończona",
  }

  const dbProjects = await prisma.project.findMany({
    where: { published: true },
    orderBy: { createdAt: "asc" },
    include: {
      units: { select: { status: true } },
      sections: {
        where: { type: "key_features", enabled: true },
        include: { items: { orderBy: { order: "asc" } } },
      },
    },
  })

  // Build slideshow slides from published DB projects
  const slideshowSlides = dbProjects
    .filter((p) => p.imageUrl && p.status !== "completed")
    .map((p) => {
      const available = p.units.filter((u) => u.status === "available").length
      const total = p.units.length
      const keyFeatures = p.sections[0]?.items.map((i) => ({ title: i.title, subtitle: i.subtitle })) ?? []
      return {
        image: p.imageUrl!,
        title: p.name,
        address: p.location,
        status: STATUS_LABELS[p.status] || p.status,
        availability: `Pozostało: ${available} / ${total}`,
        href: `/inwestycje/${p.slug}`,
        description: p.description,
        keyFeatures,
      }
    })

  const activeProjects = dbProjects
    .filter((p) => p.status === "active" || p.status === "planned")
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      location: p.location,
      imageUrl: p.imageUrl,
      heroSubtitle: p.heroSubtitle,
      status: p.status,
      description: p.description,
      availableCount: p.units.filter((u) => u.status === "available").length,
      totalCount: p.units.length,
      keyFeatures: p.sections[0]?.items.map((i) => ({ title: i.title, subtitle: i.subtitle })) ?? [],
    }))

  const [lokalizacjaData, upcomingInvestments, newCities, aboutSection, teamMembers] = await Promise.all([
    loadLokalizacjaData(),
    prisma.upcomingInvestment.findMany({ orderBy: { order: 'asc' } }),
    prisma.newCity.findMany({ orderBy: { order: 'asc' } }),
    prisma.aboutSection.findUnique({ where: { id: 'main' } }),
    prisma.teamMember.findMany({ orderBy: { order: 'asc' } }),
  ])
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null
  const mapsMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined

  const completedProjects = dbProjects
    .filter((p) => p.status === "completed")
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      location: p.location,
      imageUrl: p.imageUrl,
      heroSubtitle: p.heroSubtitle,
      description: p.description,
      totalCount: p.units.length,
      keyFeatures: p.sections[0]?.items.map((i) => ({ title: i.title, subtitle: i.subtitle })) ?? [],
    }))

  const newsPosts = await prisma.newsPost.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 10,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverImageUrl: true,
      publishedAt: true,
      createdAt: true,
    },
  })

  return (
    <>
      <HeaderServer />
      <main>
        <Hero content={home.hero} />
        <ArchitectureSlideshow dbSlides={slideshowSlides} />
        <About upcomingInvestments={upcomingInvestments} newCities={newCities} aboutSection={aboutSection} />
        <Investments projects={activeProjects} />
        {lokalizacjaData.points.length > 0 && (
          <section className="py-20 lg:py-32 bg-muted/30">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-16">
                <h2
                  className="font-serif text-3xl lg:text-4xl font-semibold mb-4"
                  style={{ color: "#3E1718" }}
                >
                  {mapCopy.heading}
                </h2>
                <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto">
                  {mapCopy.subtitle}
                </p>
              </div>
              <CityMap apiKey={mapsApiKey} mapId={mapsMapId} cities={lokalizacjaData.cities} points={lokalizacjaData.points} />
            </div>
          </section>
        )}
        <CompletedInvestments projects={completedProjects} />
        <Process content={home.process} />
        <Distinguishes content={home.distinguishes} />
        <Team members={teamMembers} />
        <Services content={home.services} />
        <InteriorShowcase content={home.interior} />
        <BuyingProcess content={home.buying} />
        <NewsScroll posts={newsPosts.map((p) => ({ ...p, publishedAt: p.publishedAt?.toISOString() ?? null, createdAt: p.createdAt.toISOString() }))} />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
