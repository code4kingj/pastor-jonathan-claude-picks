/* ── EarMark ──────────────────────────────────────────────────────────────────
   The candidate's signature motif: the unmistakable three-circle silhouette —
   one head, two ears — drawn as original geometry (no official asset, no face,
   no wordmark). Used as brand mark, rank medallion, progress meter and loader. */

export function EarMark({
  size = 28,
  color = 'currentColor',
  className,
}: {
  size?: number
  color?: string
  className?: string
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="26" cy="28" r="20" fill={color} />
      <circle cx="74" cy="28" r="20" fill={color} />
      <circle cx="50" cy="60" r="30" fill={color} />
    </svg>
  )
}

/* Rank medallion: ear silhouette + the rank number punched into the head. */
export function RankMedallion({ rank, size = 44 }: { rank: number; size?: number }) {
  return (
    <span className="ear-medallion" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 100 100" focusable="false">
        <circle cx="26" cy="26" r="19" fill="currentColor" />
        <circle cx="74" cy="26" r="19" fill="currentColor" />
        <circle cx="50" cy="58" r="32" fill="currentColor" />
        <text
          x="50"
          y="60"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--glove)"
          fontFamily="var(--display)"
          fontWeight="800"
          fontSize={rank >= 10 ? 30 : 36}
        >
          {rank}
        </text>
      </svg>
    </span>
  )
}

/* Progress medallion: the head fills like a rising tide as the Top 33 grows. */
export function ProgressEars({
  value,
  max,
  size = 92,
}: {
  value: number
  max: number
  size?: number
}) {
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max))
  const fillY = 90 - pct * 62 /* head spans roughly y=28..90 in the viewBox */
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${value} of ${max} picked`}>
      <defs>
        <clipPath id="ears-clip">
          <circle cx="26" cy="28" r="20" />
          <circle cx="74" cy="28" r="20" />
          <circle cx="50" cy="60" r="30" />
        </clipPath>
      </defs>
      <g clipPath="url(#ears-clip)">
        <rect x="0" y="0" width="100" height="100" fill="rgba(255,255,255,0.16)" />
        <rect x="0" y={fillY} width="100" height="100" fill="var(--gold)" style={{ transition: 'y 600ms var(--ease-out)' }} />
      </g>
      <circle cx="26" cy="28" r="20" fill="none" stroke="var(--glove)" strokeWidth="3" />
      <circle cx="74" cy="28" r="20" fill="none" stroke="var(--glove)" strokeWidth="3" />
      <circle cx="50" cy="60" r="30" fill="none" stroke="var(--glove)" strokeWidth="3" />
    </svg>
  )
}
