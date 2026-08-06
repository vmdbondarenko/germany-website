import type { Metadata } from "next"
import { HeaderServer } from "@/components/header-server"
import { Footer } from "@/components/footer"
import { LEGAL_ENTITY as E } from "@/lib/legal-entity"

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  alternates: { canonical: "/datenschutz", languages: { de: "/datenschutz", en: "/en/datenschutz" } },
}

// Provisional German Datenschutzerklärung. Reflects only what the website
// actually does (contact by form/e-mail/phone, consent-gated Google Maps,
// necessary + consent/language cookies). Legal review pending.
function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl font-semibold text-foreground mb-3">{heading}</h2>
      <div className="text-foreground/80 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export default function DatenschutzPage() {
  return (
    <>
      <HeaderServer />
      <main className="pt-20 min-h-screen bg-background">
        <article className="container mx-auto max-w-3xl px-4 lg:px-8 py-12 lg:py-16">
          <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-foreground mb-2">
            Datenschutzerklärung
          </h1>
          <p className="text-sm text-muted-foreground mb-10">Stand: August 2026</p>

          <div className="space-y-8">
            <Section heading="1. Verantwortlicher">
              <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
              <p className="whitespace-pre-line">
                {`${E.name}\n${E.street}\n${E.postalCode} ${E.city}\n${E.country}`}
              </p>
              <p>
                Vertreten durch die {E.managingDirectorRole}: {E.managingDirector}
                <br />
                Telefon: {E.phone}
                <br />
                E-Mail: {E.email}
              </p>
            </Section>

            <Section heading="2. Allgemeines zur Datenverarbeitung">
              <p>
                Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur, soweit dies zur
                Bereitstellung einer funktionsfähigen Website sowie zur Beantwortung Ihrer Anfragen
                erforderlich ist. Personenbezogene Daten sind alle Informationen, die sich auf eine
                identifizierte oder identifizierbare natürliche Person beziehen.
              </p>
            </Section>

            <Section heading="3. Rechtsgrundlagen der Verarbeitung">
              <p>Die Verarbeitung personenbezogener Daten erfolgt auf Grundlage der folgenden Vorschriften der DSGVO:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Art. 6 Abs. 1 lit. a DSGVO – Einwilligung (z. B. für das Laden von Google Maps);</li>
                <li>Art. 6 Abs. 1 lit. b DSGVO – Anbahnung oder Erfüllung eines Vertrags;</li>
                <li>Art. 6 Abs. 1 lit. f DSGVO – berechtigtes Interesse (z. B. Beantwortung allgemeiner Anfragen und sicherer Betrieb der Website).</li>
              </ul>
            </Section>

            <Section heading="4. SSL-/TLS-Verschlüsselung">
              <p>
                Diese Website nutzt aus Sicherheitsgründen und zum Schutz der Übertragung personenbezogener
                Daten eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie an der
                Adresszeile „https://“ sowie am Schloss-Symbol in Ihrer Browserzeile. Bei aktiver
                Verschlüsselung können die Daten, die Sie an uns übermitteln, nicht von Dritten mitgelesen
                werden.
              </p>
            </Section>

            <Section heading="5. Kontaktaufnahme (Kontaktformular, E-Mail, Telefon)">
              <p>
                Wenn Sie uns über das Kontaktformular, per E-Mail oder telefonisch kontaktieren, verarbeiten
                wir die von Ihnen mitgeteilten personenbezogenen Daten, um Ihre Anfrage zu bearbeiten und zu
                beantworten.
              </p>
              <p>Über das Kontaktformular erheben wir folgende Daten:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Name</li>
                <li>E-Mail-Adresse</li>
                <li>Telefonnummer</li>
                <li>Nachricht (sofern von Ihnen angegeben)</li>
              </ul>
              <p>
                Die Verarbeitung dieser Daten erfolgt ausschließlich zum Zweck der Bearbeitung und
                Beantwortung Ihrer Anfrage. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre
                Anfrage auf den Abschluss oder die Anbahnung eines Vertrags gerichtet ist, andernfalls unser
                berechtigtes Interesse an der Beantwortung Ihrer Anfrage gemäß Art. 6 Abs. 1 lit. f DSGVO.
              </p>
            </Section>

            <Section heading="6. Cookies und Einwilligung">
              <p>
                Wir verwenden technisch notwendige Cookies, die für den Betrieb der Website erforderlich sind.
                Dazu gehören insbesondere ein Cookie zur Speicherung Ihrer Cookie-Auswahl sowie ein Cookie zur
                Speicherung Ihrer Spracheinstellung. Diese Cookies sind für die grundlegende Funktion der
                Website erforderlich.
              </p>
              <p>
                Optionale Inhalte – insbesondere die Einbindung von Google Maps – werden ausschließlich nach
                Ihrer Einwilligung geladen. Beim Aufruf der Website können Sie wählen, ob Sie nur notwendige
                Cookies zulassen oder optionale Dienste akzeptieren. Ihre Auswahl können Sie jederzeit mit
                Wirkung für die Zukunft über den Link „Cookie-Einstellungen“ im Seitenfuß ändern und Ihre
                Einwilligung dort widerrufen.
              </p>
            </Section>

            <Section heading="7. Google Maps">
              <p>
                Auf dieser Website binden wir Karten des Dienstes Google Maps (Anbieter: Google) ein, um Ihnen
                unseren Standort anzuzeigen.
              </p>
              <p>
                Google Maps wird erst geladen, nachdem Sie hierin ausdrücklich eingewilligt haben. Vor Ihrer
                Einwilligung wird an der betreffenden Stelle lediglich ein Platzhalter angezeigt; es werden
                keine Daten an Google übertragen. Erst wenn Sie auf „Google Maps laden“ klicken oder die
                optionalen Dienste über den Cookie-Hinweis akzeptieren, wird die Karte geladen. Dabei können
                personenbezogene Daten, insbesondere Ihre IP-Adresse, an Google übertragen werden.
              </p>
              <p>
                Rechtsgrundlage für diese Verarbeitung ist Ihre Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO.
                Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft über „Cookie-Einstellungen“
                widerrufen.
              </p>
            </Section>

            <Section heading="8. Ihre Rechte">
              <p>Sie haben nach der DSGVO insbesondere folgende Rechte:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Recht auf Auskunft (Art. 15 DSGVO);</li>
                <li>Recht auf Berichtigung (Art. 16 DSGVO);</li>
                <li>Recht auf Löschung (Art. 17 DSGVO);</li>
                <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO);</li>
                <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO);</li>
                <li>Recht auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO);</li>
                <li>Recht auf Widerruf einer erteilten Einwilligung (Art. 7 Abs. 3 DSGVO).</li>
              </ul>
              <p>
                Zur Ausübung Ihrer Rechte können Sie sich jederzeit an die unter Ziffer 1 genannten
                Kontaktdaten des Verantwortlichen wenden.
              </p>
            </Section>

            <Section heading="9. Beschwerderecht bei der Aufsichtsbehörde">
              <p>
                Ihnen steht das Recht zu, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung
                Ihrer personenbezogenen Daten zu beschweren. Die für uns zuständige Aufsichtsbehörde ist:
              </p>
              <p className="font-medium text-foreground">
                Berliner Beauftragte für Datenschutz und Informationsfreiheit
              </p>
            </Section>

            <Section heading="10. Automatisierte Entscheidungsfindung">
              <p>
                Eine automatisierte Entscheidungsfindung einschließlich Profiling gemäß Art. 22 DSGVO findet
                nicht statt.
              </p>
            </Section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
