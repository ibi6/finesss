interface WeightSparklineProps {
  points: { date: string; weight: number }[]
  ariaLabel: string
  emptyMessage: string
  gradientId: string
  className?: string
}

export function WeightSparkline({
  points,
  ariaLabel,
  emptyMessage,
  gradientId,
  className,
}: WeightSparklineProps) {
  if (points.length === 0) {
    return <div className="chart-empty">{emptyMessage}</div>
  }

  const width = 360
  const height = 160
  const values = points.map((point) => point.weight)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = points.length > 1 ? width / (points.length - 1) : width

  const polyline = points
    .map((point, index) => {
      const x = index * stepX
      const y = height - ((point.weight - min) / range) * (height - 30) - 15
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      aria-label={ariaLabel}
      className={`chart-frame${className ? ` ${className}` : ''}`}
      height={height}
      role="img"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ff8d4d" />
          <stop offset="100%" stopColor="#4bd8cb" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        points={polyline}
        stroke={`url(#${gradientId})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      {points.map((point, index) => {
        const x = index * stepX
        const y = height - ((point.weight - min) / range) * (height - 30) - 15

        return <circle cx={x} cy={y} fill="#fff8f0" key={point.date} r="5" />
      })}
    </svg>
  )
}
