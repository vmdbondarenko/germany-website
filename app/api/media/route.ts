import { getVercelOidcToken } from '@vercel/oidc'

// Public, read-only proxy for PRIVATE Vercel Blob objects.
//
// The project's Blob store is private-only: its objects live at
// https://<store>.private.blob.vercel-storage.com/<path> and require an
// Authorization header to read, so a browser / next-image cannot load them
// directly. Admin uploads therefore store a same-origin URL of the form
// `/api/media?u=<encoded private blob url>`; this route fetches that object
// using the deployment's OIDC token (or a local read-write token) and streams
// it back with long-lived caching so the CDN / image optimizer only hit it once.
//
// No admin auth: these are public site images. An allowlist on the target host
// prevents the endpoint from being used as an open proxy (SSRF).

export const dynamic = 'force-dynamic'

async function blobBearer(): Promise<string | null> {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN
  try {
    return await getVercelOidcToken()
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const u = new URL(request.url).searchParams.get('u')
  if (!u) return new Response('Missing u', { status: 400 })

  let target: URL
  try {
    target = new URL(u)
  } catch {
    return new Response('Invalid url', { status: 400 })
  }
  // Only proxy Vercel Blob storage hosts.
  if (target.protocol !== 'https:' || !target.hostname.endsWith('.blob.vercel-storage.com')) {
    return new Response('Forbidden host', { status: 403 })
  }

  const bearer = await blobBearer()
  if (!bearer) return new Response('No blob credentials', { status: 500 })

  const upstream = await fetch(target.toString(), {
    headers: { Authorization: `Bearer ${bearer}` },
  })
  if (!upstream.ok || !upstream.body) {
    return new Response('Upstream error', { status: upstream.status || 502 })
  }

  const headers = new Headers()
  headers.set('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream')
  const len = upstream.headers.get('content-length')
  if (len) headers.set('Content-Length', len)
  // Uploaded objects get unique names, so cache aggressively.
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  return new Response(upstream.body, { status: 200, headers })
}
