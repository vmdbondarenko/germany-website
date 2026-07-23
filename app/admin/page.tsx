import { prisma } from '@/lib/prisma'
import { AdminProjectsTable } from './projects-table'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const projects = await prisma.project.findMany({
    include: { units: { select: { status: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const rows = projects.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    location: p.location,
    status: p.status,
    published: p.published,
    createdAt: p.createdAt.toISOString(),
    available: p.units.filter((u) => u.status === 'available').length,
    reserved: p.units.filter((u) => u.status === 'reserved').length,
    sold: p.units.filter((u) => u.status === 'sold').length,
    total: p.units.length,
  }))

  return <AdminProjectsTable rows={rows} />
}
