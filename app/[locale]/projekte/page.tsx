import Link from 'next/link'
import Image from 'next/image'
import { HeaderServer } from '@/components/header-server'
import { Footer } from '@/components/footer'
import { Badge } from '@/components/ui/badge'
import { MapPin, Home } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Projekte – Neue Häuser vom Bauträger',
  description:
    'Entdecken Sie unsere Bauprojekte in Berlin und Brandenburg – hochwertige Häuser im Stil des Bayerischen Mauerwerks, direkt vom Bauträger.',
  alternates: { canonical: '/projekte', languages: { de: '/projekte', en: '/en/projekte' } },
  openGraph: {
    title: 'Projekte – Neue Häuser vom Bauträger',
    description:
      'Entdecken Sie unsere Bauprojekte in Berlin und Brandenburg – hochwertige Häuser direkt vom Bauträger.',
    url: '/projekte',
    type: 'website',
  },
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
}

export default async function InwestycjePage() {
  const projects = await prisma.project.findMany({
    where: { status: { not: 'archived' } },
    include: { units: { select: { status: true, price: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      <HeaderServer />
      <main className="min-h-screen pt-20" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="mb-12">
            <h1
              className="text-4xl lg:text-5xl font-serif font-bold mb-4"
              style={{ color: '#3E1718' }}
            >
              Unsere Projekte
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Entdecken Sie unsere Bauprojekte und finden Sie Ihr passendes Zuhause.
            </p>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              Keine aktiven Projekte
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project) => {
                const available = project.units.filter((u) => u.status === 'available').length
                const reserved = project.units.filter((u) => u.status === 'reserved').length
                const sold = project.units.filter((u) => u.status === 'sold').length
                const prices = project.units
                  .filter((u) => u.price)
                  .map((u) => u.price!)
                const minPrice = prices.length ? Math.min(...prices) : null

                return (
                  <Link key={project.id} href={`/projekte/${project.slug}`}>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group">
                      <div className="aspect-video bg-gray-100 relative overflow-hidden">
                        {project.imageUrl ? (
                          <Image
                            src={project.imageUrl}
                            alt={project.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="h-12 w-12 text-gray-300" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              project.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : project.status === 'planned'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {project.status === 'active'
                              ? 'Im Verkauf'
                              : project.status === 'planned'
                              ? 'Geplant'
                              : 'Abgeschlossen'}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h2
                          className="text-xl font-serif font-bold mb-2"
                          style={{ color: '#3E1718' }}
                        >
                          {project.name}
                        </h2>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                          <MapPin className="h-4 w-4" />
                          {project.location}
                        </div>
                        {project.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        <div className="flex gap-2 flex-wrap mb-4">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            {available} verfügbar
                          </Badge>
                          {reserved > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                              {reserved} reserviert
                            </Badge>
                          )}
                          {sold > 0 && (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                              {sold} verkauft
                            </Badge>
                          )}
                        </div>
                        {minPrice && (
                          <p className="text-sm font-medium" style={{ color: '#6E2E2A' }}>
                            Ab {formatPrice(minPrice)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
