import type { Metadata } from "next"
import { HeaderServer } from "@/components/header-server"
import { Footer } from "@/components/footer"
import { LEGAL_ENTITY as E } from "@/lib/legal-entity"

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  alternates: { canonical: "/datenschutz", languages: { de: "/datenschutz", en: "/en/datenschutz" } },
}

// Provisional German Datenschutzerklärung. Structure and wording follow the
// supplied legal source (Datenschutz.pdf), adapted to the website's confirmed
// current functionality only: contact by form/e-mail/phone, consent-gated
// Google Maps (two-click), necessary + consent/language cookies, locally hosted
// fonts. Sections still awaiting legal confirmation (Datenschutzbeauftragte,
// server logs, processors, third-country guarantees, etc.) are omitted.
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
                <li>Art. 6 Abs. 1 lit. b DSGVO – Vertragserfüllung oder vorvertragliche Maßnahmen;</li>
                <li>Art. 6 Abs. 1 lit. c DSGVO – Erfüllung einer rechtlichen Verpflichtung;</li>
                <li>Art. 6 Abs. 1 lit. f DSGVO – Wahrung berechtigter Interessen (z. B. sicherer Betrieb der Website und Beantwortung allgemeiner Anfragen).</li>
              </ul>
            </Section>

            <Section heading="4. SSL-/TLS-Verschlüsselung">
              <p>
                Diese Website wird ausschließlich über HTTPS ausgeliefert und nutzt aus Sicherheitsgründen und
                zum Schutz der Übertragung personenbezogener Daten eine SSL- bzw. TLS-Verschlüsselung. Eine
                verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://“
                auf „https://“ wechselt, sowie am Schloss-Symbol in Ihrer Browserzeile. Wenn die
                Verschlüsselung aktiviert ist, können die Daten, die Sie an uns übermitteln, nicht von Dritten
                mitgelesen werden.
              </p>
            </Section>

            <Section heading="5. Kontaktaufnahme / Kontaktformular / E-Mail / Telefon">
              <p>
                Wenn Sie uns über das Kontaktformular, per E-Mail oder telefonisch kontaktieren, verarbeiten
                wir die von Ihnen mitgeteilten Angaben, um Ihre Anfrage sowie mögliche Anschlussfragen zu
                bearbeiten und zu beantworten. Dabei können folgende personenbezogene Daten verarbeitet werden:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Name</li>
                <li>Vorname und Nachname, soweit erhoben</li>
                <li>E-Mail-Adresse</li>
                <li>Telefonnummer</li>
                <li>Nachricht</li>
                <li>Betreff, soweit angegeben</li>
              </ul>
              <p>
                Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage auf den Abschluss oder die
                Anbahnung eines Vertrags gerichtet ist, andernfalls unser berechtigtes Interesse an der
                Beantwortung Ihrer Anfrage gemäß Art. 6 Abs. 1 lit. f DSGVO.
              </p>
            </Section>

            <Section heading="6. Cookies und Einwilligung">
              <p>
                Diese Website verwendet technisch notwendige Cookies, die für die Grundfunktionen und den
                Betrieb der Website erforderlich sind. Hierzu gehören insbesondere ein Cookie zur Speicherung
                Ihrer Cookie-Auswahl sowie – soweit Sie die Sprache umstellen – ein Cookie zur Speicherung
                Ihrer Spracheinstellung.
              </p>
              <p>
                Optionale Inhalte – insbesondere die Einbindung von Google Maps – werden ausschließlich nach
                Ihrer Einwilligung geladen. Beim Aufruf der Website können Sie wählen, ob Sie nur notwendige
                Cookies zulassen oder optionale Dienste akzeptieren. Ihre Auswahl können Sie jederzeit mit
                Wirkung für die Zukunft über den Button „Cookie-Einstellungen“ im Seitenfuß ändern und Ihre
                Einwilligung dort widerrufen; der Widerruf ist so einfach wie die Erteilung (Art. 7 Abs. 3
                DSGVO).
              </p>
            </Section>

            <Section heading="7. Google Maps / Eingebettete Karten">
              <p>
                Zur Darstellung von Standorten binden wir auf dieser Website Karten des Dienstes Google Maps
                (Anbieter: Google) ein.
              </p>
              <p>
                Wir wenden dabei eine Zwei-Klick-Lösung an: Vor Ihrer Einwilligung wird an der betreffenden
                Stelle lediglich ein Platzhalter mit einem Hinweis auf die Datenübermittlung angezeigt. Es wird
                weder ein Google-Maps-iframe noch die Google-Maps-JavaScript-API geladen, und es werden keine
                Daten an Google übertragen. Sie können die Karte laden, indem Sie auf „Google Maps laden“
                klicken oder die optionalen Dienste über den Cookie-Hinweis akzeptieren.
              </p>
              <p>
                Nach dem Laden können Ihre IP-Adresse sowie technische Informationen Ihres Browsers an Google
                übertragen werden. Rechtsgrundlage für diese Verarbeitung ist Ihre Einwilligung gemäß Art. 6
                Abs. 1 lit. a DSGVO. Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft über
                „Cookie-Einstellungen“ widerrufen.
              </p>
            </Section>

            <Section heading="8. Lokale Schriftarten">
              <p>
                Zur einheitlichen Darstellung dieser Website verwenden wir lokal eingebundene Schriftarten. Die
                Schriftdateien werden über diese Website bereitgestellt. Beim Laden der Schriftarten wird keine
                Verbindung zu Servern von Google Fonts hergestellt.
              </p>
            </Section>

            <Section heading="9. Ihre Rechte">
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
                Zur Ausübung Ihrer Rechte können Sie sich jederzeit an die unter Abschnitt 1 genannten
                Kontaktdaten des Verantwortlichen wenden.
              </p>
            </Section>

            <Section heading="10. Beschwerderecht bei der Aufsichtsbehörde">
              <p>
                Ihnen steht das Recht zu, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung
                Ihrer personenbezogenen Daten zu beschweren (Art. 77 DSGVO). Die für uns zuständige
                Aufsichtsbehörde ist:
              </p>
              <p className="whitespace-pre-line font-medium text-foreground">
                {`Berliner Beauftragte für Datenschutz und Informationsfreiheit\nAlt-Moabit 59–61\n10555 Berlin\nDeutschland`}
              </p>
            </Section>

            <Section heading="11. Widerspruchsrecht – Besonderer Hinweis">
              <p>
                Sofern wir Ihre personenbezogenen Daten auf Grundlage eines berechtigten Interesses gemäß Art.
                6 Abs. 1 lit. f DSGVO verarbeiten, haben Sie das Recht, aus Gründen, die sich aus Ihrer
                besonderen Situation ergeben, jederzeit Widerspruch gegen diese Verarbeitung einzulegen.
              </p>
              <p>
                Wir verarbeiten die betreffenden personenbezogenen Daten anschließend nicht mehr, es sei denn,
                wir können zwingende schutzwürdige Gründe für die Verarbeitung nachweisen, die Ihre Interessen,
                Rechte und Freiheiten überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder
                Verteidigung von Rechtsansprüchen.
              </p>
              <p>
                Zur Ausübung des Widerspruchsrechts können Sie sich an die in Abschnitt 1 genannten Kontaktdaten
                wenden.
              </p>
            </Section>

            <Section heading="12. Automatisierte Entscheidungsfindung / Profiling">
              <p>
                Eine automatisierte Entscheidungsfindung einschließlich Profiling gemäß Art. 22 DSGVO findet
                nicht statt.
              </p>
            </Section>

            <Section heading="13. Pflicht zur Bereitstellung von Daten">
              <p>
                Die Bereitstellung personenbezogener Daten ist weder gesetzlich noch vertraglich
                vorgeschrieben. Ohne Angabe der erforderlichen Kontaktdaten können wir Ihre Anfrage jedoch nicht
                bearbeiten. Pflichtfelder sind entsprechend gekennzeichnet.
              </p>
            </Section>

            <Section heading="14. Aktualität und Änderung dieser Datenschutzerklärung">
              <p>
                Diese Datenschutzerklärung hat den Stand August 2026. Wir behalten uns vor, sie bei Bedarf
                anzupassen, um Änderungen der rechtlichen Anforderungen oder der auf dieser Website eingesetzten
                Dienste zu berücksichtigen. Für Ihren erneuten Besuch gilt die jeweils aktuelle Fassung.
              </p>
            </Section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
