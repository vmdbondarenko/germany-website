"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { galleryAlt, resolveAlt } from "@/lib/seo/image-alt"

type GalleryImageData = {
  id: string
  src: string
  alt: string
  label: string
}

export function DynamicGallerySection({
  images,
  projectName = "",
}: {
  images: GalleryImageData[]
  projectName?: string
}) {
  const [selectedImage, setSelectedImage] = useState(-1)

  const handlePrev = () =>
    setSelectedImage((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    )
  const handleNext = () =>
    setSelectedImage((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    )

  return (
    <>
      <section className="py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F8F6F4] via-[#FAF9F7] to-[#F5F2EF]" />
        <div
          className="absolute bottom-0 right-0 w-1/2 h-full opacity-[0.035] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 100% 100%, #6E2E2A 0%, transparent 70%)" }}
        />
        <div className="container mx-auto px-4 lg:px-8 relative">
          <div className="text-center mb-12">
            <h2
              className="font-serif text-3xl lg:text-4xl font-semibold mb-4"
              style={{ color: "#3E1718" }}
            >
              Galeria
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                onClick={() => setSelectedImage(index)}
                className={`relative rounded-xl overflow-hidden cursor-pointer group ${
                  index === 0
                    ? "col-span-2 row-span-2 aspect-[4/3]"
                    : "aspect-[4/3]"
                }`}
              >
                <Image
                  src={image.src}
                  alt={resolveAlt(image.alt, galleryAlt(projectName, index))}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                {image.label && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {image.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {selectedImage >= 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm"
          onClick={() => setSelectedImage(-1)}
        >
          <button
            onClick={() => setSelectedImage(-1)}
            className="absolute top-4 right-4 lg:top-8 lg:right-8 w-12 h-12 flex items-center justify-center rounded-full bg-[#3E1718]/10 hover:bg-[#3E1718]/20 transition-colors z-50 border border-[#6E2E2A]/20"
            aria-label="Zamknij"
          >
            <X className="w-6 h-6 text-[#3E1718]" />
          </button>
          <div className="absolute top-4 left-4 lg:top-8 lg:left-8 px-4 py-2 rounded-full bg-[#3E1718]/10 text-[#3E1718] text-sm font-medium border border-[#6E2E2A]/20">
            {selectedImage + 1} / {images.length}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handlePrev()
            }}
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all z-50 border border-[#6E2E2A]/20"
            aria-label="Vorheriges Bild"
          >
            <ChevronLeft className="w-7 h-7 lg:w-8 lg:h-8 text-[#3E1718]" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleNext()
            }}
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all z-50 border border-[#6E2E2A]/20"
            aria-label="Nächstes Bild"
          >
            <ChevronRight className="w-7 h-7 lg:w-8 lg:h-8 text-[#3E1718]" />
          </button>
          <div
            className="relative w-[95vw] h-[90vh] lg:w-[90vw] lg:h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selectedImage].src}
              alt={resolveAlt(images[selectedImage].alt, galleryAlt(projectName, selectedImage))}
              width={1600}
              height={1100}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              priority
            />
          </div>
        </div>
      )}
    </>
  )
}
