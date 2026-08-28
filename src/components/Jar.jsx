const BODY = 'M14 30 h72 a10 10 0 0 1 10 10 v66 a12 12 0 0 1 -12 12 h-68 a12 12 0 0 1 -12 -12 v-66 a10 10 0 0 1 10 -10 z';

export default function Jar({ ratio = 0, emoji, complete = false, size = 66 }) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  const top = 30;
  const bottom = 118;
  const level = bottom - clamped * (bottom - top);
  const clipId = `jar-clip-${Math.round(clamped * 1000)}-${emoji ?? 'x'}`;

  return (
    <div className="jar" style={{ width: size }}>
      <svg viewBox="0 0 100 128" width={size} height={size * 1.28} aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <path d={BODY} />
          </clipPath>
        </defs>

        <rect x="26" y="14" width="48" height="18" rx="6" fill="#e2ded4" />
        <path d={BODY} fill="#f1eee8" />

        <g clipPath={`url(#${clipId})`}>
          <rect
            x="0"
            y={level}
            width="100"
            height={bottom - level + 4}
            fill={complete ? '#2f8f6f' : '#e0a42e'}
          />
          {clamped > 0 && clamped < 1 ? (
            <ellipse cx="50" cy={level} rx="46" ry="4" fill={complete ? '#3ba37f' : '#eeb64a'} />
          ) : null}
        </g>

        <path d={BODY} fill="none" stroke="#ded9cf" strokeWidth="2.5" />
      </svg>

      {emoji ? (
        <span className="jar-emoji" aria-hidden="true">
          {emoji}
        </span>
      ) : null}
    </div>
  );
}
