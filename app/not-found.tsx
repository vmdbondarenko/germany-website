import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

const SECTION_LINKS: { label: string; href: string }[] = [
  { label: 'O firmie', href: '/#o-firmie' },
  { label: 'Lokalizacja', href: '/lokalizacja' },
  { label: 'W sprzedaży', href: '/#w-sprzedazy' },
  { label: 'Zakończone', href: '/#zakonczone' },
  { label: 'O nas', href: '/#zespol' },
  { label: 'Aktualności', href: '/#aktualnosci' },
  { label: 'Kontakt', href: '/#kontakt' },
]

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-20">
        <section className="container mx-auto px-4 lg:px-8 py-20 lg:py-32">
          <div className="max-w-2xl mx-auto text-center">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase mb-6"
              style={{ backgroundColor: 'rgba(110, 46, 42, 0.1)', color: '#6E2E2A' }}
            >
              Błąd 404
            </span>

            <h1
              className="font-serif text-4xl lg:text-5xl font-semibold mb-5 leading-tight"
              style={{ color: '#3E1718' }}
            >
              404 – Strona nie została znaleziona
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-10">
              Strona, której szukasz, nie istnieje lub została przeniesiona.
            </p>

            <Link
              href="/"
              className="inline-block text-sm font-medium px-6 py-3 rounded-lg transition-all duration-300 hover:opacity-90"
              style={{ backgroundColor: '#6E2E2A', color: 'rgba(255, 255, 255, 0.95)' }}
            >
              Wróć na stronę główną
            </Link>
          </div>

          <nav aria-label="Główne sekcje" className="max-w-3xl mx-auto mt-16 lg:mt-20">
            <h2
              className="font-serif text-xl lg:text-2xl font-semibold text-center mb-8"
              style={{ color: '#3E1718' }}
            >
              Przejdź do głównych sekcji
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SECTION_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-center text-sm font-medium px-5 py-3 rounded-lg border border-border/60 bg-white text-foreground transition-all duration-300 hover:border-[#6E2E2A]/40 hover:text-[#6E2E2A] hover:shadow-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </section>
      </main>
      <Footer />
    </>
  )
}
