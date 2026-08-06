import type { Metadata } from "next"
import { HeaderServer } from "@/components/header-server"
import { Footer } from "@/components/footer"
import { LEGAL_ENTITY as E } from "@/lib/legal-entity"

export const metadata: Metadata = {
  title: "Impressum",
  alternates: { canonical: "/impressum", languages: { de: "/impressum", en: "/en/impressum" } },
}

// Provisional Impressum from confirmed data only. Fields still awaiting
// confirmation (USt-IdNr., § 34c GewO, authorities) are intentionally omitted
// rather than shown as "Wird nachgereicht".
function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl font-semibold text-foreground mb-3">{heading}</h2>
      <div className="text-foreground/80 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export default function ImpressumPage() {
  return (
    <>
      <HeaderServer />
      <main className="pt-20 min-h-screen bg-background">
        <article className="container mx-auto max-w-3xl px-4 lg:px-8 py-12 lg:py-16">
          <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-foreground mb-10">
            Impressum
          </h1>

          <div className="space-y-8">
            <Section heading="Angaben gemäß § 5 DDG">
              <p className="whitespace-pre-line">
                {`${E.name}\n${E.street}\n${E.postalCode} ${E.city}\n${E.country}`}
              </p>
            </Section>

            <Section heading="Vertreten durch">
              <p>
                {E.managingDirector}, {E.managingDirectorRole}
              </p>
            </Section>

            <Section heading="Kontakt">
              <p>
                Telefon: {E.phone}
                <br />
                E-Mail: {E.email}
              </p>
            </Section>

            <Section heading="Registereintrag">
              <p>
                Registergericht: {E.registerCourt}
                <br />
                Registernummer: {E.registrationNumber}
              </p>
            </Section>

            <Section heading="Verbraucherstreitbeilegung gemäß § 36 VSBG">
              <p>
                Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </Section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
