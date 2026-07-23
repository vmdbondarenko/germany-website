import Link from 'next/link'
import { Building2, LayoutDashboard, Building, Newspaper, MapPin, Users, Home as HomeIcon, MapPinned } from 'lucide-react'
import { AdminLogoutButton } from '@/components/admin/logout-button'
import { getCurrentRole } from '@/lib/auth'
import type { Metadata } from 'next'

// Admin panel is auth-gated — keep it out of search indexes entirely.
// noindex is inherited by every /admin/** page (including client components),
// so they need no per-page canonical.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getCurrentRole()
  const isAuthenticated = role !== null
  const isManager = role === 'manager'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href={isManager ? '/admin/units' : '/admin'} className="flex items-center gap-2 font-semibold text-gray-900">
                <Building2 className="h-5 w-5" style={{ color: '#6E2E2A' }} />
                Panel Administracyjny
                {isManager && (
                  <span className="text-xs font-normal text-gray-500 ml-1">(manager)</span>
                )}
              </Link>
              {isAuthenticated && !isManager && (
                <Link href="/admin" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
                  <LayoutDashboard className="h-4 w-4" />
                  Inwestycje
                </Link>
              )}
              {isAuthenticated && isManager && (
                <Link href="/admin/units" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
                  <HomeIcon className="h-4 w-4" />
                  Działki
                </Link>
              )}
              {isAuthenticated && (
                <Link href="/admin/companies" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
                  <Building className="h-4 w-4" />
                  Firmy
                </Link>
              )}
              {isAuthenticated && !isManager && (
                <>
                  <Link href="/admin/news" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
                    <Newspaper className="h-4 w-4" />
                    Aktualności
                  </Link>
                  <Link href="/admin/locations" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
                    <MapPinned className="h-4 w-4" />
                    Lokalizacje
                  </Link>
                  <Link href="/admin/home" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
                    <HomeIcon className="h-4 w-4" />
                    Startseite
                  </Link>
                  <Link href="/admin/about" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
                    <MapPin className="h-4 w-4" />
                    O firmie
                  </Link>
                  <Link href="/admin/team" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
                    <Users className="h-4 w-4" />
                    Zespół
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                ← Strona główna
              </Link>
              {isAuthenticated && <AdminLogoutButton />}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
