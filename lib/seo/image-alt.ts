// Fallback alt-text generation for images that ship without an authored alt.
//
// SEO issue #16: empty `alt` attributes. These helpers never touch DB data or
// image URLs — they only derive a human-readable alt from the filename and the
// surrounding content type. Authored, non-empty alt values must always win
// (see `resolveAlt`).

/**
 * Derive a readable label from an image URL or filename.
 * Steps (in order): URL-decode → strip extension → strip Vercel Blob hash
 * suffix → strip size markers (400kb / 2MB …) → `_`/`-` to spaces → collapse
 * whitespace.
 */
export function cleanImageName(input: string): string {
  if (!input) return ''

  // Work on the filename only — drop any query/hash and path segments.
  let name = input.split(/[?#]/)[0]
  name = name.substring(name.lastIndexOf('/') + 1)

  // 1. URL-decode (e.g. %20 → space, Polish diacritics).
  try {
    name = decodeURIComponent(name)
  } catch {
    // Malformed escape sequence — keep the raw value.
  }

  // 2. Remove the file extension.
  name = name.replace(/\.[A-Za-z0-9]+$/, '')

  // 3. Remove a Vercel Blob random hash suffix (a long token containing at
  //    least one digit, appended on upload). The digit guard avoids stripping
  //    legitimate long words.
  name = name.replace(/-(?=[A-Za-z0-9]*\d)[A-Za-z0-9]{16,}$/, '')

  // 4. Remove size markers like 400kb, 500KB, 2MB, 1.5mb (with any leading
  //    separator). No leading \b — a separator like `_` is itself a word char,
  //    so the trailing lookahead does the bounding instead.
  name = name.replace(/[_-]?\d+(?:[.,]\d+)?\s?(?:kb|mb|gb)(?![a-z0-9])/gi, ' ')

  // 5. Separators to spaces.
  name = name.replace(/[_-]+/g, ' ')

  // 6. Normalize whitespace.
  return name.replace(/\s+/g, ' ').trim()
}

/** Join non-empty parts with a plain hyphen, e.g. "Projekt - Galeria - 01". */
function join(...parts: Array<string | null | undefined>): string {
  return parts.map((p) => (p ?? '').trim()).filter(Boolean).join(' - ')
}

/** Use the authored alt when present (after trimming), otherwise the fallback. */
export function resolveAlt(existing: string | null | undefined, fallback: string): string {
  const trimmed = (existing ?? '').trim()
  return trimmed.length > 0 ? trimmed : fallback
}

/** Gallery: `{projectName} - Galeria - {01|02|03…}` (1-based, zero-padded). */
export function galleryAlt(projectName: string, index: number): string {
  return join(projectName, 'Galerie', String(index + 1).padStart(2, '0'))
}

/** News article images: `Aktuelles - {postTitle} - {01|02|03…}` (1-based, zero-padded). */
export function newsImageAlt(postTitle: string, index: number): string {
  return join('Aktuelles', postTitle, String(index + 1).padStart(2, '0'))
}

/** Numbered homepage section image override: `{label} - {brand} - {01|02|03…}`
 *  (1-based, zero-padded). Unconditional override on the homepage. */
export function numberedSectionAlt(label: string, brand: string, index: number): string {
  return join(label, brand, String(index + 1).padStart(2, '0'))
}

/** Team member image caption override: `Über uns - {name} - {position}`. */
export function teamMemberAlt(name: string, position: string): string {
  return join('Über uns', name, position)
}

/** House types / floor plans: `{projectName} - Haustypen - {cleanedImageName}`. */
export function houseTypeAlt(projectName: string, url: string): string {
  return join(projectName, 'Haustypen', cleanImageName(url))
}

/** Site plan: `{projectName} - Plan osiedla - {cleanedImageName}`. */
export function sitePlanAlt(projectName: string, url: string): string {
  return join(projectName, 'Lageplan', cleanImageName(url))
}

/** Investment scheme: `{projectName} - Schemat inwestycji - {cleanedImageName}`. */
export function schemeAlt(projectName: string, url: string): string {
  return join(projectName, 'Projektschema', cleanImageName(url))
}

/** Homepage / general sections: `{sectionTitle} - {cleanedImageName}`. */
export function sectionAlt(sectionTitle: string, url: string): string {
  return join(sectionTitle, cleanImageName(url))
}
