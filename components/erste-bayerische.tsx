import Image from "next/image"
import { DynamicIcon } from "@/components/dynamic-icon"
import { ErsteBayerischeGallery } from "@/components/erste-bayerische-gallery"
import { renderBold, RichText } from "@/lib/render-bold"
import type { ErsteBayerischeContent, EbBlock } from "@/lib/home-content"

// "Erste Bayerische" — the first investment, presented in full on the homepage
// directly after the Bauweise section. Server component (no client JS) to keep
// the homepage lightweight; all imagery uses next/image with responsive ratios.

function TextImageBlock({ block, flip }: { block: EbBlock; flip?: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
      <div className={flip ? "lg:order-2" : "lg:order-1"}>
        {block.title && (
          <h3 className="font-serif text-2xl lg:text-3xl font-semibold mb-4" style={{ color: "#3E1718" }}>
            {renderBold(block.title)}
          </h3>
        )}
        <RichText
          text={block.body}
          containerClassName="space-y-4"
          pClassName="text-muted-foreground text-base lg:text-lg leading-relaxed"
        />
      </div>
      {block.image && (
        <div className={flip ? "lg:order-1" : "lg:order-2"}>
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
            <Image
              src={block.image}
              alt={block.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-white/30 rounded-tl-xl" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-white/30 rounded-br-xl" />
          </div>
        </div>
      )}
    </div>
  )
}

export function ErsteBayerische({ content }: { content: ErsteBayerischeContent }) {
  const c = content
  return (
    <section id="erste-bayerische" className="py-16 lg:py-28 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-10 lg:mb-14">
          <span
            className="inline-block text-sm lg:text-base font-medium tracking-[0.2em] uppercase mb-4"
            style={{ color: "#6E2E2A" }}
          >
            {renderBold(c.projectName)}
          </span>
          <h2 className="font-serif text-3xl lg:text-5xl font-semibold leading-tight" style={{ color: "#3E1718" }}>
            {renderBold(c.heading)}
          </h2>
        </div>

        {/* Hero image */}
        {c.hero.image && (
          <div className="relative aspect-[16/9] lg:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl mb-12 lg:mb-16">
            <Image
              src={c.hero.image}
              alt={c.hero.alt}
              fill
              priority={false}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          </div>
        )}

        {/* Intro */}
        <RichText
          text={c.intro}
          containerClassName="max-w-3xl mx-auto text-center mb-16 lg:mb-24 space-y-4"
          pClassName="text-lg lg:text-xl text-muted-foreground leading-relaxed"
        />

        <div className="max-w-7xl mx-auto space-y-16 lg:space-y-24">
          {/* Subsection A — green surroundings & connection */}
          <TextImageBlock block={c.blocks.location} />

          {/* Wide nature image */}
          {c.wide.image && (
            <div className="relative aspect-[21/9] rounded-3xl overflow-hidden shadow-xl">
              <Image
                src={c.wide.image}
                alt={c.wide.alt}
                fill
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover"
              />
            </div>
          )}

          {/* Subsection B — nature & the Dahme (image left) */}
          <TextImageBlock block={c.blocks.nature} flip />

          {/* Subsection C — Zeuthener See & marina */}
          <TextImageBlock block={c.blocks.see} />

          {/* Objektbeschreibung & Grundrisse — project description, key facts and
              the 2D floor plans + 3D visualizations (Erdgeschoss & Dachgeschoss). */}
          <div>
            <div className="max-w-3xl mx-auto text-center mb-10 lg:mb-14">
              <h3 className="font-serif text-2xl lg:text-3xl font-semibold mb-3" style={{ color: "#3E1718" }}>
                {renderBold(c.objekt.title)}
              </h3>
              <p className="text-muted-foreground text-base lg:text-lg">
                {renderBold(c.objekt.subtitle)}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
              <RichText
                text={c.objekt.body}
                containerClassName="space-y-4"
                pClassName="text-muted-foreground text-base lg:text-lg leading-relaxed"
              />

              <div className="rounded-3xl border border-[#6E2E2A]/10 bg-card p-6 lg:p-8 shadow-sm">
                <h4 className="font-serif text-xl lg:text-2xl font-semibold mb-5" style={{ color: "#3E1718" }}>
                  Eckdaten
                </h4>
                <dl>
                  {c.eckdaten.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-start justify-between gap-4 border-b border-border/50 py-2.5 last:border-0"
                    >
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="font-medium text-foreground text-right">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Floor plans — dynamic subsections; each shows two images side by
                side on desktop (left + right) and stacked on mobile. */}
            {c.plans.length > 0 && (
              <div className="mt-12 lg:mt-16">
                <h4 className="font-serif text-xl lg:text-2xl font-semibold text-center mb-8 lg:mb-10" style={{ color: "#3E1718" }}>
                  {renderBold(c.plansHeading)}
                </h4>
                <div className="space-y-10 lg:space-y-14">
                  {c.plans.map((p, idx) => {
                    const figs = [
                      { image: p.image1, alt: p.alt1 },
                      { image: p.image2, alt: p.alt2 },
                    ].filter((f) => f.image)
                    if (figs.length === 0) return null
                    return (
                      <div key={idx}>
                        {/* Public title = exactly the admin-entered title (no appended labels). */}
                        {p.floor && (
                          <h5 className="font-medium text-lg text-center mb-5" style={{ color: "#6E2E2A" }}>
                            {p.floor}
                          </h5>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-8">
                          {figs.map((f, i) => (
                            <figure key={i}>
                              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-white shadow-xl border border-border/50">
                                <Image
                                  src={f.image}
                                  alt={f.alt || p.floor}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                  className="object-contain p-3"
                                />
                              </div>
                            </figure>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Travel times & everyday infrastructure */}
          {c.travel.length > 0 && (
            <div>
              <h3 className="font-serif text-2xl lg:text-3xl font-semibold text-center mb-10 lg:mb-14" style={{ color: "#3E1718" }}>
                {renderBold(c.travelHeading)}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
                {c.travel.map((tv, i) => (
                  <div
                    key={i}
                    className="group relative flex flex-col rounded-2xl border border-[#6E2E2A]/10 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl mb-4"
                      style={{ background: "linear-gradient(135deg, #6E2E2A 0%, #3E1718 100%)" }}
                    >
                      <DynamicIcon name={tv.icon} className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-medium text-foreground leading-snug whitespace-pre-line">{renderBold(tv.title)}</p>
                    {tv.description && (
                      <p className="mt-1 text-sm text-muted-foreground leading-snug whitespace-pre-line">{renderBold(tv.description)}</p>
                    )}
                    {tv.meta && (
                      <p className="mt-2 text-sm font-semibold whitespace-pre-line" style={{ color: "#6E2E2A" }}>
                        {renderBold(tv.meta)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Closing paragraph */}
          {c.blocks.closing.body && (
            <div className="max-w-3xl mx-auto text-center">
              {c.blocks.closing.title && (
                <h3 className="font-serif text-2xl lg:text-3xl font-semibold mb-4" style={{ color: "#3E1718" }}>
                  {renderBold(c.blocks.closing.title)}
                </h3>
              )}
              <RichText
                text={c.blocks.closing.body}
                containerClassName="space-y-4"
                pClassName="text-lg lg:text-xl text-muted-foreground leading-relaxed"
              />
            </div>
          )}

          {/* Optional gallery — photos open in the shared lightbox */}
          <ErsteBayerischeGallery images={c.gallery} />
        </div>
      </div>
    </section>
  )
}
