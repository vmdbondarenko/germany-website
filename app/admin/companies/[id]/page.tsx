'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

type CompanyUnit = {
  id: string
  label: string
  buildingLabel: string | null
  status: string
  area: number | null
  price: number | null
  project: { id: string; name: string; slug: string }
}

type AllUnit = {
  id: string
  label: string
  buildingLabel: string | null
  status: string
  area: number | null
  price: number | null
  companyId: string | null
  project: { id: string; name: string }
  company: { id: string; name: string } | null
}

type Company = {
  id: string
  name: string
  slug: string
  legalForm: string | null
  nip: string
  krs: string | null
  ceidg: string | null
  regon: string
  [key: string]: unknown
  units?: CompanyUnit[]
}

function Field({ label, name, value, onChange, placeholder }: {
  label: string
  name: string
  value: string
  onChange: (name: string, value: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

// Group units by project, then by building
function groupUnits(units: CompanyUnit[]) {
  const byProject = new Map<string, { project: { id: string; name: string; slug: string }; buildings: Map<string, CompanyUnit[]> }>()
  for (const u of units) {
    if (!byProject.has(u.project.id)) {
      byProject.set(u.project.id, { project: u.project, buildings: new Map() })
    }
    const bldg = u.buildingLabel || '—'
    const entry = byProject.get(u.project.id)!
    if (!entry.buildings.has(bldg)) entry.buildings.set(bldg, [])
    entry.buildings.get(bldg)!.push(u)
  }
  return byProject
}

export default function CompanyEditPage() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  // /admin/companies/new is served by new/page.tsx re-exporting this component,
  // so there's no [id] segment and params.id is undefined. Detect via pathname.
  const isNew = pathname?.endsWith('/companies/new') ?? false
  const id = isNew ? '' : (params.id as string)

  const [form, setForm] = useState<Record<string, string>>({
    name: '', slug: '', legalForm: '', nip: '', krs: '', ceidg: '', regon: '',
    addrVoivodeship: '', addrCounty: '', addrMunicipality: '', addrCity: '',
    addrStreet: '', addrBuildingNr: '', addrUnitNr: '', addrPostalCode: '',
    salesVoivodeship: '', salesCounty: '', salesMunicipality: '', salesCity: '',
    salesStreet: '', salesBuildingNr: '', salesUnitNr: '', salesPostalCode: '',
    salesAdditional: '', salesContact: '',
    contactEmail: '', contactPhone: '', contactFax: '', contactPerson: '', websiteUrl: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Units state
  const [assignedUnitIds, setAssignedUnitIds] = useState<Set<string>>(new Set())
  const [forcedUnitIds, setForcedUnitIds] = useState<Set<string>>(new Set())
  const [assignedUnits, setAssignedUnits] = useState<CompanyUnit[]>([])
  const [allUnits, setAllUnits] = useState<AllUnit[]>([])
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [showSelector, setShowSelector] = useState(false)

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/companies/${id}`)
        .then(r => r.json())
        .then((data: Company) => {
          const f: Record<string, string> = {}
          for (const key of Object.keys(form)) {
            const v = data[key]
            f[key] = typeof v === 'string' ? v : ''
          }
          setForm(f)
          if (data.units) {
            setAssignedUnits(data.units)
            setAssignedUnitIds(new Set(data.units.map(u => u.id)))
            setForcedUnitIds(new Set())
          }
        })

      fetch('/api/admin/units')
        .then(r => r.json())
        .then((data: AllUnit[]) => setAllUnits(data))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew])

  const onChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const toggleUnit = (unitId: string) => {
    setAssignedUnitIds(prev => {
      const next = new Set(prev)
      if (next.has(unitId)) {
        next.delete(unitId)
        setAssignedUnits(units => units.filter(u => u.id !== unitId))
      } else {
        next.add(unitId)
        const unit = allUnits.find(u => u.id === unitId)
        if (unit) {
          setAssignedUnits(units => [...units, {
            id: unit.id, label: unit.label, buildingLabel: unit.buildingLabel,
            status: unit.status, area: unit.area, price: unit.price,
            project: unit.project as CompanyUnit['project'],
          }])
        }
      }
      return next
    })
  }

  const takeoverProject = (projectId: string) => {
    const projectUnits = allUnits.filter(u => u.project.id === projectId)
    const newAssigned = new Set(assignedUnitIds)
    const newForced = new Set(forcedUnitIds)
    const newAssignedUnits = [...assignedUnits]
    for (const u of projectUnits) {
      newAssigned.add(u.id)
      if (u.companyId && u.companyId !== id) {
        newForced.add(u.id)
      }
      if (!assignedUnits.find(a => a.id === u.id)) {
        newAssignedUnits.push({
          id: u.id, label: u.label, buildingLabel: u.buildingLabel,
          status: u.status, area: u.area, price: u.price,
          project: u.project as CompanyUnit['project'],
        })
      }
    }
    setAssignedUnitIds(newAssigned)
    setForcedUnitIds(newForced)
    setAssignedUnits(newAssignedUnits)
  }

  const toggleBuilding = (projectId: string, buildingLabel: string, unitIds: string[]) => {
    const allAssigned = unitIds.every(uid => assignedUnitIds.has(uid))
    if (allAssigned) {
      // Remove all
      unitIds.forEach(uid => {
        assignedUnitIds.delete(uid)
      })
      setAssignedUnitIds(new Set(assignedUnitIds))
      setAssignedUnits(units => units.filter(u => !unitIds.includes(u.id)))
    } else {
      // Add all
      const newIds = new Set(assignedUnitIds)
      const newUnits = [...assignedUnits]
      for (const uid of unitIds) {
        if (!newIds.has(uid)) {
          newIds.add(uid)
          const unit = allUnits.find(u => u.id === uid)
          if (unit) {
            newUnits.push({
              id: unit.id, label: unit.label, buildingLabel: unit.buildingLabel,
              status: unit.status, area: unit.area, price: unit.price,
              project: unit.project as CompanyUnit['project'],
            })
          }
        }
      }
      setAssignedUnitIds(newIds)
      setAssignedUnits(newUnits)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const url = isNew ? '/api/admin/companies' : `/api/admin/companies/${id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          unitIds: [...assignedUnitIds],
          forceUnitIds: [...forcedUnitIds],
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to save')
      }
      const data = await res.json()
      if (isNew) {
        router.push(`/admin/companies/${data.id}`)
      } else {
        if (data.units) {
          setAssignedUnits(data.units)
          setAssignedUnitIds(new Set(data.units.map((u: CompanyUnit) => u.id)))
          setForcedUnitIds(new Set())
        }
        setMessage('Saved')
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Save error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this company?')) return
    await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' })
    router.push('/admin/companies')
  }

  // Group ALL units by project -> building for selector (other-company units shown greyed out)
  const availableByProject = new Map<string, { name: string; buildings: Map<string, AllUnit[]> }>()
  for (const u of allUnits) {
    if (!availableByProject.has(u.project.id)) {
      availableByProject.set(u.project.id, { name: u.project.name, buildings: new Map() })
    }
    const bldg = u.buildingLabel || '—'
    const entry = availableByProject.get(u.project.id)!
    if (!entry.buildings.has(bldg)) entry.buildings.set(bldg, [])
    entry.buildings.get(bldg)!.push(u)
  }

  const grouped = groupUnits(assignedUnits)

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/companies">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-serif font-bold text-gray-900">
          {isNew ? 'New company' : 'Edit company'}
        </h1>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-2 rounded text-sm ${message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dane podstawowe</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name firmy" name="name" value={form.name} onChange={onChange} placeholder="Bawaria Development sp. z o. o." />
            <Field label="Slug (URL)" name="slug" value={form.slug} onChange={onChange} placeholder="bawaria-development-sp-z-o-o" />
            <Field label="Forma prawna" name="legalForm" value={form.legalForm} onChange={onChange} placeholder="GmbH" />
            <Field label="NIP" name="nip" value={form.nip} onChange={onChange} placeholder="0001082792" />
            <Field label="KRS" name="krs" value={form.krs} onChange={onChange} />
            <Field label="CEiDG" name="ceidg" value={form.ceidg} onChange={onChange} />
            <Field label="REGON" name="regon" value={form.regon} onChange={onChange} placeholder="1133122062" />
          </CardContent>
        </Card>

        {/* Registered address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adres siedziby</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Region" name="addrVoivodeship" value={form.addrVoivodeship} onChange={onChange} />
            <Field label="Powiat" name="addrCounty" value={form.addrCounty} onChange={onChange} />
            <Field label="Gmina" name="addrMunicipality" value={form.addrMunicipality} onChange={onChange} />
            <Field label="City" name="addrCity" value={form.addrCity} onChange={onChange} />
            <Field label="Ulica" name="addrStreet" value={form.addrStreet} onChange={onChange} />
            <Field label="Nr domu" name="addrBuildingNr" value={form.addrBuildingNr} onChange={onChange} />
            <Field label="Nr lokalu" name="addrUnitNr" value={form.addrUnitNr} onChange={onChange} />
            <Field label="Kod pocztowy" name="addrPostalCode" value={form.addrPostalCode} onChange={onChange} />
          </CardContent>
        </Card>

        {/* Sales office */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales office address</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Region" name="salesVoivodeship" value={form.salesVoivodeship} onChange={onChange} />
            <Field label="Powiat" name="salesCounty" value={form.salesCounty} onChange={onChange} />
            <Field label="Gmina" name="salesMunicipality" value={form.salesMunicipality} onChange={onChange} />
            <Field label="City" name="salesCity" value={form.salesCity} onChange={onChange} />
            <Field label="Ulica" name="salesStreet" value={form.salesStreet} onChange={onChange} />
            <Field label="Nr domu" name="salesBuildingNr" value={form.salesBuildingNr} onChange={onChange} />
            <Field label="Nr lokalu" name="salesUnitNr" value={form.salesUnitNr} onChange={onChange} />
            <Field label="Kod pocztowy" name="salesPostalCode" value={form.salesPostalCode} onChange={onChange} />
            <div className="md:col-span-2">
              <Field label="Additional sales location" name="salesAdditional" value={form.salesAdditional} onChange={onChange} />
            </div>
            <div className="md:col-span-2">
              <Field label="Contact method" name="salesContact" value={form.salesContact} onChange={onChange} />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kontakt</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="E-mail" name="contactEmail" value={form.contactEmail} onChange={onChange} />
            <Field label="Telefon" name="contactPhone" value={form.contactPhone} onChange={onChange} />
            <Field label="Faks" name="contactFax" value={form.contactFax} onChange={onChange} />
            <Field label="Contact person" name="contactPerson" value={form.contactPerson} onChange={onChange} />
            <div className="md:col-span-2">
              <Field label="Strona WWW" name="websiteUrl" value={form.websiteUrl} onChange={onChange} />
            </div>
          </CardContent>
        </Card>

        {/* Assigned units */}
        {!isNew && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Assigned plots</span>
                <span className="text-sm font-normal text-gray-500">{assignedUnitIds.size} plots</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current assignments grouped by project -> building */}
              {[...grouped.entries()].map(([projectId, { project, buildings }]) => (
                <div key={projectId} className="border rounded-lg">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                    onClick={() => setExpandedProject(expandedProject === projectId ? null : projectId)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedProject === projectId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="font-medium text-sm">{project.name}</span>
                      <span className="text-xs text-gray-500">
                        ({[...buildings.values()].reduce((sum, units) => sum + units.length, 0)} plots)
                      </span>
                    </div>
                  </button>
                  {expandedProject === projectId && (
                    <div className="border-t px-4 py-3 bg-gray-50 space-y-2">
                      {[...buildings.entries()].map(([bldg, units]) => (
                        <div key={bldg}>
                          <div className="text-xs font-medium text-gray-500 mb-1">
                            Building: {bldg}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                            {units.map(u => (
                              <div key={u.id} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1 border">
                                <span>{u.label}</span>
                                <span className={`ml-1 ${u.status === 'available' ? 'text-green-600' : u.status === 'reserved' ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {u.price ? `${(u.price / 1000).toFixed(0)}k` : '—'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {assignedUnitIds.size === 0 && !showSelector && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No plots assigned. Assign plots to this company.
                </p>
              )}

              {/* Toggle selector */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSelector(!showSelector)}
              >
                {showSelector ? 'Ukryj selektor' : 'Assign / remove plots'}
              </Button>

              {/* Unit selector — grouped by project -> building with checkboxes */}
              {showSelector && (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-4 max-h-[500px] overflow-y-auto">
                  <p className="text-xs text-gray-500">Select the plots assigned to this company. You can select a whole building.</p>
                  {[...availableByProject.entries()].map(([projectId, { name, buildings }]) => {
                    const projectUnits = allUnits.filter(u => u.project.id === projectId)
                    const otherCompanyCount = projectUnits.filter(u => u.companyId && u.companyId !== id && !assignedUnitIds.has(u.id)).length
                    return (
                    <div key={projectId}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm">{name}</div>
                        {otherCompanyCount > 0 && (
                          <button
                            type="button"
                            className="text-xs text-red-600 border border-red-300 rounded px-2 py-0.5 hover:bg-red-50"
                            onClick={() => takeoverProject(projectId)}
                          >
                            Take over project ({otherCompanyCount} taken)
                          </button>
                        )}
                      </div>
                      {[...buildings.entries()].map(([bldg, units]) => {
                        const allChecked = units.every(u => assignedUnitIds.has(u.id))
                        const someChecked = units.some(u => assignedUnitIds.has(u.id))
                        return (
                          <div key={bldg} className="ml-3 mb-3">
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={allChecked}
                                ref={el => { if (el) el.indeterminate = someChecked && !allChecked }}
                                onChange={() => toggleBuilding(projectId, bldg, units.map(u => u.id))}
                                className="rounded"
                              />
                              Building: {bldg} ({units.length} plots)
                              {units.some(u => u.companyId && u.companyId !== id) && (
                                <span className="text-orange-500 ml-1">(partially taken)</span>
                              )}
                            </label>
                            <div className="ml-5 grid grid-cols-2 md:grid-cols-4 gap-1">
                              {units.map(u => {
                                const otherCompany = u.companyId && u.companyId !== id && !assignedUnitIds.has(u.id)
                                return (
                                  <label
                                    key={u.id}
                                    className={`flex items-center gap-1.5 text-xs bg-white rounded px-2 py-1 border cursor-pointer ${otherCompany ? 'opacity-50' : ''}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={assignedUnitIds.has(u.id)}
                                      onChange={() => toggleUnit(u.id)}
                                      disabled={!!otherCompany}
                                      className="rounded"
                                    />
                                    <span>{u.label}</span>
                                    {u.price && <span className="text-gray-400 ml-auto">{(u.price / 1000).toFixed(0)}k</span>}
                                    {otherCompany && u.company && (
                                      <span className="text-orange-500 text-[10px]">({u.company.name.substring(0, 10)}...)</span>
                                    )}
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ backgroundColor: '#6E2E2A' }}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Save
          </Button>
          {!isNew && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
