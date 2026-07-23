// Schema.org / JSON-LD helpers.
//
// All URLs are emitted on the canonical www host so structured data matches the
// site's canonical metadata (see metadataBase in app/layout.tsx). Each builder
// returns a plain object; render it with <JsonLd> to emit a single
// <script type="application/ld+json"> block.

import { primaryContact } from '@/lib/contact-info'

export const SITE_URL = 'https://www.jednopietrowawarszawa.pl'

/** Build an absolute URL on the canonical www host from a root-relative path.
 *  Already-absolute URLs (e.g. Vercel Blob images) are returned unchanged. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

const ORG_NAME = 'Jednopiętrowa Warszawa sp. z o.o.'
const ORG_LOGO = absoluteUrl('/images/logo-jednopietrowa.png')

/** Bare Organization node, reused as author/publisher inside other schemas. */
const organizationNode = {
  '@type': 'Organization',
  name: ORG_NAME,
  url: SITE_URL,
  logo: ORG_LOGO,
}

/** Publisher node — Google rich results require the logo as an ImageObject. */
const publisherNode = {
  '@type': 'Organization',
  name: ORG_NAME,
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: ORG_LOGO },
}

/** Site-wide Organization schema (rendered once in the root layout). */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ORG_NAME,
    url: SITE_URL,
    logo: ORG_LOGO,
    sameAs: [
      'https://www.instagram.com/jednopietrowawarszawa/',
      'https://www.youtube.com/@jednopietrowawarszawasp.zo6617',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      telephone: primaryContact.phone,
      email: primaryContact.email,
    },
  }
}

/** An image plus its human-readable title/caption (e.g. the resolved alt text). */
export interface ImageInput {
  url: string
  caption?: string | null
  width?: number | null
  height?: number | null
}

/** Build a Schema.org ImageObject with a name/caption from the resolved alt. */
function imageObject(img: ImageInput) {
  const node: Record<string, unknown> = {
    '@type': 'ImageObject',
    url: absoluteUrl(img.url),
    contentUrl: absoluteUrl(img.url),
  }
  const caption = img.caption?.trim()
  if (caption) {
    node.name = caption
    node.caption = caption
  }
  if (img.width) node.width = img.width
  if (img.height) node.height = img.height
  return node
}

/** Map image inputs to ImageObjects, dropping any without a URL. */
function imageObjects(images: ImageInput[]): Record<string, unknown>[] {
  return images.filter((i) => i.url).map(imageObject)
}

export interface Crumb {
  name: string
  /** Root-relative path; converted to an absolute www URL. */
  path: string
}

/** BreadcrumbList mirroring the page's visible breadcrumb trail. */
export function breadcrumbSchema(items: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  }
}

/** RealEstateListing modelled as an ApartmentComplex (a Residence) so the
 *  available-unit count and postal address map to real Schema.org properties. */
export function residenceSchema(opts: {
  name: string
  description?: string | null
  images?: ImageInput[]
  path: string
  availableCount: number
  streetAddress?: string | null
  locality?: string | null
  region?: string | null
  postalCode?: string | null
}) {
  const address: Record<string, unknown> = {
    '@type': 'PostalAddress',
    addressCountry: 'PL',
  }
  if (opts.streetAddress) address.streetAddress = opts.streetAddress
  if (opts.locality) address.addressLocality = opts.locality
  if (opts.region) address.addressRegion = opts.region
  if (opts.postalCode) address.postalCode = opts.postalCode

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ApartmentComplex',
    name: opts.name,
    url: absoluteUrl(opts.path),
    numberOfAvailableAccommodationUnits: opts.availableCount,
    address,
  }
  if (opts.description) schema.description = opts.description
  const images = imageObjects(opts.images ?? [])
  if (images.length) schema.image = images
  return schema
}

/** Article schema for a news post. */
export function articleSchema(opts: {
  headline: string
  description?: string | null
  image?: ImageInput | null
  datePublished: Date
  dateModified: Date
  path: string
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    datePublished: opts.datePublished.toISOString(),
    dateModified: opts.dateModified.toISOString(),
    author: organizationNode,
    publisher: publisherNode,
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(opts.path) },
  }
  if (opts.description) schema.description = opts.description
  if (opts.image?.url) schema.image = [imageObject(opts.image)]
  return schema
}

/** ItemList of articles for the news listing page. */
export function itemListSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  }
}

/** Render a schema object as a single JSON-LD script block.
 *  `<` is escaped to `<` so embedded user content can't break out of the
 *  <script> element. */
export function JsonLd({ schema }: { schema: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
      }}
    />
  )
}
