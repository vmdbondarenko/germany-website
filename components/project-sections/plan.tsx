import { ProjectNavigator } from "@/components/project-navigator"

export function DynamicPlanSection({ slug, projectName }: { slug: string; projectName?: string }) {
  return (
    <section className="py-16 lg:py-24 relative overflow-hidden">
      {/* Premium Background with Layered Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8F6F4] via-[#FAF9F7] to-[#F5F2EF]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, #6E2E2A 1px, transparent 1px), radial-gradient(circle at 80% 70%, #5A2A1C 1px, transparent 1px)",
          backgroundSize: "60px 60px, 80px 80px",
        }}
      />
      <div
        className="absolute top-0 left-0 w-1/2 h-full opacity-[0.04] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 0% 0%, #6E2E2A 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 right-0 w-1/2 h-full opacity-[0.03] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 100% 100%, #3E1718 0%, transparent 70%)" }}
      />

      {/* Decorative Corner Elements */}
      <div className="absolute top-8 left-8 w-24 h-24 border-l-2 border-t-2 border-[#6E2E2A]/10 rounded-tl-3xl" />
      <div className="absolute bottom-8 right-8 w-24 h-24 border-r-2 border-b-2 border-[#6E2E2A]/10 rounded-br-3xl" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="text-center mb-12">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase mb-4"
            style={{
              backgroundColor: "rgba(110, 46, 42, 0.1)",
              color: "#6E2E2A",
            }}
          >
            Plan Osiedla
          </span>
          <h2
            className="font-serif text-3xl lg:text-4xl font-semibold mb-4"
            style={{ color: "#3E1718" }}
          >
            Schemat inwestycji
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Wybierz nieruchomość na mapie lub skorzystaj z filtrów, aby znaleźć
            swój wymarzony dom
          </p>
        </div>
        <ProjectNavigator slug={slug} projectName={projectName} />
      </div>
    </section>
  )
}
