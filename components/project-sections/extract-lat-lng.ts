// Shared helper usable from both server and client components.
// Extract lat/lng from a Google Maps share URL or a plain "lat,lng" string.
// Matches the logic used by /lokalizacja (lib/lokalizacja-points.ts) so any URL
// that pins a project on that page also pins an item here.
export function extractLatLng(input: string | null | undefined): { lat: number; lng: number } | null {
  if (!input) return null
  const s = input.trim()

  // Plain "lat,lng"
  const plain = s.match(/^(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/)
  if (plain) return { lat: parseFloat(plain[1]), lng: parseFloat(plain[2]) }

  const normalized = s.match(/^https?:\/\//) ? s : `https://${s}`

  // Google place URLs often contain multiple !3d!4d pairs; the last one is the
  // actual place coordinate (earlier ones may belong to viewport/related data).
  const placeMatches = [...normalized.matchAll(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/g)]
  if (placeMatches.length > 0) {
    const last = placeMatches[placeMatches.length - 1]
    return { lat: parseFloat(last[1]), lng: parseFloat(last[2]) }
  }

  const at = normalized.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) }

  const q = normalized.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (q) return { lat: parseFloat(q[1]), lng: parseFloat(q[2]) }

  const ll = normalized.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (ll) return { lat: parseFloat(ll[1]), lng: parseFloat(ll[2]) }

  return null
}
