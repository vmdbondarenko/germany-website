import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { signSession, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS, type Role } from '@/lib/auth'

const MAX_FAILED_ATTEMPTS = 5
const RATE_WINDOW_MIN = 15

function getIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim() || 'unknown'
  const real = request.headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}

function constantTimeEquals(a: string, b: string): boolean {
  // Pad to equal length so timingSafeEqual doesn't throw, then verify the
  // length match separately. Both branches do the same amount of work.
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  const max = Math.max(ab.length, bb.length, 1)
  const aPadded = Buffer.alloc(max)
  const bPadded = Buffer.alloc(max)
  ab.copy(aPadded)
  bb.copy(bPadded)
  const eq = timingSafeEqual(aPadded, bPadded)
  return eq && ab.length === bb.length
}

export async function POST(request: Request) {
  const ip = getIp(request)
  const userAgent = request.headers.get('user-agent')?.slice(0, 200) || null

  const since = new Date(Date.now() - RATE_WINDOW_MIN * 60 * 1000)
  const recentFails = await prisma.loginAttempt.count({
    where: { ipAddress: ip, success: false, createdAt: { gte: since } },
  })
  if (recentFails >= MAX_FAILED_ATTEMPTS) {
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${RATE_WINDOW_MIN} minutes.` },
      { status: 429 }
    )
  }

  let password = ''
  try {
    const body = await request.json()
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    // empty body / invalid JSON — treat as wrong password below
  }

  const adminPassword = process.env.ADMIN_PASSWORD?.trim() || ''
  const managerPassword = process.env.MANAGER_PASSWORD?.trim() || ''

  // Match against admin first; if both passwords are configured to the same
  // value (don't), admin wins. Manager only matches when distinct from admin
  // and from empty.
  let role: Role | null = null
  if (password.length > 0) {
    if (adminPassword.length > 0 && constantTimeEquals(password, adminPassword)) {
      role = 'admin'
    } else if (
      managerPassword.length > 0 &&
      managerPassword !== adminPassword &&
      constantTimeEquals(password, managerPassword)
    ) {
      role = 'manager'
    }
  }
  const success = role !== null

  // Audit-log every attempt. Don't fail the request if logging fails.
  prisma.loginAttempt.create({
    data: { ipAddress: ip, userAgent, success },
  }).catch(() => {})

  if (!success || role === null) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const token = await signSession(role)
  const response = NextResponse.json({ success: true, role })
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  })
  return response
}
