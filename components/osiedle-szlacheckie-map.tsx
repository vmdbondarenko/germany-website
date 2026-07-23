"use client"

import { Building2, Plane, ShoppingCart, Leaf, Car } from "lucide-react"

const locations = [
  {
    id: "centrum",
    label: "Warszawa Śródmieście",
    detail: "13 km · 25 min. samochodem",
    icon: Building2,
    x: 42,
    y: 10,
    arrowDir: "down",
  },
  {
    id: "lotnisko",
    label: "Lotnisko Chopina",
    detail: "7 km · 14 min. samochodem",
    icon: Plane,
    x: 73,
    y: 18,
    arrowDir: "down",
  },
  {
    id: "stawy",
    label: "Rezerwat Stawy Raszyńskie",
    detail: "3,5 km · 10 min. rowerem",
    icon: Leaf,
    x: 14,
    y: 36,
    arrowDir: "right",
  },
  {
    id: "janki",
    label: "Centrum handlowe Janki",
    detail: "7 km · 11 min. samochodem",
    icon: ShoppingCart,
    x: 2,
    y: 52,
    arrowDir: "right",
  },
  {
    id: "pow",
    label: "Południowa Obwodnica Warszawy",
    detail: "3 km · 7 min. samochodem",
    icon: Car,
    x: 56,
    y: 50,
    arrowDir: "left",
  },
  {
    id: "s79",
    label: "Droga ekspresowa S79",
    detail: "3 km · 7 min. samochodem",
    icon: Car,
    x: 62,
    y: 60,
    arrowDir: "left",
  },
]

export function OsiedleSzlacheckieMap() {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-xl border border-[#6E2E2A]/10"
      style={{ aspectRatio: "4/3", backgroundColor: "#F5F0EB" }}
    >
      {/* Subtle grid background */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Background */}
        <rect width="800" height="600" fill="#F5F0EB" />

        {/* Soft road network lines */}
        <g stroke="#D9CEBC" strokeWidth="6" fill="none" strokeLinecap="round">
          {/* Main horizontal road */}
          <path d="M0 320 Q200 300 400 310 Q600 320 800 300" />
          {/* Vertical road */}
          <path d="M520 0 Q510 150 515 300 Q520 450 525 600" />
          {/* Diagonal S79 / POW */}
          <path d="M350 600 Q430 480 480 380 Q530 280 600 200 Q680 120 800 80" />
          {/* Secondary roads */}
          <path d="M0 180 Q150 190 300 200 Q400 205 500 210" />
          <path d="M280 0 Q270 100 265 200 Q260 350 270 500" />
          <path d="M0 420 Q200 410 350 405 Q500 400 700 390 Q750 388 800 385" />
          <path d="M100 0 Q110 120 115 240 Q120 360 110 480 Q105 540 100 600" />
          <path d="M650 0 Q660 150 655 300 Q650 450 660 600" />
        </g>

        {/* Expressway / ringroad - thicker */}
        <g stroke="#C8BBAA" strokeWidth="10" fill="none" strokeLinecap="round">
          <path d="M350 600 Q430 480 480 380 Q530 280 600 200 Q680 120 800 80" />
        </g>

        {/* Water bodies */}
        <ellipse cx="100" cy="200" rx="55" ry="30" fill="#DAEAF5" opacity="0.7" />
        <ellipse cx="65" cy="240" rx="40" ry="22" fill="#DAEAF5" opacity="0.6" />
        <ellipse cx="145" cy="225" rx="30" ry="18" fill="#DAEAF5" opacity="0.5" />
        <ellipse cx="90" cy="170" rx="25" ry="14" fill="#DAEAF5" opacity="0.5" />
        <ellipse cx="680" cy="490" rx="35" ry="20" fill="#DAEAF5" opacity="0.5" />

        {/* Green areas */}
        <ellipse cx="130" cy="210" rx="60" ry="38" fill="#D4E8CC" opacity="0.35" />
        <rect x="600" y="350" width="100" height="80" rx="12" fill="#D4E8CC" opacity="0.3" />
        <ellipse cx="200" cy="500" rx="70" ry="40" fill="#D4E8CC" opacity="0.25" />

        {/* Distance circles - dotted, brick color */}
        {/* 1.5 km */}
        <circle
          cx="400"
          cy="355"
          r="65"
          fill="none"
          stroke="#6E2E2A"
          strokeWidth="1.5"
          strokeDasharray="5 5"
          opacity="0.55"
        />
        {/* 3 km */}
        <circle
          cx="400"
          cy="355"
          r="130"
          fill="none"
          stroke="#6E2E2A"
          strokeWidth="1.5"
          strokeDasharray="5 5"
          opacity="0.4"
        />
        {/* 6 km */}
        <circle
          cx="400"
          cy="355"
          r="255"
          fill="none"
          stroke="#6E2E2A"
          strokeWidth="1.5"
          strokeDasharray="5 5"
          opacity="0.25"
        />

        {/* Distance labels on circles */}
        {/* 1.5 km label */}
        <g>
          <rect x="440" y="395" width="58" height="26" rx="13" fill="white" opacity="0.95" stroke="#6E2E2A" strokeWidth="1.5" />
          <text x="469" y="417" textAnchor="middle" fontSize="14" fill="#6E2E2A" fontFamily="serif" fontWeight="700">1,5 km</text>
        </g>
        {/* 3 km label */}
        <g>
          <rect x="490" y="448" width="56" height="26" rx="13" fill="white" opacity="0.95" stroke="#6E2E2A" strokeWidth="1.5" />
          <text x="518" y="470" textAnchor="middle" fontSize="14" fill="#6E2E2A" fontFamily="serif" fontWeight="700">3 km</text>
        </g>
        {/* 6 km label */}
        <g>
          <rect x="604" y="560" width="56" height="26" rx="13" fill="white" opacity="0.95" stroke="#6E2E2A" strokeWidth="1.5" />
          <text x="632" y="582" textAnchor="middle" fontSize="14" fill="#6E2E2A" fontFamily="serif" fontWeight="700">6 km</text>
        </g>

        {/* Connector dashed lines from center to labels */}
        <g stroke="#6E2E2A" strokeWidth="1" strokeDasharray="4 4" opacity="0.4">
          {/* centrum */}
          <line x1="400" y1="355" x2="345" y2="65" />
          {/* lotnisko */}
          <line x1="400" y1="355" x2="585" y2="110" />
          {/* stawy */}
          <line x1="400" y1="355" x2="155" y2="220" />
          {/* janki */}
          <line x1="400" y1="355" x2="95" y2="315" />
          {/* pow */}
          <line x1="400" y1="355" x2="445" y2="305" />
          {/* s79 */}
          <line x1="400" y1="355" x2="495" y2="365" />
        </g>

        {/* Central marker - Osiedle Szlacheckie */}
        <g>
          {/* Outer pulse ring */}
          <circle cx="400" cy="355" r="24" fill="rgba(110,46,42,0.15)" />
          {/* Inner dot */}
          <circle cx="400" cy="355" r="10" fill="#6E2E2A" />
          <circle cx="400" cy="355" r="5" fill="white" />

          {/* Label box - much larger */}
          <rect x="265" y="360" width="270" height="65" rx="12" fill="#3E1718" />
          <rect x="265" y="360" width="270" height="8" rx="12" fill="#6E2E2A" />
          {/* Small triangle pointer */}
          <polygon points="400,350 385,360 415,360" fill="#3E1718" />
          <text x="400" y="395" textAnchor="middle" fontSize="22" fill="white" fontFamily="serif" fontWeight="700" letterSpacing="0.5">Osiedle Szlacheckie</text>
          <text x="400" y="418" textAnchor="middle" fontSize="14" fill="rgba(255,255,255,0.85)" fontFamily="sans-serif">ul. Szlachecka, Dawidy Bankowe</text>
        </g>

        {/* Location label: Warszawa Śródmieście */}
        <g>
          <rect x="235" y="25" width="240" height="55" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="235" y="25" width="55" height="55" rx="10" fill="#3E1718" />
          <rect x="265" y="25" width="25" height="55" fill="#3E1718" />
          <text x="262" y="60" textAnchor="middle" fontSize="22" fill="white">🏛</text>
          <text x="300" y="47" textAnchor="start" fontSize="15" fill="#3E1718" fontFamily="serif" fontWeight="700">Warszawa Śródmieście</text>
          <text x="300" y="68" textAnchor="start" fontSize="12" fill="#6E2E2A" fontFamily="sans-serif">13 km · 25 min. samochodem</text>
          <polygon points="338,80 352,80 345,92" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Location label: Lotnisko Chopina */}
        <g>
          <rect x="495" y="55" width="210" height="55" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="495" y="55" width="55" height="55" rx="10" fill="#3E1718" />
          <rect x="525" y="55" width="25" height="55" fill="#3E1718" />
          <text x="522" y="90" textAnchor="middle" fontSize="22" fill="white">✈</text>
          <text x="560" y="77" textAnchor="start" fontSize="15" fill="#3E1718" fontFamily="serif" fontWeight="700">Lotnisko Chopina</text>
          <text x="560" y="98" textAnchor="start" fontSize="12" fill="#6E2E2A" fontFamily="sans-serif">7 km · 14 min. samochodem</text>
          <polygon points="562,110 576,110 569,122" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Location label: Rezerwat Stawy Raszyńskie */}
        <g>
          <rect x="8" y="175" width="245" height="55" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="8" y="175" width="55" height="55" rx="10" fill="#3E1718" />
          <rect x="38" y="175" width="25" height="55" fill="#3E1718" />
          <text x="35" y="210" textAnchor="middle" fontSize="22" fill="white">🌿</text>
          <text x="73" y="197" textAnchor="start" fontSize="14" fill="#3E1718" fontFamily="serif" fontWeight="700">Rezerwat Stawy Raszyńskie</text>
          <text x="73" y="218" textAnchor="start" fontSize="12" fill="#6E2E2A" fontFamily="sans-serif">3,5 km · 10 min. rowerem</text>
          <polygon points="252,202 266,212 252,222" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Location label: CH Janki */}
        <g>
          <rect x="8" y="275" width="215" height="55" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="8" y="275" width="55" height="55" rx="10" fill="#3E1718" />
          <rect x="38" y="275" width="25" height="55" fill="#3E1718" />
          <text x="35" y="310" textAnchor="middle" fontSize="22" fill="white">🛒</text>
          <text x="73" y="297" textAnchor="start" fontSize="14" fill="#3E1718" fontFamily="serif" fontWeight="700">Centrum handlowe Janki</text>
          <text x="73" y="318" textAnchor="start" fontSize="12" fill="#6E2E2A" fontFamily="sans-serif">7 km · 11 min. samochodem</text>
          <polygon points="222,302 236,312 222,322" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Location label: POW */}
        <g>
          <rect x="433" y="245" width="270" height="55" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="433" y="245" width="55" height="55" rx="10" fill="#3E1718" />
          <rect x="463" y="245" width="25" height="55" fill="#3E1718" />
          <text x="460" y="280" textAnchor="middle" fontSize="22" fill="white">🚗</text>
          <text x="498" y="267" textAnchor="start" fontSize="14" fill="#3E1718" fontFamily="serif" fontWeight="700">Południowa Obwodnica Warszawy</text>
          <text x="498" y="288" textAnchor="start" fontSize="12" fill="#6E2E2A" fontFamily="sans-serif">3 km · 7 min. samochodem</text>
          <polygon points="433,268 419,275 433,282" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Location label: S79 */}
        <g>
          <rect x="490" y="320" width="230" height="55" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="490" y="320" width="55" height="55" rx="10" fill="#3E1718" />
          <rect x="520" y="320" width="25" height="55" fill="#3E1718" />
          <text x="517" y="355" textAnchor="middle" fontSize="22" fill="white">🛣</text>
          <text x="555" y="342" textAnchor="start" fontSize="15" fill="#3E1718" fontFamily="serif" fontWeight="700">Droga ekspresowa S79</text>
          <text x="555" y="363" textAnchor="start" fontSize="12" fill="#6E2E2A" fontFamily="sans-serif">3 km · 7 min. samochodem</text>
          <polygon points="490,343 476,350 490,357" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>
      </svg>
    </div>
  )
}
