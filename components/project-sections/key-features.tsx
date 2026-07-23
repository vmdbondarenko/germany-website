import { SectionIcon } from "./icon-map"

type Item = {
  id: string
  icon: string | null
  title: string
  subtitle: string | null
  description: string | null
}

const LG_COLS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
}

export function DynamicKeyFeatures({ items }: { items: Item[] }) {
  const lgCols = LG_COLS[Math.min(items.length, 4)] || "lg:grid-cols-4"
  return (
    <section className="py-8 border-b border-border/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8F6F4] via-[#FAF9F7] to-[#F5F2EF]" />
      <div
        className="absolute top-0 left-0 w-1/2 h-full opacity-[0.035] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 0% 0%, #6E2E2A 0%, transparent 70%)" }}
      />
      <div className="container mx-auto px-4 lg:px-8 relative">
        <div
          className={`grid gap-5 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 ${lgCols}`}
        >
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-4 min-w-0">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(110,46,42,0.1)" }}
              >
                <SectionIcon
                  name={item.icon || "MapPin"}
                  className="w-5 h-5"
                  style={{ color: "#6E2E2A" }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  className="font-medium text-sm break-words"
                  style={{ color: "#3E1718" }}
                >
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p className="text-sm text-muted-foreground break-words">
                    {item.subtitle}
                  </p>
                )}
                {item.description && (
                  <p className="text-sm text-muted-foreground break-words">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
