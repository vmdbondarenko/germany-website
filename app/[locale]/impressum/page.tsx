import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { HeaderServer } from "@/components/header-server"
import { Footer } from "@/components/footer"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal")
  return { title: t("impressumTitle"), alternates: { canonical: "/impressum" } }
}

export default async function ImpressumPage() {
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
            {t("impressumTitle")}
          </h1>
          <div className="space-y-8">
            <Section heading={t("providerHeading")}>
              {tc("companyName")}
              {"\n"}
              {t("placeholder")}
            </Section>
            <Section heading={t("contactHeading")}>{t("placeholder")}</Section>
            <Section heading={t("registerHeading")}>{t("placeholder")}</Section>
            <Section heading={t("vatHeading")}>{t("placeholder")}</Section>
            <Section heading={t("disclaimerHeading")}>{t("disclaimerBody")}</Section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
