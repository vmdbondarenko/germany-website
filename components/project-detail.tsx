import { notFound } from 'next/navigation'
import { FileText, Download } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { prisma } from '@/lib/prisma'
import { DynamicProjectHero } from '@/components/project-sections/hero'
import { DynamicPlanSection } from '@/components/project-sections/plan'
import { DynamicKeyFeatures } from '@/components/project-sections/key-features'
import { DynamicTwoColumnSection } from '@/components/project-sections/two-column-section'
import { DynamicStandardSection } from '@/components/project-sections/standard-section'
import { DynamicGallerySection } from '@/components/project-sections/gallery-section'
import { DynamicContactSection } from '@/components/project-sections/contact-section'
import { BuyingProcess } from '@/components/buying-process'
import { Contact } from '@/components/contact'
import { JsonLd, breadcrumbSchema, residenceSchema } from '@/lib/seo/json-ld'
import { resolveAlt, galleryAlt } from '@/lib/seo/image-alt'
import { PROJECT_COPY } from '@/lib/seo/landing-copy'
import { getLocale } from 'next-intl/server'
import { getHomeContent } from '@/lib/home-content'
import type { Locale } from '@/i18n/routing'

/**
 * Full investment page body. Rendered by both /inwestycje/[slug] (legacy, only
 * for projects without an assigned city) and /[citySlug]/[slug] (canonical city
 * path). `canonicalPath` feeds the breadcrumb + Residence JSON-LD so structured
 * data points at the canonical URL. `cities` (for the header dropdown) is passed
 * down from the route's server fetch.
 */
export async function ProjectDetail({
  slug,
  canonicalPath,
  cities,
}: {
  slug: string
  canonicalPath: string
  cities: { name: string; slug: string }[]
}) {
  const locale = (await getLocale()) as Locale
  const buyingContent = (await getHomeContent(locale)).buying
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      units: {
        orderBy: { label: 'asc' },
        include: {
          houseType: {
            include: {
              floorPlans: {
                include: { rooms: true },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      },
      houseTypes: {
        include: {
          floorPlans: {
            include: { rooms: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      planViews: { orderBy: { order: 'asc' } },
      sections: {
        where: { enabled: true },
        include: { items: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      },
      galleryImages: { orderBy: { order: 'asc' } },
      documents: { orderBy: { order: 'asc' } },
    },
  })

  if (!project) notFound()

  const getSection = (type: string) => project.sections.find(s => s.type === type)

  const keyFeatures = getSection('key_features')
  const lokalizacja = getSection('lokalizacja')
  const otoczenie = getSection('otoczenie')
  const oInwestycji = getSection('o_inwestycji')
  const udogodnienia = getSection('udogodnienia')
  const dodatki = getSection('dodatki')
  const dom = getSection('dom')
  const standard = getSection('standard')
  const jakKupic = getSection('jak_kupic')
  const jakPomoc = getSection('jak_pomoc')
  const oInwestorze = getSection('o_inwestorze')

  const STATUS_MAP: Record<string, string> = {
    active: 'W sprzedaży',
    planned: 'Wkrótce',
    completed: 'Zakończona',
  }

  // Structured data — mirrors the visible hero breadcrumb and the project's
  // public-facing data. Uses the canonical path so JSON-LD agrees with <link
  // rel=canonical>.
  const path = canonicalPath
  const availableCount = project.units.filter((u) => u.status === 'available').length
  const streetAddress = [project.investStreet, project.investBuildingNr]
    .filter(Boolean)
    .join(' ')
    .trim()
  const breadcrumb = breadcrumbSchema([
    { name: 'Domy jednorodzinne', path: '/' },
    { name: project.name, path },
  ])
  // Hero + gallery images as captioned ImageObjects (captions reuse the same
  // resolved alt text shown on the page).
  const schemaImages = [
    ...(project.imageUrl ? [{ url: project.imageUrl, caption: project.name }] : []),
    ...project.galleryImages.map((g, i) => ({
      url: g.src,
      caption: resolveAlt(g.alt, galleryAlt(project.name, i)),
    })),
  ]
  const residence = residenceSchema({
    name: project.name,
    description: project.description ?? project.heroSubtitle,
    images: schemaImages,
    path,
    availableCount,
    streetAddress: streetAddress || null,
    locality: project.investCity ?? project.location,
    region: project.investVoivodeship,
    postalCode: project.investPostalCode,
  })

  return (
    <div className="min-h-screen bg-background">
      <JsonLd schema={breadcrumb} />
      <JsonLd schema={residence} />
      <Header cities={cities} />

      {/* Hero */}
      {project.imageUrl && (
        <DynamicProjectHero
          title={project.name}
          h1={PROJECT_COPY[project.slug]?.h1}
          subtitle={project.heroSubtitle || ''}
          location={project.location}
          status={STATUS_MAP[project.status] || project.status}
          imageUrl={project.imageUrl}
        />
      )}

      {/* Key Features Strip */}
      {keyFeatures && keyFeatures.items.length > 0 && (
        <DynamicKeyFeatures items={keyFeatures.items} />
      )}

      {/* Lokalizacja */}
      {lokalizacja && (
        <DynamicTwoColumnSection
          section={lokalizacja}
          imagePosition="right"
          mapRight
          projectMap={{
            name: project.name,
            lat: project.latitude,
            lng: project.longitude,
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null,
            mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined,
          }}
        />
      )}

      {/* Otoczenie */}
      {otoczenie && (
        <DynamicTwoColumnSection
          section={otoczenie}
          imagePosition="left"
        />
      )}

      {/* O Inwestycji */}
      {oInwestycji && (
        <DynamicTwoColumnSection
          section={oInwestycji}
          imagePosition="right"
          dualImage
        />
      )}

      {/* Udogodnienia */}
      {udogodnienia && (
        <DynamicTwoColumnSection
          section={udogodnienia}
          imagePosition="left"
        />
      )}

      {/* Dodatki */}
      {dodatki && (
        <DynamicTwoColumnSection
          section={dodatki}
          imagePosition="right"
          showCta
        />
      )}

      {/* Dom */}
      {dom && (
        <DynamicTwoColumnSection
          section={dom}
          imagePosition="left"
        />
      )}

      {/* Standard */}
      {standard && standard.items.length > 0 && (
        <DynamicStandardSection section={standard} />
      )}

      {/* Gallery */}
      {project.galleryImages.length > 0 && (
        <DynamicGallerySection images={project.galleryImages} projectName={project.name} />
      )}

      {/* Plan Osiedla */}
      {(project.svgContent || project.planImageUrl || project.planViews.length > 0) && (
        <DynamicPlanSection slug={project.slug} projectName={project.name} />
      )}

      {/* Informacje dodatkowe */}
      {(project.additionalInfo || project.documents.length > 0) && (
        <section className="py-16 lg:py-24 bg-[#faf9f7]">
          <div className="container mx-auto px-4 lg:px-8">

            {/* Badge + heading above the grid */}
            <div className="mb-10">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase mb-4"
                style={{ backgroundColor: 'rgba(110, 46, 42, 0.1)', color: '#6E2E2A' }}
              >
                Dokumenty i cennik
              </span>
              <h2 className="font-serif text-3xl lg:text-4xl font-semibold" style={{ color: '#3E1718' }}>
                Informacje dodatkowe
              </h2>
            </div>

            {/* Documents left, text right — both start at the same level */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

              {/* Left: documents */}
              <div className="space-y-6">
                {project.documents.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-2xl p-8 shadow-sm border border-border/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'rgba(110, 46, 42, 0.1)' }}
                      >
                        <FileText className="w-5 h-5" style={{ color: '#6E2E2A' }} />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-semibold" style={{ color: '#3E1718' }}>
                          {doc.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">Dokument do pobrania</p>
                      </div>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-[#faf9f7] hover:bg-white transition-all hover:shadow-md"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors bg-[#3E1718] group-hover:bg-[#6E2E2A]">
                        <Download className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {doc.label}
                      </span>
                    </a>
                  </div>
                ))}
              </div>

              {/* Right: info text */}
              {project.additionalInfo && (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {project.additionalInfo}
                </p>
              )}

            </div>
          </div>
        </section>
      )}

      {/* Jak kupić */}
      {jakKupic && <BuyingProcess content={buyingContent} />}

      {/* Jak jeszcze możemy pomóc? */}
      {jakPomoc && (
        <DynamicTwoColumnSection
          section={jakPomoc}
          imagePosition="right"
        />
      )}

      {/* O inwestorze */}
      {oInwestorze && (
        <DynamicTwoColumnSection
          section={oInwestorze}
          imagePosition="left"
        />
      )}

      {/* Contact */}
      {(project.contactPhone || project.contactEmail || project.contactAddress) ? (
        <DynamicContactSection
          phone={project.contactPhone}
          email={project.contactEmail}
          address={project.contactAddress}
        />
      ) : (
        <Contact />
      )}

      <Footer />
    </div>
  )
}
