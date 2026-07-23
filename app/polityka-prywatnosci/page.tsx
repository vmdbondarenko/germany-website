import type { Metadata } from "next"
import { HeaderServer } from "@/components/header-server"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Polityka prywatności | Jednopiętrowa Warszawa",
  description:
    "Polityka prywatności serwisu jednopietrowawarszawa.pl – zasady przetwarzania i ochrony danych osobowych.",
  alternates: { canonical: "/polityka-prywatnosci" },
}

const UPDATED = "8 lipca 2026"

export default function PolitykaPrywatnosciPage() {
  return (
    <>
      <HeaderServer />
      <main className="pt-20 min-h-screen bg-background">
        <article className="container mx-auto max-w-3xl px-4 lg:px-8 py-12 lg:py-16">
          <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-foreground mb-10">
            Polityka prywatności
          </h1>

          <div className="space-y-8 text-foreground/80 leading-relaxed">
            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                §1. Postanowienia ogólne
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Niniejsza Polityka prywatności określa zasady przetwarzania i
                  ochrony danych osobowych Użytkowników serwisu internetowego
                  dostępnego pod adresem https://www.jednopietrowawarszawa.pl
                  (dalej: „Serwis").
                </li>
                <li>
                  Administratorem danych osobowych jest{" "}
                  <strong>Jednopiętrowa Warszawa sp. z o.o.</strong> z siedzibą w
                  Warszawie, ul. Postępu 12C lok. U5, 02-676 Warszawa, wpisana do
                  rejestru przedsiębiorców KRS pod numerem 0000993491, NIP
                  1133072329, REGON 52318514400000 (dalej: „Administrator").
                </li>
                <li>
                  Kontakt w sprawach danych osobowych: e-mail
                  maryna@jwdevelopment.net, tel. +48 888 181 080.
                </li>
                <li>
                  Administrator nie powołał Inspektora Ochrony Danych; kontakt w
                  sprawach danych – pod adresem e-mail powyżej.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                §2. Zakres zbieranych danych
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Za pośrednictwem formularza kontaktowego zbieramy: imię i
                  nazwisko, numer telefonu, adres e-mail oraz treść wiadomości.
                </li>
                <li>
                  Podanie danych jest dobrowolne, lecz niezbędne do udzielenia
                  odpowiedzi na zapytanie.
                </li>
                <li>
                  Podczas korzystania z Serwisu automatycznie zbierane są dane o
                  aktywności (m.in. adres IP, typ przeglądarki, dane z plików
                  cookies) – szczegóły w §7.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                §3. Cele i podstawy prawne
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Obsługa zapytania z formularza – art. 6 ust. 1 lit. b i lit. f
                  RODO.
                </li>
                <li>
                  Marketing własnych produktów i usług oraz pomiar skuteczności
                  reklam – art. 6 ust. 1 lit. f RODO, a w zakresie wymagającym
                  zgody (cookies marketingowe) – art. 6 ust. 1 lit. a RODO.
                </li>
                <li>
                  Ustalenie, dochodzenie lub obrona roszczeń – art. 6 ust. 1 lit.
                  f RODO.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                §4. Odbiorcy danych
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Odbiorcami danych mogą być podmioty świadczące usługi:
                  hostingowe, informatyczne, analityczne i marketingowe.
                </li>
                <li>
                  Administrator korzysta m.in. z: Vercel Inc. (hosting), Google
                  LLC (Google Analytics, Google Tag Manager, Google Ads), Meta
                  Platforms Ireland Limited (Meta Pixel – narzędzia reklamowe i
                  analityczne Facebook oraz Instagram).
                </li>
                <li>
                  Administrator korzysta również z usług RINGOSTAT POLAND Sp. z
                  o.o. (NIP 7011251293, ul. Hoża 86 lok. 210, 00-682 Warszawa),
                  świadczącej usługi call trackingu, analityki połączeń
                  telefonicznych oraz dynamicznej podmiany numerów telefonów.
                  Dane przetwarzane przez Ringostat są przechowywane na terenie
                  Unii Europejskiej. Ringostat szyfruje przechowywane dane oraz
                  posiada certyfikat ISO/IEC 27001:2022.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                §5. Przekazywanie danych poza EOG
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Niektórzy dostawcy (m.in. Google LLC, Vercel Inc., a w ramach
                  grupy Meta – Meta Platforms, Inc.) mają siedzibę w USA.
                  Przekazywanie odbywa się na podstawie zabezpieczeń z art. 46
                  RODO (standardowe klauzule umowne) lub decyzji o adekwatności
                  (Data Privacy Framework).
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                §6. Okres przechowywania
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Dane z formularza przechowujemy przez 1 rok od zakończenia
                  korespondencji, a w zakresie niezbędnym do roszczeń – do upływu
                  terminu ich przedawnienia.
                </li>
                <li>
                  Dane przetwarzane na podstawie zgody – do czasu jej wycofania.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                §7. Pliki cookies
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Serwis wykorzystuje pliki cookies (niezbędne, analityczne,
                  marketingowe).
                </li>
                <li>
                  Cookies analityczne i marketingowe (m.in. Google Analytics,
                  Google Ads, Meta Pixel – Facebook/Instagram, Ringostat – call
                  tracking) wykorzystywane są na podstawie zgody Użytkownika.
                  Skrypt Ringostat ładowany jest wyłącznie po wyrażeniu przez
                  Użytkownika zgody na pliki cookies.
                </li>
                <li>
                  Użytkownik może zmienić ustawienia cookies w przeglądarce lub
                  poprzez link „Ustawienia cookies" w Serwisie.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                §8. Prawa osób, których dane dotyczą
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Przysługuje prawo: dostępu, sprostowania, usunięcia,
                  ograniczenia, przenoszenia, sprzeciwu oraz cofnięcia zgody w
                  dowolnym momencie (bez wpływu na zgodność z prawem przetwarzania
                  przed cofnięciem).
                </li>
                <li>
                  Prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych
                  Osobowych (ul. Stawki 2, 00-193 Warszawa).
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                §9. Postanowienia końcowe
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Administrator zastrzega prawo zmiany Polityki; aktualna wersja
                  obowiązuje od dnia publikacji.
                </li>
                <li>Data ostatniej aktualizacji: {UPDATED}.</li>
              </ol>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
