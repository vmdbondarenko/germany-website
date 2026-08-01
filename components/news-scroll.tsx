"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Calendar, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"

type NewsPostData = {
  id: string
  slug: string
  title: string
  description: string | null
  coverImageUrl: string | null
  publishedAt: string | null
  createdAt: string
}

export function NewsScroll({ posts }: { posts: NewsPostData[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(true)

  const checkScroll = () => {
    const c = scrollContainerRef.current
    if (c) {
      setShowLeft(c.scrollLeft > 0)
      setShowRight(c.scrollLeft < c.scrollWidth - c.clientWidth - 10)
    }
  }

  useEffect(() => {
    const c = scrollContainerRef.current
    if (c) {
      c.addEventListener("scroll", checkScroll)
      checkScroll()
      return () => c.removeEventListener("scroll", checkScroll)
    }
  }, [])

  const scroll = (dir: "left" | "right") => {
    scrollContainerRef.current?.scrollBy({ left: dir === "left" ? -380 : 380, behavior: "smooth" })
  }

  if (posts.length === 0) return null

  return (
    <section id="aktualnosci" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2
              className="font-serif text-3xl lg:text-4xl font-semibold mb-3"
              style={{ color: "#3E1718" }}
            >
              Aktuelles
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg max-w-xl">
              Neuigkeiten aus unserem Unternehmen und unseren Projekten
            </p>
          </div>
          <Link
            href="/aktuelles"
            className="hidden md:flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color: "#6E2E2A" }}
          >
            Alle Neuigkeiten
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative">
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-border/20 disabled:opacity-30"
            aria-label="Vorheriger Beitrag"
            disabled={!showLeft}
          >
            <ChevronLeft className="w-6 h-6 lg:w-7 lg:h-7 text-[#3E1718]" />
          </button>

          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-border/20 disabled:opacity-30"
            aria-label="Nächster Beitrag"
            disabled={!showRight}
          >
            <ChevronRight className="w-6 h-6 lg:w-7 lg:h-7 text-[#3E1718]" />
          </button>

          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-14 py-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {posts.map((post) => {
              const date = post.publishedAt ?? post.createdAt
              return (
                <Link
                  key={post.id}
                  href={`/aktuelles/${post.slug}`}
                  className="flex-shrink-0 w-[340px] group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-border/50 flex flex-col cursor-pointer"
                >
                  {post.coverImageUrl ? (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={post.coverImageUrl}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground text-xs">Kein Bild</span>
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <Calendar className="h-3 w-3" />
                      {new Date(date).toLocaleDateString("de-DE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <h3
                      className="font-serif text-lg font-semibold mb-2 line-clamp-2"
                      style={{ color: "#3E1718" }}
                    >
                      {post.title}
                    </h3>
                    {post.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-grow">
                        {post.description}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link
            href="/aktuelles"
            className="inline-flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "#6E2E2A" }}
          >
            Alle Neuigkeiten
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
