"use client"

import { useState } from "react"
import Image from "next/image"
import { PhotoLightbox } from "@/components/photo-lightbox"
import type { EbImage } from "@/lib/home-content"

// The Erste Bayerische photo group below the closing paragraph. Same grid layout
// as before; each photo now opens the shared PhotoLightbox (identical to the
// "Bauweise und Entwicklung" viewer) with prev/next through this image group.
export function ErsteBayerischeGallery({ images }: { images: EbImage[] }) {
  const [index, setIndex] = useState(-1)
  if (images.length === 0) return null
  const lightboxImages = images.map((g) => ({ src: g.image, alt: g.alt }))

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {images.map((g, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={g.alt || `Foto ${i + 1}`}
            className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md w-full cursor-pointer"
          >
            <Image
              src={g.image}
              alt={g.alt}
              fill
              sizes="(max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
          </button>
        ))}
      </div>
      <PhotoLightbox images={lightboxImages} index={index} onClose={() => setIndex(-1)} onNavigate={setIndex} />
    </>
  )
}
