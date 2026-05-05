interface FunnelStage {
  nome: string
  valor: number | string
  pct: number
  cor: string
}

interface FunnelChartProps {
  stages: FunnelStage[]
}

export default function FunnelChart({ stages }: FunnelChartProps) {
  return (
    <div className="fn-wrap">
      {stages.map((s, i) => (
        <div key={i}>
          <div className="fn-stage">
            <div className="fn-nm">{s.nome}</div>
            <div className="fn-bar-c">
              <div
                className="fn-bar"
                style={{ width: `${Math.max(8, s.pct)}%`, background: s.cor }}
              >
                {s.nome}
              </div>
            </div>
            <div className="fn-v">{s.valor}</div>
            <div className="fn-p">{s.pct}%</div>
          </div>
          {i < stages.length - 1 && (
            <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--bk5)', padding: '2px 0', paddingLeft: '110px' }}>↓</div>
          )}
        </div>
      ))}
    </div>
  )
}
