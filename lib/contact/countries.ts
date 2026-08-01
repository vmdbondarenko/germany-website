// Country dial codes for the contact-form phone input. Polish names; Poland is
// the default selection. `nationalLength` (when set) is the exact expected
// number of national digits used for stricter validation.

export type Country = {
  iso: string // ISO 3166-1 alpha-2, used as the stable <option> key/value
  name: string // Polish display name
  dial: string // e.g. "+49"
  flag: string // emoji flag
  nationalLength?: number | number[]
}

export const COUNTRIES: Country[] = [
  { iso: "PL", name: "Polen", dial: "+48", flag: "🇵🇱", nationalLength: 9 },
  { iso: "DE", name: "Deutschland", dial: "+49", flag: "🇩🇪" },
  { iso: "GB", name: "Vereinigtes Königreich", dial: "+44", flag: "🇬🇧", nationalLength: 10 },
  { iso: "UA", name: "Ukraine", dial: "+380", flag: "🇺🇦", nationalLength: 9 },
  { iso: "CZ", name: "Tschechien", dial: "+420", flag: "🇨🇿", nationalLength: 9 },
  { iso: "SK", name: "Slowakei", dial: "+421", flag: "🇸🇰", nationalLength: 9 },
  { iso: "LT", name: "Litauen", dial: "+370", flag: "🇱🇹", nationalLength: 8 },
  { iso: "LV", name: "Lettland", dial: "+371", flag: "🇱🇻", nationalLength: 8 },
  { iso: "EE", name: "Estonia", dial: "+372", flag: "🇪🇪" },
  { iso: "BY", name: "Belarus", dial: "+375", flag: "🇧🇾", nationalLength: 9 },
  { iso: "FR", name: "Frankreich", dial: "+33", flag: "🇫🇷", nationalLength: 9 },
  { iso: "ES", name: "Spanien", dial: "+34", flag: "🇪🇸", nationalLength: 9 },
  { iso: "IT", name: "Italien", dial: "+39", flag: "🇮🇹" },
  { iso: "NL", name: "Niederlande", dial: "+31", flag: "🇳🇱", nationalLength: 9 },
  { iso: "BE", name: "Belgien", dial: "+32", flag: "🇧🇪" },
  { iso: "AT", name: "Austria", dial: "+43", flag: "🇦🇹" },
  { iso: "CH", name: "Schweiz", dial: "+41", flag: "🇨🇭", nationalLength: 9 },
  { iso: "SE", name: "Schweden", dial: "+46", flag: "🇸🇪" },
  { iso: "NO", name: "Norwegen", dial: "+47", flag: "🇳🇴", nationalLength: 8 },
  { iso: "DK", name: "Dänemark", dial: "+45", flag: "🇩🇰", nationalLength: 8 },
  { iso: "FI", name: "Finnland", dial: "+358", flag: "🇫🇮" },
  { iso: "IE", name: "Irland", dial: "+353", flag: "🇮🇪" },
  { iso: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹", nationalLength: 9 },
  { iso: "GR", name: "Griechenland", dial: "+30", flag: "🇬🇷", nationalLength: 10 },
  { iso: "HU", name: "Ungarn", dial: "+36", flag: "🇭🇺" },
  { iso: "RO", name: "Rumänien", dial: "+40", flag: "🇷🇴", nationalLength: 9 },
  { iso: "BG", name: "Bulgarien", dial: "+359", flag: "🇧🇬" },
  { iso: "HR", name: "Kroatien", dial: "+385", flag: "🇭🇷" },
  { iso: "SI", name: "Slowenien", dial: "+386", flag: "🇸🇮" },
  { iso: "US", name: "Vereinigte Staaten", dial: "+1", flag: "🇺🇸", nationalLength: 10 },
  { iso: "CA", name: "Kanada", dial: "+1", flag: "🇨🇦", nationalLength: 10 },
  { iso: "AU", name: "Australien", dial: "+61", flag: "🇦🇺", nationalLength: 9 },
  { iso: "AE", name: "VAE", dial: "+971", flag: "🇦🇪" },
  { iso: "TR", name: "Türkei", dial: "+90", flag: "🇹🇷", nationalLength: 10 },
  { iso: "IL", name: "Israel", dial: "+972", flag: "🇮🇱" },
  { iso: "IN", name: "Indien", dial: "+91", flag: "🇮🇳", nationalLength: 10 },
  { iso: "CN", name: "China", dial: "+86", flag: "🇨🇳", nationalLength: 11 },
  { iso: "JP", name: "Japan", dial: "+81", flag: "🇯🇵" },
]

export const DEFAULT_COUNTRY: Country =
  COUNTRIES.find((c) => c.iso === "DE") ?? COUNTRIES[0]

export function findCountry(iso: string): Country {
  return COUNTRIES.find((c) => c.iso === iso) ?? DEFAULT_COUNTRY
}
