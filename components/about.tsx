"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X, Clock, Zap, Wrench, Hammer, Building, Building2, Home, MapPin, Star, Check, Timer, HardHat, TrendingUp } from "lucide-react"
import { numberedSectionAlt } from "@/lib/seo/image-alt"

const INVESTMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock, Zap, Wrench, Hammer, Building, Building2, Home, MapPin, Star, Check, Timer, HardHat, TrendingUp,
}

function InvestmentIcon({ name, className }: { name: string; className?: string }) {
  const Icon = INVESTMENT_ICONS[name] || Clock
  return <Icon className={className} />
}

type UpcomingInvestment = { id: string; title: string; description: string; status: string; statusColor: string; icon: string }
type NewCity = { id: string; city: string; date: string }
type AboutSectionData = { companyName: string; description: string; photos?: unknown } | null

// Default company name + history (German) shown until an admin overrides them in
// the DB (AboutSection). Paragraphs are separated by a blank line; the section
// splits on "\n\n".
const DEFAULT_COMPANY_NAME = "Projektentwicklung Einstöckiges Berlin GmbH"
const DEFAULT_ABOUT_DESCRIPTION = [
  "Seit 2026 sind wir unter dem Namen Projektentwicklung Einstöckiges Berlin GmbH als Projektentwickler in Berlin tätig. Dieser Schritt ist die konsequente Fortsetzung eines langjährigen Weges, der auf Erfahrung, Qualität und dem Vertrauen unserer Kunden basiert.",
  "Unsere Geschichte begann 2016 in der Ukraine. Unter dem Namen „Einstöckiges Kiew“ realisierten wir hochwertige Einfamilienhäuser aus Ziegeln im charakteristischen Stil des Bayerischen Mauerwerks. Ein besonderes Merkmal unserer Projekte ist der Einsatz exklusiver handgeformter Ziegel. Diese werden heute ausschließlich für unsere Bauvorhaben produziert und direkt nach dem Brennvorgang aus dem Ziegelwerk geliefert. So können wir eine gleichbleibend hohe Qualität und die unverwechselbare Optik jedes einzelnen Hauses gewährleisten.",
  "Ausgehend von Kiew erweiterten wir unsere Tätigkeit kontinuierlich und realisierten erfolgreich Projekte auch in Lwiw, Tscherniwzi und Dnipro.",
  "Im Jahr 2022 traten wir unter dem Namen „Einstöckige Warschau“ in den europäischen Markt ein. Den Auftakt bildete ein Doppelhaus in einem Vorort der polnischen Hauptstadt. In den darauffolgenden vier Jahren wuchs das Unternehmen deutlich und erweiterte seine Projektentwicklung auf weitere Städte wie Breslau, Krakau und Posen.",
  "2025 erschlossen wir einen weiteren Markt und begannen mit der Entwicklung neuer Wohnprojekte im Umland von Baku in Aserbaidschan. Damit setzten wir unseren internationalen Wachstumskurs konsequent fort.",
  "Heute entwickeln und realisieren wir erfolgreich Projekte in allen Ländern, in denen wir vertreten sind.",
  "Unabhängig vom Land folgen alle unsere Häuser derselben Philosophie: zeitlose Architektur, hochwertige Materialien, durchdachte Grundrisse und eine präzise Ausführung bis ins kleinste Detail.",
].join("\n\n")

export function About({ upcomingInvestments, newCities, aboutSection }: { upcomingInvestments: UpcomingInvestment[]; newCities: NewCity[]; aboutSection: AboutSectionData }) {
  const [isVisible, setIsVisible] = useState(false)
  const [expansionVisible, setExpansionVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const expansionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    const expansionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setExpansionVisible(true)
        }
      },
      { threshold: 0.15 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }
    if (expansionRef.current) {
      expansionObserver.observe(expansionRef.current)
    }

    return () => {
      observer.disconnect()
      expansionObserver.disconnect()
    }
  }, [])

  const [selectedImageIndex, setSelectedImageIndex] = useState(-1)
  const [selectedTechImageIndex, setSelectedTechImageIndex] = useState(-1)

  const dbPhotos = Array.isArray(aboutSection?.photos) ? (aboutSection.photos as string[]) : []
  // "O firmie" section override: alt is the numbered section format for every
  // image (overrides authored alts), index = image sequence.
  const companySrcs = dbPhotos.length > 0
    ? dbPhotos
    : ["/images/house-main.jpg", "/images/house-balcony.jpg", "/images/house-terrace.jpg"]
  const companyImages = companySrcs.map((src, i) => ({
    src,
    alt: numberedSectionAlt("Unternehmensgeschichte", "", i),
  }))

  const techImages = [
    { src: "/images/tech-house-main.jpg", alt: numberedSectionAlt("Bauweise und Entwicklung", "", 0) },
    { src: "/images/tech-houses-twin.jpg", alt: numberedSectionAlt("Bauweise und Entwicklung", "", 1) },
  ]

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? companyImages.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev === companyImages.length - 1 ? 0 : prev + 1))
  }

  const handlePrevTechImage = () => {
    setSelectedTechImageIndex((prev) => (prev === 0 ? techImages.length - 1 : prev - 1))
  }

  const handleNextTechImage = () => {
    setSelectedTechImageIndex((prev) => (prev === techImages.length - 1 ? 0 : prev + 1))
  }

  const stats = [
    { value: "10+", label: "Jahre Erfahrung" },
    { value: "900+", label: "gebaute Häuser" },
    { value: "96 %", label: "der Bauprojekte termingerecht übergeben" },
  ]

  return (
    <section id="unternehmen" className="py-12 lg:py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 lg:mb-32">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="font-serif text-5xl lg:text-6xl font-semibold text-primary mb-2">
                {stat.value}
              </p>
              <p className="text-muted-foreground text-base lg:text-lg">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Expansion Section - Upcoming Investments */}
        <div className="mb-20 lg:mb-32 py-16 lg:py-24 -mx-4 lg:-mx-8 px-4 lg:px-8 rounded-3xl relative overflow-hidden">
          {/* Premium Background with Layered Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#F8F6F4] via-[#FAF9F7] to-[#F5F2EF]" />
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 30%, #6E2E2A 1px, transparent 1px), radial-gradient(circle at 80% 70%, #5A2A1C 1px, transparent 1px)`,
              backgroundSize: '60px 60px, 80px 80px',
            }}
          />
          <div 
            className="absolute top-0 left-0 w-1/2 h-full opacity-[0.04] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 0% 0%, #6E2E2A 0%, transparent 70%)' }}
          />
          <div 
            className="absolute bottom-0 right-0 w-1/2 h-full opacity-[0.03] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 100% 100%, #3E1718 0%, transparent 70%)' }}
          />
          
          {/* Decorative Corner Elements */}
          <div className="absolute top-8 left-8 w-24 h-24 border-l-2 border-t-2 border-[#6E2E2A]/10 rounded-tl-3xl" />
          <div className="absolute bottom-8 right-8 w-24 h-24 border-r-2 border-b-2 border-[#6E2E2A]/10 rounded-br-3xl" />
          
          {/* Section Header */}
          <div className="relative text-center mb-14 lg:mb-20">
            <h2 className="font-serif text-3xl lg:text-5xl font-semibold mb-5 leading-tight" style={{ color: '#3E1718' }}>
              Bald beginnen wir mit dem Bau
              <br />
              <span className="relative inline-block mt-1">
                weiterer Projekte!
                <div className="absolute -bottom-2 left-0 right-0 h-1 rounded-full opacity-30" style={{ backgroundColor: '#6E2E2A' }} />
              </span>
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
              Neue Standorte, neue Entwicklungsphasen und weitere Projekte an sorgfältig ausgewählten Orten.
            </p>
          </div>

          {/* Featured Investments */}
          <div ref={expansionRef} className="mb-16 lg:mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              {/* First Card - Large */}
              {upcomingInvestments[0] && (
              <div
                className={`lg:col-span-7 group relative bg-card rounded-3xl p-8 lg:p-10 border border-border/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ${
                  expansionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: "0ms" }}
              >
                <div className="mb-6">
                  {/* Premium Status Badge */}
                  <div className="inline-flex items-center gap-2.5 relative">
                    <div 
                      className="absolute inset-0 rounded-full blur-md opacity-30"
                      style={{ backgroundColor: upcomingInvestments[0].statusColor }}
                    />
                    <div 
                      className="relative flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-sm"
                      style={{ 
                        background: `linear-gradient(135deg, ${upcomingInvestments[0].statusColor}, ${upcomingInvestments[0].statusColor}dd)`,
                        borderColor: 'rgba(255,255,255,0.15)',
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                        <div className="w-1 h-1 rounded-full bg-white/50" />
                      </div>
                      <span className="text-[11px] font-semibold tracking-wide text-white/95 uppercase">
                        {upcomingInvestments[0].status}
                      </span>
                      <InvestmentIcon name={upcomingInvestments[0].icon} className="w-3.5 h-3.5 text-white/70" />
                    </div>
                  </div>
                </div>
                <div 
                  className="w-16 h-1 rounded-full mb-6 transition-all duration-300 group-hover:w-24"
                  style={{ backgroundColor: '#6E2E2A' }}
                />
                <h3 className="font-serif text-2xl lg:text-3xl font-semibold mb-4" style={{ color: '#3E1718' }}>
                  {upcomingInvestments[0].title}
                </h3>
                <p className="text-muted-foreground text-base lg:text-lg leading-relaxed whitespace-pre-line">
                  {upcomingInvestments[0].description}
                </p>
                <div
                  className="absolute bottom-0 right-0 w-20 h-20 rounded-tl-3xl rounded-br-3xl opacity-5"
                  style={{ backgroundColor: '#6E2E2A' }}
                />
              </div>
              )}

              {/* Second and Third Cards */}
              <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8">
                {upcomingInvestments.slice(1).map((investment, index) => (
                  <div 
                    key={index}
                    className={`group relative bg-card rounded-2xl p-6 lg:p-8 border border-border/40 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500 flex-1 ${
                      expansionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    }`}
                    style={{ transitionDelay: `${(index + 1) * 150}ms` }}
                  >
                    <div className="mb-4">
                      {/* Premium Status Badge */}
                      <div className="inline-flex items-center gap-2 relative">
                        <div 
                          className="absolute inset-0 rounded-full blur-md opacity-25"
                          style={{ backgroundColor: investment.statusColor }}
                        />
                        <div 
                          className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-full border shadow-sm"
                          style={{ 
                            background: `linear-gradient(135deg, ${investment.statusColor}, ${investment.statusColor}dd)`,
                            borderColor: 'rgba(255,255,255,0.15)',
                          }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                          <span className="text-[10px] font-semibold tracking-wide text-white/95 uppercase">
                            {investment.status}
                          </span>
                          <InvestmentIcon name={investment.icon} className="w-3 h-3 text-white/70" />
                        </div>
                      </div>
                    </div>
                    <div 
                      className="w-10 h-0.5 rounded-full mb-4 transition-all duration-300 group-hover:w-16"
                      style={{ backgroundColor: investment.statusColor }}
                    />
                    <h3 className="font-serif text-xl lg:text-2xl font-semibold mb-2" style={{ color: '#3E1718' }}>
                      {investment.title}
                    </h3>
                    <p className="text-muted-foreground text-sm lg:text-base leading-relaxed whitespace-pre-line">
                      {investment.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* New Cities Panel */}
          <div 
            className={`relative rounded-3xl p-8 lg:p-14 overflow-hidden transition-all duration-700 ${
              expansionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "450ms" }}
          >
            {/* Premium Panel Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#3E1718] via-[#4A1F1E] to-[#2A0F0E]" />
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zM22.344 0L13.858 8.485 15.272 9.9l9.9-9.9h-2.828zM32 0l-3.486 3.485-1.414-1.414L30.172 0H32z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              }}
            />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#6E2E2A] to-transparent opacity-40" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#6E2E2A] to-transparent opacity-40" />
            
            {/* Decorative Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse, #6E2E2A, transparent)' }} />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header with Icon */}
              <div className="text-center mb-12 lg:mb-14">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 border border-white/10" style={{ background: 'linear-gradient(135deg, rgba(110,46,42,0.4), rgba(90,42,28,0.2))' }}>
                  <svg className="w-8 h-8 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <h3 className="font-serif text-2xl lg:text-4xl font-semibold mb-3 text-white">
                  Wir bauen bald in weiteren Städten!
                </h3>
                <p className="text-white/60 text-sm lg:text-base max-w-xl mx-auto">
                  Wir erweitern unsere Tätigkeit auf neue Märkte
                </p>
              </div>
              
              {/* Cities Cards */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 lg:gap-10 mb-12 lg:mb-14">
                {newCities.map((item, index) => (
                  <div 
                    key={index}
                    className={`group relative rounded-2xl px-12 lg:px-20 py-8 lg:py-10 text-center border border-white/10 hover:border-white/25 transition-all duration-500 hover:scale-105 ${
                      expansionVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    }`}
                    style={{ 
                      transitionDelay: `${600 + index * 150}ms`,
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {/* Shine Effect */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </div>
                    
                    <p className="font-serif text-3xl lg:text-4xl font-bold tracking-wider mb-3 text-white relative">
                      {item.city}
                    </p>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-8 h-px bg-gradient-to-r from-transparent to-[#6E2E2A]" />
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6E2E2A' }} />
                      <div className="w-8 h-px bg-gradient-to-l from-transparent to-[#6E2E2A]" />
                    </div>
                    <p className="text-sm lg:text-base font-medium text-white/70">
                      {item.date}
                    </p>
                    
                    {/* Bottom Glow */}
                    <div 
                      className="absolute -bottom-px left-1/2 -translate-x-1/2 w-20 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"
                      style={{ backgroundColor: '#6E2E2A' }}
                    />
                  </div>
                ))}
              </div>
              
              {/* Footer Note */}
              <div className="text-center">
                <div className="inline-flex flex-col items-center gap-3 px-8 py-5 rounded-2xl border border-white/10 bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-1">
                      <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: '#6E2E2A' }} />
                      <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: '#5A2A1C' }} />
                      <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: '#3E1718' }} />
                    </div>
                    <p className="text-white font-medium text-base lg:text-lg">
                      Häuser in Kiew, Lwiw und Baku
                    </p>
                  </div>
                  <p className="text-white/60 text-sm lg:text-base max-w-lg text-center leading-relaxed">
                    In unserem Angebot finden Sie außerdem freistehende Häuser, Doppelhäuser und Reihenhäuser in Kiew, Lwiw und Baku!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-primary text-sm font-medium tracking-widest uppercase mb-4">
              Unternehmensgeschichte
            </p>
            <h2 className="font-serif text-3xl lg:text-5xl font-semibold text-foreground mb-6 text-balance">
              {aboutSection?.companyName ?? DEFAULT_COMPANY_NAME}
            </h2>
            <div className="space-y-4 text-muted-foreground text-base lg:text-lg leading-relaxed">
              {(aboutSection?.description || DEFAULT_ABOUT_DESCRIPTION).split('\n\n').filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2">
            {/* Dynamic Architectural Gallery */}
            <div className="grid grid-cols-12 grid-rows-6 gap-3 lg:gap-4 h-[400px] lg:h-[500px]">
              {/* Main large image - top left, spans 8 cols and 4 rows */}
              {companyImages[0] && (
                <div
                  onClick={() => setSelectedImageIndex(0)}
                  className="col-span-8 row-span-4 relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
                >
                  <Image
                    src={companyImages[0].src}
                    alt={companyImages[0].alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              )}

              {/* Top right vertical image - 4 cols, 3 rows */}
              {companyImages[1] && (
                <div
                  onClick={() => setSelectedImageIndex(1)}
                  className="col-span-4 row-span-3 relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
                >
                  <Image
                    src={companyImages[1].src}
                    alt={companyImages[1].alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              )}

              {/* Bottom left image - 5 cols, 2 rows */}
              {companyImages[2] && (
                <div
                  onClick={() => setSelectedImageIndex(2)}
                  className="col-span-5 row-span-2 relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
                >
                  <Image
                    src={companyImages[2].src}
                    alt={companyImages[2].alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              )}
              
              {/* Bottom right — 4th photo slot (managed via admin) */}
              {companyImages[3] ? (
                <div
                  onClick={() => setSelectedImageIndex(3)}
                  className="col-span-7 row-span-3 relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
                >
                  <Image
                    src={companyImages[3].src}
                    alt={companyImages[3].alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              ) : (
                <div
                  className="col-span-7 row-span-3 relative rounded-2xl overflow-hidden shadow-lg flex items-center justify-center border-2 border-dashed border-border/40"
                  style={{ backgroundColor: '#F5F2EF' }}
                >
                  <p className="text-muted-foreground/40 text-xs text-center px-4">Bild im Adminbereich hinzufügen</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lightbox Modal */}
        {selectedImageIndex >= 0 && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm"
            onClick={() => setSelectedImageIndex(-1)}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImageIndex(-1)}
              className="absolute top-4 right-4 lg:top-8 lg:right-8 w-12 h-12 flex items-center justify-center rounded-full bg-[#3E1718]/10 hover:bg-[#3E1718]/20 transition-colors duration-300 z-50 border border-[#6E2E2A]/20"
              aria-label="Schließen"
            >
              <X className="w-6 h-6 text-[#3E1718]" />
            </button>

            {/* Image Counter */}
            <div className="absolute top-4 left-4 lg:top-8 lg:left-8 px-4 py-2 rounded-full bg-[#3E1718]/10 text-[#3E1718] text-sm font-medium border border-[#6E2E2A]/20">
              {selectedImageIndex + 1} / {companyImages.length}
            </div>

            {/* Previous Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePrevImage()
              }}
              className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 border border-[#6E2E2A]/20"
              aria-label="Vorheriges Bild"
            >
              <ChevronLeft className="w-7 h-7 lg:w-8 lg:h-8 text-[#3E1718]" />
            </button>

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleNextImage()
              }}
              className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 border border-[#6E2E2A]/20"
              aria-label="Nächstes Bild"
            >
              <ChevronRight className="w-7 h-7 lg:w-8 lg:h-8 text-[#3E1718]" />
            </button>

            {/* Main Image */}
            <div 
              className="relative w-[95vw] h-[90vh] lg:w-[90vw] lg:h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={companyImages[selectedImageIndex].src}
                alt={companyImages[selectedImageIndex].alt}
                width={1600}
                height={1100}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                priority
              />
            </div>
          </div>
        )}

        {/* Mission / Vision / Strategy / Prices - Premium Editorial Section */}
        <div className="mt-20 lg:mt-32">
          {/* Section Header */}
          <div className="text-center mb-12 lg:mb-16">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#6E2E2A]/40" />
              <span className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: '#5A2A1C' }}>
                Unsere Werte
              </span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#6E2E2A]/40" />
            </div>
            <h2 className="font-serif text-2xl lg:text-3xl font-semibold" style={{ color: '#3E1718' }}>
              Das Fundament unseres Handelns
            </h2>
          </div>

          {/* Premium Cards Grid */}
          <div ref={sectionRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-6xl mx-auto">
            {[
              {
                title: "Unsere Mission",
                description: "Wir sind überzeugt, dass ein eigenes Haus oder eine Wohnung mit eigenem Grundstück kein unerreichbarer Luxus sein sollte, sondern eine realistische Möglichkeit für viele Menschen. Unser Anspruch ist es, hochwertigen Wohnraum zu schaffen und das Vertrauen unserer Kunden durch Qualität, Transparenz und Verlässlichkeit zu gewinnen. Der größte Maßstab unseres Erfolgs sind zufriedene Eigentümer.",
                brickColor: "#6E2E2A",
              },
              {
                title: "Unsere Vision",
                description: "Wir möchten unseren Kunden genau das bieten, was wir selbst von einem Projektentwickler erwarten würden: sichere und transparente Prozesse, hochwertige Baumaterialien sowie ein überzeugendes Preis-Leistungs-Verhältnis.",
                brickColor: "#5A2A1C",
              },
              {
                title: "Unsere Strategie",
                description: "Wir setzen auf langfristige Kundenbeziehungen und effiziente und termingerechte Umsetzung unserer Projekte. Dabei legen wir großen Wert auf Termintreue, Qualität und eine sorgfältige Planung. So entstehen Wohnräume, die Komfort, Funktionalität und zeitlose Architektur miteinander verbinden.",
                brickColor: "#3E1718",
              },
              {
                title: "Unser Stil",
                description: "Ein charakteristisches Merkmal unserer Häuser ist das Fassadenmauerwerk im bayerischen Stil. Die unterschiedlichen Farbtöne der Ziegel verleihen jedem Gebäude eine individuelle Ausstrahlung und schaffen ein harmonisches Gesamtbild, das auch über viele Jahre hinweg seinen zeitlosen Charakter bewahrt.",
                brickColor: "#120A0A",
              },
            ].map((card, index) => (
              <div
                key={index}
                className="group relative bg-card aspect-square flex flex-col items-center justify-center p-6 lg:p-8 rounded-2xl border border-border/40 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-400"
              >
                {/* Brick Block */}
                <div className="flex justify-center mb-5">
                  <div
                    className={`w-14 h-5 lg:w-16 lg:h-6 rounded-md shadow-md transition-all duration-600 ease-out group-hover:scale-105 group-hover:shadow-lg ${
                      isVisible 
                        ? "opacity-100 translate-y-0" 
                        : "opacity-0 translate-y-3"
                    }`}
                    style={{ 
                      backgroundColor: card.brickColor,
                      transitionDelay: `${index * 120}ms`,
                    }}
                  />
                </div>
                
                {/* Title */}
                <h3 
                  className="font-serif text-lg lg:text-xl font-semibold mb-3 tracking-tight text-center"
                  style={{ color: card.brickColor }}
                >
                  {card.title}
                </h3>
                
                {/* Description */}
                <p className="text-muted-foreground text-xs lg:text-sm leading-relaxed text-center">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bauweise und Entwicklung - Premium Section */}
        <div className="mt-24 lg:mt-36">
          {/* Premium Background Container */}
          <div className="relative py-16 lg:py-24 -mx-4 lg:-mx-8 px-4 lg:px-8 rounded-3xl overflow-hidden">
            {/* Layered Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FAF9F7] via-[#F8F6F4] to-[#F5F2EF]" />
            <div 
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `radial-gradient(circle at 30% 20%, #6E2E2A 1px, transparent 1px), radial-gradient(circle at 70% 80%, #5A2A1C 1px, transparent 1px)`,
                backgroundSize: '50px 50px, 70px 70px',
              }}
            />
            <div 
              className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03] pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 100% 0%, #6E2E2A 0%, transparent 60%)' }}
            />
            
            {/* Decorative Corner Elements */}
            <div className="absolute top-6 left-6 lg:top-10 lg:left-10 w-20 h-20 lg:w-28 lg:h-28 border-l-2 border-t-2 border-[#6E2E2A]/10 rounded-tl-3xl">
              <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#6E2E2A]/20" />
            </div>
            <div className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10 w-20 h-20 lg:w-28 lg:h-28 border-r-2 border-b-2 border-[#6E2E2A]/10 rounded-br-3xl">
              <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[#6E2E2A]/20" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              {/* Section Header */}
              <div className="text-center mb-14 lg:mb-20">
                <h2 className="font-serif text-3xl lg:text-5xl font-semibold" style={{ color: '#3E1718' }}>
                  Bauweise und Entwicklung
                </h2>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-7xl mx-auto">
                {/* Text Column */}
                <div className="order-2 lg:order-1">
                  <div className="space-y-6 text-muted-foreground text-base lg:text-lg leading-relaxed">
                    <p>
                      Wir entwickeln unsere Bauweise kontinuierlich weiter und verbinden moderne Technologien mit traditioneller Handwerkskunst. Unser Ziel ist es, nicht nur komfortable Häuser zu schaffen, sondern Lebensräume, in denen Träume Wirklichkeit werden können. Dabei begleiten wir unsere Kunden zuverlässig durch alle Phasen der Projektentwicklung – von der Planung bis zur Fertigstellung.
                    </p>
                    <p>
                      Die Idee, Häuser im Stil des Bayerischen Mauerwerks mit handgeformten Ziegeln zu errichten, entstand aus dem Wunsch, Wohnraum mit einem unverwechselbaren architektonischen Charakter zu schaffen. Die Kombination aus exklusiven Materialien und sorgfältiger Ausführung verleiht jedem Gebäude eine individuelle Ausstrahlung und eine dauerhaft hohe Wertigkeit.
                    </p>
                    <p>
                      Unter der Marke „Einstöckiges Kiew“ entwickelte sich unser Unternehmen innerhalb weniger Jahre zu einem der führenden Anbieter im Segment hochwertiger Einfamilienhäuser in der Ukraine. Diese Entwicklung bildete die Grundlage für unsere Expansion nach Polen.
                    </p>
                    <p>
                      Mit „Einstöckige Warschau“ konnten wir dank unserer langjährigen Erfahrung, unseres hohen Qualitätsanspruchs und einer konsequenten Kundenorientierung das Vertrauen zahlreicher Kunden gewinnen.
                    </p>
                    <p>
                      Heute setzen wir diesen Weg in Deutschland fort. Mit unserer Erfahrung aus mehreren europäischen Märkten, hohen Qualitätsstandards und einer klaren architektonischen Handschrift entwickeln wir Wohnprojekte, die Ästhetik, Langlebigkeit und moderne Bauqualität auf überzeugende Weise miteinander verbinden.
                    </p>
                  </div>
                  
                  {/* CTA Button */}
                  <div className="mt-8">
                    <a 
                      href="#kontakt"
                      className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group"
                      style={{ 
                        background: 'linear-gradient(135deg, #6E2E2A 0%, #5A2A1C 50%, #3E1718 100%)',
                      }}
                    >
                      <span>Kontakt aufnehmen</span>
                      <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Photo Column */}
                <div className="order-1 lg:order-2">
                  <div className="grid grid-cols-12 gap-4 lg:gap-5">
                    {/* Main Large Photo */}
                    <div 
                      onClick={() => setSelectedTechImageIndex(0)}
                      className="col-span-12 relative rounded-3xl overflow-hidden shadow-xl group aspect-[4/3] cursor-pointer"
                    >
                      <Image
                        src="/images/tech-house-main.jpg"
                        alt={numberedSectionAlt("Bauweise und Entwicklung", "", 0)}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      {/* Premium Corner Accent */}
                      <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-white/30 rounded-tl-xl" />
                      <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-white/30 rounded-br-xl" />
                    </div>
                    
                    {/* Secondary Photo */}
                    <div 
                      onClick={() => setSelectedTechImageIndex(1)}
                      className="col-span-12 relative rounded-2xl overflow-hidden shadow-lg group aspect-[16/9] cursor-pointer"
                    >
                      <Image
                        src="/images/tech-houses-twin.jpg"
                        alt={numberedSectionAlt("Bauweise und Entwicklung", "", 1)}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Lightbox Modal */}
        {selectedTechImageIndex >= 0 && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm"
            onClick={() => setSelectedTechImageIndex(-1)}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedTechImageIndex(-1)}
              className="absolute top-4 right-4 lg:top-8 lg:right-8 w-12 h-12 flex items-center justify-center rounded-full bg-[#3E1718]/10 hover:bg-[#3E1718]/20 transition-colors duration-300 z-50 border border-[#6E2E2A]/20"
              aria-label="Schließen"
            >
              <X className="w-6 h-6 text-[#3E1718]" />
            </button>

            {/* Image Counter */}
            <div className="absolute top-4 left-4 lg:top-8 lg:left-8 px-4 py-2 rounded-full bg-[#3E1718]/10 text-[#3E1718] text-sm font-medium border border-[#6E2E2A]/20">
              {selectedTechImageIndex + 1} / {techImages.length}
            </div>

            {/* Previous Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePrevTechImage()
              }}
              className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 border border-[#6E2E2A]/20"
              aria-label="Vorheriges Bild"
            >
              <ChevronLeft className="w-7 h-7 lg:w-8 lg:h-8 text-[#3E1718]" />
            </button>

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleNextTechImage()
              }}
              className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 border border-[#6E2E2A]/20"
              aria-label="Nächstes Bild"
            >
              <ChevronRight className="w-7 h-7 lg:w-8 lg:h-8 text-[#3E1718]" />
            </button>

            {/* Main Image */}
            <div 
              className="relative w-[95vw] h-[90vh] lg:w-[90vw] lg:h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={techImages[selectedTechImageIndex].src}
                alt={numberedSectionAlt("Bauweise und Entwicklung", "", selectedTechImageIndex)}
                width={1600}
                height={1100}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                priority
              />
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
