"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { numberedSectionAlt, resolveAlt } from "@/lib/seo/image-alt"
import type { InteriorExampleContent } from "@/lib/home-content"

// "Beispiel für den Innenausbau" — reuses the Polish "Wnętrza pod klucz"
// running-photo-feed + lightbox design, adapted to this site's design system
// and made fully admin-driven. The gallery is NEVER hardcoded here: every image
// comes from `content.images` (admin-managed HomeSection "interior-example").
// The section hides itself when there are no images (empty-DB safe).
export function InteriorExample({ content }: { content: InteriorExampleContent }) {
  const tc = useTranslations("common")
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const images = content.images
  const count = images.length

  // Duplicate images for seamless infinite scroll.
  const duplicatedImages = [...images, ...images]

  const openLightbox = (index: number) => {
    if (count === 0) return
    setCurrentIndex(((index % count) + count) % count)
    setLightboxOpen(true)
  }

  const closeLightbox = () => setLightboxOpen(false)

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? count - 1 : prev - 1))
  }, [count])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === count - 1 ? 0 : prev + 1))
  }, [count])

  // Keyboard navigation + body scroll lock while the lightbox is open.
  useEffect(() => {
    if (!lightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox()
      if (e.key === "ArrowLeft") goToPrevious()
      if (e.key === "ArrowRight") goToNext()
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [lightboxOpen, goToPrevious, goToNext])

  const altFor = (index: number) =>
    resolveAlt(images[index]?.alt, numberedSectionAlt(content.heading, "", index))

  // Nothing to show → render nothing (keeps settings/images in the DB).
  if (!content.enabled || count === 0) return null

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF9F7] via-[#F8F6F4] to-[#F5F2EF]" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 40%, #6E2E2A 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-1/3 h-1/2 opacity-[0.03] pointer-events-none" style={{ background: "radial-gradient(ellipse at 0% 0%, #6E2E2A 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 right-0 w-1/3 h-1/2 opacity-[0.02] pointer-events-none" style={{ background: "radial-gradient(ellipse at 100% 100%, #3E1718 0%, transparent 70%)" }} />

      {/* Corner Borders */}
      <div className="absolute top-10 left-10 w-28 h-28 border-l-2 border-t-2 border-[#6E2E2A]/10 rounded-tl-3xl hidden lg:block" />
      <div className="absolute bottom-10 right-10 w-28 h-28 border-r-2 border-b-2 border-[#6E2E2A]/10 rounded-br-3xl hidden lg:block" />

      <div className="container mx-auto px-4 lg:px-8 relative mb-12 lg:mb-16">
        {/* Section Header */}
        <div className="text-center">
          <h2
            className="font-serif text-3xl lg:text-5xl font-semibold mb-5 leading-tight"
            style={{ color: "#3E1718" }}
          >
            <span className="relative inline-block">
              {content.heading}
              <div className="absolute -bottom-2 left-0 right-0 h-1 rounded-full opacity-25" style={{ backgroundColor: "#6E2E2A" }} />
            </span>
          </h2>
          {content.description && (
            <p className="text-muted-foreground text-base lg:text-lg max-w-3xl mx-auto leading-relaxed">
              {content.description}
            </p>
          )}
        </div>
      </div>

      {/* Running Photo Feed */}
      <div className="relative w-full overflow-hidden">
        {/* First Row - Scrolling Left */}
        <div className="flex mb-4 lg:mb-6 scroll-row-left">
          {duplicatedImages.map((image, index) => (
            <button
              key={`row1-${index}`}
              onClick={() => openLightbox(index)}
              className="flex-shrink-0 w-72 h-48 lg:w-96 lg:h-64 mx-2 lg:mx-3 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
            >
              <Image
                src={image.image}
                alt={altFor(index % count)}
                width={400}
                height={280}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </button>
          ))}
        </div>

        {/* Second Row - Scrolling Right */}
        <div className="flex scroll-row-right">
          {[...duplicatedImages].reverse().map((image, index) => (
            <button
              key={`row2-${index}`}
              onClick={() => openLightbox(duplicatedImages.length - 1 - index)}
              className="flex-shrink-0 w-72 h-48 lg:w-96 lg:h-64 mx-2 lg:mx-3 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
            >
              <Image
                src={image.image}
                alt={altFor((duplicatedImages.length - 1 - index) % count)}
                width={400}
                height={280}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </button>
          ))}
        </div>

        {/* Gradient Fade Edges */}
        <div className="absolute top-0 left-0 w-24 lg:w-40 h-full bg-gradient-to-r from-[#FAF9F7] to-transparent pointer-events-none z-10" />
        <div className="absolute top-0 right-0 w-24 lg:w-40 h-full bg-gradient-to-l from-[#FAF9F7] to-transparent pointer-events-none z-10" />
      </div>

      {/* Lightbox Gallery */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 lg:top-8 lg:right-8 w-12 h-12 flex items-center justify-center rounded-full bg-[#3E1718]/10 hover:bg-[#3E1718]/20 transition-colors duration-300 z-50 border border-[#6E2E2A]/20"
            aria-label={tc("close")}
          >
            <svg className="w-6 h-6 text-[#3E1718]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 lg:top-8 lg:left-8 px-4 py-2 rounded-full bg-[#3E1718]/10 text-[#3E1718] text-sm font-medium border border-[#6E2E2A]/20">
            {currentIndex + 1} / {count}
          </div>

          {count > 1 && (
            <>
              {/* Previous Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
                className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 border border-[#6E2E2A]/20"
                aria-label={tc("previousImage")}
              >
                <svg className="w-7 h-7 lg:w-8 lg:h-8 text-[#3E1718]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Next Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
                className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 border border-[#6E2E2A]/20"
                aria-label={tc("nextImage")}
              >
                <svg className="w-7 h-7 lg:w-8 lg:h-8 text-[#3E1718]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Main Image */}
          <div
            className="relative w-[95vw] h-[90vh] lg:w-[90vw] lg:h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[currentIndex].image}
              alt={altFor(currentIndex)}
              width={1600}
              height={1100}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              priority
            />
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes scroll-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }

        .scroll-row-left {
          animation: scroll-left 40s linear infinite;
        }

        .scroll-row-right {
          animation: scroll-right 40s linear infinite;
        }
      `}</style>
    </section>
  )
}
