"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Phone, MapPin, Send } from "lucide-react"
import { useSiteSettings } from "@/components/site-settings-provider"
import { MapGate } from "@/components/map-gate"
import { isValidNationalNumber, PHONE_ERROR_MESSAGE } from "@/lib/validation/phone"
import { isValidEmail, EMAIL_ERROR_MESSAGE } from "@/lib/validation/email"
import { PhoneField } from "@/components/forms/phone-field"
import { DEFAULT_COUNTRY, type Country } from "@/lib/contact/countries"

export function Contact() {
  const t = useTranslations("contact")
  const s = useSiteSettings()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem("email") as HTMLInputElement).value

    const emailOk = isValidEmail(email)
    const phoneOk = isValidNationalNumber(country.dial, phoneNumber, country.nationalLength)
    setEmailError(emailOk ? null : EMAIL_ERROR_MESSAGE)
    setPhoneError(phoneOk ? null : PHONE_ERROR_MESSAGE)
    if (!emailOk || !phoneOk) return

    setIsSubmitting(true)
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email,
      phone: `${country.dial} ${phoneNumber.trim()}`,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    }
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        alert(t("successAlert"))
        form.reset()
        setPhoneNumber("")
        setCountry(DEFAULT_COUNTRY)
      } else {
        alert(t("errorAlert"))
      }
    } catch {
      alert(t("errorAlert"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = [
    {
      icon: Mail,
      label: t("email"),
      value: s.email,
      href: `mailto:${s.email}`,
    },
    // One phone entry per office — same numbers as the top-bar dropdown.
    ...s.contacts.map((c) => ({
      icon: Phone,
      label: `${t("phone")} — ${c.city}`,
      value: c.phone,
      href: c.phoneHref,
    })),
    {
      icon: MapPin,
      label: t("addressLabel"),
      value: s.addressOneLine,
      href: s.mapHref,
    },
  ]

  return (
    <section id="kontakt" className="py-20 lg:py-32 bg-muted">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-medium tracking-widest uppercase mb-4">
            {t("eyebrow")}
          </p>
          <h2 className="font-serif text-3xl lg:text-5xl font-semibold text-foreground mb-6">
            {t("heading")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact Form */}
          <div className="bg-card p-8 lg:p-10 rounded-3xl border border-border shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  {t("name")} *
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder={t("namePlaceholder")}
                  className="bg-background border-border"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  {t("phone")} *
                </label>
                <PhoneField
                  inputId="phone"
                  required
                  country={country}
                  onCountryChange={setCountry}
                  number={phoneNumber}
                  onNumberChange={(v) => {
                    setPhoneNumber(v)
                    if (phoneError) setPhoneError(null)
                  }}
                  error={phoneError}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  {t("email")} *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder={t("emailPlaceholder")}
                  className="bg-background border-border"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                  onChange={() => emailError && setEmailError(null)}
                />
                {emailError && (
                  <p id="email-error" className="mt-1.5 text-sm text-red-600">
                    {emailError}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  {t("message")}
                </label>
                <Textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder={t("messagePlaceholder")}
                  className="bg-background border-border resize-none"
                />
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="privacy" required className="mt-1" />
                <label htmlFor="privacy" className="text-sm text-muted-foreground">
                  {t("privacyConsent")}
                </label>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {isSubmitting ? (
                  t("submitting")
                ) : (
                  <>
                    {t("submit")}
                    <Send className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Contact Info & Map */}
          <div className="flex flex-col gap-8">
            {/* Contact Details */}
            <div className="bg-card p-8 lg:p-10 rounded-3xl border border-border shadow-lg">
              <h3 className="font-serif text-2xl font-semibold text-foreground mb-6">
                {t("detailsHeading")}
              </h3>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <a
                    key={index}
                    href={info.href}
                    target={info.icon === MapPin ? "_blank" : undefined}
                    rel={info.icon === MapPin ? "noopener noreferrer" : undefined}
                    className="flex items-start gap-4 group"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors duration-300">
                      <info.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{info.label}</p>
                      <p className="text-foreground font-medium group-hover:text-primary transition-colors duration-200">
                        {info.value}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Google Map — loaded only after consent (banner "accept" or the
                "Google Maps laden" button); a placeholder holds the same box. */}
            <div className="bg-card rounded-3xl border border-border shadow-lg overflow-hidden flex-1 min-h-[300px] relative">
              <MapGate className="absolute inset-0">
                <a
                  href={s.mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-4 right-4 z-10 bg-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center gap-2 text-sm font-medium text-foreground"
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  {t("openInMaps")}
                </a>
                <iframe
                  src={s.mapEmbedSrc}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '300px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Projektentwicklung Einstöckiges Berlin GmbH – Büro"
                  className="absolute inset-0"
                />
              </MapGate>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
