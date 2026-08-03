// Shared contact + legal company data — single source of truth for everything
// shown across the site (header phone dropdown, footer, contact section, PDF,
// Impressum, Datenschutz, Organization schema). Keep all values here so nothing
// is duplicated by hand.

export type CityContact = {
  /** Office label shown above the number (e.g. the city). */
  city: string
  /** Human-readable phone, e.g. "+49 175 5080012". */
  phone: string
  /** tel: href with no spaces, e.g. "tel:+491755080012". */
  phoneHref: string
  /** Contact email. */
  email: string
}

// Single German office.
export const cityContacts: CityContact[] = [
  {
    city: "Berlin",
    phone: "+49 175 5080012",
    phoneHref: "tel:+491755080012",
    email: "vitalina@jwdevelopment.net",
  },
]

/** Primary contact used wherever a single number/email is shown. */
export const primaryContact = cityContacts[0]

/** Registered company address (Firmensitz). */
export const headquarters = {
  addressLines: ["Pariser Platz 6a", "10117 Berlin"],
  /** One-line form for map links / single-line displays. */
  addressOneLine: "Pariser Platz 6a, 10117 Berlin",
  mapHref: "https://maps.google.com/?q=Pariser+Platz+6a,+10117+Berlin",
  /** Keyless Google Maps embed (no API key required). */
  mapEmbedSrc: "https://www.google.com/maps?q=Pariser+Platz+6a%2C+10117+Berlin&output=embed",
}

/**
 * Full legal company identity for the Impressum / Datenschutz / Organization
 * schema. VAT ID, §34c authority, and any supervisory authority are intentionally
 * left empty — fill them in once the official values are available.
 */
export const company = {
  name: "Projektentwicklung Einstöckiges Berlin GmbH",
  managingDirector: "Vitalina Kalinichenko",
  addressLines: ["Pariser Platz 6a", "10117 Berlin", "Deutschland"],
  addressOneLine: "Pariser Platz 6a, 10117 Berlin",
  street: "Pariser Platz 6a",
  postalCode: "10117",
  city: "Berlin",
  country: "DE", // ISO code (JSON-LD addressCountry)
  countryName: "Deutschland", // display form (addresses / Impressum)
  phone: primaryContact.phone,
  phoneHref: primaryContact.phoneHref,
  email: primaryContact.email,
  registerCourt: "Amtsgericht Charlottenburg",
  registrationNumber: "HRB 288526 B",
  /** Not yet available — do not invent. */
  vatId: "" as string,
}
