import { Check } from "lucide-react"
import { SectionIcon } from "./icon-map"

type SectionItemData = {
  id: string
  icon: string | null
  title: string
  description: string | null
}

type SectionData = {
  label: string | null
  heading: string | null
  description: string | null
  items: SectionItemData[]
}

export function DynamicStandardSection({ section }: { section: SectionData }) {
  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8F6F4] via-[#FAF9F7] to-[#F5F2EF]" />
      <div
        className="absolute top-0 left-0 w-1/2 h-full opacity-[0.035] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 0% 0%, #6E2E2A 0%, transparent 70%)" }}
      />
      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="text-center mb-16">
          {section.label && (
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase mb-4"
              style={{
                backgroundColor: "rgba(110,46,42,0.1)",
                color: "#6E2E2A",
              }}
            >
              {section.label}
            </span>
          )}
          {section.heading && (
            <h2
              className="font-serif text-3xl lg:text-5xl font-semibold mb-6"
              style={{ color: "#3E1718" }}
            >
              {section.heading}
            </h2>
          )}
          {section.description && (
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
              {section.description}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {section.items.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white rounded-2xl p-8 shadow-sm border border-border/30 hover:shadow-lg hover:border-[#6E2E2A]/20 transition-all duration-300"
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(110,46,42,0.08)" }}
                >
                  <SectionIcon
                    name={item.icon || "Check"}
                    className="w-7 h-7"
                    style={{ color: "#6E2E2A" }}
                  />
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#6E2E2A" }}
                >
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {item.title}
              </p>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
