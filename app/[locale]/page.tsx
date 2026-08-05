import { HeaderServer } from "@/components/header-server"
import { Hero } from "@/components/hero"
import { ArchitectureSlideshow } from "@/components/architecture-slideshow"
import { About } from "@/components/about"
import { ErsteBayerische } from "@/components/erste-bayerische"
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
import { CompletedGallery } from "@/components/completed-gallery"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"
import { NewsScroll } from "@/components/news-scroll"
import { prisma } from "@/lib/prisma"
import { getLocale, getTranslations } from "next-intl/server"
import { getHomeContent, getAboutContent, getErsteBayerischeContent, getGalleryContent, getNewsContent } from "@/lib/home-content"
import { pick } from "@/lib/i18n-content"
import type { Locale } from "@/i18n/routing"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  const title = t("homeTitle")
  const description = t("homeDescription")
  return {
    title,
    description,
    alternates: { canonical: "/", languages: { de: "/", en: "/en" } },
    openGraph: { title, description, url: "/", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function HomePage() {
  const locale = (await getLocale()) as Locale
  const home = await getHomeContent(locale)
  const aboutContent = await getAboutContent(locale)
  const ersteBayerische = await getErsteBayerischeContent(locale)
  const gallery = await getGalleryContent(locale)
  const th = await getTranslations("home")
  const tn = await getTranslations("news")
  const mapCopy = { heading: th("mapHeading"), subtitle: th("mapSubtitle") }

  const STATUS_LABELS: Record<string, string> = {
    active: th("statusActive"),
    planned: th("statusPlanned"),
    completed: th("statusCompleted"),
  }
  function L(base: string, en: string | null): string
  function L(base: string | null, en: string | null): string | null
  function L(base: string | null, en: string | null): string | null {
    return pick(base, en, locale)
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
  const keyFeaturesOf = (p: (typeof dbProjects)[number]) =>
    p.sections[0]?.items.map((i) => ({
      title: L(i.title, i.titleEn),
      subtitle: L(i.subtitle, i.subtitleEn),
    })) ?? []

  // Build slideshow slides from published DB projects
  const slideshowSlides = dbProjects
    .filter((p) => p.imageUrl && p.status !== "completed")
    .map((p) => {
      const available = p.units.filter((u) => u.status === "available").length
      const total = p.units.length
      return {
        image: p.imageUrl!,
        title: p.name,
        address: L(p.location, p.locationEn),
        status: STATUS_LABELS[p.status] || p.status,
        availability: `${th("remaining")}: ${available} / ${total}`,
        href: `/projekte/${p.slug}`,
        description: L(p.description, p.descriptionEn),
        keyFeatures: keyFeaturesOf(p),
      }
    })

  const activeProjects = dbProjects
    .filter((p) => p.status === "active" || p.status === "planned")
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      location: L(p.location, p.locationEn),
      imageUrl: p.imageUrl,
      heroSubtitle: L(p.heroSubtitle, p.heroSubtitleEn),
      status: p.status,
      description: L(p.description, p.descriptionEn),
      availableCount: p.units.filter((u) => u.status === "available").length,
      totalCount: p.units.length,
      keyFeatures: keyFeaturesOf(p),
    }))

  const [lokalizacjaData, upcomingInvestmentsRaw, newCitiesRaw, aboutSectionRaw, teamMembersRaw] = await Promise.all([
    loadLokalizacjaData(),
    prisma.upcomingInvestment.findMany({ orderBy: { order: 'asc' } }),
    prisma.newCity.findMany({ orderBy: { order: 'asc' } }),
    prisma.aboutSection.findUnique({ where: { id: 'main' } }),
    prisma.teamMember.findMany({ orderBy: { order: 'asc' } }),
  ])
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null
  const mapsMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined

  const upcomingInvestments = upcomingInvestmentsRaw.map((i) => ({
    ...i,
    title: L(i.title, i.titleEn),
    description: L(i.description, i.descriptionEn),
    status: L(i.status, i.statusEn),
  }))
  const newCities = newCitiesRaw.map((c) => ({
    ...c,
    city: L(c.city, c.cityEn),
    date: L(c.date, c.dateEn),
  }))
  const aboutSection = aboutSectionRaw && {
    ...aboutSectionRaw,
    companyName: L(aboutSectionRaw.companyName, aboutSectionRaw.companyNameEn),
    description: L(aboutSectionRaw.description, aboutSectionRaw.descriptionEn),
  }
  const teamMembers = teamMembersRaw.map((m) => ({ ...m, role: L(m.role, m.roleEn) }))

  const completedProjects = dbProjects
    .filter((p) => p.status === "completed")
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      location: L(p.location, p.locationEn),
      imageUrl: p.imageUrl,
      heroSubtitle: L(p.heroSubtitle, p.heroSubtitleEn),
      description: L(p.description, p.descriptionEn),
      totalCount: p.units.length,
      keyFeatures: keyFeaturesOf(p),
    }))

  const newsContent = await getNewsContent(locale)
  const newsDateLocale = locale === "en" ? "en-US" : "de-DE"
  const newsPostsRaw = await prisma.newsPost.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 10,
    select: {
      id: true,
      slug: true,
      title: true,
      titleEn: true,
      description: true,
      descriptionEn: true,
      coverImageUrl: true,
      coverImageAlt: true,
      coverImageAltEn: true,
      publishedAt: true,
      createdAt: true,
    },
  })
  const newsPosts = newsPostsRaw.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: L(p.title, p.titleEn),
    description: L(p.description, p.descriptionEn),
    coverImageUrl: p.coverImageUrl,
    coverImageAlt: L(p.coverImageAlt, p.coverImageAltEn),
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
  }))

  return (
    <>
      <HeaderServer />
      <main>
        <Hero content={home.hero} />
        <ArchitectureSlideshow dbSlides={slideshowSlides} />
        <About content={aboutContent} upcomingInvestments={upcomingInvestments} newCities={newCities} aboutSection={aboutSection} afterSinceFounding={<CompletedGallery content={gallery} />} />
        <NewsScroll
          content={newsContent}
          dateLocale={newsDateLocale}
          noImageLabel={tn("noImage")}
          posts={newsPosts.map((p) => ({ ...p, publishedAt: p.publishedAt?.toISOString() ?? null, createdAt: p.createdAt.toISOString() }))}
        />
        <ErsteBayerische content={ersteBayerische} />
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
        <Team members={teamMembers} content={aboutContent.team} />
        <Services content={home.services} />
        <InteriorShowcase content={home.interior} />
        <BuyingProcess content={home.buying} />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
