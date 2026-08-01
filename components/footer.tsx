import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { cityContacts, headquarters } from "@/lib/contact-info"
import { CookieSettingsButton } from "@/components/cookie-settings-button"

export async function Footer() {
  const t = await getTranslations("footer")
  const tn = await getTranslations("nav")
  const tc = await getTranslations("common")

  const navLinks = [
    { href: "#unternehmen", label: tn("about") },
    { href: "#verkauf", label: t("navInvestments") },
    { href: "#ablauf", label: t("navWhyUs") },
    { href: "#kontakt", label: tn("contact") },
  ]

  // No German social profiles provided yet — add them here when available.
  const socialLinks: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }[] = []

  return (
    <footer className="bg-foreground text-primary-foreground py-16 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="font-serif text-2xl font-semibold text-primary-foreground">
                {tc("companyName")}
              </span>
            </Link>
            <p className="text-primary-foreground/70 max-w-md leading-relaxed mb-6">
              {t("description")}
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-primary-foreground/20 transition-colors duration-200"
                >
                  <social.icon className="h-5 w-5 text-primary-foreground" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-primary-foreground mb-4">{t("navHeading")}</h4>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-primary-foreground mb-4">{t("contactHeading")}</h4>
            <div className="space-y-5">
              {cityContacts.map((c) => (
                <div key={c.city}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/40 mb-2">{c.city}</p>
                  <ul className="space-y-1.5 text-primary-foreground/70">
                    <li>
                      <a href={c.phoneHref} className="hover:text-primary-foreground transition-colors">
                        {c.phone}
                      </a>
                    </li>
                    <li>
                      <a href={`mailto:${c.email}`} className="hover:text-primary-foreground transition-colors">
                        {c.email}
                      </a>
                    </li>
                  </ul>
                </div>
              ))}
              {/* Registered office */}
              <div className="pt-1 border-t border-primary-foreground/10">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/40 mb-2">{t("hqLabel")}</p>
                <p className="text-primary-foreground/70 text-sm leading-relaxed">
                  {headquarters.addressLines.map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < headquarters.addressLines.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/50 text-sm">
            © {new Date().getFullYear()} {tc("companyName")}. {t("rights")}
          </p>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/datenschutz" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">
              {t("privacy")}
            </Link>
            <Link href="/impressum" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">
              {t("terms")}
            </Link>
            <CookieSettingsButton className="text-primary-foreground/50 hover:text-primary-foreground transition-colors" />
          </div>
        </div>
      </div>
    </footer>
  )
}
