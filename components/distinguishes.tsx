import { Layers, PenLine, ArrowUpToLine } from "lucide-react"

const items = [
  {
    icon: Layers,
    title: "Cegła ręcznie formowana",
    description:
      "Przypomina starożytny materiał okładzinowy, który był używany we Włoszech setki lat temu, zwłaszcza do dekoracji domów i zamków na wybrzeżu Morza Liguryjskiego.",
  },
  {
    icon: PenLine,
    title: "Projektowanie i planowanie",
    description:
      "Budujemy wyłącznie swoje projekty, na swoich działkach. Na etapie przygotowywania projektu istnieje możliwość wprowadzenia zmian lokatorskich według potrzeb i pomysłów klienta.",
  },
  {
    icon: ArrowUpToLine,
    title: "Wysokość sufitu do 6 metrów",
    description:
      "W budowanych nieruchomościach możemy wykonać podwyższone sufity, co pozwala wstawić większe okna i wpuścić do pomieszczeń jeszcze więcej światła.",
  },
]

export function Distinguishes() {
  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16 lg:mb-20">
          <p
            className="text-sm lg:text-base font-medium tracking-[0.2em] uppercase mb-4"
            style={{ color: "#6E2E2A" }}
          >
            Nasza oferta
          </p>
          <h2
            className="font-serif text-3xl lg:text-4xl font-semibold mb-4"
            style={{ color: "#3E1718" }}
          >
            Co nas wyróżnia?
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            Dbamy o każdy detal — od wyboru materiałów po indywidualne podejście do projektu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 max-w-5xl mx-auto">
          {items.map((item, index) => (
            <div
              key={index}
              className="group relative bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{ background: "linear-gradient(90deg, #6E2E2A, #3E1718)" }}
              />

              <div className="p-8 pt-9">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: "rgba(110, 46, 42, 0.08)" }}
                >
                  <item.icon className="h-7 w-7" style={{ color: "#6E2E2A" }} />
                </div>

                <h3
                  className="font-serif text-xl font-semibold mb-3 leading-snug"
                  style={{ color: "#3E1718" }}
                >
                  {item.title}
                </h3>

                <p className="text-muted-foreground text-sm lg:text-base leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
