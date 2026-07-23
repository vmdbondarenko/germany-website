// SEO copy (H1 / <title> / meta description) authored in new h1_title_09.06.xlsx
// (sheet "Meta-dane"). One source of truth consumed by the homepage, the city-hub
// landing pages (/{location.slug}) and the investment pages (/inwestycje/{slug}
// and /{city}/{slug}). og:title is always set to the same string as <title>.
//
// Generated from the spreadsheet — Polish diacritics preserved byte-for-byte.
// Do not hand-edit casually; update the spreadsheet and re-derive.

export type LandingCopy = {
  /** Visible <h1> on the page. */
  h1: string
  /** <title> and og:title (identical by construction). */
  title: string
  /** <meta name="description"> and og:description. */
  description: string
}

/** Homepage ("/"). */
export const HOME_COPY: LandingCopy = {
  h1: 'Nowe domy na sprzedaż od dewelopera',
  title: 'Domy na sprzedaż od dewelopera | Domy pod Warszawą',
  description: 'Nowe domy od dewelopera z ogrodem pod Warszawą, Wrocławiem i Krakowem. Sprawdzone technologie, zakup bez pośredników. Wybrane lokale bez MSWiA.',
}

/** City-hub landing pages, keyed by Location.slug. */
export const LOCATION_COPY: Record<string, LandingCopy> = {
  'domy-pod-warszawa': {
    h1: 'Domy na sprzedaż od dewelopera pod Warszawą',
    title: 'Domy na sprzedaż pod Warszawą | Deweloper',
    description: 'Nowe domy od dewelopera pod Warszawą i w Warszawie. Różne metraże, prywatne ogrody i miejsca postojowe. Wybrane lokale bez pozwolenia MSWiA.',
  },
  'domy-pod-wroclawiem': {
    h1: 'Domy na sprzedaż od dewelopera pod Wrocławiem',
    title: 'Domy na sprzedaż pod Wrocławiem | Deweloper',
    description: 'Nowe domy od dewelopera pod Wrocławiem. Dom wolnostojący i bliźniaki z prywatnym ogrodem, garażem oraz pompą ciepła. Poznaj inwestycje.',
  },
  'domy-pod-krakowem': {
    h1: 'Domy na sprzedaż od dewelopera pod Krakowem',
    title: 'Domy na sprzedaż pod Krakowem | Deweloper',
    description: 'Nowe domy od dewelopera pod Krakowem. Prywatny ogród, 2 miejsca postojowe, dogodny dojazd do centrum. Wybrane lokale bez pozwolenia MSWiA.',
  },
}

/** Investment pages, keyed by Project.slug (shared by /inwestycje/{slug} and /{city}/{slug}). */
export const PROJECT_COPY: Record<string, LandingCopy> = {
  'dawidy-bankowe': {
    h1: 'Domy na sprzedaż w Dawidach Bankowych pod Warszawą',
    title: 'Domy na sprzedaż Dawidy Bankowe | Deweloper',
    description: 'Nowe domy w Dawidach Bankowych pod Warszawą - Osiedle Szlacheckie, 55-133 m². Prywatny ogród, 2 miejsca postojowe. Bez pozwolenia MSWiA.',
  },
  'jablonna': {
    h1: 'Domy na sprzedaż w Jabłonnie pod Warszawą',
    title: 'Domy na sprzedaż Jabłonna | Deweloper',
    description: 'Nowe domy od dewelopera w Jabłonnie pod Warszawą - Osiedle przy Marmurowej, 113-135 m². Prywatny ogród, szybki dojazd do Warszawy.',
  },
  'jastrzebie': {
    h1: 'Bliźniaki na sprzedaż w Jastrzębiu pod Warszawą',
    title: 'Bliźniaki na sprzedaż Jastrzębie | Deweloper',
    description: 'Bliźniak 110 m² w Jastrzębiu pod Warszawą - Dziesiąty Bawarski. Prywatny ogród 200 m², 2 miejsca postojowe. Bez pozwolenia MSWiA.',
  },
  'wawer': {
    h1: 'Nowe mieszkania i domy na sprzedaż w Wawrze',
    title: 'Mieszkania i domy na sprzedaż w Wawrze',
    description: 'Domy od dewelopera w Wawrze w Warszawie - bliźniaki 110 m² z ogrodem i garażem oraz lokale 55 m². Szybki dojazd do centrum.',
  },
  'dlugoleka': {
    h1: 'Dom wolnostojący na sprzedaż w Długołęce pod Wrocławiem',
    title: 'Dom na sprzedaż Długołęka | Deweloper',
    description: 'Dom wolnostojący od dewelopera w Długołęce pod Wrocławiem - Południowa Bawaria. 80 m², ogród 330 m², pompa ciepła. Szybki dojazd do Wrocławia.',
  },
  'dobrzykowice': {
    h1: 'Domy na sprzedaż w Dobrzykowicach pod Wrocławiem',
    title: 'Domy na sprzedaż Dobrzykowice | Deweloper',
    description: 'Nowe domy 112 m² w Dobrzykowicach pod Wrocławiem - Bawarska Przestrzeń. Garaż, pompa ciepła i ogród w cenie. Szybki dojazd do Wrocławia.',
  },
  'kaszow': {
    h1: 'Domy na sprzedaż w Kaszówie pod Krakowem',
    title: 'Domy na sprzedaż Kaszów | Deweloper',
    description: 'Nowe domy od dewelopera w Kaszowie pod Krakowem - Bawarskie Wzgórze, od 90 m². Prywatny ogród, 25 min od centrum. Bez pozwolenia MSWiA.',
  },
  'janowice': {
    h1: 'Bliźniaki na sprzedaż w Janowicach pod Krakowem',
    title: 'Bliźniaki na sprzedaż Janowice | Deweloper',
    description: 'Nowe domy 150 m² w Janowicach pod Krakowem - Pierwszy Krakowski. Prywatny ogród 280 m², 2 miejsca postojowe, 25 min od centrum Krakowa.',
  },
}
