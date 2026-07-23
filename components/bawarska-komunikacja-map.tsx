export function BawarskaKomunikacjaMap() {
  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-xl border border-border/30">
      <svg
        viewBox="0 0 700 620"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        style={{ backgroundColor: "#F5F3EF" }}
      >
        {/* Map background grid lines - streets */}
        <g stroke="#D6D0C8" strokeWidth="6" opacity="0.5">
          <line x1="0" y1="140" x2="700" y2="140" />
          <line x1="0" y1="320" x2="700" y2="320" />
          <line x1="0" y1="490" x2="700" y2="490" />
          <line x1="160" y1="0" x2="160" y2="620" />
          <line x1="380" y1="0" x2="380" y2="620" />
          <line x1="570" y1="0" x2="570" y2="620" />
        </g>

        {/* Wschodnia Obwodnica - diagonal road */}
        <line x1="300" y1="0" x2="460" y2="620" stroke="#C8C2B8" strokeWidth="11" opacity="0.5" />
        <line x1="320" y1="0" x2="480" y2="620" stroke="#E8E4DC" strokeWidth="6" opacity="0.6" />

        {/* Wrocławska road - horizontal major */}
        <line x1="0" y1="370" x2="700" y2="370" stroke="#C8C2B8" strokeWidth="9" opacity="0.45" />
        <line x1="0" y1="370" x2="700" y2="370" stroke="#E8E4DC" strokeWidth="4" opacity="0.5" />

        {/* River Odra area - bottom left */}
        <ellipse cx="100" cy="510" rx="90" ry="28" fill="#B8D4E0" opacity="0.55" />
        <ellipse cx="60" cy="530" rx="60" ry="18" fill="#B8D4E0" opacity="0.4" />

        {/* Las Strachociński - green area left */}
        <ellipse cx="110" cy="310" rx="75" ry="55" fill="#C2D9C0" opacity="0.55" />
        <ellipse cx="95" cy="300" rx="50" ry="40" fill="#AECBA8" opacity="0.4" />

        {/* Distance circles - dotted, center is bottom-right area (Dobrzykowice) */}
        {/* 1 km */}
        <circle
          cx="530" cy="370"
          r="95"
          fill="none"
          stroke="#6E2E2A"
          strokeWidth="2.5"
          strokeDasharray="6 5"
          opacity="0.75"
        />
        {/* 2 km */}
        <circle
          cx="530" cy="370"
          r="200"
          fill="none"
          stroke="#6E2E2A"
          strokeWidth="2.5"
          strokeDasharray="6 5"
          opacity="0.65"
        />
        {/* 3 km */}
        <circle
          cx="530" cy="370"
          r="320"
          fill="none"
          stroke="#6E2E2A"
          strokeWidth="2.5"
          strokeDasharray="6 5"
          opacity="0.45"
        />

        {/* Distance circle labels - sitting on the circle lines */}
        {/* 1 km: right side of 1 km circle, center cx=530 + r=95 → x≈601 */}
        <g>
          <rect x="578" y="357" width="48" height="26" rx="13" fill="white" stroke="#6E2E2A" strokeWidth="1.5" />
          <text x="602" y="375" textAnchor="middle" fontSize="12" fill="#6E2E2A" fontFamily="serif" fontWeight="700">1 km</text>
        </g>
        {/* 2 km: left side of 2 km circle, cx=530 - r=200 → x≈306 */}
        <g>
          <rect x="306" y="357" width="48" height="26" rx="13" fill="white" stroke="#6E2E2A" strokeWidth="1.5" />
          <text x="330" y="375" textAnchor="middle" fontSize="12" fill="#6E2E2A" fontFamily="serif" fontWeight="700">2 km</text>
        </g>
        {/* 3 km: left side of 3 km circle, cx=530 - r=320 → x≈186 */}
        <g>
          <rect x="186" y="357" width="48" height="26" rx="13" fill="white" stroke="#6E2E2A" strokeWidth="1.5" />
          <text x="210" y="375" textAnchor="middle" fontSize="12" fill="#6E2E2A" fontFamily="serif" fontWeight="700">3 km</text>
        </g>

        {/* Central marker - Bawarska Przestrzeń */}
        <g>
          <circle cx="530" cy="370" r="20" fill="rgba(110,46,42,0.12)" />
          <circle cx="530" cy="370" r="8" fill="#6E2E2A" />
          <circle cx="530" cy="370" r="3.5" fill="white" />
          {/* Label - to the right / below center */}
          <rect x="398" y="378" width="262" height="56" rx="12" fill="#3E1718" />
          <rect x="398" y="378" width="262" height="7" rx="12" fill="#6E2E2A" />
          <polygon points="530,361 516,378 544,378" fill="#3E1718" />
          <text x="529" y="411" textAnchor="middle" fontSize="18" fill="white" fontFamily="serif" fontWeight="700" letterSpacing="0.5">Bawarska Przestrzeń</text>
          <text x="529" y="428" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.75)" fontFamily="sans-serif">ul. Jarzębinowa, Dobrzykowice</text>
        </g>

        {/* Wschodnia Obwodnica - top center-left, 4 min samochodem */}
        <g>
          <rect x="210" y="28" width="258" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="428" y="28" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="428" y="28" width="18" height="52" fill="#3E1718" />
          {/* car icon */}
          <g transform="translate(435,39)" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
            <rect x="1" y="8" width="22" height="12" rx="3" />
            <path d="M5 8 L8 2 L16 2 L19 8" />
            <circle cx="6" cy="21" r="2.5" fill="white" stroke="none" />
            <circle cx="18" cy="21" r="2.5" fill="white" stroke="none" />
            <line x1="0" y1="14" x2="24" y2="14" />
          </g>
          <text x="217" y="50" textAnchor="start" fontSize="14" fill="#3E1718" fontFamily="serif" fontWeight="700">Wschodnia Obwodnica</text>
          <text x="217" y="68" textAnchor="start" fontSize="11" fill="#6E2E2A" fontFamily="sans-serif">4 min samochodem</text>
          <polygon points="355,80 369,80 362,90" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Boisko - top right, 5 min rowerem */}
        <g>
          <rect x="480" y="28" width="210" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="650" y="28" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="650" y="28" width="18" height="52" fill="#3E1718" />
          {/* football / soccer ball icon */}
          <g transform="translate(657,36)" fill="none" stroke="white" strokeWidth="1.8">
            <circle cx="13" cy="13" r="11" />
            <polygon points="13,5 17,9 15,14 11,14 9,9" fill="white" stroke="#3E1718" strokeWidth="0.5" />
            <line x1="13" y1="5" x2="13" y2="2" />
            <line x1="17" y1="9" x2="22" y2="7" />
            <line x1="15" y1="14" x2="19" y2="18" />
            <line x1="11" y1="14" x2="7" y2="18" />
            <line x1="9" y1="9" x2="4" y2="7" />
          </g>
          <text x="487" y="50" textAnchor="start" fontSize="14" fill="#3E1718" fontFamily="serif" fontWeight="700">Boisko</text>
          <text x="487" y="68" textAnchor="start" fontSize="11" fill="#6E2E2A" fontFamily="sans-serif">5 min rowerem</text>
          <polygon points="565,80 579,80 572,90" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Las Strachociński - left center, 18 min rowerem */}
        <g>
          <rect x="6" y="270" width="248" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="214" y="270" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="214" y="270" width="18" height="52" fill="#3E1718" />
          {/* tree / forest icon */}
          <g transform="translate(221,278)" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
            <polygon points="12,2 22,18 2,18" fill="white" opacity="0.9" stroke="#3E1718" strokeWidth="0.5" />
            <polygon points="12,8 20,22 4,22" fill="white" opacity="0.85" stroke="#3E1718" strokeWidth="0.5" />
            <line x1="12" y1="22" x2="12" y2="28" stroke="white" />
          </g>
          <text x="13" y="292" textAnchor="start" fontSize="14" fill="#3E1718" fontFamily="serif" fontWeight="700">Las Strachociński</text>
          <text x="13" y="310" textAnchor="start" fontSize="11" fill="#6E2E2A" fontFamily="sans-serif">18 min rowerem</text>
          <polygon points="200,260 214,260 207,270" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Park handlowy - bottom center-left, 6 min samochodem */}
        <g>
          <rect x="100" y="450" width="248" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="308" y="450" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="308" y="450" width="18" height="52" fill="#3E1718" />
          {/* shopping bags icon */}
          <g transform="translate(315,458)" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
            <rect x="2" y="8" width="12" height="14" rx="2" />
            <path d="M5 8 Q5 4 8 4 Q11 4 11 8" />
            <rect x="14" y="10" width="10" height="12" rx="2" />
            <path d="M16 10 Q16 7 19 7 Q22 7 22 10" />
          </g>
          <text x="107" y="472" textAnchor="start" fontSize="14" fill="#3E1718" fontFamily="serif" fontWeight="700">Park handlowy</text>
          <text x="107" y="490" textAnchor="start" fontSize="11" fill="#6E2E2A" fontFamily="sans-serif">6 min samochodem</text>
          <polygon points="250,440 264,440 257,450" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

        {/* Odra - bottom left, 15 min rowerem */}
        <g>
          <rect x="6" y="548" width="220" height="52" rx="10" fill="white" stroke="#6E2E2A" strokeWidth="1" />
          <rect x="186" y="548" width="40" height="52" rx="10" fill="#3E1718" />
          <rect x="186" y="548" width="18" height="52" fill="#3E1718" />
          {/* water / waves icon */}
          <g transform="translate(193,560)" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M0 8 Q5 4 10 8 Q15 12 20 8" />
            <path d="M0 16 Q5 12 10 16 Q15 20 20 16" />
            <path d="M3 2 Q6 0 9 2" />
          </g>
          <text x="13" y="570" textAnchor="start" fontSize="14" fill="#3E1718" fontFamily="serif" fontWeight="700">Odra</text>
          <text x="13" y="588" textAnchor="start" fontSize="11" fill="#6E2E2A" fontFamily="sans-serif">15 min rowerem</text>
          <polygon points="130,538 144,538 137,548" fill="white" stroke="#6E2E2A" strokeWidth="1" />
        </g>

      </svg>
    </div>
  )
}
