import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { getSessionRole, SESSION_COOKIE_NAME, type Role } from '@/lib/auth'
import { routing } from '@/i18n/routing'
import { prisma } from '@/lib/prisma'

// Handles locale detection + prefixing for the public site (de default, /en).
const intlMiddleware = createIntlMiddleware(routing)

// Paths under /admin or /api/admin that must remain reachable without a valid
// session — otherwise the user could never log in or out.
const PUBLIC_ADMIN_PATHS = new Set<string>([
  '/admin/login',
  '/api/admin/auth/login',
  '/api/admin/auth/logout',
])

// Manager-allowed API prefixes. Specific methods are further restricted at
// the handler level (e.g. companies POST/PATCH/DELETE are admin-only).
const MANAGER_API_PREFIXES = [
  '/api/admin/units',
  '/api/admin/companies',
]

function isManagerAllowedPagePath(pathname: string): boolean {
  // Manager landing — units list/edit
  if (pathname === '/admin/units' || pathname.startsWith('/admin/units/')) return true
  // Companies list (read-only)
  if (pathname === '/admin/companies') return true
  // Block /admin/companies/new (create form) and /admin/companies/[id] (edit form).
  // Only the view subpath is allowed: /admin/companies/<id>/view (with optional trailing).
  const viewMatch = pathname.match(/^\/admin\/companies\/[^/]+\/view(\/.*)?$/)
  if (viewMatch) return true
  return false
}

function isManagerAllowedApiPath(pathname: string): boolean {
  return MANAGER_API_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function denyForRole(request: NextRequest, role: Role | null) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: role ? 'Forbidden' : 'Unauthorized' }, { status: role ? 403 : 401 })
  }
  if (!role) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('from', pathname + (request.nextUrl.search || ''))
    return NextResponse.redirect(loginUrl)
  }
  // Authenticated but lacking permission — bounce to manager landing.
  const url = request.nextUrl.clone()
  url.pathname = '/admin/units'
  url.search = ''
  return NextResponse.redirect(url)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Admin gate (never localized) ──────────────────────────────────────────
  if (PUBLIC_ADMIN_PATHS.has(pathname)) return NextResponse.next()

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const role = await getSessionRole(token)
    if (!role) return denyForRole(request, null)

    if (role === 'admin') return NextResponse.next()

    // Manager: restrict to allow-listed paths.
    const allowed = pathname.startsWith('/api/')
      ? isManagerAllowedApiPath(pathname)
      : isManagerAllowedPagePath(pathname)
    if (!allowed) return denyForRole(request, role)

    return NextResponse.next()
  }

  // ── Other API routes: not localized ──────────────────────────────────────
  if (pathname.startsWith('/api')) return NextResponse.next()

  // ── English visibility gate ───────────────────────────────────────────────
  // When the admin "show language switcher" setting is OFF, English is hidden
  // from public access: /en and /en/* redirect to the German equivalent (sub-
  // path + query preserved). English content, routes and data stay intact and
  // return automatically when the setting is turned back ON. The redirect target
  // never starts with /en, so no redirect loop is possible.
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    let show = true
    try {
      const row = await prisma.siteSettings.findUnique({
        where: { id: 'main' },
        select: { showLanguageSwitcher: true },
      })
      show = row?.showLanguageSwitcher ?? true
    } catch {
      show = true // DB unavailable → don't hide anything
    }
    if (!show) {
      const url = request.nextUrl.clone()
      url.pathname = pathname === '/en' ? '/' : pathname.slice('/en'.length)
      return NextResponse.redirect(url)
    }
  }

  // ── Public site: locale prefixing ─────────────────────────────────────────
  return intlMiddleware(request)
}

export const config = {
  // Run on everything except Next internals and files with an extension
  // (sitemap.xml, robots.txt, images, favicon). /api is included so the admin
  // gate can act on /api/admin; non-admin /api is passed through above.
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
