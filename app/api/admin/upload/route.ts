import { NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'
import { getVercelOidcToken } from '@vercel/oidc'
import { isAuthenticated } from '@/lib/auth'
import { buildBlobKey, splitExt } from '@/lib/blob-filename'

// Credentials for @vercel/blob. The store is connected to this project via OIDC
// in production (BLOB_STORE_ID is injected, no BLOB_READ_WRITE_TOKEN), so we
// authenticate with the deployment's OIDC token + store id. Locally a static
// BLOB_READ_WRITE_TOKEN (from .env.local) takes priority. `access: 'public'` is
// kept so returned URLs are on *.public.blob.vercel-storage.com — the only host
// allowed by next.config's image remotePatterns.
type BlobAuth = { token?: string; oidcToken?: string; storeId?: string }
async function blobAuthOptions(): Promise<BlobAuth> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return { token: process.env.BLOB_READ_WRITE_TOKEN }
  }
  return { oidcToken: await getVercelOidcToken(), storeId: process.env.BLOB_STORE_ID }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await request.formData()
  const file = form.get('file') as File
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Optional contextual base name (no extension). When absent we slugify the
  // original filename — used for technical drawings (house types, floor plans,
  // 2D/3D layouts, site/stage/plan views).
  const name = (form.get('name') as string | null) || null
  const key = buildBlobKey(file.name, name)

  try {
    const auth = await blobAuthOptions()

    // Drop the random hash suffix; keep clean names unique with -2, -3, … only
    // when the key already exists. Existing Blob objects are never overwritten.
    const [base, ext] = splitExt(key)
    const { blobs } = await list({ prefix: base, ...auth })
    const taken = new Set(blobs.map((b) => b.pathname))
    let candidate = key
    let n = 1
    while (taken.has(candidate)) {
      n += 1
      candidate = `${base}-${n}${ext}`
    }

    // The connected store is private-only, so blobs must be uploaded with
    // private access. Their canonical URL (…​.private.blob.vercel-storage.com)
    // needs an auth header to read and isn't an allowed next/image host, so we
    // hand back a same-origin proxy URL (/api/media) that streams the bytes.
    const blob = await put(candidate, file, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      ...auth,
    })
    return NextResponse.json({ url: `/api/media?u=${encodeURIComponent(blob.url)}`, pathname: blob.pathname })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Blob upload error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
