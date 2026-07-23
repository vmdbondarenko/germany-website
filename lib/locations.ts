import { prisma } from '@/lib/prisma'

export type HeaderCity = { name: string; slug: string }

/** Locations for the public top-bar "W sprzedaży" dropdown, ordered. */
export async function loadHeaderCities(): Promise<HeaderCity[]> {
  return prisma.location.findMany({
    orderBy: { order: 'asc' },
    select: { name: true, slug: true },
  })
}
