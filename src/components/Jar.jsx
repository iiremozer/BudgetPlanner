import { colorOf } from '../lib/colors.js';

// Kavanozun gerçekçi görünmesi omuz eğrisinden geliyor: boyun dar başlar,
// aşağı doğru genişleyip gövdeye açılır. Üstüne cam için yumuşak bir
// parlama, sıvı için üstte açık altta koyu bir geçiş ve zeminde bulanık
// bir gölge biniyor.

const BODY = `M 34 24
  L 34 31
  C 34 37.5, 16 41, 16 53
  L 16 105
  Q 16 118, 29 118
  L 71 118
  Q 84 118, 84 105
  L 84 53
  C 84 41, 66 37.5, 66 31
  L 66 24 Z`;

const TOP = 24;
const BOTTOM = 118;

export default function Jar({ ratio = 0, emoji, complete = false, size = 68, id = 'jar', color }) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  const level = BOTTOM - clamped * (BOTTOM - TOP - 6);
  const filled = clamped > 0.005;

  const uid = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
  const tone = color ?? colorOf(undefined);

  const clipId = `c-${uid}`;
  const glassId = `g-${uid}`;
  const liquidId = `l-${uid}`;
  const lidId = `d-${uid}`;
  const softId = `s-${uid}`;
  const shadowId = `w-${uid}`;

  return (
    <div className="jar" style={{ width: size }}>
      <svg viewBox="0 0 100 134" width={size} height={size * 1.34} aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <path d={BODY} />
          </clipPath>

          <linearGradient id={liquidId} x1="0" y1="0" x2="1" y2="0.3">
            <stop offset="0" stopColor={tone.dark} />
            <stop offset="0.18" stopColor={tone.base} />
            <stop offset="0.45" stopColor={tone.light} />
            <stop offset="0.78" stopColor={tone.base} />
            <stop offset="1" stopColor={tone.dark} />
          </linearGradient>

          <linearGradient id={glassId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#6f6a5e" stopOpacity="0.28" />
            <stop offset="0.07" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="0.3" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="0.68" stopColor="#ffffff" stopOpacity="0.04" />
            <stop offset="0.88" stopColor="#6f6a5e" stopOpacity="0.16" />
            <stop offset="1" stopColor="#4a463d" stopOpacity="0.32" />
          </linearGradient>

          <linearGradient id={lidId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#b9b3a5" />
            <stop offset="0.16" stopColor="#f2efe7" />
            <stop offset="0.45" stopColor="#d8d3c6" />
            <stop offset="0.75" stopColor="#efece3" />
            <stop offset="1" stopColor="#a9a294" />
          </linearGradient>

          <filter id={softId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>

          <filter id={shadowId} x="-40%" y="-60%" width="180%" height="240%">
            <feGaussianBlur stdDeviation="3.6" />
          </filter>
        </defs>

        {/* zemin gölgesi */}
        <ellipse cx="50" cy="124" rx="29" ry="5.5" fill="#3a352c" opacity="0.22" filter={`url(#${shadowId})`} />

        {/* kapak */}
        <rect x="30" y="7" width="40" height="13" rx="3.5" fill={`url(#${lidId})`} />
        <rect x="30" y="7" width="40" height="13" rx="3.5" fill="none" stroke="#9c9587" strokeWidth="0.9" opacity="0.7" />
        <path d="M36 9.5v8M43 9.5v8M50 9.5v8M57 9.5v8M64 9.5v8" stroke="#9c9587" strokeWidth="0.7" opacity="0.35" />
        <rect x="33" y="19.5" width="34" height="5" rx="1.6" fill="#cdc7b9" />

        <g clipPath={`url(#${clipId})`}>
          {/* cam gövde */}
          <path d={BODY} fill="#f7f5f0" />

          {filled ? (
            <>
              <rect
                className="jar-liquid"
                x="10"
                y={level}
                width="80"
                height={BOTTOM - level + 8}
                fill={`url(#${liquidId})`}
              />
              {/* sıvının yüzeyi: yandan bakınca oval görünür */}
              <ellipse className="jar-liquid" cx="50" cy={level} rx="35" ry="5.5" fill={tone.light} />
              <ellipse
                className="jar-liquid"
                cx="50"
                cy={level}
                rx="27"
                ry="3.4"
                fill="#ffffff"
                opacity="0.3"
              />
              {/* dipteki ışık toplanması */}
              <ellipse cx="50" cy="112" rx="26" ry="7" fill="#ffffff" opacity="0.12" filter={`url(#${softId})`} />
            </>
          ) : null}

          {/* cam üstü gölgelendirme */}
          <path d={BODY} fill={`url(#${glassId})`} />

          {/* parlamalar */}
          <ellipse cx="30" cy="52" rx="7" ry="19" fill="#ffffff" opacity="0.5" filter={`url(#${softId})`} />
          <ellipse cx="70" cy="92" rx="3.6" ry="12" fill="#ffffff" opacity="0.22" filter={`url(#${softId})`} />
          <rect x="25.5" y="40" width="4.6" height="46" rx="2.3" fill="#ffffff" opacity="0.55" />
        </g>

        {/* kenar çizgisi */}
        <path d={BODY} fill="none" stroke="#b6b0a2" strokeWidth="1.3" opacity="0.85" />
      </svg>

      {emoji ? (
        <span className="jar-emoji" aria-hidden="true">
          {emoji}
        </span>
      ) : null}
    </div>
  );
}
