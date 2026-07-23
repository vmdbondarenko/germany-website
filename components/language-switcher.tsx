"use client"

import { useLocale } from "next-intl"
import { useTransition } from "react"
import { usePathname, useRouter } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"

// Compact DE / EN toggle. Keeps the user on the current page and swaps only the
// locale (the default locale renders prefix-free, EN under /en). Uses the
// locale-aware navigation helpers so the prefix is handled automatically.
export function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const switchTo = (next: string) => {
    if (next === locale) return
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <div
      className="flex items-center gap-1 text-xs font-semibold"
      style={{ color: "rgba(74, 42, 42, 0.7)" }}
      aria-label="Sprache / Language"
    >
      {routing.locales.map((loc, i) => (
        <span key={loc} className="flex items-center gap-1">
          {i > 0 && <span className="opacity-40">/</span>}
          <button
            type="button"
            onClick={() => switchTo(loc)}
            disabled={isPending}
            aria-current={loc === locale ? "true" : undefined}
            className={`uppercase transition-opacity hover:opacity-100 ${
              loc === locale ? "opacity-100 underline underline-offset-4" : "opacity-60"
            }`}
          >
            {loc}
          </button>
        </span>
      ))}
    </div>
  )
}
