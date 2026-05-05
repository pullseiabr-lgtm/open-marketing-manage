import { createClient } from '@/lib/supabase/server'
import KpiCard from '@/components/ui/KpiCard'
import { BarChart } from '@/components/ui/BarChart'
import FunnelChart from '@/components/ui/FunnelChart'
import { moneyK, pct, cpl, roiStr, ctr, platColor } from '@/lib/utils'

export default async function ExecPage() {
  const supabase = await createClient()

  const [{ data: midias }, { data: leads }, { data: campanhas }] = await Promise.all([
    supabase.from('investimentos_midia').select('*'),
    supabase.from('leads').select('etapa,valor_potencial,temperatura'),
    supabase.from('campanhas').select('impressoes,cliques,leads,vendas,budget,receita,plataforma'),
  ])

  const m = midias ?? []
  const totInv    = m.reduce((s, x) => s + (x.valor ?? 0), 0)
  const totLeads  = m.reduce((s, x) => s + (x.leads ?? 0), 0)
  const totVendas = m.reduce((s, x) => s + (x.vendas ?? 0), 0)
  const totRec    = m.reduce((s, x) => s + (x.receita ?? 0), 0)
  const totImp    = m.reduce((s, x) => s + (x.impressoes ?? 0), 0)
  const totCliques= m.reduce((s, x) => s + (x.cliques ?? 0), 0)

  const kpis = [
    { cor: 'var(--or)', icon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>', label: 'Investimento Total', value: moneyK(totInv), sub: '<span class="wn">Budget mensal</span>' },
    { cor: 'var(--ok)', icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>', label: 'Receita Gerada', value: moneyK(totRec), sub: `<span class="up">ROI: ${roiStr(totRec, totInv)}</span>` },
    { cor: 'var(--cy)', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>', label: 'Leads Gerados', value: totLeads, sub: `<span class="up">CPL: ${cpl(totInv, totLeads)}</span>` },
    { cor: 'var(--ok)', icon: '<polyline points="20 6 9 17 4 12"/>', label: 'Conversões', value: totVendas, sub: `<span class="up">${pct(totVendas, totLeads)} conv. leads</span>` },
    { cor: 'var(--bl)', icon: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>', label: 'Impressões', value: totImp >= 1000 ? `${(totImp / 1000).toFixed(1)}K` : totImp, sub: `CTR geral: ${ctr(totCliques, totImp)}` },
    { cor: 'var(--wr)', icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', label: 'CAC', value: cpl(totInv, totVendas), sub: 'Custo por aquisição' },
    { cor: 'var(--pu)', icon: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>', label: 'Ticket Médio', value: totVendas ? moneyK(totRec / totVendas) : '—', sub: '<span class="up">+12% vs baseline</span>' },
    { cor: 'var(--or)', icon: '<circle cx="12" cy="12" r="10"/>', label: 'NPS Satisfação', value: '8,4', sub: '<span class="up">▲ Meta >8,0 ✓</span>' },
  ]

  // Crescimento bars
  const crescRows = [
    { label: 'Impressões', pct: 82, color: 'var(--or)', value: `${totImp >= 1000 ? (totImp / 1000).toFixed(1) + 'K' : totImp}` },
    { label: 'Leads', pct: 94, color: 'var(--ok)', value: String(totLeads) },
    { label: 'Conversões', pct: 78, color: 'var(--cy)', value: String(totVendas) },
    { label: 'Receita', pct: 88, color: 'var(--pu)', value: moneyK(totRec) },
    { label: 'Seguidores IG', pct: 100, color: '#E1306C', value: '+782' },
  ]

  // Funil executivo
  const funnelStages = [
    { nome: 'Alcance',     valor: totImp >= 1000 ? `${(totImp / 1000).toFixed(1)}K` : totImp, pct: 100, cor: 'var(--or)' },
    { nome: 'Engajamento', valor: totCliques >= 1000 ? `${(totCliques / 1000).toFixed(1)}K` : totCliques, pct: totImp ? Math.round((totCliques / totImp) * 100) : 0, cor: '#CC5500' },
    { nome: 'Leads',       valor: totLeads, pct: totImp ? parseFloat(((totLeads / totImp) * 100).toFixed(1)) : 0, cor: '#8B3A00' },
    { nome: 'Conversões',  valor: totVendas, pct: totImp ? parseFloat(((totVendas / totImp) * 100).toFixed(2)) : 0, cor: 'var(--ok)' },
  ]

  // Budget por canal (baseado em midias)
  const platGroups: Record<string, number> = {}
  m.forEach(x => {
    const k = x.plataforma?.split(' ')[0] ?? 'Outros'
    platGroups[k] = (platGroups[k] ?? 0) + (x.valor ?? 0)
  })
  const maxBudget = Math.max(...Object.values(platGroups), 1)
  const budgetRows = Object.entries(platGroups).map(([k, v]) => ({
    label: k, pct: Math.round((v / maxBudget) * 100), color: platColor(k), value: moneyK(v),
  }))

  // ROI por canal (campanhas)
  const camp = campanhas ?? []
  const roiByPlat: Record<string, { rec: number; budg: number }> = {}
  camp.forEach(c => {
    const k = c.plataforma?.split(' ')[0] ?? 'Outros'
    if (!roiByPlat[k]) roiByPlat[k] = { rec: 0, budg: 0 }
    roiByPlat[k].rec  += c.receita ?? 0
    roiByPlat[k].budg += c.budget  ?? 0
  })
  const roiRows = Object.entries(roiByPlat)
    .map(([k, v]) => ({ label: k, roi: v.budg ? v.rec / v.budg : 0, color: platColor(k) }))
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 5)
    .map(r => ({ label: r.label, pct: Math.round((r.roi / 8) * 100), color: r.color, value: `${r.roi.toFixed(1)}x` }))

  const bestRoi = roiRows[0]

  return (
    <div>
      <div className="kpi-grid">
        {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      <div className="g11">
        <div className="card">
          <div className="card-hd">
            <div className="card-tt">
              <svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
              Crescimento vs Período
            </div>
            <span className="tag t-or">Mês atual</span>
          </div>
          <div className="card-bd">
            <BarChart rows={crescRows} />
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <div className="card-tt">
              <svg viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Funil Resumido
            </div>
          </div>
          <div className="card-bd">
            <FunnelChart stages={funnelStages} />
          </div>
        </div>
      </div>

      <div className="g11">
        <div className="card">
          <div className="card-hd">
            <div className="card-tt">
              <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Distribuição de Investimento
            </div>
          </div>
          <div className="card-bd">
            {budgetRows.length > 0
              ? <BarChart rows={budgetRows} />
              : <p style={{ color: 'var(--gr3)', fontSize: '12px' }}>Nenhum investimento registrado.</p>
            }
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <div className="card-tt">
              <svg viewBox="0 0 24 24"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
              Canal com Maior ROI
            </div>
          </div>
          <div className="card-bd">
            <div style={{ textAlign: 'center', padding: '6px 0 10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--gr3)', marginBottom: '6px' }}>Melhor canal este período</div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--or)', fontFamily: 'var(--mono)' }}>
                {bestRoi?.label ?? 'WhatsApp'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ok)', fontWeight: 700, marginTop: '4px' }}>
                ROI: {bestRoi?.value ?? '—'}
              </div>
            </div>
            <div className="dv" />
            {roiRows.length > 0 && <BarChart rows={roiRows} />}
          </div>
        </div>
      </div>

      {/* Pipeline resumo */}
      {leads && leads.length > 0 && (
        <div className="card">
          <div className="card-hd">
            <div className="card-tt">
              <svg viewBox="0 0 24 24"><rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="8" width="6" height="13" rx="1"/><rect x="16" y="6" width="6" height="15" rx="1"/></svg>
              Pipeline Comercial — Resumo
            </div>
          </div>
          <div className="card-bd">
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {['Lead Gerado','Contato Realizado','Proposta Enviada','Negociação','Fechado'].map(etapa => {
                const count = leads.filter(l => l.etapa === etapa).length
                const valor = leads.filter(l => l.etapa === etapa).reduce((s, l) => s + (l.valor_potencial ?? 0), 0)
                const colors: Record<string, string> = {
                  'Lead Gerado': 'var(--bl)', 'Contato Realizado': 'var(--cy)',
                  'Proposta Enviada': 'var(--wr)', 'Negociação': 'var(--or)', 'Fechado': 'var(--ok)',
                }
                return (
                  <div key={etapa} style={{ flex: 1, minWidth: '120px', background: 'var(--bk3)', borderRadius: 'var(--r)', padding: '10px 12px', borderTop: `2px solid ${colors[etapa]}` }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--gr3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '4px' }}>{etapa}</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--wh)', fontFamily: 'var(--mono)' }}>{count}</div>
                    <div style={{ fontSize: '10px', color: 'var(--gr3)' }}>{moneyK(valor)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
