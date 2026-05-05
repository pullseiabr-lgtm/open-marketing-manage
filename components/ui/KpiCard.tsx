interface KpiCardProps {
  cor: string
  icon: string
  label: string
  value: string | number
  sub: string
}

export default function KpiCard({ cor, icon, label, value, sub }: KpiCardProps) {
  return (
    <div className="kpi" style={{ borderTop: `2px solid ${cor}` }}>
      <div className="kpi-i" style={{ background: `${cor}18` }}>
        <svg viewBox="0 0 24 24" style={{ stroke: cor }} dangerouslySetInnerHTML={{ __html: icon }} />
      </div>
      <div className="kpi-l">{label}</div>
      <div className="kpi-v">{value}</div>
      <div className="kpi-s" dangerouslySetInnerHTML={{ __html: sub }} />
    </div>
  )
}
