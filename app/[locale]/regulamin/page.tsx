import type { Metadata } from "next"
import { HeaderServer } from "@/components/header-server"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Regulamin | Jednopiętrowa Warszawa",
  description: "Regulamin korzystania z serwisu internetowego jednopietrowawarszawa.pl.",
  alternates: { canonical: "/regulamin" },
}

const UPDATED = "22 czerwca 2026"

export default function RegulaminPage() {
  return (
    <>
      <HeaderServer />
      <main className="pt-20 min-h-screen bg-background">
        <article className="container mx-auto max-w-3xl px-4 lg:px-8 py-12 lg:py-16">
          <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-foreground mb-10">
            Regulamin serwisu
          </h1>

          <div className="space-y-8 text-foreground/80 leading-relaxed">
            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                §1. Postanowienia ogólne
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Regulamin określa zasady korzystania z serwisu pod adresem
                  https://www.jednopietrowawarszawa.pl (dalej: „Serwis").
                </li>
                <li>
                  Operatorem Serwisu jest Jednopiętrowa Warszawa sp. z o.o., ul.
                  Postępu 12C lok. U5, 02-676 Warszawa, KRS 0000993491, NIP
                  1133072329, REGON 52318514400000 (dalej: „Usługodawca").
                </li>
                <li>
                  Kontakt: e-mail maryna@jwdevelopment.net, tel. +48 888 181 080.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                §2. Definicje
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>Usługodawca — Jednopiętrowa Warszawa sp. z o.o.</li>
                <li>Użytkownik — osoba korzystająca z Serwisu.</li>
                <li>
                  Serwis — strona pod adresem
                  https://www.jednopietrowawarszawa.pl.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                §3. Rodzaj i zakres usług
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Usługodawca świadczy drogą elektroniczną usługi: udostępnianie
                  treści informacyjnych o inwestycjach i ofercie oraz kontakt
                  przez formularz kontaktowy.
                </li>
                <li>
                  Treści w Serwisie mają charakter informacyjny i nie stanowią
                  oferty w rozumieniu art. 66 Kodeksu cywilnego.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                §4. Warunki korzystania i wymagania techniczne
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Potrzebne jest urządzenie z dostępem do Internetu i aktualna
                  przeglądarka z obsługą JavaScript oraz cookies.
                </li>
                <li>
                  Zakazane jest dostarczanie treści o charakterze bezprawnym;
                  Użytkownik korzysta z Serwisu zgodnie z prawem i dobrymi
                  obyczajami.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                §5. Formularz kontaktowy
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Skorzystanie z formularza wymaga podania danych obowiązkowych i
                  zapoznania się z zasadami przetwarzania danych.
                </li>
                <li>
                  Zasady przetwarzania danych określa Polityka prywatności.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                §6. Reklamacje
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Reklamacje dotyczące Serwisu: e-mail maryna@jwdevelopment.net.
                </li>
                <li>Rozpatrzenie w terminie 14 dni od otrzymania.</li>
              </ol>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                §7. Postanowienia końcowe
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  W sprawach nieuregulowanych stosuje się prawo polskie (Kodeks
                  cywilny, ustawa o świadczeniu usług drogą elektroniczną).
                </li>
                <li>
                  Usługodawca zastrzega prawo zmiany Regulaminu; aktualna wersja
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
