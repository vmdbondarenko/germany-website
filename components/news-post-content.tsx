"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { resolveAlt, newsImageAlt } from "@/lib/seo/image-alt"

export type NewsBlockData = {
  id: string
  type: string
  content: string | null
  imageUrl: string | null
  order: number
}

export function NewsPostContent({
  blocks,
  postTitle = "",
}: {
  blocks: NewsBlockData[]
  postTitle?: string
}) {
  const [lightboxIdx, setLightboxIdx] = useState(-1)

  const images = blocks.filter((b) => b.type === "image" && b.imageUrl)
  const imageIndexByBlockId = new Map<string, number>()
  images.forEach((img, idx) => imageIndexByBlockId.set(img.id, idx))

  const handlePrev = () =>
    setLightboxIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  const handleNext = () =>
    setLightboxIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1))

  return (
    <>
      <div className="space-y-8 lg:space-y-10">
        {blocks.map((block) => {
          if (block.type === "paragraph" && block.content) {
            return (
              <div
                key={block.id}
                className="text-base lg:text-lg text-foreground/90 leading-relaxed whitespace-pre-line"
              >
                {block.content}
              </div>
            )
          }
          if (block.type === "image" && block.imageUrl) {
            const idx = imageIndexByBlockId.get(block.id) ?? 0
            return (
              <figure key={block.id} className="space-y-3">
                <div
                  className="relative aspect-[16/9] rounded-xl overflow-hidden shadow-md cursor-pointer group"
                  onClick={() => setLightboxIdx(idx)}
                >
                  <Image
                    src={block.imageUrl}
                    alt={resolveAlt(block.content, newsImageAlt(postTitle, idx))}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 1024px) 100vw, 896px"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                {block.content && (
                  <figcaption className="text-sm text-muted-foreground text-center italic">
                    {block.content}
                  </figcaption>
                )}
              </figure>
            )
          }
          return null
        })}
      </div>

      {images.length > 1 && (
        <section className="mt-16 lg:mt-24">
          <h2
            className="font-serif text-2xl lg:text-3xl font-semibold mb-8 text-center"
            style={{ color: "#3E1718" }}
          >
            Galeria
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {images.map((image, index) => (
              <div
                key={`gallery-${image.id}`}
                onClick={() => setLightboxIdx(index)}
                className={`relative rounded-xl overflow-hidden cursor-pointer group ${
                  index === 0 ? "col-span-2 row-span-2 aspect-[4/3]" : "aspect-[4/3]"
                }`}
              >
                <Image
                  src={image.imageUrl!}
                  alt={resolveAlt(image.content, newsImageAlt(postTitle, index))}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                {image.content && (
                  <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/50 rounded text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity truncate">
                    {image.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {lightboxIdx >= 0 && images[lightboxIdx] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm"
          onClick={() => setLightboxIdx(-1)}
        >
          <button
            onClick={() => setLightboxIdx(-1)}
            className="absolute top-4 right-4 lg:top-8 lg:right-8 w-12 h-12 flex items-center justify-center rounded-full bg-[#3E1718]/10 hover:bg-[#3E1718]/20 transition-colors z-50 border border-[#6E2E2A]/20"
            aria-label="Zamknij"
          >
            <X className="w-6 h-6 text-[#3E1718]" />
          </button>
          <div className="absolute top-4 left-4 lg:top-8 lg:left-8 px-4 py-2 rounded-full bg-[#3E1718]/10 text-[#3E1718] text-sm font-medium border border-[#6E2E2A]/20">
            {lightboxIdx + 1} / {images.length}
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrev()
                }}
                className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all z-50 border border-[#6E2E2A]/20"
                aria-label="Poprzednie zdjęcie"
              >
                <ChevronLeft className="w-7 h-7 lg:w-8 lg:h-8 text-[#3E1718]" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleNext()
                }}
                className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all z-50 border border-[#6E2E2A]/20"
                aria-label="Następne zdjęcie"
              >
                <ChevronRight className="w-7 h-7 lg:w-8 lg:h-8 text-[#3E1718]" />
              </button>
            </>
          )}
          <div
            className="relative w-[95vw] h-[90vh] lg:w-[90vw] lg:h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIdx].imageUrl!}
              alt={resolveAlt(images[lightboxIdx].content, newsImageAlt(postTitle, lightboxIdx))}
              width={1600}
              height={1100}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              priority
            />
            {images[lightboxIdx].content && (
              <div className="mt-4 px-4 py-2 bg-white/80 rounded-lg text-[#3E1718] text-sm max-w-xl text-center">
                {images[lightboxIdx].content}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
