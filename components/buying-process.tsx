"use client"

import { useRef, useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { DynamicIcon } from "@/components/dynamic-icon"
import type { BuyingContent } from "@/lib/home-content"

// Fixed decorative icons for the buying steps, indexed by step position. The
// step copy itself is admin-managed and per-locale (see lib/home-content.ts).
const STEP_ICONS = [
  <svg key="1" className="w-8 h-8 lg:w-10 lg:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
  <svg key="2" className="w-8 h-8 lg:w-10 lg:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10c0-1 1-2 2-2h10c1 0 2 1 2 2v1c0 .5-.5 1-1 1H6c-.5 0-1-.5-1-1v-1z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 12v6c0 1 1 2 2 2h8c1 0 2-1 2-2v-6" /></svg>,
  <svg key="3" className="w-8 h-8 lg:w-10 lg:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 14l-3 3-1.5-1.5" /></svg>,
  <svg key="4" className="w-8 h-8 lg:w-10 lg:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg key="5" className="w-8 h-8 lg:w-10 lg:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664M9.75 3.104c.251.023.501.05.75.082m-1.5-.082A2.25 2.25 0 007.5 5.25v1.5m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H7.5z" /></svg>,
  <svg key="6" className="w-8 h-8 lg:w-10 lg:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>,
  <svg key="7" className="w-8 h-8 lg:w-10 lg:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 11v4m0 0l-2-2m2 2l2-2" /></svg>,
]

export function BuyingProcess({ content }: { content: BuyingContent }) {
  const tc = useTranslations("common")
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftStart, setScrollLeftStart] = useState(0)

  const updateScrollState = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 10)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', updateScrollState)
      updateScrollState()
      return () => container.removeEventListener('scroll', updateScrollState)
    }
  }, [])

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX
    setStartX(pageX)
    setScrollLeftStart(scrollContainerRef.current?.scrollLeft || 0)
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX
    const walk = (startX - pageX) * 1.5
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeftStart + walk
    }
  }

  const handleDragEnd = () => setIsDragging(false)

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5F1ED] via-[#FAF8F6] to-[#F8F5F2]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#6E2E2A]/[0.02] via-transparent to-[#5A2A1C]/[0.03]" />
      </div>

      {/* Subtle Dot Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at center, #3E1718 1.5px, transparent 1.5px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center mb-16 lg:mb-20">
          <h2
            className="font-serif text-4xl lg:text-5xl xl:text-6xl font-semibold leading-tight tracking-tight"
            style={{ color: '#3E1718' }}
          >
            {content.heading}
          </h2>
        </div>

        {/* Scrollable Cards Container */}
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full transition-all duration-300 -ml-2 lg:-ml-6 ${
              canScrollLeft
                ? 'bg-white shadow-xl hover:shadow-2xl border border-[#6E2E2A]/10 hover:border-[#6E2E2A]/20 hover:scale-105'
                : 'bg-white/50 shadow-md border border-[#6E2E2A]/5 cursor-not-allowed opacity-50'
            }`}
            aria-label={tc("scrollLeft")}
          >
            <svg className={`w-6 h-6 lg:w-7 lg:h-7 transition-colors ${canScrollLeft ? 'text-[#3E1718]' : 'text-[#3E1718]/30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full transition-all duration-300 -mr-2 lg:-mr-6 ${
              canScrollRight
                ? 'bg-white shadow-xl hover:shadow-2xl border border-[#6E2E2A]/10 hover:border-[#6E2E2A]/20 hover:scale-105'
                : 'bg-white/50 shadow-md border border-[#6E2E2A]/5 cursor-not-allowed opacity-50'
            }`}
            aria-label={tc("scrollRight")}
          >
            <svg className={`w-6 h-6 lg:w-7 lg:h-7 transition-colors ${canScrollRight ? 'text-[#3E1718]' : 'text-[#3E1718]/30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Gradient Fade Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F8F5F2] via-[#F8F5F2]/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F8F5F2] via-[#F8F5F2]/80 to-transparent z-10 pointer-events-none" />

          {/* Cards */}
          <div
            ref={scrollContainerRef}
            className={`flex gap-6 lg:gap-8 overflow-x-auto scrollbar-hide px-12 lg:px-20 pb-6 -mx-4 lg:-mx-8 snap-x snap-mandatory ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            {content.steps.map((step, index) => (
              <div
                key={index}
                className="group flex-shrink-0 w-[340px] lg:w-[380px] relative snap-center select-none"
              >
                <div className="h-full bg-white rounded-3xl p-7 lg:p-9 shadow-lg hover:shadow-2xl transition-all duration-500 border border-[#6E2E2A]/[0.07] hover:border-[#6E2E2A]/15 relative overflow-hidden group-hover:-translate-y-1">
                  <div
                    className="absolute -top-6 -right-6 font-serif text-[200px] lg:text-[240px] font-bold leading-none opacity-[0.06] pointer-events-none select-none group-hover:opacity-[0.09] transition-opacity duration-500"
                    style={{ color: '#5A2A1C' }}
                  >
                    {index + 1}
                  </div>

                  <div className="relative mb-7">
                    <div
                      className="rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#5A2A1C]/25 group-hover:shadow-xl group-hover:shadow-[#5A2A1C]/30 transition-all duration-300"
                      style={{
                        background: 'linear-gradient(135deg, #5A2A1C 0%, #3E1718 100%)',
                        width: '72px',
                        height: '72px',
                      }}
                    >
                      {STEP_ICONS[index % STEP_ICONS.length]}
                    </div>
                  </div>

                  <div className="relative">
                    <h3
                      className="font-serif text-xl lg:text-2xl font-semibold mb-4 leading-snug pr-4"
                      style={{ color: '#3E1718' }}
                    >
                      {step.title}
                    </h3>

                    {index === 0 && (
                      <a
                        href="#kontakt"
                        className="inline-flex items-center gap-2.5 mt-3 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-[#5A2A1C]/25 hover:-translate-y-0.5"
                        style={{ background: 'linear-gradient(135deg, #6E2E2A 0%, #5A2A1C 100%)' }}
                      >
                        {tc("contact")}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How else can we help */}
        <div className="mt-24 lg:mt-32">
          <div className="text-center mb-12 lg:mb-16">
            <h2
              className="font-serif text-4xl lg:text-5xl xl:text-6xl font-semibold leading-tight tracking-tight"
              style={{ color: '#3E1718' }}
            >
              {content.helpHeading}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {content.help.map((card, index) => (
              <div key={index} className="group bg-white rounded-3xl p-8 lg:p-10 shadow-lg hover:shadow-2xl transition-all duration-500 border border-[#6E2E2A]/[0.07] hover:border-[#6E2E2A]/15 hover:-translate-y-1">
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#5A2A1C]/25 group-hover:shadow-xl group-hover:shadow-[#5A2A1C]/30 transition-all duration-300 mb-6"
                    style={{ background: 'linear-gradient(135deg, #5A2A1C 0%, #3E1718 100%)' }}
                  >
                    <DynamicIcon name={card.icon} className="w-10 h-10 lg:w-12 lg:h-12" />
                  </div>
                  <p className="text-lg lg:text-xl font-medium leading-relaxed" style={{ color: '#3E1718' }}>
                    {card.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* About the Investor */}
        <div className="mt-24 lg:mt-32">
          <div className="text-center mb-12 lg:mb-16">
            <p className="text-sm lg:text-base font-medium tracking-[0.2em] uppercase mb-4" style={{ color: '#6E2E2A' }}>
              {content.investor.eyebrow}
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-semibold leading-tight tracking-tight" style={{ color: '#3E1718' }}>
              {content.investor.heading}
            </h2>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-[#6E2E2A]/[0.07] overflow-hidden">
              <div className="flex flex-col lg:flex-row items-center">
                {/* Left Side - Text */}
                <div className="flex-1 p-8 lg:p-12 xl:p-16">
                  <div className="max-w-xl">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-[2px] bg-gradient-to-r from-[#6E2E2A] to-[#6E2E2A]/30" />
                      <span className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: '#6E2E2A' }}>
                        {content.investor.experienceBadge}
                      </span>
                    </div>

                    {content.investor.paragraphs.map((para, i) => (
                      <p key={i} className="text-lg lg:text-xl leading-relaxed mb-8" style={{ color: '#4A4A4A' }}>
                        {para}
                      </p>
                    ))}

                    <a
                      href={content.investor.ctaHref}
                      className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-white text-base font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-[#5A2A1C]/25 hover:-translate-y-0.5 group"
                      style={{ background: 'linear-gradient(135deg, #6E2E2A 0%, #5A2A1C 100%)' }}
                    >
                      {content.investor.ctaLabel}
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Right Side - Brand swatches (editable colors, matching the
                    former four-block brand logo). */}
                <div className="flex-1 p-8 lg:p-12 xl:p-16 flex items-center justify-center">
                  <div className="w-56 lg:w-72 xl:w-80 flex gap-1.5 lg:gap-2" role="img" aria-label={content.investor.heading}>
                    {content.investor.swatches.map((color, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-md shadow-sm"
                        style={{
                          aspectRatio: '2.2 / 1',
                          background: `linear-gradient(135deg, ${color} 0%, ${color} 55%, rgba(0,0,0,0.18) 100%)`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
