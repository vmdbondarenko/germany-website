"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react"

type InvestmentData = {
  slug: string
  name: string
  location: string
  imageUrl: string | null
  heroSubtitle: string | null
  description: string | null
  totalCount: number
  keyFeatures: { title: string; subtitle: string | null }[]
}

export function CompletedInvestments({ projects }: { projects: InvestmentData[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollability = () => {
    const container = scrollContainerRef.current
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      )
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      checkScrollability()
      container.addEventListener("scroll", checkScrollability)
      window.addEventListener("resize", checkScrollability)
      return () => {
        container.removeEventListener("scroll", checkScrollability)
        window.removeEventListener("resize", checkScrollability)
      }
    }
  }, [])

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current
    if (container) {
      container.scrollBy({
        left: direction === "left" ? -300 : 300,
        behavior: "smooth",
      })
    }
  }

  if (projects.length === 0) return null

  return (
    <section id="abgeschlossen" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2
            className="font-serif text-4xl lg:text-5xl font-bold mb-6"
            style={{ color: "#3E1718" }}
          >
            Abgeschlossene Projekte
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Entdecken Sie unsere realisierten Projekte, die zum Zuhause
            zufriedener Familien geworden sind.
          </p>
        </div>

        <div className="relative">
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all duration-300 -ml-6"
              style={{
                backgroundColor: "#5A3D2B",
                color: "rgba(255, 255, 255, 0.95)",
              }}
              aria-label="Vorheriges Projekt"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {projects.map((project) => (
              <div
                key={project.slug}
                className="flex-shrink-0 w-[280px] group bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1 border border-border/50 flex flex-col"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  {project.imageUrl ? (
                    <Image
                      src={project.imageUrl}
                      alt={project.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                      Kein Bild
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span
                      className="text-[10px] font-medium px-2 py-1 rounded-full shadow-sm"
                      style={{
                        backgroundColor: "#9ca3af",
                        color: "rgba(255, 255, 255, 0.95)",
                      }}
                    >
                      Abgeschlossen
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-grow">
                  <h3
                    className="font-serif text-base font-semibold mb-0.5"
                    style={{ color: "#3E1718" }}
                  >
                    {project.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {project.location}
                  </p>

                  <p
                    className="text-[10px] font-medium mb-3"
                    style={{ color: "#8B4513" }}
                  >
                    Verfügbar: 0 / {project.totalCount}
                  </p>

                  {project.keyFeatures.length > 0 ? (
                    <ul className="mb-4 flex-grow space-y-1">
                      {project.keyFeatures.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <span className="mt-1 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: "#5A3D2B" }} />
                          <span>
                            <span className="font-medium" style={{ color: "#3E1718" }}>{f.title}</span>
                            {f.subtitle && <span> — {f.subtitle}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : project.heroSubtitle ? (
                    <p className="text-xs text-muted-foreground mb-4 flex-grow line-clamp-2">
                      {project.heroSubtitle}
                    </p>
                  ) : null}

                  <Link
                    href={`/projekte/${project.slug}`}
                    className="inline-block w-full text-center text-xs font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:opacity-90"
                    style={{
                      backgroundColor: "#5A3D2B",
                      color: "rgba(255, 255, 255, 0.95)",
                    }}
                  >
                    Projekt ansehen
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all duration-300 -mr-6"
              style={{
                backgroundColor: "#5A3D2B",
                color: "rgba(255, 255, 255, 0.95)",
              }}
              aria-label="Nächstes Projekt"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
