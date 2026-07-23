import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import type { HeroContent } from "@/lib/home-content"

export function Hero({ content }: { content: HeroContent }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-main.jpg"
          alt={content.title}
          fill
          className="object-cover"
          priority
          loading="eager"
        />
        <div className="absolute inset-0 bg-foreground/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 pt-20">
        <div className="max-w-3xl">
          <p className="text-primary-foreground/80 text-sm lg:text-base font-medium tracking-widest uppercase mb-4">
            {content.eyebrow}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-7xl font-semibold text-primary-foreground leading-tight mb-6 text-balance">
            {content.title}
          </h1>
          <p className="text-primary-foreground/90 text-lg lg:text-xl leading-relaxed mb-8 max-w-2xl">
            {content.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              asChild
              size="lg"
              className="bg-primary-foreground text-foreground hover:bg-primary-foreground/90 font-medium text-base px-8"
            >
              <Link href={content.primaryCta.href}>
                {content.primaryCta.label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/50 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 font-medium text-base px-8"
            >
              <Link href={content.secondaryCta.href}>{content.secondaryCta.label}</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary-foreground/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-primary-foreground/70 rounded-full" />
        </div>
      </div>
    </section>
  )
}
