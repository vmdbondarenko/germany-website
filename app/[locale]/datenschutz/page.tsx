import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { HeaderServer } from "@/components/header-server"
import { Footer } from "@/components/footer"
import { company } from "@/lib/contact-info"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal")
  return { title: t("datenschutzTitle"), alternates: { canonical: "/datenschutz" } }
}

export default async function DatenschutzPage() {
  const t = await getTranslations("legal")
  const tc = await getTranslations("common")

  const Section = ({ heading, children }: { heading: string; children: React.ReactNode }) => (
    <section>
      <h2 className="font-serif text-xl font-semibold text-foreground mb-3">{heading}</h2>
      <div className="text-foreground/80 leading-relaxed whitespace-pre-line">{children}</div>
    </section>
  )

  return (
    <>
      <HeaderServer />
      <main className="pt-20 min-h-screen bg-background">
        <article className="container mx-auto max-w-3xl px-4 lg:px-8 py-12 lg:py-16">
          <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-foreground mb-10">
            {t("datenschutzTitle")}
          </h1>
          <div className="space-y-8">
            <Section heading={t("controllerHeading")}>
              {[company.name, ...company.addressLines].join("\n")}
            </Section>
            <Section heading={t("dataHeading")}>{t("dataBody")}</Section>
            <Section heading={t("rightsHeading")}>{t("rightsBody")}</Section>
            <Section heading={t("contactHeading")}>
              {`${tc("phone")}: ${company.phone}\n${tc("email")}: ${company.email}`}
            </Section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
