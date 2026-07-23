// Shared contact data — single source of truth for phone numbers / emails shown
// across the site (header phone dropdown, footer, contact section). Keep all
// numbers here so they are never duplicated by hand in multiple components.

export type CityContact = {
  /** City label, exactly as displayed (Polish, with diacritics). */
  city: string
  /** Human-readable phone, e.g. "+48 788 830 036". */
  phone: string
  /** tel: href with no spaces, e.g. "tel:+48788830036". */
  phoneHref: string
  /** Contact email for this city. */
  email: string
}

export const cityContacts: CityContact[] = [
  {
    city: "Warszawa",
    phone: "+48 788 830 036",
    phoneHref: "tel:+48788830036",
    email: "maryna@jwdevelopment.net",
  },
  {
    city: "Kraków",
    phone: "+48 795 260 007",
    phoneHref: "tel:+48795260007",
    email: "daryna@jwdevelopment.net",
  },
  {
    city: "Wrocław",
    phone: "+48 795 140 224",
    phoneHref: "tel:+48795140224",
    email: "olena@jwdevelopment.net",
  },
]

/** Primary contact used wherever a single number/email is shown. */
export const primaryContact = cityContacts[0]

/** Registered company address (Siedziba spółki). */
export const headquarters = {
  addressLines: ["02-676 Warszawa", "ul. Postępu 12c/lok U5"],
  /** One-line form for map links / single-line displays. */
  addressOneLine: "Postępu 12C / lok. U5, 02-676 Warszawa",
  mapHref: "https://maps.google.com/?q=Postępu+12C+Warszawa",
}
