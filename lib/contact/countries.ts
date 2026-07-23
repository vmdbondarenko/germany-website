// Country dial codes for the contact-form phone input. Polish names; Poland is
// the default selection. `nationalLength` (when set) is the exact expected
// number of national digits used for stricter validation.

export type Country = {
  iso: string // ISO 3166-1 alpha-2, used as the stable <option> key/value
  name: string // Polish display name
  dial: string // e.g. "+48"
  flag: string // emoji flag
  nationalLength?: number | number[]
}

export const COUNTRIES: Country[] = [
  { iso: "PL", name: "Polska", dial: "+48", flag: "🇵🇱", nationalLength: 9 },
  { iso: "DE", name: "Niemcy", dial: "+49", flag: "🇩🇪" },
  { iso: "GB", name: "Wielka Brytania", dial: "+44", flag: "🇬🇧", nationalLength: 10 },
  { iso: "UA", name: "Ukraina", dial: "+380", flag: "🇺🇦", nationalLength: 9 },
  { iso: "CZ", name: "Czechy", dial: "+420", flag: "🇨🇿", nationalLength: 9 },
  { iso: "SK", name: "Słowacja", dial: "+421", flag: "🇸🇰", nationalLength: 9 },
  { iso: "LT", name: "Litwa", dial: "+370", flag: "🇱🇹", nationalLength: 8 },
  { iso: "LV", name: "Łotwa", dial: "+371", flag: "🇱🇻", nationalLength: 8 },
  { iso: "EE", name: "Estonia", dial: "+372", flag: "🇪🇪" },
  { iso: "BY", name: "Białoruś", dial: "+375", flag: "🇧🇾", nationalLength: 9 },
  { iso: "FR", name: "Francja", dial: "+33", flag: "🇫🇷", nationalLength: 9 },
  { iso: "ES", name: "Hiszpania", dial: "+34", flag: "🇪🇸", nationalLength: 9 },
  { iso: "IT", name: "Włochy", dial: "+39", flag: "🇮🇹" },
  { iso: "NL", name: "Holandia", dial: "+31", flag: "🇳🇱", nationalLength: 9 },
  { iso: "BE", name: "Belgia", dial: "+32", flag: "🇧🇪" },
  { iso: "AT", name: "Austria", dial: "+43", flag: "🇦🇹" },
  { iso: "CH", name: "Szwajcaria", dial: "+41", flag: "🇨🇭", nationalLength: 9 },
  { iso: "SE", name: "Szwecja", dial: "+46", flag: "🇸🇪" },
  { iso: "NO", name: "Norwegia", dial: "+47", flag: "🇳🇴", nationalLength: 8 },
  { iso: "DK", name: "Dania", dial: "+45", flag: "🇩🇰", nationalLength: 8 },
  { iso: "FI", name: "Finlandia", dial: "+358", flag: "🇫🇮" },
  { iso: "IE", name: "Irlandia", dial: "+353", flag: "🇮🇪" },
  { iso: "PT", name: "Portugalia", dial: "+351", flag: "🇵🇹", nationalLength: 9 },
  { iso: "GR", name: "Grecja", dial: "+30", flag: "🇬🇷", nationalLength: 10 },
  { iso: "HU", name: "Węgry", dial: "+36", flag: "🇭🇺" },
  { iso: "RO", name: "Rumunia", dial: "+40", flag: "🇷🇴", nationalLength: 9 },
  { iso: "BG", name: "Bułgaria", dial: "+359", flag: "🇧🇬" },
  { iso: "HR", name: "Chorwacja", dial: "+385", flag: "🇭🇷" },
  { iso: "SI", name: "Słowenia", dial: "+386", flag: "🇸🇮" },
  { iso: "US", name: "Stany Zjednoczone", dial: "+1", flag: "🇺🇸", nationalLength: 10 },
  { iso: "CA", name: "Kanada", dial: "+1", flag: "🇨🇦", nationalLength: 10 },
  { iso: "AU", name: "Australia", dial: "+61", flag: "🇦🇺", nationalLength: 9 },
  { iso: "AE", name: "ZEA", dial: "+971", flag: "🇦🇪" },
  { iso: "TR", name: "Turcja", dial: "+90", flag: "🇹🇷", nationalLength: 10 },
  { iso: "IL", name: "Izrael", dial: "+972", flag: "🇮🇱" },
  { iso: "IN", name: "Indie", dial: "+91", flag: "🇮🇳", nationalLength: 10 },
  { iso: "CN", name: "Chiny", dial: "+86", flag: "🇨🇳", nationalLength: 11 },
  { iso: "JP", name: "Japonia", dial: "+81", flag: "🇯🇵" },
]

export const DEFAULT_COUNTRY: Country =
  COUNTRIES.find((c) => c.iso === "PL") ?? COUNTRIES[0]

export function findCountry(iso: string): Country {
  return COUNTRIES.find((c) => c.iso === iso) ?? DEFAULT_COUNTRY
}
