"use client"

import { useEffect, useState, useRef } from "react"

const services = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    title: "Bezpłatne wsparcie kredytowe",
    description: "Oferujemy możliwość skorzystania z bezpłatnego wsparcia eksperta kredytowego.",
    accent: "#6E2E2A",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
    title: "Ekipy wykończeniowe",
    description: "Polecamy sprawdzone i doświadczone ekipy wykończeniowe.",
    accent: "#5A2A1C",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
    title: "Programy rządowe",
    description: "Oferowane nieruchomości spełniają wymagania programów rządowych.",
    accent: "#3E1718",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    title: "Dla obywateli spoza UE",
    description: "Nasze lokale mogą kupować obywatele spoza UE bez zezwolenia od MSWiA.",
    accent: "#6E2E2A",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
    title: "Wykończenie pod klucz",
    description: "Oferujemy kompleksowe wykonczenie mieszkania pod klucz - wprowadż sie do w pelni przygotowanego lokalu bez dodatkowych prac.",
    accent: "#5A2A1C",
  },
]

export function Services() {
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
              Jak jeszcze możemy pomóc?
              <div 
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full opacity-30"
                style={{ backgroundColor: '#6E2E2A' }}
              />
            </span>
          </h2>
          
          <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            Kompleksowe wsparcie na każdym etapie zakupu i wykończenia nieruchomości
          </p>
        </div>

        {/* Services Grid */}
        <div ref={sectionRef} className="max-w-6xl mx-auto">
          {/* First Row - 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-6 lg:mb-8">
            {services.slice(0, 3).map((service, index) => (
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
                  style={{ borderColor: service.accent }}
                />
                
                {/* Gradient Hover Effect */}
                <div 
                  className="absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `linear-gradient(145deg, ${service.accent}05, transparent)` }}
                />
                
                {/* Content */}
                <div className="relative">
                  {/* Icon Container */}
                  <div className="mb-6">
                    <div 
                      className="inline-flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                      style={{ 
                        background: `linear-gradient(145deg, ${service.accent}15, ${service.accent}08)`,
                        color: service.accent,
                      }}
                    >
                      {service.icon}
                    </div>
                  </div>
                  
                  {/* Accent Line */}
                  <div className="flex items-center gap-2 mb-4">
                    <div 
                      className="w-8 h-0.5 rounded-full transition-all duration-300 group-hover:w-12"
                      style={{ backgroundColor: service.accent }}
                    />
                    <div 
                      className="w-1.5 h-1.5 rounded-full opacity-50 transition-transform duration-300 group-hover:scale-150"
                      style={{ backgroundColor: service.accent }}
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
                  style={{ borderColor: service.accent }}
                />
              </div>
            ))}
          </div>
          
          {/* Second Row - 2 Cards Centered */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {services.slice(3).map((service, index) => (
              <div
                key={index + 3}
                className={`group relative rounded-3xl p-8 transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${(index + 3) * 100}ms` }}
              >
                {/* Card Background */}
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 transition-all duration-300 group-hover:shadow-xl group-hover:bg-white/90" />
                <div 
                  className="absolute inset-0 rounded-3xl border opacity-0 transition-opacity duration-300 group-hover:opacity-30"
                  style={{ borderColor: service.accent }}
                />
                
                {/* Gradient Hover Effect */}
                <div 
                  className="absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `linear-gradient(145deg, ${service.accent}05, transparent)` }}
                />
                
                {/* Content */}
                <div className="relative">
                  {/* Icon Container */}
                  <div className="mb-6">
                    <div 
                      className="inline-flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                      style={{ 
                        background: `linear-gradient(145deg, ${service.accent}15, ${service.accent}08)`,
                        color: service.accent,
                      }}
                    >
                      {service.icon}
                    </div>
                  </div>
                  
                  {/* Accent Line */}
                  <div className="flex items-center gap-2 mb-4">
                    <div 
                      className="w-8 h-0.5 rounded-full transition-all duration-300 group-hover:w-12"
                      style={{ backgroundColor: service.accent }}
                    />
                    <div 
                      className="w-1.5 h-1.5 rounded-full opacity-50 transition-transform duration-300 group-hover:scale-150"
                      style={{ backgroundColor: service.accent }}
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
                  style={{ borderColor: service.accent }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
