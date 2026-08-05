"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

export type LightboxImage = { src: string; alt: string }

// Shared photo lightbox — the exact look of the "Bauweise und Entwicklung"
// viewer (light overlay, tinted close/counter, bordered arrows, contained image)
// plus prev/next, an image counter, keyboard (←/→/Esc), mobile swipe and body
// scroll-lock. `index` is the open image (-1 = closed); the parent owns it and
// updates it via `onNavigate`.
export function PhotoLightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: LightboxImage[]
  index: number
  onClose: () => void
  onNavigate: (i: number) => void
}) {
  const isOpen = index >= 0 && index < images.length
  const prev = useCallback(
    () => onNavigate(index <= 0 ? images.length - 1 : index - 1),
    [index, images.length, onNavigate],
  )
  const next = useCallback(
    () => onNavigate(index >= images.length - 1 ? 0 : index + 1),
    [index, images.length, onNavigate],
  )
  const [touchX, setTouchX] = useState<number | null>(null)

  // Keyboard navigation + body scroll-lock while open.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
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
  }, [isOpen, onClose, prev, next])

  if (!isOpen) return null

  const onTouchStart = (e: React.TouchEvent) => setTouchX(e.touches[0].clientX)
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX === null) return
    const dx = e.changedTouches[0].clientX - touchX
    if (Math.abs(dx) > 50) (dx < 0 ? next() : prev())
    setTouchX(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="dialog"
      aria-modal="true"
    >
      {/* Close Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-4 right-4 lg:top-8 lg:right-8 w-12 h-12 flex items-center justify-center rounded-full bg-[#3E1718]/10 hover:bg-[#3E1718]/20 transition-colors duration-300 z-50 border border-[#6E2E2A]/20"
        aria-label="Schließen"
      >
        <X className="w-6 h-6 text-[#3E1718]" />
      </button>

      {/* Image Counter */}
      <div className="absolute top-4 left-4 lg:top-8 lg:left-8 px-4 py-2 rounded-full bg-[#3E1718]/10 text-[#3E1718] text-sm font-medium border border-[#6E2E2A]/20">
        {index + 1} / {images.length}
      </div>

      {images.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 border border-[#6E2E2A]/20"
            aria-label="Vorheriges Bild"
          >
            <ChevronLeft className="w-7 h-7 lg:w-8 lg:h-8 text-[#3E1718]" />
          </button>
          {/* Next Button */}
          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 border border-[#6E2E2A]/20"
            aria-label="Nächstes Bild"
          >
            <ChevronRight className="w-7 h-7 lg:w-8 lg:h-8 text-[#3E1718]" />
          </button>
        </>
      )}

      {/* Main Image */}
      <div
        className="relative w-[95vw] h-[90vh] lg:w-[90vw] lg:h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[index].src}
          alt={images[index].alt}
          width={1600}
          height={1100}
          className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          priority
        />
      </div>
    </div>
  )
}
