// HMAC-signed session tokens. Cookie value is one of:
//   `<expiresAtMs>.<base64url(hmac)>`             (legacy, role implied = "admin")
//   `<expiresAtMs>.<role>.<base64url(hmac)>`      (current)
// where hmac = HMAC-SHA256(SESSION_SECRET, payload). The cookie is a
// forgery-proof bearer of expiry + role; it never contains the password.
//
// Uses Web Crypto API so the same code runs in Node (server components / API
// routes) and in the Edge runtime (middleware.ts at the repo root).

export const SESSION_COOKIE_NAME = 'admin_session'
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

export type Role = 'admin' | 'manager'

export const ROLES: readonly Role[] = ['admin', 'manager'] as const

function isRole(s: string): s is Role {
  return s === 'admin' || s === 'manager'
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET is not set or is too short (>=16 chars required)')
  }
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function bytesToB64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes
  let bin = ''
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i])
  return btoa(bin).replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function b64urlToBytes(s: string): Uint8Array | null {
  try {
    const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)
    const bin = atob(padded)
    const arr = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
    return arr
  } catch {
    return null
  }
}

export async function signSession(role: Role = 'admin', expiresAtMs?: number): Promise<string> {
  const exp = expiresAtMs ?? (Date.now() + SESSION_TTL_SECONDS * 1000)
  const payload = `${exp}.${role}`
  const sig = await crypto.subtle.sign('HMAC', await getKey(), new TextEncoder().encode(payload))
  return `${payload}.${bytesToB64url(sig)}`
}

type SessionInfo = { ok: true; role: Role } | { ok: false }

// Parses cookie into (payload, sigStr) tolerating both legacy 2-part and
// current 3-part token shapes. Returns null on malformed input.
function splitToken(token: string): { payload: string; sigStr: string } | null {
  const lastDot = token.lastIndexOf('.')
  if (lastDot <= 0 || lastDot === token.length - 1) return null
  const payload = token.slice(0, lastDot)
  const sigStr = token.slice(lastDot + 1)
  if (payload.length === 0 || sigStr.length === 0) return null
  return { payload, sigStr }
}

async function verifyAndParse(token: string | undefined | null): Promise<SessionInfo> {
  if (!token) return { ok: false }

  const split = splitToken(token)
  if (!split) return { ok: false }
  const { payload, sigStr } = split

  // Payload is either "<exp>" (legacy) or "<exp>.<role>".
  const firstDot = payload.indexOf('.')
  let expStr: string
  let role: Role
  if (firstDot === -1) {
    expStr = payload
    role = 'admin'
  } else {
    expStr = payload.slice(0, firstDot)
    const roleStr = payload.slice(firstDot + 1)
    if (!isRole(roleStr)) return { ok: false }
    role = roleStr
  }

  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp < Date.now()) return { ok: false }

  const sigBytes = b64urlToBytes(sigStr)
  if (!sigBytes) return { ok: false }

  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await getKey(),
      sigBytes,
      new TextEncoder().encode(payload)
    )
    return valid ? { ok: true, role } : { ok: false }
  } catch {
    return { ok: false }
  }
}

export async function verifySession(token: string | undefined | null): Promise<boolean> {
  const info = await verifyAndParse(token)
  return info.ok
}

export async function getSessionRole(token: string | undefined | null): Promise<Role | null> {
  const info = await verifyAndParse(token)
  return info.ok ? info.role : null
}

// Server-component helper. Reads the cookie via next/headers — Node-only.
// Middleware should call verifySession() / getSessionRole() directly with request.cookies.
async function getCookieToken(): Promise<string | undefined> {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value
}

export async function isAuthenticated(): Promise<boolean> {
  return verifySession(await getCookieToken())
}

export async function getCurrentRole(): Promise<Role | null> {
  return getSessionRole(await getCookieToken())
}

export async function requireAuth(): Promise<void> {
  if (!(await isAuthenticated())) {
    throw new Error('Unauthorized')
  }
}

// True if the current session has any of the allowed roles.
export async function hasRole(...allowed: Role[]): Promise<boolean> {
  const role = await getCurrentRole()
  return role !== null && allowed.includes(role)
}
