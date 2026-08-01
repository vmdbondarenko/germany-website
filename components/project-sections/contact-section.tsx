"use client"

import { useState } from "react"
import { Mail, Phone, MapPin, Send } from "lucide-react"
import { trackFormSubmit, pushToDataLayer } from "@/lib/gtm"
import { isValidNationalNumber, PHONE_ERROR_MESSAGE } from "@/lib/validation/phone"
import { isValidEmail, EMAIL_ERROR_MESSAGE } from "@/lib/validation/email"
import { PhoneField } from "@/components/forms/phone-field"
import { DEFAULT_COUNTRY, type Country } from "@/lib/contact/countries"

export function DynamicContactSection({
  phone,
  email,
  address,
}: {
  phone: string | null
  email: string | null
  address: string | null
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const emailValue = (form.elements.namedItem("email") as HTMLInputElement).value
    const phoneInput = phoneNumber.trim()

    const emailOk = isValidEmail(emailValue)
    // Phone is optional here; validate only when something was entered.
    const phoneOk = phoneInput === "" || isValidNationalNumber(country.dial, phoneNumber, country.nationalLength)
    setEmailError(emailOk ? null : EMAIL_ERROR_MESSAGE)
    setPhoneError(phoneOk ? null : PHONE_ERROR_MESSAGE)
    if (!emailOk || !phoneOk) return

    setIsSubmitting(true)
    const data = {
      name: `${(form.elements.namedItem("firstName") as HTMLInputElement).value} ${(form.elements.namedItem("lastName") as HTMLInputElement).value}`.trim(),
      email: emailValue,
      phone: phoneInput ? `${country.dial} ${phoneInput}` : "",
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    }
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        trackFormSubmit("project_contact")
        // Google Ads conversion event — fires only after the server confirms success.
        pushToDataLayer({ event: "form_submit_success", form_location: "projekt" })
        setSubmitted(true)
        setPhoneNumber("")
        setCountry(DEFAULT_COUNTRY)
      } else alert("Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch.")
    } catch {
      alert("Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactItems = [
    phone && { icon: Phone, label: "Telefon", value: phone, href: `tel:${phone}` },
    email && { icon: Mail, label: "Email", value: email, href: `mailto:${email}` },
    address && { icon: MapPin, label: "Büro", value: address },
  ].filter(Boolean) as Array<{ icon: React.ComponentType<{ className?: string }>; label: string; value: string; href?: string }>

  return (
    <section id="kontakt" className="py-20 lg:py-32" style={{ backgroundColor: "#1a1a1a" }}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <h2 className="font-serif text-3xl lg:text-4xl font-semibold text-white mb-6">
              Kontaktieren Sie uns
            </h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Haben Sie Fragen zum Projekt? Wir beantworten gerne alle Ihre Fragen und helfen Ihnen, die beste Option zu wählen.
            </p>
            <div className="space-y-4">
              {contactItems.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(110,46,42,0.3)" }}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-white hover:underline">{item.value}</a>
                    ) : (
                      <p className="text-white">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Send className="w-12 h-12 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Vielen Dank!</h3>
                <p className="text-gray-400">Wir melden uns in Kürze bei Ihnen.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input name="firstName" placeholder="Vorname" required className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#6E2E2A]" />
                  <input name="lastName" placeholder="Nachname" required className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#6E2E2A]" />
                </div>
                <input name="email" type="email" placeholder="Email" required aria-invalid={!!emailError} aria-describedby={emailError ? "project-email-error" : undefined} onChange={() => emailError && setEmailError(null)} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#6E2E2A]" />
                {emailError && (
                  <p id="project-email-error" className="text-sm text-red-400">
                    {emailError}
                  </p>
                )}
                <PhoneField
                  inputId="project-phone"
                  variant="dark"
                  country={country}
                  onCountryChange={setCountry}
                  number={phoneNumber}
                  onNumberChange={(v) => {
                    setPhoneNumber(v)
                    if (phoneError) setPhoneError(null)
                  }}
                  error={phoneError}
                />
                <textarea name="message" placeholder="Nachricht" rows={4} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#6E2E2A] resize-none" />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#6E2E2A", color: "white" }}
                >
                  {isSubmitting ? "Wird gesendet …" : "Nachricht senden"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
