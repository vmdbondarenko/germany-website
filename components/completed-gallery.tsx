"use client"

import { useCallback, useEffect, useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import type { GalleryContent, GalleryImage } from "@/lib/home-content"

// Completed-projects photo gallery. Photos only (no titles/captions), country
// tabs (Poland / Ukraine — labels per locale, images shared), an asymmetric
// layout (large lead photo + masonry) that preserves each image's proportions,
// and an accessible lightbox (arrows, counter, keyboard, swipe, scroll lock).
export function CompletedGallery({ content }: { content: GalleryContent }) {
  const groups = [
    { key: "poland" as const, label: content.polandLabel, images: content.poland },
    { key: "ukraine" as const, label: content.ukraineLabel, images: content.ukraine },
  ]
  const total = content.poland.length + content.ukraine.length

  // Default to the first country that actually has photos.
  const initial = content.poland.length > 0 ? "poland" : "ukraine"
  const [active, setActive] = useState<"poland" | "ukraine">(initial)
  const [lightbox, setLightbox] = useState<number>(-1)
  const [touchX, setTouchX] = useState<number | null>(null)

  const images: GalleryImage[] = active === "poland" ? content.poland : content.ukraine
  const isOpen = lightbox >= 0 && lightbox < images.length

  const close = useCallback(() => setLightbox(-1), [])
  const prev = useCallback(() => setLightbox((i) => (i <= 0 ? images.length - 1 : i - 1)), [images.length])
  const next = useCallback(() => setLightbox((i) => (i >= images.length - 1 ? 0 : i + 1)), [images.length])

  // Keyboard navigation + body scroll lock while the lightbox is open.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      else if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, close, prev, next])

  // Hidden when disabled or empty — preserves settings/images in the DB.
  if (!content.enabled || total === 0) return null

  const onTouchStart = (e: React.TouchEvent) => setTouchX(e.touches[0].clientX)
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX === null) return
    const dx = e.changedTouches[0].clientX - touchX
    if (Math.abs(dx) > 50) (dx < 0 ? next() : prev())
    setTouchX(null)
  }

  const lead = images[0]
  const rest = images.slice(1)

  return (
    <section id="galerie" className="py-16 lg:py-28 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-8 lg:mb-12">
          <span className="inline-block text-sm lg:text-base font-medium tracking-[0.2em] uppercase mb-4" style={{ color: "#6E2E2A" }}>
            {content.eyebrow}
          </span>
          <h2 className="font-serif text-3xl lg:text-5xl font-semibold leading-tight" style={{ color: "#3E1718" }}>
            {content.heading}
          </h2>
          {content.subtitle && (
            <p className="mt-4 text-base lg:text-lg text-muted-foreground leading-relaxed">{content.subtitle}</p>
          )}
        </div>

        {/* Country tabs */}
        <div className="flex items-center justify-center gap-2 mb-10 lg:mb-14" role="tablist" aria-label={content.heading}>
          {groups.map((g) => {
            const selected = active === g.key
            return (
              <button
                key={g.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => { setActive(g.key); setLightbox(-1) }}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  selected ? "text-white shadow-md" : "text-[#3E1718] bg-[#6E2E2A]/5 hover:bg-[#6E2E2A]/10"
                }`}
                style={selected ? { background: "linear-gradient(135deg, #6E2E2A 0%, #3E1718 100%)" } : undefined}
              >
                {g.label}
              </button>
            )
          })}
        </div>

        {/* Photos */}
        {images.length === 0 ? (
          <p className="text-center text-muted-foreground">—</p>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Lead image (large) */}
            {lead && (
              <button
                type="button"
                onClick={() => setLightbox(0)}
                className="block w-full mb-4 lg:mb-6 rounded-3xl overflow-hidden shadow-xl group cursor-pointer"
                aria-label={lead.alt || `${content.heading} 1`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lead.image}
                  alt={lead.alt}
                  loading="lazy"
                  className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                />
              </button>
            )}

            {/* Remaining images — masonry (natural proportions, no cropping) */}
            {rest.length > 0 && (
              <div className="columns-2 lg:columns-3 gap-4 lg:gap-6 [column-fill:_balance]">
                {rest.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightbox(i + 1)}
                    className="block w-full mb-4 lg:mb-6 rounded-2xl overflow-hidden shadow-md group cursor-pointer break-inside-avoid"
                    aria-label={img.alt || `${content.heading} ${i + 2}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image}
                      alt={img.alt}
                      loading="lazy"
                      className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm"
          onClick={close}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="dialog"
          aria-modal="true"
          aria-label={content.heading}
        >
          <button
            onClick={(e) => { e.stopPropagation(); close() }}
            className="absolute top-4 right-4 lg:top-8 lg:right-8 w-12 h-12 flex items-center justify-center rounded-full bg-[#3E1718]/10 hover:bg-[#3E1718]/20 transition-colors duration-300 z-50 border border-[#6E2E2A]/20"
            aria-label="Schließen"
          >
            <X className="w-6 h-6 text-[#3E1718]" />
          </button>

          <div className="absolute top-4 left-4 lg:top-8 lg:left-8 px-4 py-2 rounded-full bg-[#3E1718]/10 text-[#3E1718] text-sm font-medium border border-[#6E2E2A]/20">
            {lightbox + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 border border-[#6E2E2A]/20"
                aria-label="Vorheriges Bild"
              >
                <ChevronLeft className="w-7 h-7 lg:w-8 lg:h-8 text-[#3E1718]" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 border border-[#6E2E2A]/20"
                aria-label="Nächstes Bild"
              >
                <ChevronRight className="w-7 h-7 lg:w-8 lg:h-8 text-[#3E1718]" />
              </button>
            </>
          )}

          <div className="relative w-[95vw] h-[90vh] lg:w-[90vw] lg:h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightbox].image}
              alt={images[lightbox].alt}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </section>
  )
}
