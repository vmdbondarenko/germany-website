'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, MapPin, Edit, Eye, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

interface Row {
  id: string
  name: string
  slug: string
  location: string
  status: string
  published: boolean
  createdAt: string
  available: number
  reserved: number
  sold: number
  total: number
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  planned: 'bg-blue-100 text-blue-800',
}

const statusLabels: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  planned: 'Planned',
}

type SortKey = 'name' | 'location' | 'status' | 'total' | 'available' | 'reserved' | 'sold' | 'createdAt'
type SortDir = 'asc' | 'desc'

export function AdminProjectsTable({ rows }: { rows: Row[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const toggle = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    const va = a[sortKey]
    const vb = b[sortKey]
    if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb, 'pl') * dir
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
    return 0
  })

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-30" />
    return sortDir === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 ml-1" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1" />
  }

  const Th = ({ col, children, className = '' }: { col: SortKey; children: React.ReactNode; className?: string }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 select-none whitespace-nowrap ${className}`}
      onClick={() => toggle(col)}
    >
      <span className="inline-flex items-center">
        {children}
        <SortIcon col={col} />
      </span>
    </th>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Manage development projects</p>
        </div>
        <Link href="/admin/projects/new">
          <Button style={{ backgroundColor: '#6E2E2A' }}>
            <Plus className="h-4 w-4 mr-2" />
            Add project
          </Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No projects yet. Add the first one!</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <Th col="name">Name</Th>
                <Th col="location">Lokalizacja</Th>
                <Th col="status">Status</Th>
                <Th col="total">Units</Th>
                <Th col="available">Available</Th>
                <Th col="reserved">Reserved</Th>
                <Th col="sold">Sold</Th>
                <Th col="createdAt">Data</Th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{row.name}</div>
                    {row.published && (
                      <span className="text-xs text-green-600 font-medium">● Published</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {row.location}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[row.status] || statusColors.active}`}>
                      {statusLabels[row.status] || row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 tabular-nums">{row.total}</td>
                  <td className="px-4 py-3">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 tabular-nums">{row.available}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 tabular-nums">{row.reserved}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100 tabular-nums">{row.sold}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 tabular-nums whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleDateString('pl-PL')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <Link href={`/admin/projects/${row.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/inwestycje/${row.slug}`} target="_blank">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
