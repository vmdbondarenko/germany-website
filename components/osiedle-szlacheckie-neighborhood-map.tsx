export function OsiedleSzlacheckieNeighborhoodMap() {
  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-xl border border-border/30">
      <svg
        viewBox="0 0 700 650"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        style={{ backgroundColor: '#F5F3EF' }}
      >
        {/* Map background grid lines - streets */}
        <g stroke="#D6D0C8" strokeWidth="6" opacity="0.5">
          {/* Horizontal roads */}
          <line x1="0" y1="180" x2="700" y2="180" />
          <line x1="0" y1="350" x2="700" y2="350" />
          <line x1="0" y1="520" x2="700" y2="520" />
          {/* Vertical roads */}
          <line x1="200" y1="0" x2="200" y2="650" />
          <line x1="420" y1="0" x2="420" y2="650" />
          <line x1="600" y1="0" x2="600" y2="650" />
        </g>

        {/* Diagonal road */}
        <line x1="0" y1="80" x2="280" y2="380" stroke="#C8C2B8" strokeWidth="8" opacity="0.4" />
        <line x1="420" y1="100" x2="700" y2="320" stroke="#C8C2B8" strokeWidth="6" opacity="0.35" />

        {/* Water / park areas */}
        <ellipse cx="90" cy="260" rx="60" ry="30" fill="#D6E8F0" opacity="0.5" />
        <ellipse cx="640" cy="500" rx="45" ry="25" fill="#D6E8F0" opacity="0.4" />

        {/* Distance circles - dotted */}
        {/* 200m */}
        <circle
          cx="370" cy="270"
          r="80"
          fill="none"
          stroke="#6E2E2A"
          strokeWidth="2.5"
          strokeDasharray="6 5"
          opacity="0.7"
        />
        {/* 350m */}
        <circle
          cx="370" cy="270"
          r="150"
          fill="none"
          stroke="#6E2E2A"
          strokeWidth="2.5"
          strokeDasharray="6 5"
          opacity="0.7"
        />
        {/* 800m */}
        <circle
          cx="370" cy="270"
          r="290"
          fill="none"
          stroke="#6E2E2A"
          strokeWidth="2.5"
          strokeDasharray="6 5"
          opacity="0.55"
        />

        {/* Distance circle labels */}
        <g>
          <rect x="427" y="333" width="58" height="26" rx="13" fill="white" stroke="#6E2E2A" strokeWidth="1.5" />
          <text x="456" y="351" textAnchor="middle" fontSize="13" fill="#6E2E2A" fontFamily="serif" fontWeight="700">200 m</text>
        </g>
        <g>
          <rect x="492" y="395" width="58" height="26" rx="13" fill="white" stroke="#6E2E2A" strokeWidth="1.5" />
          <text x="521" y="413" textAnchor="middle" fontSize="13" fill="#6E2E2A" fontFamily="serif" fontWeight="700">350 m</text>
        </g>
        <g>
          <rect x="628" y="508" width="58" height="26" rx="13" fill="white" stroke="#6E2E2A" strokeWidth="1.5" />
          <text x="657" y="526" textAnchor="middle" fontSize="13" fill="#6E2E2A" fontFamily="serif" fontWeight="700">800 m</text>
        </g>

        {/* Central marker - Osiedle Szlacheckie */}
        <g>
          <circle cx="370" cy="270" r="22" fill="rgba(110,46,42,0.15)" />
          <circle cx="370" cy="270" r="9" fill="#6E2E2A" />
          <circle cx="370" cy="270" r="4" fill="white" />
          {/* Label */}
          <rect x="248" y="275" width="244" height="58" rx="12" fill="#3E1718" />
          <rect x="248" y="275" width="244" height="7" rx="12" fill="#6E2E2A" />
          <polygon points="370,262 356,275 384,275" fill="#3E1718" />
          <text x="370" y="308" textAnchor="middle" fontSize="20" fill="white" fontFamily="serif" fontWeight="700" letterSpacing="0.5">Osiedle Szlacheckie</text>
          <text x="370" y="326" textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.8)" fontFamily="sans-serif">ul. Szlachecka, Dawidy Bankowe</text>
        </g>

        {/* --- LABELS above central marker --- */}

        {/* Supermarket Dino - top right */}
        <g>
          <rect x="408" y="30" width="240" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="608" y="30" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="608" y="30" width="18" height="52" fill="#3E1718" />
          <text x="630" y="63" textAnchor="middle" fontSize="20" fill="white">🛒</text>
          <text x="415" y="52" textAnchor="start" fontSize="15" fill="#3E1718" fontFamily="serif" fontWeight="700">Supermarket Dino</text>
          <text x="415" y="71" textAnchor="start" fontSize="12" fill="#6E2E2A" fontFamily="sans-serif">0,6 km · 9 min. pieszo</text>
          {/* Arrow pointing down-left toward center */}
          <polygon points="510,82 524,82 517,94" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Supermarket ABC - left of center, upper */}
        <g>
          <rect x="60" y="170" width="215" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="235" y="170" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="235" y="170" width="18" height="52" fill="#3E1718" />
          <text x="255" y="203" textAnchor="middle" fontSize="20" fill="white">🛒</text>
          <text x="67" y="192" textAnchor="start" fontSize="15" fill="#3E1718" fontFamily="serif" fontWeight="700">Supermarket ABC</text>
          <text x="67" y="211" textAnchor="start" fontSize="12" fill="#6E2E2A" fontFamily="sans-serif">0,2 km · 3 min. pieszo</text>
          <polygon points="248,222 262,222 255,234" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Przystanek BUS - center */}
        <g>
          <rect x="220" y="340" width="205" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="385" y="340" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="385" y="340" width="18" height="52" fill="#3E1718" />
          <text x="405" y="373" textAnchor="middle" fontSize="20" fill="white">🚌</text>
          <text x="227" y="362" textAnchor="start" fontSize="15" fill="#3E1718" fontFamily="serif" fontWeight="700">Przystanek BUS</text>
          <text x="227" y="381" textAnchor="start" fontSize="12" fill="#6E2E2A" fontFamily="sans-serif">0,35 km · 4 min. pieszo</text>
          <polygon points="298,330 312,330 305,340" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Akademia Puzelek - left */}
        <g>
          <rect x="8" y="395" width="205" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="173" y="395" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="173" y="395" width="18" height="52" fill="#3E1718" />
          <text x="193" y="428" textAnchor="middle" fontSize="20" fill="white">🧸</text>
          <text x="15" y="417" textAnchor="start" fontSize="15" fill="#3E1718" fontFamily="serif" fontWeight="700">Akademia Puzelek</text>
          <text x="15" y="436" textAnchor="start" fontSize="12" fill="#6E2E2A" fontFamily="sans-serif">0,4 km · 5 min. pieszo</text>
          <polygon points="156,421 170,421 163,433" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Szkola Podstawowa - left center */}
        <g>
          <rect x="60" y="455" width="220" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="240" y="455" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="240" y="455" width="18" height="52" fill="#3E1718" />
          <text x="260" y="488" textAnchor="middle" fontSize="20" fill="white">🎓</text>
          <text x="67" y="477" textAnchor="start" fontSize="15" fill="#3E1718" fontFamily="serif" fontWeight="700">Szkoła Podstawowa</text>
          <text x="67" y="496" textAnchor="start" fontSize="12" fill="#6E2E2A" fontFamily="sans-serif">0,4 km · 5 min. pieszo</text>
          <polygon points="220,445 234,445 227,455" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Bajkowe przedszkole - bottom left */}
        <g>
          <rect x="30" y="540" width="230" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="220" y="540" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="220" y="540" width="18" height="52" fill="#3E1718" />
          <text x="240" y="573" textAnchor="middle" fontSize="20" fill="white">🧸</text>
          <text x="37" y="562" textAnchor="start" fontSize="15" fill="#3E1718" fontFamily="serif" fontWeight="700">Bajkowe przedszkole</text>
          <text x="37" y="581" textAnchor="start" fontSize="12" fill="#6E2E2A" fontFamily="sans-serif">0,7 km · 10 min. pieszo</text>
          <polygon points="205,530 219,530 212,540" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Kosciól - bottom center */}
        <g>
          <rect x="290" y="570" width="175" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="425" y="570" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="425" y="570" width="18" height="52" fill="#3E1718" />
          <text x="445" y="603" textAnchor="middle" fontSize="20" fill="white">⛪</text>
          <text x="297" y="592" textAnchor="start" fontSize="15" fill="#3E1718" fontFamily="serif" fontWeight="700">Kościół</text>
          <text x="297" y="611" textAnchor="start" fontSize="12" fill="#6E2E2A" fontFamily="sans-serif">0,85 km · 12 min. pieszo</text>
          <polygon points="388,560 402,560 395,570" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

      </svg>
    </div>
  )
}
