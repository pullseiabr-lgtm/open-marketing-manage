interface BarRowProps {
  label: string
  pct: number
  color: string
  value: string
}

export function BarRow({ label, pct, color, value }: BarRowProps) {
  return (
    <div className="bc-row">
      <div className="bc-lbl">{label}</div>
      <div className="bc-out">
        <div className="bc-in" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }} />
      </div>
      <div className="bc-val">{value}</div>
    </div>
  )
}

interface BarChartProps {
  rows: BarRowProps[]
}

export function BarChart({ rows }: BarChartProps) {
  return (
    <div className="bc-col">
      {rows.map((r, i) => <BarRow key={i} {...r} />)}
    </div>
  )
}
