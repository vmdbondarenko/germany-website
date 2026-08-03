"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { teamMemberAlt } from "@/lib/seo/image-alt"
import { DEFAULT_TEAM, DEFAULT_TEAM_MEMBERS } from "@/lib/content-defaults"

const ACCENTS = ["#6E2E2A", "#5A2A1C", "#3E1718"]

type TeamMemberData = { id: string; name: string; role: string; image: string | null; order: number }

// German fallback used until the TeamMember table is seeded (from the shared
// single source, so it can't drift from the seed).
const FALLBACK_MEMBERS: TeamMemberData[] = DEFAULT_TEAM_MEMBERS.map((m, i) => ({
  id: String(i + 1), name: m.name, role: m.role.de, image: m.image, order: m.order,
}))

export function Team({ members: membersProp, content }: { members?: TeamMemberData[]; content?: { heading: string; description: string } }) {
  const heading = content?.heading ?? DEFAULT_TEAM.heading.de
  const description = content?.description ?? DEFAULT_TEAM.description.de
  const teamMembers = (membersProp && membersProp.length > 0 ? membersProp : FALLBACK_MEMBERS).map((m, i) => ({
    ...m,
    accent: ACCENTS[i % ACCENTS.length],
  }))
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

  // Reusable card component for consistent sizing
  const TeamCard = ({ member, index }: { member: typeof teamMembers[0]; index: number }) => (
    <div
      className={`group relative rounded-3xl overflow-hidden transition-all duration-500 h-full ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Card Background with Gradient */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: `linear-gradient(145deg, ${member.accent}08, ${member.accent}03)`,
        }}
      />
      
      {/* Glass Border Effect */}
      <div className="absolute inset-0 rounded-3xl border border-white/60 shadow-lg" />
      <div 
        className="absolute inset-0 rounded-3xl border opacity-20 transition-opacity duration-300 group-hover:opacity-40"
        style={{ borderColor: member.accent }}
      />
      
      {/* Inner Content */}
      <div className="relative h-full flex flex-col">
        {/* Photo Area with Premium Effects */}
        <div className="relative h-64 overflow-hidden">
          {/* Photo */}
          <div className="absolute inset-0">
            {member.image ? (
              <Image
                src={member.image}
                alt={teamMemberAlt(member.name, member.role)}
                fill
                className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-4xl text-muted-foreground">{member.name.charAt(0)}</span>
              </div>
            )}
            {/* Subtle overlay to blend with card */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          </div>
          
          {/* Top Accent Bar */}
          <div 
            className="absolute top-0 left-0 right-0 h-1 transition-all duration-300"
            style={{ 
              background: `linear-gradient(90deg, transparent, ${member.accent}, transparent)`,
              opacity: 0.4,
            }}
          />
          
          {/* Side Accent on Hover */}
          <div 
            className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-all duration-300"
            style={{ backgroundColor: member.accent }}
          />
        </div>
        
        {/* Content Area */}
        <div className="relative flex-1 p-6 lg:p-7 bg-white/80 backdrop-blur-sm">
          {/* Decorative Line */}
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-10 h-0.5 rounded-full transition-all duration-300 group-hover:w-16"
              style={{ backgroundColor: member.accent }}
            />
            <div 
              className="w-2 h-2 rounded-full opacity-60 transition-transform duration-300 group-hover:scale-125"
              style={{ backgroundColor: member.accent }}
            />
          </div>
          
          <h3 
            className="font-serif text-xl lg:text-2xl font-semibold mb-2 transition-colors duration-300"
            style={{ color: '#3E1718' }}
          >
            {member.name}
          </h3>
          
          <p 
            className="text-sm lg:text-base font-medium leading-relaxed"
            style={{ color: member.accent }}
          >
            {member.role}
          </p>
          
          {/* Bottom Corner Accent */}
          <div 
            className="absolute bottom-4 right-4 w-8 h-8 rounded-tr-2xl border-t-2 border-r-2 opacity-20 transition-opacity duration-300 group-hover:opacity-40"
            style={{ borderColor: member.accent }}
          />
        </div>
      </div>
    </div>
  )

  return (
    <section id="team" className="py-20 lg:py-28 relative overflow-hidden">
      {/* Premium Multi-Layer Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3E1718] via-[#4A1F1E] to-[#2A0F0E]" />
      
      {/* Geometric Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px, 70px 70px',
        }}
      />
      
      {/* Decorative Gradient Orbs */}
      <div 
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6E2E2A, transparent 70%)' }}
      />
      <div 
        className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #5A2A1C, transparent 70%)' }}
      />
      
      {/* Top Light Streak */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6E2E2A]/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6E2E2A]/40 to-transparent" />
      
      {/* Decorative Corner Elements */}
      <div className="absolute top-12 left-12 w-40 h-40 border-l border-t border-white/10 rounded-tl-3xl hidden lg:block" />
      <div className="absolute bottom-12 right-12 w-40 h-40 border-r border-b border-white/10 rounded-br-3xl hidden lg:block" />
      
      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center mb-16 lg:mb-20">
          {/* Decorative Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 border border-white/10" style={{ background: 'linear-gradient(135deg, rgba(110,46,42,0.3), rgba(90,42,28,0.1))' }}>
            <svg className="w-8 h-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          
          <h2 className="font-serif text-3xl lg:text-5xl font-semibold mb-5 leading-tight text-white">
            {heading}
          </h2>

          <p className="text-white/60 text-base lg:text-lg max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Team Cards - Uniform Grid */}
        <div ref={sectionRef} className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {teamMembers.map((member, index) => (
              <TeamCard key={index} member={member} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
