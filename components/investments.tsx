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
  status: string
  availableCount: number
  totalCount: number
  description: string | null
  keyFeatures: { title: string; subtitle: string | null }[]
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: "W sprzedaży", color: "#16a34a" },
  planned: { label: "Wkrótce", color: "#666" },
  completed: { label: "Zakończona", color: "#9ca3af" },
}

export function Investments({ projects }: { projects: InvestmentData[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(true)

  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (container) {
      setShowLeftButton(container.scrollLeft > 0)
      setShowRightButton(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      )
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", checkScroll)
      checkScroll()
      return () => container.removeEventListener("scroll", checkScroll)
    }
  }, [])

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current
    if (container) {
      container.scrollBy({
        left: direction === "left" ? -400 : 400,
        behavior: "smooth",
      })
    }
  }

  if (projects.length === 0) return null

  return (
    <section id="w-sprzedazy" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className="font-serif text-3xl lg:text-4xl font-semibold mb-4"
            style={{ color: "#3E1718" }}
          >
            Wszystkie dostępne inwestycje
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto">
            Nowoczesne domy i osiedla w zielonym otoczeniu
          </p>
        </div>

        <div className="relative">
          {showLeftButton && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-border/20"
              aria-label="Poprzednia inwestycja"
            >
              <ChevronLeft className="w-6 h-6 lg:w-7 lg:h-7 text-[#3E1718]" />
            </button>
          )}

          {showRightButton && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-border/20"
              aria-label="Następna inwestycja"
            >
              <ChevronRight className="w-6 h-6 lg:w-7 lg:h-7 text-[#3E1718]" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {projects.map((project) => {
              const statusInfo = STATUS_MAP[project.status] || STATUS_MAP.active
              return (
                <Link
                  key={project.slug}
                  href={`/inwestycje/${project.slug}`}
                  className="flex-shrink-0 w-[380px] group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-border/50 flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {project.imageUrl ? (
                      <Image
                        src={project.imageUrl}
                        alt={project.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                        Brak zdjęcia
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span
                        className="text-[11px] font-medium px-3 py-1.5 rounded-full shadow-sm"
                        style={{
                          backgroundColor: statusInfo.color,
                          color: "rgba(255, 255, 255, 0.95)",
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <h3
                      className="font-serif text-xl font-semibold mb-1"
                      style={{ color: "#3E1718" }}
                    >
                      {project.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {project.location}
                    </p>

                    <p
                      className="text-xs font-medium mb-4"
                      style={{ color: "#5A2A1C" }}
                    >
                      Pozostało: {project.availableCount} / {project.totalCount}
                    </p>

                    {project.keyFeatures.length > 0 ? (
                      <ul className="mb-6 flex-grow space-y-1.5">
                        {project.keyFeatures.slice(0, 4).map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#6E2E2A" }} />
                            <span>
                              <span className="font-medium" style={{ color: "#3E1718" }}>{f.title}</span>
                              {f.subtitle && <span className="text-muted-foreground"> — {f.subtitle}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : project.description ? (
                      <p className="text-sm text-muted-foreground mb-6 flex-grow line-clamp-3">
                        {project.description}
                      </p>
                    ) : null}

                    <span
                      className="inline-block w-full text-center text-sm font-medium px-5 py-3 rounded-lg transition-all duration-300 group-hover:opacity-90 mt-auto"
                      style={{
                        backgroundColor: "#6E2E2A",
                        color: "rgba(255, 255, 255, 0.95)",
                      }}
                    >
                      Zobacz inwestycję
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
