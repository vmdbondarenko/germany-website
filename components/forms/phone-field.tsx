"use client"

import { COUNTRIES, findCountry, type Country } from "@/lib/contact/countries"
import { PHONE_MAX_LENGTH } from "@/lib/validation/phone"

type Variant = "light" | "dark"

const STYLES: Record<Variant, { control: string; error: string }> = {
  light: {
    control:
      "border border-border bg-background text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
    error: "mt-1.5 text-sm text-red-600",
  },
  dark: {
    control:
      "rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-gray-500 px-4 py-3 focus:outline-none focus:border-[#6E2E2A]",
    error: "mt-1 text-sm text-red-400",
  },
}

/**
 * Phone input with a country dial-code dropdown (Poland default) and a separate
 * national-number field. Fully controlled — the parent owns `country`/`number`,
 * composes the submitted value, and runs validation.
 */
export function PhoneField({
  country,
  onCountryChange,
  number,
  onNumberChange,
  error,
  variant = "light",
  required,
  inputId = "phone",
  disabled,
}: {
  country: Country
  onCountryChange: (c: Country) => void
  number: string
  onNumberChange: (v: string) => void
  error?: string | null
  variant?: Variant
  required?: boolean
  inputId?: string
  disabled?: boolean
}) {
  const s = STYLES[variant]
  const errorId = `${inputId}-error`

  return (
    <div>
      <div className="flex gap-2">
        <select
          aria-label="Kierunkowy kraju"
          value={country.iso}
          onChange={(e) => onCountryChange(findCountry(e.target.value))}
          disabled={disabled}
          className={`${s.control} w-32 shrink-0`}
        >
          {COUNTRIES.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.flag} {c.dial} {c.name}
            </option>
          ))}
        </select>
        <input
          id={inputId}
          name="phone-number"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required={required}
          maxLength={PHONE_MAX_LENGTH}
          value={number}
          onChange={(e) => onNumberChange(e.target.value)}
          placeholder="123 456 789"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`${s.control} flex-1 min-w-0`}
        />
      </div>
      {error && (
        <p id={errorId} className={s.error}>
          {error}
        </p>
      )}
    </div>
  )
}
