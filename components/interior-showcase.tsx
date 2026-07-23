"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { numberedSectionAlt } from "@/lib/seo/image-alt"

const interiorImages = [
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/10-1.jpg-JakdJk0xlSKqLQ3K8fZyKuvvXu6CO3.png",
    alt: "Otwarty salon z jadalnią i kuchnią",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/9-1.jpg-9RJlI6NAiWuYeJkx7mVmdHhN6bSb6o.png",
    alt: "Nowoczesna kuchnia",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/8-2.jpg-z8jrfgleBqsV78lLib5OTfc5YMPk1u.png",
    alt: "Przestronny salon ze schodami",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3-5.jpg-crfYtjepayNCjnzX7DMeFqugKYZkfC.png",
    alt: "Przytulna sypialnia na poddaszu",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/4-4.jpg-ymJoRt6aGNLJFJ0e1XDIEzIaFAxr2l.png",
    alt: "Elegancka sypialnia z toaletką",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3-4.jpg-W6DRzmkYhVYAUaFOCDSsBgSjOKBnr3.png",
    alt: "Luksusowa łazienka",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-5.jpg-dxDapnUd5kiqzBZwMRvlQabJ0OBWY8.png",
    alt: "Nowoczesna łazienka na poddaszu",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-5.jpg-SVke9rt1z8lX0KkHP5QzI0SwbTdTAz.png",
    alt: "Stylowa łazienka",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5-4.jpg-5kZsHK8GHwUsFmsuWHUuB1lyMxwQ5x.png",
    alt: "Nowoczesna łazienka z prysznicem",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/4-3.jpg-JSrb9ZKtM4WPQiyKdwDhf4GUTzyPiN.png",
    alt: "Łazienka z wanną",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6-3.jpg-mWrO2hyJpEIJo1lmAdPIaF2sW5UW0k.png",
    alt: "Domowe biuro",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/7-2.jpg-VoUGVf4UKlKhAvEX4C5HesFFkDdprZ.png",
    alt: "Pokój gościnny",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6-4.jpg-CHMKQhnpjzHVcXK7yDZzs0lTdsp2an.png",
    alt: "Pokój dziecięcy na poddaszu",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/7-3.jpg-hclO2HP0ZFr9Jus1IZh7NmvZdmEXIV.png",
    alt: "Jasny pokój dziecięcy",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-4.jpg-WXPDN3LqMMSfGpalVYJpo6eIKu5jdr.png",
    alt: "Nowoczesny przedpokój",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-4.jpg-WzfLLkp2xUQMIHDjWdBckxngJsxmln.png",
    alt: "Funkcjonalna garderoba",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5-5.jpg-rlQ3Xgtmc2WC3f1xwyv0EbTaYs0Zdc.png",
    alt: "Jasny salon",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/8-3.jpg-qDoqamGeF5u5ypsF2siVl9tuZZRQyw.png",
    alt: "Pokój rodzinny",
  },
]

export function InteriorShowcase() {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Duplicate images for seamless infinite scroll
  const duplicatedImages = [...interiorImages, ...interiorImages]

  const openLightbox = (index: number) => {
    // Convert duplicated index to original index
    const originalIndex = index % interiorImages.length
    setCurrentIndex(originalIndex)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? interiorImages.length - 1 : prev - 1))
  }, [])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === interiorImages.length - 1 ? 0 : prev + 1))
  }, [])

  // Keyboard navigation
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

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF9F7] via-[#F8F6F4] to-[#F5F2EF]" />
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 40%, #6E2E2A 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-1/3 h-1/2 opacity-[0.03] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 0% 0%, #6E2E2A 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-1/3 h-1/2 opacity-[0.02] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 100% 100%, #3E1718 0%, transparent 70%)' }} />
      
      {/* Corner Borders */}
      <div className="absolute top-10 left-10 w-28 h-28 border-l-2 border-t-2 border-[#6E2E2A]/10 rounded-tl-3xl hidden lg:block" />
      <div className="absolute bottom-10 right-10 w-28 h-28 border-r-2 border-b-2 border-[#6E2E2A]/10 rounded-br-3xl hidden lg:block" />

      <div className="container mx-auto px-4 lg:px-8 relative mb-12 lg:mb-16">
        {/* Section Header */}
        <div className="text-center">
          <h2 
            className="font-serif text-3xl lg:text-5xl font-semibold mb-5 leading-tight"
            style={{ color: '#3E1718' }}
          >
            <span className="relative inline-block">
              Wnętrza pod klucz
              <div className="absolute -bottom-2 left-0 right-0 h-1 rounded-full opacity-25" style={{ backgroundColor: '#6E2E2A' }} />
            </span>
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg max-w-3xl mx-auto leading-relaxed">
            Tworzymy wnętrza gotowe do zamieszkania — funkcjonalne, estetyczne i dopracowane w każdym detalu.
          </p>
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
                src={image.src}
                alt={numberedSectionAlt("Wnętrza pod klucz", "Jednopiętrowa Warszawa", index % interiorImages.length)}
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
                src={image.src}
                alt={numberedSectionAlt("Wnętrza pod klucz", "Jednopiętrowa Warszawa", (duplicatedImages.length - 1 - index) % interiorImages.length)}
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
            aria-label="Zamknij"
          >
            <svg className="w-6 h-6 text-[#3E1718]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 lg:top-8 lg:left-8 px-4 py-2 rounded-full bg-[#3E1718]/10 text-[#3E1718] text-sm font-medium border border-[#6E2E2A]/20">
            {currentIndex + 1} / {interiorImages.length}
          </div>

          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              goToPrevious()
            }}
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 border border-[#6E2E2A]/20"
            aria-label="Poprzednie zdjęcie"
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
            aria-label="Następne zdjęcie"
          >
            <svg className="w-7 h-7 lg:w-8 lg:h-8 text-[#3E1718]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Main Image */}
          <div 
            className="relative w-[95vw] h-[90vh] lg:w-[90vw] lg:h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={interiorImages[currentIndex].src}
              alt={numberedSectionAlt("Wnętrza pod klucz", "Jednopiętrowa Warszawa", currentIndex)}
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
