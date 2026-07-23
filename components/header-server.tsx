import { Header } from '@/components/header'
import { loadHeaderCities } from '@/lib/locations'

/**
 * Server wrapper around the client <Header>. Loads the admin-managed Locations
 * so the top-bar "W sprzedaży" dropdown is crawlable + flash-free. Use this in
 * place of <Header /> on plain pages; pages that already fetch cities (the
 * project + city routes) render <Header cities={...} /> directly.
 */
export async function HeaderServer() {
  const cities = await loadHeaderCities()
  return <Header cities={cities} />
}
