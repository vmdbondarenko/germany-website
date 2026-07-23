export type GeocodeSuccess = { ok: true; lat: number; lng: number; formatted?: string }
export type GeocodeFailure = { ok: false; reason: string; status?: string }
export type GeocodeResult = GeocodeSuccess | GeocodeFailure

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) {
    return { ok: false, reason: 'GOOGLE_MAPS_API_KEY nie jest ustawiony na serwerze' }
  }
  if (!address.trim()) {
    return { ok: false, reason: 'Pusty adres' }
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', address)
  url.searchParams.set('key', key)
  url.searchParams.set('region', 'pl')
  url.searchParams.set('language', 'pl')

  let res: Response
  try {
    res = await fetch(url.toString())
  } catch (e) {
    return { ok: false, reason: `Błąd sieci: ${(e as Error).message}` }
  }
  if (!res.ok) {
    return { ok: false, reason: `HTTP ${res.status} z Google Geocoding` }
  }
  const data = (await res.json()) as {
    status: string
    error_message?: string
    results?: { geometry: { location: { lat: number; lng: number } }; formatted_address?: string }[]
  }

  if (data.status !== 'OK') {
    const detail = data.error_message ? ` — ${data.error_message}` : ''
    return { ok: false, reason: `Google: ${data.status}${detail}`, status: data.status }
  }
  if (!data.results?.length) {
    return { ok: false, reason: 'Brak wyników dla tego adresu', status: 'ZERO_RESULTS' }
  }

  const { lat, lng } = data.results[0].geometry.location
  return { ok: true, lat, lng, formatted: data.results[0].formatted_address }
}

export function buildProjectAddress(p: {
  investStreet?: string | null
  investBuildingNr?: string | null
  investPostalCode?: string | null
  investCity?: string | null
  investVoivodeship?: string | null
  location?: string | null
}): string {
  const streetLine = [p.investStreet, p.investBuildingNr].filter(Boolean).join(' ')
  const cityLine = [p.investPostalCode, p.investCity].filter(Boolean).join(' ')
  const parts = [streetLine, cityLine, p.investVoivodeship, 'Polska'].filter(Boolean)
  const joined = parts.join(', ')
  return joined || p.location || ''
}
