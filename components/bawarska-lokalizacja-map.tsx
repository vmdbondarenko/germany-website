export function BawarskaLokalizacjaMap() {
  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-xl border border-border/30">
      <svg
        viewBox="0 0 700 620"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        style={{ backgroundColor: '#F5F3EF' }}
      >
        {/* Map background grid lines - streets */}
        <g stroke="#D6D0C8" strokeWidth="6" opacity="0.5">
          {/* Horizontal roads */}
          <line x1="0" y1="160" x2="700" y2="160" />
          <line x1="0" y1="330" x2="700" y2="330" />
          <line x1="0" y1="500" x2="700" y2="500" />
          {/* Vertical roads */}
          <line x1="180" y1="0" x2="180" y2="620" />
          <line x1="400" y1="0" x2="400" y2="620" />
          <line x1="580" y1="0" x2="580" y2="620" />
        </g>

        {/* Diagonal road (Wschodnia Obwodnica / A4) */}
        <line x1="0" y1="60" x2="260" y2="360" stroke="#C8C2B8" strokeWidth="9" opacity="0.45" />
        <line x1="440" y1="80" x2="700" y2="300" stroke="#C8C2B8" strokeWidth="7" opacity="0.38" />

        {/* Water / green areas */}
        <ellipse cx="80" cy="240" rx="55" ry="28" fill="#D6E8F0" opacity="0.5" />
        <ellipse cx="630" cy="480" rx="42" ry="22" fill="#D6E8F0" opacity="0.4" />
        <ellipse cx="550" cy="140" rx="38" ry="18" fill="#C8DCCA" opacity="0.45" />

        {/* Distance circles - dotted */}
        {/* 500 m */}
        <circle
          cx="360" cy="260"
          r="90"
          fill="none"
          stroke="#6E2E2A"
          strokeWidth="2.5"
          strokeDasharray="6 5"
          opacity="0.7"
        />
        {/* 1 km */}
        <circle
          cx="360" cy="260"
          r="175"
          fill="none"
          stroke="#6E2E2A"
          strokeWidth="2.5"
          strokeDasharray="6 5"
          opacity="0.65"
        />
        {/* 1.5 km */}
        <circle
          cx="360" cy="260"
          r="280"
          fill="none"
          stroke="#6E2E2A"
          strokeWidth="2.5"
          strokeDasharray="6 5"
          opacity="0.5"
        />

        {/* Distance circle labels */}
        <g>
          <rect x="418" y="330" width="56" height="26" rx="13" fill="white" stroke="#6E2E2A" strokeWidth="1.5" />
          <text x="446" y="348" textAnchor="middle" fontSize="12" fill="#6E2E2A" fontFamily="serif" fontWeight="700">500 m</text>
        </g>
        <g>
          <rect x="500" y="406" width="52" height="26" rx="13" fill="white" stroke="#6E2E2A" strokeWidth="1.5" />
          <text x="526" y="424" textAnchor="middle" fontSize="12" fill="#6E2E2A" fontFamily="serif" fontWeight="700">1 km</text>
        </g>
        <g>
          <rect x="614" y="502" width="58" height="26" rx="13" fill="white" stroke="#6E2E2A" strokeWidth="1.5" />
          <text x="643" y="520" textAnchor="middle" fontSize="12" fill="#6E2E2A" fontFamily="serif" fontWeight="700">1,5 km</text>
        </g>

        {/* Central marker - Bawarska Przestrzeń */}
        <g>
          <circle cx="360" cy="260" r="22" fill="rgba(110,46,42,0.15)" />
          <circle cx="360" cy="260" r="9" fill="#6E2E2A" />
          <circle cx="360" cy="260" r="4" fill="white" />
          {/* Label */}
          <rect x="230" y="265" width="260" height="58" rx="12" fill="#3E1718" />
          <rect x="230" y="265" width="260" height="7" rx="12" fill="#6E2E2A" />
          <polygon points="360,252 346,265 374,265" fill="#3E1718" />
          <text x="360" y="298" textAnchor="middle" fontSize="18" fill="white" fontFamily="serif" fontWeight="700" letterSpacing="0.5">Bawarska Przestrzeń</text>
          <text x="360" y="316" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.8)" fontFamily="sans-serif">ul. Jarzębinowa, Dobrzykowice</text>
        </g>

        {/* Szkoła Podstawowa - top right, 3 min samochodem */}
        <g>
          <rect x="430" y="22" width="255" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="645" y="22" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="645" y="22" width="18" height="52" fill="#3E1718" />
          {/* graduation cap icon */}
          <g transform="translate(654,34) scale(0.85)" fill="white">
            <path d="M15 0 L30 7 L15 14 L0 7 Z" />
            <path d="M4 9.5 L4 18 Q15 24 26 18 L26 9.5" fill="none" stroke="white" strokeWidth="2" />
            <line x1="28" y1="7" x2="28" y2="20" stroke="white" strokeWidth="2" />
            <circle cx="28" cy="21" r="2" />
          </g>
          <text x="437" y="44" textAnchor="start" fontSize="14" fill="#3E1718" fontFamily="serif" fontWeight="700">Szkoła Podstawowa</text>
          <text x="437" y="62" textAnchor="start" fontSize="11" fill="#6E2E2A" fontFamily="sans-serif">3 min samochodem</text>
          <polygon points="510,74 524,74 517,84" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Plac Zabaw - top center, 14 min spacerem */}
        <g>
          <rect x="258" y="22" width="205" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="423" y="22" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="423" y="22" width="18" height="52" fill="#3E1718" />
          {/* playground / slide icon */}
          <g transform="translate(431,34)" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <circle cx="8" cy="4" r="3" fill="white" stroke="none" />
            <line x1="8" y1="7" x2="8" y2="14" stroke="white" />
            <line x1="8" y1="10" x2="14" y2="13" stroke="white" />
            <line x1="8" y1="14" x2="4" y2="20" stroke="white" />
            <line x1="8" y1="14" x2="12" y2="20" stroke="white" />
            <path d="M16 8 Q22 10 20 20" stroke="white" fill="none" />
          </g>
          <text x="265" y="44" textAnchor="start" fontSize="14" fill="#3E1718" fontFamily="serif" fontWeight="700">Plac Zabaw</text>
          <text x="265" y="62" textAnchor="start" fontSize="11" fill="#6E2E2A" fontFamily="sans-serif">14 min spacerem</text>
          <polygon points="360,74 374,74 367,84" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Żłobek - left, 14 min spacerem */}
        <g>
          <rect x="6" y="160" width="220" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="186" y="160" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="186" y="160" width="18" height="52" fill="#3E1718" />
          {/* pacifier / baby icon */}
          <g transform="translate(195,171)" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <circle cx="10" cy="10" r="7" />
            <circle cx="10" cy="10" r="3" fill="white" stroke="none" />
            <line x1="15" y1="5" x2="19" y2="1" />
            <path d="M19 1 Q23 0 22 4" />
          </g>
          <text x="13" y="182" textAnchor="start" fontSize="14" fill="#3E1718" fontFamily="serif" fontWeight="700">Żłobek</text>
          <text x="13" y="200" textAnchor="start" fontSize="11" fill="#6E2E2A" fontFamily="sans-serif">14 min spacerem</text>
          <polygon points="200,202 214,202 207,212" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Przedszkole - left, 11 min spacerem */}
        <g>
          <rect x="6" y="310" width="230" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="196" y="310" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="196" y="310" width="18" height="52" fill="#3E1718" />
          {/* graduation cap icon (smaller) */}
          <g transform="translate(203,320) scale(0.75)" fill="white">
            <path d="M15 0 L30 7 L15 14 L0 7 Z" />
            <path d="M4 9.5 L4 18 Q15 24 26 18 L26 9.5" fill="none" stroke="white" strokeWidth="2.5" />
            <line x1="28" y1="7" x2="28" y2="20" stroke="white" strokeWidth="2.5" />
            <circle cx="28" cy="21" r="2.5" />
          </g>
          <text x="13" y="332" textAnchor="start" fontSize="14" fill="#3E1718" fontFamily="serif" fontWeight="700">Przedszkole</text>
          <text x="13" y="350" textAnchor="start" fontSize="11" fill="#6E2E2A" fontFamily="sans-serif">11 min spacerem</text>
          <polygon points="200,302 214,302 207,312" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Kościół - center bottom, 9 min spacerem */}
        <g>
          <rect x="260" y="390" width="200" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="420" y="390" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="420" y="390" width="18" height="52" fill="#3E1718" />
          {/* church icon */}
          <g transform="translate(429,398)" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
            <rect x="4" y="12" width="14" height="10" fill="none" />
            <polygon points="0,12 11,4 22,12" fill="none" />
            <line x1="11" y1="0" x2="11" y2="5" />
            <line x1="8" y1="2.5" x2="14" y2="2.5" />
            <rect x="8" y="16" width="6" height="6" fill="none" />
          </g>
          <text x="267" y="412" textAnchor="start" fontSize="14" fill="#3E1718" fontFamily="serif" fontWeight="700">Kościół</text>
          <text x="267" y="430" textAnchor="start" fontSize="11" fill="#6E2E2A" fontFamily="sans-serif">9 min spacerem</text>
          <polygon points="348,380 362,380 355,390" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Szkoła Podstawowa - bottom left, 4 min samochodem */}
        <g>
          <rect x="6" y="450" width="255" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="221" y="450" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="221" y="450" width="18" height="52" fill="#3E1718" />
          {/* graduation cap icon */}
          <g transform="translate(228,460) scale(0.75)" fill="white">
            <path d="M15 0 L30 7 L15 14 L0 7 Z" />
            <path d="M4 9.5 L4 18 Q15 24 26 18 L26 9.5" fill="none" stroke="white" strokeWidth="2.5" />
            <line x1="28" y1="7" x2="28" y2="20" stroke="white" strokeWidth="2.5" />
            <circle cx="28" cy="21" r="2.5" />
          </g>
          <text x="13" y="472" textAnchor="start" fontSize="14" fill="#3E1718" fontFamily="serif" fontWeight="700">Szkoła Podstawowa</text>
          <text x="13" y="490" textAnchor="start" fontSize="11" fill="#6E2E2A" fontFamily="sans-serif">4 min samochodem</text>
          <polygon points="180,440 194,440 187,450" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* PKP Dobrzykowice - far bottom left, 5 min samochodem */}
        <g>
          <rect x="6" y="546" width="255" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="221" y="546" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="221" y="546" width="18" height="52" fill="#3E1718" />
          {/* train icon */}
          <g transform="translate(229,555)" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
            <rect x="2" y="2" width="18" height="14" rx="3" />
            <line x1="2" y1="10" x2="20" y2="10" />
            <line x1="7" y1="6" x2="7" y2="10" />
            <line x1="15" y1="6" x2="15" y2="10" />
            <line x1="4" y1="16" x2="1" y2="21" />
            <line x1="18" y1="16" x2="21" y2="21" />
            <line x1="1" y1="21" x2="21" y2="21" />
          </g>
          <text x="13" y="568" textAnchor="start" fontSize="14" fill="#3E1718" fontFamily="serif" fontWeight="700">PKP Dobrzykowice</text>
          <text x="13" y="586" textAnchor="start" fontSize="11" fill="#6E2E2A" fontFamily="sans-serif">5 min samochodem</text>
          <polygon points="140,536 154,536 147,546" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Biedronka - right, 3 min samochodem */}
        <g>
          <rect x="436" y="300" width="248" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="644" y="300" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="644" y="300" width="18" height="52" fill="#3E1718" />
          {/* shopping cart icon */}
          <g transform="translate(651,309)" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
            <path d="M0 0 L3 0 L6 14 L18 14 L21 5 L4 5" />
            <circle cx="8" cy="18" r="2" fill="white" stroke="none" />
            <circle cx="16" cy="18" r="2" fill="white" stroke="none" />
          </g>
          <text x="443" y="322" textAnchor="start" fontSize="14" fill="#3E1718" fontFamily="serif" fontWeight="700">Biedronka</text>
          <text x="443" y="340" textAnchor="start" fontSize="11" fill="#6E2E2A" fontFamily="sans-serif">3 min samochodem</text>
          <polygon points="480,290 494,290 487,300" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

      </svg>
    </div>
  )
}
