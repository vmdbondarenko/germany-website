"use client"

import { useEffect, useState, useRef } from "react"
import { DynamicIcon } from "@/components/dynamic-icon"
import type { FeatureSection } from "@/lib/home-content"

const ACCENTS = ["#6E2E2A", "#5A2A1C", "#3E1718"]

export function Services({ content }: { content: FeatureSection }) {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="jak-pomagamy" className="py-20 lg:py-28 relative overflow-hidden">
      {/* Premium Layered Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF9F7] via-[#F8F6F4] to-[#F5F2EF]" />

      {/* Decorative Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 30% 20%, #6E2E2A 1.5px, transparent 1.5px),
            radial-gradient(circle at 70% 80%, #3E1718 1px, transparent 1px)
          `,
          backgroundSize: '70px 70px, 50px 50px',
        }}
      />

      {/* Gradient Orbs */}
      <div
        className="absolute top-0 right-0 w-1/2 h-1/2 opacity-[0.04] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 100% 0%, #6E2E2A 0%, transparent 60%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-1/2 h-1/2 opacity-[0.03] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 0% 100%, #3E1718 0%, transparent 60%)' }}
      />

      {/* Decorative Lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6E2E2A]/15 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6E2E2A]/15 to-transparent" />

      {/* Corner Accents */}
      <div className="absolute top-12 left-12 w-32 h-32 border-l-2 border-t-2 border-[#6E2E2A]/8 rounded-tl-3xl hidden lg:block" />
      <div className="absolute bottom-12 right-12 w-32 h-32 border-r-2 border-b-2 border-[#6E2E2A]/8 rounded-br-3xl hidden lg:block" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center mb-14 lg:mb-20">
          {/* Icon Badge */}
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 border shadow-lg"
            style={{
              background: 'linear-gradient(145deg, rgba(110,46,42,0.1), rgba(90,42,28,0.05))',
              borderColor: 'rgba(110,46,42,0.15)',
            }}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: '#6E2E2A' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>

          <h2
            className="font-serif text-3xl lg:text-5xl font-semibold mb-5 leading-tight"
            style={{ color: '#3E1718' }}
          >
            <span className="relative inline-block">
              {content.heading}
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full opacity-30"
                style={{ backgroundColor: '#6E2E2A' }}
              />
            </span>
          </h2>

          <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            {content.description}
          </p>
        </div>

        {/* Services Grid */}
        <div ref={sectionRef} className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {content.items.map((service, index) => {
              const accent = ACCENTS[index % ACCENTS.length]
              return (
                <div
                  key={index}
                  className={`group relative rounded-3xl p-8 transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Card Background */}
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 transition-all duration-300 group-hover:shadow-xl group-hover:bg-white/90" />
                  <div
                    className="absolute inset-0 rounded-3xl border opacity-0 transition-opacity duration-300 group-hover:opacity-30"
                    style={{ borderColor: accent }}
                  />

                  {/* Gradient Hover Effect */}
                  <div
                    className="absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: `linear-gradient(145deg, ${accent}05, transparent)` }}
                  />

                  {/* Content */}
                  <div className="relative">
                    {/* Icon Container */}
                    <div className="mb-6">
                      <div
                        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                        style={{
                          background: `linear-gradient(145deg, ${accent}15, ${accent}08)`,
                          color: accent,
                        }}
                      >
                        <DynamicIcon name={service.icon} className="w-7 h-7" />
                      </div>
                    </div>

                    {/* Accent Line */}
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className="w-8 h-0.5 rounded-full transition-all duration-300 group-hover:w-12"
                        style={{ backgroundColor: accent }}
                      />
                      <div
                        className="w-1.5 h-1.5 rounded-full opacity-50 transition-transform duration-300 group-hover:scale-150"
                        style={{ backgroundColor: accent }}
                      />
                    </div>

                    <h3
                      className="font-serif text-xl lg:text-2xl font-semibold mb-3"
                      style={{ color: '#3E1718' }}
                    >
                      {service.title}
                    </h3>

                    <p className="text-muted-foreground text-sm lg:text-base leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Corner Accent */}
                  <div
                    className="absolute bottom-4 right-4 w-6 h-6 rounded-tr-xl border-t border-r opacity-0 transition-opacity duration-300 group-hover:opacity-30"
                    style={{ borderColor: accent }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
