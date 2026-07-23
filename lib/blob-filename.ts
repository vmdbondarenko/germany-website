// SEO-friendly Blob filename helpers for NEW admin uploads (forward-only).
// Existing Blob objects/URLs are never touched.

const POLISH: Record<string, string> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ż: 'z', ź: 'z',
}

/**
 * Slugify a string: lowercase → strip Polish diacritics → spaces/underscores/
 * brackets/special chars → hyphens → collapse duplicate hyphens → trim.
 * e.g. "Osiedle Szlacheckie Typ M04(bud31-35-39) Rzut 2D Pietro"
 *   → "osiedle-szlacheckie-typ-m04-bud31-35-39-rzut-2d-pietro"
 */
export function slugifyBase(input: string): string {
  return input
    .toLowerCase()
    .replace(/[ąćęłńóśżź]/g, (c) => POLISH[c] ?? c)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip any remaining combining marks
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Split a filename into [base, ext], ext lowercased and including the dot ('' if none). */
export function splitExt(filename: string): [string, string] {
  const m = filename.match(/\.([a-zA-Z0-9]+)$/)
  if (!m || m.index === undefined) return [filename, '']
  return [filename.slice(0, m.index), `.${m[1].toLowerCase()}`]
}

/**
 * Build the clean Blob key. When a contextual `name` (base, no extension) is
 * supplied it is slugified and used; otherwise the original filename's base is
 * slugified (technical drawings). The original extension is always preserved.
 */
export function buildBlobKey(originalFilename: string, contextualName?: string | null): string {
  const [origBase, ext] = splitExt(originalFilename)
  const source = contextualName && contextualName.trim() ? contextualName : origBase
  const base = slugifyBase(source) || 'plik'
  return `${base}${ext}`
}
