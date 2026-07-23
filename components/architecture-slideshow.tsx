"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Play, Pause, MapPin } from "lucide-react"

type SlideData = {
  image: string
  title: string
  address: string
  status: string
  availability: string
  href: string
  description: string | null
  keyFeatures: { title: string; subtitle: string | null }[]
}

export function ArchitectureSlideshow({ dbSlides = [] }: { dbSlides?: SlideData[] }) {
  const slides = dbSlides

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const goToNextSlide = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
      setIsTransitioning(false)
    }, 500)
  }, [slides.length])

  const goToPrevSlide = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
      setIsTransitioning(false)
    }, 500)
  }, [slides.length])

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      goToNextSlide()
    }, 5000)

    return () => clearInterval(interval)
  }, [isPaused, goToNextSlide])

  const goToSlide = (index: number) => {
    if (index !== currentSlide) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentSlide(index)
        setIsTransitioning(false)
      }, 500)
    }
  }

  const current = slides[currentSlide]

  const cardInner = (
    <>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'rgba(110, 46, 42, 0.8)', color: 'rgba(255, 255, 255, 0.9)' }}
        >
          {current.status}
        </span>
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'rgba(62, 23, 24, 0.8)', color: 'rgba(255, 255, 255, 0.9)' }}
        >
          {current.availability}
        </span>
      </div>
      <h3 className="font-serif text-lg lg:text-xl font-semibold mb-1" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
        {current.title}
      </h3>
      <p className="text-[10px] mb-2 flex items-center gap-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
        <MapPin className="w-2.5 h-2.5 shrink-0" />
        {current.address}
      </p>
      {current.keyFeatures.length > 0 ? (
        <ul className="space-y-1 mb-3">
          {current.keyFeatures.slice(0, 4).map((f, idx) => (
            <li
              key={idx}
              className="text-[10px] leading-relaxed flex items-start gap-1.5"
              style={{ color: 'rgba(255, 255, 255, 0.8)' }}
            >
              <span className="mt-1 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: '#6E2E2A' }} />
              <span>
                <span style={{ color: 'rgba(255,255,255,0.95)' }}>{f.title}</span>
                {f.subtitle && <span style={{ color: 'rgba(255,255,255,0.65)' }}> — {f.subtitle}</span>}
              </span>
            </li>
          ))}
        </ul>
      ) : current.description ? (
        <p className="text-[10px] mb-3 line-clamp-3" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          {current.description}
        </p>
      ) : null}
      <a
        href={current.href}
        className="inline-block text-[11px] font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:opacity-90 shadow-md"
        style={{ backgroundColor: '#6E2E2A', color: 'rgba(255, 255, 255, 0.95)' }}
      >
        Zobacz inwestycję
      </a>
    </>
  )

  const controlsInner = (
    <>
      <button
        onClick={goToPrevSlide}
        className="p-2 rounded-full backdrop-blur-md border border-white/20 transition-all duration-300 hover:bg-white/20"
        style={{ backgroundColor: 'rgba(18, 10, 10, 0.5)' }}
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-4 h-4 text-white/90" />
      </button>
      <button
        onClick={() => setIsPaused(!isPaused)}
        className="p-2 rounded-full backdrop-blur-md border border-white/20 transition-all duration-300 hover:bg-white/20"
        style={{ backgroundColor: 'rgba(18, 10, 10, 0.5)' }}
        aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
      >
        {isPaused ? <Play className="w-4 h-4 text-white/90" /> : <Pause className="w-4 h-4 text-white/90" />}
      </button>
      <button
        onClick={goToNextSlide}
        className="p-2 rounded-full backdrop-blur-md border border-white/20 transition-all duration-300 hover:bg-white/20"
        style={{ backgroundColor: 'rgba(18, 10, 10, 0.5)' }}
        aria-label="Next slide"
      >
        <ChevronRight className="w-4 h-4 text-white/90" />
      </button>
      <div className="w-px h-6 bg-white/20 mx-1" />
      <div className="flex items-center gap-1.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`rounded-full transition-all duration-300 ${
              index === currentSlide ? "w-6 h-2" : "w-2 h-2 hover:bg-white/60"
            }`}
            style={{
              backgroundColor: index === currentSlide ? '#6E2E2A' : 'rgba(255, 255, 255, 0.4)',
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </>
  )

  return (
    <section className="relative w-full">
      {/* Image area — tall on desktop, compact on mobile */}
      <div className="relative w-full h-[45vh] sm:h-[55vh] lg:h-[80vh] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide
                ? isTransitioning
                  ? "opacity-0 scale-105"
                  : "opacity-100 scale-100"
                : "opacity-0 scale-110"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover"
              priority={index === 0}
              loading={index === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        ))}

        {/* Desktop-only overlay card */}
        <div className="hidden lg:block absolute bottom-10 left-12 w-80">
          <div
            className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-5 shadow-xl transition-all duration-500 ${
              isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}
          >
            {cardInner}
          </div>
        </div>

        {/* Desktop-only overlay controls */}
        <div className="hidden lg:flex absolute bottom-10 right-12 items-center gap-3">
          {controlsInner}
        </div>
      </div>

      {/* Mobile-only: card + controls in a dark strip below the image */}
      <div className="lg:hidden" style={{ backgroundColor: '#2a1010' }}>
        <div className="px-4 pt-5 pb-3">
          <div
            className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-5 shadow-xl transition-all duration-500 ${
              isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
            }`}
          >
            {cardInner}
          </div>
        </div>
        <div className="px-4 pb-4 flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide">
          {controlsInner}
        </div>
      </div>
    </section>
  )
}
