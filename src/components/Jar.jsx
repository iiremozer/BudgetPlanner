import { colorOf } from '../lib/colors.js';

// Kavanozu üç boyutlu göstermek için üç şey gerekiyor: camın kenarlarda
// koyulaşıp ortada açılması, sıvının üstünde bir elips (yandan bakınca ağız
// oval görünür) ve altta bir gölge.

const TOP = 30;
const BOTTOM = 116;
const RX = 34;
const RY = 8;


export default function Jar({ ratio = 0, emoji, complete = false, size = 66, id = 'jar', color }) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  const level = BOTTOM - clamped * (BOTTOM - TOP);
  const filled = clamped > 0.01;

  const uid = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
  const glassId = `glass-${uid}`;
  const liquidId = `liquid-${uid}`;
  const clipId = `clip-${uid}`;
  const shineId = `shine-${uid}`;

  const tone = color ?? colorOf(undefined);
  const liquidTop = tone.light;
  const liquidBottom = tone.dark;

  const bodyPath = `M ${50 - RX} ${TOP} L ${50 - RX} ${BOTTOM - 10} A ${RX} ${RY + 4} 0 0 0 ${
    50 + RX
  } ${BOTTOM - 10} L ${50 + RX} ${TOP} Z`;

  return (
    <div className="jar" style={{ width: size }}>
      <svg viewBox="0 0 100 136" width={size} height={size * 1.36} aria-hidden="true">
        <defs>
          <linearGradient id={glassId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#c9c4b8" stopOpacity="0.55" />
            <stop offset="0.12" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="0.78" stopColor="#b7b1a4" stopOpacity="0.28" />
            <stop offset="1" stopColor="#8f8a7e" stopOpacity="0.48" />
          </linearGradient>

          <linearGradient id={liquidId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={liquidBottom} />
            <stop offset="0.22" stopColor={liquidTop} />
            <stop offset="0.72" stopColor={liquidTop} />
            <stop offset="1" stopColor={liquidBottom} />
          </linearGradient>

          <linearGradient id={shineId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.12" />
          </linearGradient>

          <clipPath id={clipId}>
            <path d={bodyPath} />
          </clipPath>
        </defs>

        <ellipse cx="50" cy="128" rx="30" ry="5" fill="#000" opacity="0.1" />

        <path d={`M 28 16 L 28 ${TOP - 2} L 72 ${TOP - 2} L 72 16 Z`} fill="#ddd8cc" />
        <ellipse cx="50" cy="16" rx="22" ry="6" fill="#eae5da" />
        <ellipse cx="50" cy="16" rx="22" ry="6" fill="none" stroke="#cfc9bb" strokeWidth="1.2" />

        <g clipPath={`url(#${clipId})`}>
          <rect x={50 - RX} y={TOP} width={RX * 2} height={BOTTOM - TOP + 12} fill="#f4f1ea" />

          {filled ? (
            <>
              <rect
                className="jar-liquid"
                x={50 - RX}
                y={level}
                width={RX * 2}
                height={BOTTOM - level + 12}
                fill={`url(#${liquidId})`}
              />
              <ellipse className="jar-liquid" cx="50" cy={level} rx={RX} ry={RY - 1} fill={liquidTop} />
              <ellipse
                className="jar-liquid"
                cx="50"
                cy={level}
                rx={RX - 5}
                ry={RY - 3.5}
                fill="#ffffff"
                opacity="0.22"
              />
            </>
          ) : null}

          <rect x={50 - RX} y={TOP} width={RX * 2} height={BOTTOM - TOP + 12} fill={`url(#${glassId})`} />
          <rect
            x={50 - RX + 6}
            y={TOP + 10}
            width="7"
            height={BOTTOM - TOP - 30}
            rx="3.5"
            fill={`url(#${shineId})`}
          />
        </g>

        <path d={bodyPath} fill="none" stroke="#cfc9bb" strokeWidth="1.6" />
        <ellipse cx="50" cy={TOP} rx={RX} ry={RY} fill="#efece4" />
        <ellipse cx="50" cy={TOP} rx={RX} ry={RY} fill="none" stroke="#cfc9bb" strokeWidth="1.6" />
        <ellipse cx="50" cy={TOP} rx={RX - 5} ry={RY - 3} fill="#e2ddd1" />
      </svg>

      {emoji ? (
        <span className="jar-emoji" aria-hidden="true">
          {emoji}
        </span>
      ) : null}
    </div>
  );
}
