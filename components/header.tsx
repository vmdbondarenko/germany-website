"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Menu, X, Mail, Phone, ChevronDown, Instagram, Youtube } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { ContactModal } from "@/components/contact-modal"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useSiteSettings } from "@/components/site-settings-provider"

export function Header({ cities = [] }: { cities?: { name: string; slug: string }[] }) {
  const t = useTranslations("nav")
  const tc = useTranslations("common")
  const settings = useSiteSettings()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showPhonePopup, setShowPhonePopup] = useState(false)
  const [showCitiesPopup, setShowCitiesPopup] = useState(false)
  const [showKontaktPopup, setShowKontaktPopup] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const phoneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (phoneRef.current && !phoneRef.current.contains(e.target as Node)) {
        setShowPhonePopup(false)
      }
    }
    if (showPhonePopup) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showPhonePopup])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: "/#unternehmen", label: t("about") },
    { href: "/standort", label: t("locations") },
    { href: "/#verkauf", label: t("forSale") },
    { href: "/#abgeschlossen", label: t("completed") },
    { href: "/#team", label: t("team") },
    { href: "/#so-helfen-wir", label: t("howWeHelp") },
    { href: "/#aktualnosci", label: t("news") },
    { href: "/#kontakt", label: t("contact") },
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-background/95 backdrop-blur-md border-b border-border/50" : "bg-background/40 backdrop-blur-sm"}`}>
      <div className="w-full px-2 lg:px-4">
        <div className="flex items-center justify-between h-12 lg:h-14">
          <Link href="/" className="flex flex-col items-center justify-center flex-shrink-0">
            {/* Desktop: Stacked brand mark with matching widths */}
            <div className="hidden lg:flex flex-col items-center justify-center">
              <Image
                src="/images/logo-blocks.png"
                alt={`${settings.companyName} logo`}
                width={175}
                height={40}
                style={{ width: 175, height: 'auto' }}
                priority
                unoptimized
              />
              <span 
                className="text-[12px] font-medium whitespace-nowrap w-full text-center mt-0.5"
                style={{ color: 'rgba(74, 42, 42, 0.7)', letterSpacing: '0.08em' }}
              >
                {settings.companyName}
              </span>
            </div>
            {/* Mobile: Compact version */}
            <div className="flex lg:hidden flex-col items-center">
              <Image
                src="/images/logo-blocks.png"
                alt={`${settings.companyName} logo`}
                width={120}
                height={28}
                style={{ width: 120, height: 'auto' }}
                priority
                unoptimized
              />
              <span 
                className="text-[9px] font-medium whitespace-nowrap mt-0.5 w-full text-center"
                style={{ color: 'rgba(74, 42, 42, 0.7)', letterSpacing: '0.04em' }}
              >
                {settings.companyName}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Far Right */}
          <div className="hidden lg:flex items-center gap-4 ml-auto pr-2">
            <nav className="flex items-center gap-3">
              {navLinks.map((link) =>
                link.href === '/#verkauf' && cities.length > 0 ? (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => setShowCitiesPopup(true)}
                    onMouseLeave={() => setShowCitiesPopup(false)}
                  >
                    <Link
                      href={link.href}
                      className="flex items-center gap-0.5 text-xs font-medium hover:opacity-70 transition-opacity duration-200"
                      style={{ color: 'rgba(74, 42, 42, 0.7)' }}
                      aria-haspopup="true"
                      aria-expanded={showCitiesPopup}
                    >
                      {link.label}
                      <ChevronDown className="h-3 w-3" />
                    </Link>
                    <div
                      className={`absolute left-0 top-full pt-2 z-50 ${showCitiesPopup ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                    >
                      <div className="bg-background border border-border rounded-lg shadow-lg py-2 min-w-[210px]">
                        {cities.map((c) => (
                          <Link
                            key={c.slug}
                            href={`/${c.slug}`}
                            className="block px-4 py-2 text-sm font-medium hover:bg-foreground/5 transition-colors whitespace-nowrap"
                            style={{ color: 'rgba(74, 42, 42, 0.9)' }}
                          >
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : link.href === '/#kontakt' ? (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => setShowKontaktPopup(true)}
                    onMouseLeave={() => setShowKontaktPopup(false)}
                  >
                    <Link
                      href={link.href}
                      className="flex items-center gap-0.5 text-xs font-medium hover:opacity-70 transition-opacity duration-200"
                      style={{ color: 'rgba(74, 42, 42, 0.7)' }}
                      aria-haspopup="true"
                      aria-expanded={showKontaktPopup}
                    >
                      {link.label}
                      <ChevronDown className="h-3 w-3" />
                    </Link>
                    {/* Always mounted so Ringostat can detect/replace the tel: links; only visibility
                        is toggled. `pt-2` bridges the gap to the trigger so hovering a number works. */}
                    <div
                      inert={!showKontaktPopup}
                      aria-hidden={!showKontaktPopup}
                      className={`absolute right-0 top-full pt-2 z-50 ${showKontaktPopup ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                    >
                      <div className="bg-background border border-border rounded-lg shadow-lg py-2 min-w-[200px]">
                        {settings.contacts.map((c) => (
                          <div key={c.city} className="px-4 py-1.5">
                            <p
                              className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
                              style={{ color: 'rgba(74, 42, 42, 0.45)' }}
                            >
                              {c.city}
                            </p>
                            <a
                              href={c.phoneHref}
                              className="text-sm font-medium whitespace-nowrap hover:opacity-70 transition-opacity"
                              style={{ color: 'rgba(74, 42, 42, 0.9)' }}
                            >
                              {c.phone}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs font-medium hover:opacity-70 transition-opacity duration-200"
                    style={{ color: 'rgba(74, 42, 42, 0.7)' }}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>
            
            {/* Vertical Divider */}
            <div className="h-6 w-px bg-foreground/20" />
            
            {/* Contact Icons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowContactModal(true)}
                className="p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 backdrop-blur-sm transition-all duration-200"
                aria-label={tc("email")}
              >
                <Mail className="h-4 w-4" style={{ color: 'rgba(74, 42, 42, 0.7)' }} />
              </button>
              <div
                ref={phoneRef}
                className="relative"
                onMouseEnter={() => setShowPhonePopup(true)}
                onMouseLeave={() => setShowPhonePopup(false)}
              >
                <button
                  onClick={() => setShowPhonePopup(v => !v)}
                  className="p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 backdrop-blur-sm transition-all duration-200"
                  aria-label={tc("phone")}
                  aria-expanded={showPhonePopup}
                >
                  <Phone className="h-4 w-4" style={{ color: 'rgba(74, 42, 42, 0.7)' }} />
                </button>
                {/* Always mounted so Ringostat can detect/replace the tel: links; only visibility is
                    toggled (opacity, not display) so the nodes stay in the render tree. The `pt-2`
                    padding (not a margin) bridges the gap to the button so moving the mouse onto a
                    number doesn't cross empty space and trigger onMouseLeave. */}
                <div
                  inert={!showPhonePopup}
                  aria-hidden={!showPhonePopup}
                  className={`absolute right-0 top-full pt-2 z-50 ${showPhonePopup ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                >
                  <div className="bg-background border border-border rounded-lg shadow-lg py-2 min-w-[200px]">
                    {settings.contacts.map((c) => (
                      <div key={c.city} className="px-4 py-1.5">
                        <p
                          className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
                          style={{ color: 'rgba(74, 42, 42, 0.45)' }}
                        >
                          {c.city}
                        </p>
                        <a
                          href={c.phoneHref}
                          className="text-sm font-medium whitespace-nowrap hover:opacity-70 transition-opacity"
                          style={{ color: 'rgba(74, 42, 42, 0.9)' }}
                        >
                          {c.phone}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Social links — same icon group; only shown when a URL is set */}
              {settings.socials
                .filter((soc) => soc.platform === 'instagram' || soc.platform === 'youtube')
                .map((soc) => {
                  const Icon = soc.platform === 'instagram' ? Instagram : Youtube
                  return (
                    <a
                      key={soc.platform}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 backdrop-blur-sm transition-all duration-200"
                      aria-label={soc.platform === 'instagram' ? 'Instagram' : 'YouTube'}
                    >
                      <Icon className="h-4 w-4" style={{ color: 'rgba(74, 42, 42, 0.7)' }} />
                    </a>
                  )
                })}
            </div>

            {/* Vertical Divider */}
            <div className="h-6 w-px bg-foreground/20" />

            {/* Language switcher */}
            <LanguageSwitcher />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? tc("closeMenu") : tc("openMenu")}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation — always mounted so the phone tel: links stay in the DOM for Ringostat;
            when closed it collapses to an invisible, non-interactive, out-of-flow layer (opacity, not
            display) so the header layout is unchanged. */}
        <nav
          inert={!isMenuOpen}
          aria-hidden={!isMenuOpen}
          className={`lg:hidden py-4 border-t border-border/50 ${isMenuOpen ? "" : "absolute opacity-0 pointer-events-none"}`}
        >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <div key={link.href}>
                  <Link
                    href={link.href}
                    className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                  {link.href === '/#verkauf' && cities.length > 0 && (
                    <div className="mt-1 ml-4 flex flex-col gap-1 border-l border-border/50 pl-3">
                      {cities.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/${c.slug}`}
                          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Phone numbers grouped by city — same source as the desktop dropdown */}
            <div className="mt-4 pt-4 border-t border-border/50 flex flex-col gap-3">
              {settings.contacts.map((c) => (
                <div key={c.city} className="flex items-center justify-between gap-4">
                  <span
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'rgba(74, 42, 42, 0.45)' }}
                  >
                    {c.city}
                  </span>
                  <a
                    href={c.phoneHref}
                    className="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
                    style={{ color: 'rgba(74, 42, 42, 0.9)' }}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {c.phone}
                  </a>
                </div>
              ))}
            </div>

            {/* Language switcher (mobile) */}
            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(74, 42, 42, 0.45)' }}
              >
                {tc("language")}
              </span>
              <LanguageSwitcher />
            </div>
        </nav>
      </div>
      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
    </header>
  )
}
