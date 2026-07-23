import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentRole } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Pencil, RefreshCw, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    available: 'bg-green-100 text-green-700',
    reserved: 'bg-yellow-100 text-yellow-700',
    sold: 'bg-red-100 text-red-700',
  }
  const labels: Record<string, string> = {
    available: 'Dostępny',
    reserved: 'Rezerwacja',
    sold: 'Sprzedany',
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  )
}

export default async function CompanyViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const role = await getCurrentRole()
  const isManager = role === 'manager'

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      units: {
        include: {
          project: { select: { id: true, name: true, slug: true, investVoivodeship: true, investCity: true, investStreet: true } },
        },
        orderBy: [{ projectId: 'asc' }, { buildingLabel: 'asc' }, { label: 'asc' }],
      },
    },
  })

  if (!company) notFound()

  // Group units by project -> building
  const byProject = new Map<string, {
    project: { id: string; name: string; slug: string; investCity: string | null; investStreet: string | null }
    buildings: Map<string, typeof company.units>
  }>()

  for (const u of company.units) {
    if (!byProject.has(u.project.id)) {
      byProject.set(u.project.id, { project: u.project, buildings: new Map() })
    }
    const bldg = u.buildingLabel || '—'
    const entry = byProject.get(u.project.id)!
    if (!entry.buildings.has(bldg)) entry.buildings.set(bldg, [])
    entry.buildings.get(bldg)!.push(u)
  }

  const totalUnits = company.units.length
  const availableUnits = company.units.filter(u => u.status === 'available').length
  const reservedUnits = company.units.filter(u => u.status === 'reserved').length
  const soldUnits = company.units.filter(u => u.status === 'sold').length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/companies">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Powrót
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900">{company.name}</h1>
            <p className="text-sm text-gray-500">NIP: {company.nip} &middot; REGON: {company.regon}</p>
          </div>
        </div>
        {!isManager && (
          <Link href={`/admin/companies/${id}`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1.5" />
              Edytuj
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — company info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dane firmy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <dl className="grid grid-cols-2 gap-3">
                <InfoRow label="Forma prawna" value={company.legalForm} />
                <InfoRow label="KRS" value={company.krs} />
                <InfoRow label="CEiDG" value={company.ceidg} />
                <InfoRow label="REGON" value={company.regon} />
                <InfoRow label="NIP" value={company.nip} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adres siedziby</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-900">
                {[company.addrStreet, company.addrBuildingNr].filter(Boolean).join(' ')}
                {company.addrUnitNr && ` lok. ${company.addrUnitNr}`}
              </p>
              <p className="text-sm text-gray-900">
                {[company.addrPostalCode, company.addrCity].filter(Boolean).join(' ')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {[company.addrMunicipality, company.addrCounty, company.addrVoivodeship].filter(Boolean).join(', ')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kontakt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <dl className="grid grid-cols-1 gap-2">
                <InfoRow label="Telefon" value={company.contactPhone} />
                <InfoRow label="E-mail" value={company.contactEmail} />
                <InfoRow label="Faks" value={company.contactFax} />
                <InfoRow label="Osoba kontaktowa" value={company.contactPerson} />
                {company.websiteUrl && (
                  <div>
                    <dt className="text-xs text-gray-500">Strona WWW</dt>
                    <dd className="text-sm">
                      <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        {company.websiteUrl} <ExternalLink className="h-3 w-3" />
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

        </div>

        {/* Right column — units */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-gray-900">{totalUnits}</div>
                <div className="text-xs text-gray-500">Łącznie</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-green-600">{availableUnits}</div>
                <div className="text-xs text-gray-500">Dostępne</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-yellow-600">{reservedUnits}</div>
                <div className="text-xs text-gray-500">Rezerwacja</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-red-600">{soldUnits}</div>
                <div className="text-xs text-gray-500">Sprzedane</div>
              </CardContent>
            </Card>
          </div>

          {/* Units by project -> building */}
          {byProject.size === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-400">
                Brak przypisanych działek. Przejdź do edycji aby przypisać.
              </CardContent>
            </Card>
          ) : (
            [...byProject.entries()].map(([projectId, { project, buildings }]) => (
              <Card key={projectId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {[project.investStreet, project.investCity].filter(Boolean).join(', ') || 'Brak lokalizacji'}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {[...buildings.values()].reduce((s, u) => s + u.length, 0)} działek
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...buildings.entries()].map(([bldg, units]) => (
                    <div key={bldg}>
                      <div className="text-xs font-medium text-gray-500 mb-2">Budynek: {bldg}</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-gray-500 border-b">
                              <th className="text-left py-1 pr-3">Nr</th>
                              <th className="text-left py-1 pr-3">Status</th>
                              <th className="text-right py-1 pr-3">Pow. m²</th>
                              <th className="text-right py-1 pr-3">Cena</th>
                              <th className="text-right py-1">Cena/m²</th>
                            </tr>
                          </thead>
                          <tbody>
                            {units.map(u => (
                              <tr key={u.id} className="border-b border-gray-50">
                                <td className="py-1.5 pr-3 font-medium">{u.label}</td>
                                <td className="py-1.5 pr-3"><StatusBadge status={u.status} /></td>
                                <td className="py-1.5 pr-3 text-right text-gray-600">{u.area?.toFixed(1) || '—'}</td>
                                <td className="py-1.5 pr-3 text-right text-gray-600">
                                  {u.price ? `${(u.price).toLocaleString('pl-PL')} zł` : '—'}
                                </td>
                                <td className="py-1.5 text-right text-gray-600">
                                  {u.price && u.area ? `${(u.price / u.area).toFixed(0)} zł` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
