"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { isValidNationalNumber, PHONE_ERROR_MESSAGE } from "@/lib/validation/phone"
import { isValidEmail, EMAIL_ERROR_MESSAGE } from "@/lib/validation/email"
import { PhoneField } from "@/components/forms/phone-field"
import { DEFAULT_COUNTRY, type Country } from "@/lib/contact/countries"

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  subject?: string
}

export function ContactModal({ isOpen, onClose, subject }: ContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false)
      setPhoneError(null)
      setEmailError(null)
      setPhoneNumber("")
      setCountry(DEFAULT_COUNTRY)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

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
      subject,
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
        setSubmitted(true)
        formRef.current?.reset()
        setPhoneNumber("")
        setCountry(DEFAULT_COUNTRY)
      } else {
        alert("Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch.")
      }
    } catch {
      alert("Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-3xl border border-border shadow-2xl w-full max-w-md p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-foreground/10 hover:bg-foreground/20 transition-colors"
          aria-label="Schließen"
        >
          <X className="h-3.5 w-3.5" />
          Schließen
        </button>

        <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
          Kontaktieren Sie uns
        </h2>
        {subject && (
          <p className="text-sm text-muted-foreground mb-6">
            Anfrage zu: <span className="font-medium text-foreground">{subject}</span>
          </p>
        )}
        {!subject && (
          <p className="text-sm text-muted-foreground mb-6">
            Füllen Sie das Formular aus, wir melden uns in Kürze bei Ihnen.
          </p>
        )}

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Send className="h-12 w-12 mb-4" style={{ color: '#6E2E2A' }} />
            <h3 className="text-xl font-semibold text-foreground mb-2">Vielen Dank!</h3>
            <p className="text-muted-foreground">Wir melden uns in Kürze bei Ihnen.</p>
            <Button onClick={onClose} className="mt-6" variant="outline">Schließen</Button>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="modal-name" className="block text-sm font-medium text-foreground mb-1.5">
                Name *
              </label>
              <Input id="modal-name" name="name" type="text" required placeholder="Max Mustermann" className="bg-background border-border" />
            </div>
            <div>
              <label htmlFor="modal-phone" className="block text-sm font-medium text-foreground mb-1.5">
                Telefon *
              </label>
              <PhoneField
                inputId="modal-phone"
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
              <label htmlFor="modal-email" className="block text-sm font-medium text-foreground mb-1.5">
                E-Mail-Adresse *
              </label>
              <Input id="modal-email" name="email" type="email" required placeholder="max@beispiel.de" className="bg-background border-border" aria-invalid={!!emailError} aria-describedby={emailError ? "modal-email-error" : undefined} onChange={() => emailError && setEmailError(null)} />
              {emailError && (
                <p id="modal-email-error" className="mt-1.5 text-sm text-red-600">
                  {emailError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="modal-message" className="block text-sm font-medium text-foreground mb-1.5">
                Nachricht
              </label>
              <Textarea id="modal-message" name="message" rows={3} placeholder="Schreiben Sie uns …" className="bg-background border-border resize-none" />
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="modal-privacy" required className="mt-1" />
              <label htmlFor="modal-privacy" className="text-xs text-muted-foreground leading-relaxed">
                Ich habe die Informationen zur Verarbeitung personenbezogener Daten in der Datenschutzerklärung zur Kenntnis genommen.
              </label>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full font-medium"
              style={{ backgroundColor: '#6E2E2A', color: 'white' }}
            >
              {isSubmitting ? "Wird gesendet …" : (
                <>Nachricht senden <Send className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}
