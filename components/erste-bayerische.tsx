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
