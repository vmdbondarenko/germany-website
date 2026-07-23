import { MapPin, Home, Trees, Settings } from "lucide-react"

const features = [
  {
    icon: MapPin,
    title: "Atrakcyjne położenie",
    description:
      "Starannie wybrana lokalizacja łączy komfort życia codziennego z łatwym dostępem do miejskiej infrastruktury.",
  },
  {
    icon: Home,
    title: "Prywatna przestrzeń",
    description:
      "Każdy dom oferuje własny ogród, który zapewnia komfort, relaks i kontakt z naturą na co dzień.",
  },
  {
    icon: Trees,
    title: "Zielone otoczenie",
    description:
      "Inwestycja powstaje w spokojnej, zielonej okolicy, idealnej dla rodzin i osób ceniących ciszę oraz przestrzeń.",
  },
  {
    icon: Settings,
    title: "Wygoda i funkcjonalność",
    description:
      "Przemyślane układy pomieszczeń, miejsca parkingowe do każdego domu i nowoczesne rozwiązania dla codziennej wygody.",
  },
]

export function Process() {
  return (
    <section id="proces" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 lg:mb-20">
          <h2 
            className="font-serif text-3xl lg:text-4xl font-semibold mb-4"
            style={{ color: '#3E1718' }}
          >
            Dlaczego warto wybrać nas
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg max-w-3xl mx-auto leading-relaxed">
            Tworzymy nowoczesne inwestycje w zielonym otoczeniu, z myślą o komforcie codziennego życia, estetyce architektury i wysokiej jakości wykonania.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-card p-6 lg:p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Icon */}
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: 'rgba(110, 46, 42, 0.1)' }}
              >
                <feature.icon 
                  className="h-6 w-6" 
                  style={{ color: '#6E2E2A' }} 
                />
              </div>
              
              {/* Title */}
              <h3 
                className="font-serif text-lg lg:text-xl font-semibold mb-3"
                style={{ color: '#3E1718' }}
              >
                {feature.title}
              </h3>
              
              {/* Description */}
              <p className="text-muted-foreground text-sm lg:text-base leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
