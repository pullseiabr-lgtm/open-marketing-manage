'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import KpiCard from '@/components/ui/KpiCard'
import { BarChart } from '@/components/ui/BarChart'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { showToast } from '@/components/ui/Toast'
import { confirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate, platColor } from '@/lib/utils'
import type { MetricaSocial, MetricaSocialInput } from '@/types'

const PLATAFORMAS = ['Instagram','YouTube','LinkedIn','TikTok','Facebook','Twitter/X']

const BLANK: MetricaSocialInput = {
  plataforma: 'Instagram',
  periodo: new Date().toISOString().slice(0, 7),
  seguidores_total: 0, seguidores_novos: 0, seguidores_perdidos: 0,
  alcance_seguidores: 0, alcance_nao_seguidores: 0, impressoes: 0,
  curtidas: 0, comentarios: 0, compartilhamentos: 0, saves: 0,
  cliques_link: 0, cliques_perfil: 0,
  campanhas_ativas: 0, campanhas_total: 0,
  visitas_perfil: 0, stories_visualizacoes: 0, observacoes: '',
}

function ScoreRing({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  const dash = (pct / 100) * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div className="score-ring">
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r={r} fill="none" stroke="var(--bk4)" strokeWidth="6" />
          <circle
            cx="45" cy="45" r={r} fill="none"
            stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '45px 45px', transition: '1s' }}
          />
        </svg>
        <div className="score-txt" style={{ fontSize: '14px' }}>
          {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}
          <span className="score-lbl">{pct.toFixed(0)}%</span>
        </div>
      </div>
      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--gr3)', textTransform: 'uppercase', letterSpacing: '.08em', textAlign: 'center' }}>{label}</div>
    </div>
  )
}

function MiniSpark({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const w = 80, h = 32
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`)
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline
        points={pts.join(' ')}
        fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  )
}

export default function MetricasPage() {
  const supabase = createClient()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<MetricaSocialInput>(BLANK)
  const [editId, setEditId] = useState<string | null>(null)
  const [filtPlat, setFiltPlat] = useState('Instagram')

  const { data: metricas = [], isLoading } = useQuery({
    queryKey: ['metricas_sociais'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metricas_sociais').select('*').order('periodo', { ascending: false })
      if (error) throw error
      return data as MetricaSocial[]
    },
  })

  const save = useMutation({
    mutationFn: async (p: MetricaSocialInput & { id?: string }) => {
      const { id, ...rest } = p
      if (id) {
        const { error } = await supabase.from('metricas_sociais').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('metricas_sociais').insert(rest)
        if (error) throw error
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['metricas_sociais'] }); showToast('Métrica salva!'); setModal(false) },
    onError: (e: Error) => showToast(e.message?.includes('unique') ? 'Já existe um registro para esta plataforma/período.' : 'Erro ao salvar.', 'er'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('metricas_sociais').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['metricas_sociais'] }); showToast('Excluído!') },
    onError: () => showToast('Erro ao excluir.', 'er'),
  })

  function openNew() { setForm({ ...BLANK, plataforma: filtPlat }); setEditId(null); setModal(true) }
  function openEdit(m: MetricaSocial) {
    setForm({
      plataforma: m.plataforma, periodo: m.periodo,
      seguidores_total: m.seguidores_total, seguidores_novos: m.seguidores_novos, seguidores_perdidos: m.seguidores_perdidos,
      alcance_seguidores: m.alcance_seguidores, alcance_nao_seguidores: m.alcance_nao_seguidores, impressoes: m.impressoes,
      curtidas: m.curtidas, comentarios: m.comentarios, compartilhamentos: m.compartilhamentos, saves: m.saves,
      cliques_link: m.cliques_link, cliques_perfil: m.cliques_perfil,
      campanhas_ativas: m.campanhas_ativas, campanhas_total: m.campanhas_total,
      visitas_perfil: m.visitas_perfil, stories_visualizacoes: m.stories_visualizacoes, observacoes: m.observacoes ?? '',
    })
    setEditId(m.id); setModal(true)
  }
  function set(k: keyof MetricaSocialInput, v: string | number) { setForm(f => ({ ...f, [k]: v })) }
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); save.mutate(editId ? { ...form, id: editId } : form) }

  // Dados filtrados por plataforma selecionada (ordenados por periodo)
  const platData = metricas
    .filter(m => m.plataforma === filtPlat)
    .sort((a, b) => a.periodo.localeCompare(b.periodo))

  const latest = platData[platData.length - 1]
  const prev   = platData[platData.length - 2]

  function delta(curr?: number, ant?: number) {
    if (!curr || !ant || ant === 0) return ''
    const d = ((curr - ant) / ant) * 100
    return d >= 0 ? `<span class="up">▲ ${d.toFixed(1)}%</span>` : `<span class="dn">▼ ${Math.abs(d).toFixed(1)}%</span>`
  }

  const engajTotal = latest ? latest.curtidas + latest.comentarios + latest.compartilhamentos + latest.saves : 0
  const alcanceTotal = latest ? latest.alcance_seguidores + latest.alcance_nao_seguidores : 0
  const engajPct = alcanceTotal > 0 ? ((engajTotal / alcanceTotal) * 100).toFixed(2) : '0'

  // KPIs do período mais recente
  const kpis = latest ? [
    { cor: 'var(--or)', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5"/><circle cx="9" cy="7" r="4"/>', label: 'Seguidores Total', value: latest.seguidores_total >= 1000 ? `${(latest.seguidores_total/1000).toFixed(1)}K` : latest.seguidores_total, sub: `Novos: ${latest.seguidores_novos > 0 ? '+' : ''}${latest.seguidores_novos} ${delta(latest.seguidores_novos, prev?.seguidores_novos)}` },
    { cor: 'var(--cy)', icon: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>', label: 'Cliques no Link', value: latest.cliques_link, sub: `Perfil: ${latest.cliques_perfil} ${delta(latest.cliques_link, prev?.cliques_link)}` },
    { cor: 'var(--ok)', icon: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>', label: 'Engajamento', value: `${engajPct}%`, sub: `${engajTotal} interações ${delta(engajTotal, prev ? prev.curtidas + prev.comentarios + prev.compartilhamentos + prev.saves : undefined)}` },
    { cor: 'var(--pu)', icon: '<rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="8" width="6" height="13" rx="1"/><rect x="16" y="6" width="6" height="15" rx="1"/>', label: 'Campanhas', value: latest.campanhas_ativas, sub: `${latest.campanhas_total} total ${delta(latest.campanhas_ativas, prev?.campanhas_ativas)}` },
    { cor: 'var(--bl)', icon: '<circle cx="12" cy="12" r="10"/>', label: 'Impressões', value: latest.impressoes >= 1000 ? `${(latest.impressoes/1000).toFixed(1)}K` : latest.impressoes, sub: `Visitas perfil: ${latest.visitas_perfil} ${delta(latest.impressoes, prev?.impressoes)}` },
    { cor: '#E1306C', icon: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>', label: 'Alcance Total', value: alcanceTotal >= 1000 ? `${(alcanceTotal/1000).toFixed(1)}K` : alcanceTotal, sub: `Seg: ${latest.alcance_seguidores} · Não-seg: ${latest.alcance_nao_seguidores}` },
  ] : []

  // Barras de alcance: seguidores vs não seguidores
  const alcanceRows = latest ? [
    { label: 'Seguidores', pct: alcanceTotal ? Math.round((latest.alcance_seguidores / alcanceTotal) * 100) : 0, color: platColor(filtPlat), value: `${alcanceTotal ? Math.round((latest.alcance_seguidores / alcanceTotal) * 100) : 0}%` },
    { label: 'Não-seguidores', pct: alcanceTotal ? Math.round((latest.alcance_nao_seguidores / alcanceTotal) * 100) : 0, color: 'var(--gr2)', value: `${alcanceTotal ? Math.round((latest.alcance_nao_seguidores / alcanceTotal) * 100) : 0}%` },
  ] : []

  // Engajamento breakdown
  const engajRows = latest ? [
    { label: 'Curtidas', pct: engajTotal ? Math.round((latest.curtidas / engajTotal) * 100) : 0, color: '#E1306C', value: String(latest.curtidas) },
    { label: 'Comentários', pct: engajTotal ? Math.round((latest.comentarios / engajTotal) * 100) : 0, color: 'var(--bl)', value: String(latest.comentarios) },
    { label: 'Compartilhamentos', pct: engajTotal ? Math.round((latest.compartilhamentos / engajTotal) * 100) : 0, color: 'var(--ok)', value: String(latest.compartilhamentos) },
    { label: 'Saves', pct: engajTotal ? Math.round((latest.saves / engajTotal) * 100) : 0, color: 'var(--wr)', value: String(latest.saves) },
  ] : []

  // Sparks (histórico por período)
  const seguidoresHist = platData.map(m => m.seguidores_total)
  const engajHist      = platData.map(m => m.curtidas + m.comentarios + m.compartilhamentos + m.saves)
  const alcanceHist    = platData.map(m => m.alcance_seguidores + m.alcance_nao_seguidores)
  const cliquesHist    = platData.map(m => m.cliques_link + m.cliques_perfil)

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-tt">Métricas de Dados — Redes Sociais</div>
        <button className="btn p sm" onClick={openNew}>+ Registrar Dados</button>
      </div>

      {/* Seletor de plataforma */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {PLATAFORMAS.map(p => (
          <button
            key={p}
            className={`btn sm${filtPlat === p ? ' p' : ''}`}
            onClick={() => setFiltPlat(p)}
            style={filtPlat !== p ? { borderColor: platColor(p), color: platColor(p) } : {}}
          >
            {p}
          </button>
        ))}
      </div>

      {platData.length === 0 ? (
        <div className="card">
          <div className="card-bd" style={{ textAlign: 'center', padding: '40px', color: 'var(--gr3)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>Sem dados para {filtPlat}</div>
            <div style={{ fontSize: '11px' }}>Clique em "+ Registrar Dados" para adicionar o primeiro snapshot.</div>
          </div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          {kpis.length > 0 && (
            <div className="kpi-grid">
              {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
            </div>
          )}

          {/* Tendência visual */}
          {platData.length >= 2 && (
            <div className="card" style={{ marginBottom: '14px' }}>
              <div className="card-hd"><div className="card-tt">Tendência — Últimos {platData.length} períodos</div></div>
              <div className="card-bd">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                  {[
                    { label: 'Seguidores', vals: seguidoresHist, color: platColor(filtPlat) },
                    { label: 'Engajamento', vals: engajHist, color: 'var(--ok)' },
                    { label: 'Alcance', vals: alcanceHist, color: 'var(--cy)' },
                    { label: 'Cliques', vals: cliquesHist, color: 'var(--wr)' },
                  ].map(({ label, vals, color }) => {
                    const last = vals[vals.length - 1] ?? 0
                    const prev2 = vals[vals.length - 2] ?? 0
                    const diff = last - prev2
                    return (
                      <div key={label} style={{ background: 'var(--bk3)', borderRadius: 'var(--r)', padding: '12px' }}>
                        <div style={{ fontSize: '9px', color: 'var(--gr3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '4px' }}>{label}</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--wh)', fontFamily: 'var(--mono)', marginBottom: '4px' }}>
                          {last >= 1000 ? `${(last / 1000).toFixed(1)}K` : last}
                        </div>
                        <div style={{ fontSize: '9.5px', color: diff >= 0 ? 'var(--ok)' : 'var(--er)', marginBottom: '6px' }}>
                          {diff >= 0 ? '▲' : '▼'} {Math.abs(diff) >= 1000 ? `${(Math.abs(diff) / 1000).toFixed(1)}K` : Math.abs(diff)} vs anterior
                        </div>
                        <MiniSpark values={vals} color={color} />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="g11">
            {/* Alcance: seguidores vs não seguidores */}
            <div className="card">
              <div className="card-hd">
                <div className="card-tt">Alcance — Seguidores vs Não-seguidores</div>
                {latest && <span className="tag t-cy">{formatDate(latest.periodo)}</span>}
              </div>
              <div className="card-bd">
                {alcanceRows.length > 0
                  ? <>
                    <BarChart rows={alcanceRows} />
                    <div className="dv" />
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                      <ScoreRing value={latest?.alcance_seguidores ?? 0} max={alcanceTotal} color={platColor(filtPlat)} label="Seguidores" />
                      <ScoreRing value={latest?.alcance_nao_seguidores ?? 0} max={alcanceTotal} color="var(--gr2)" label="Não-seguidores" />
                    </div>
                  </>
                  : <p style={{ color: 'var(--gr3)', fontSize: '12px' }}>Sem dados de alcance.</p>
                }
              </div>
            </div>

            {/* Engajamento breakdown */}
            <div className="card">
              <div className="card-hd">
                <div className="card-tt">Distribuição de Engajamento</div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--or)', fontWeight: 700 }}>{engajPct}%</span>
              </div>
              <div className="card-bd">
                {engajRows.length > 0
                  ? <>
                    <BarChart rows={engajRows} />
                    <div className="dv" />
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {engajRows.map(r => (
                        <div key={r.label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: r.color, fontFamily: 'var(--mono)' }}>{r.value}</div>
                          <div style={{ fontSize: '9px', color: 'var(--gr3)', textTransform: 'uppercase' }}>{r.label}</div>
                        </div>
                      ))}
                    </div>
                  </>
                  : <p style={{ color: 'var(--gr3)', fontSize: '12px' }}>Sem dados de engajamento.</p>
                }
              </div>
            </div>
          </div>

          {/* Análise de seguidores */}
          {platData.length > 0 && (
            <div className="card">
              <div className="card-hd"><div className="card-tt">Análise de Seguidores — Histórico</div></div>
              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th>Período</th><th>Seguidores Total</th><th>Novos</th><th>Perdidos</th>
                      <th>Crescimento Líquido</th><th>Cliques</th><th>Engajamento</th>
                      <th>Campanhas Ativas</th><th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...platData].reverse().map(m => {
                      const eng = m.curtidas + m.comentarios + m.compartilhamentos + m.saves
                      const alc = m.alcance_seguidores + m.alcance_nao_seguidores
                      const engP = alc > 0 ? ((eng / alc) * 100).toFixed(2) : '0'
                      const liquido = m.seguidores_novos - m.seguidores_perdidos
                      return (
                        <tr key={m.id}>
                          <td style={{ fontFamily: 'var(--mono)', fontSize: '11px' }}>{formatDate(m.periodo)}</td>
                          <td style={{ fontWeight: 700, fontFamily: 'var(--mono)' }}>{m.seguidores_total.toLocaleString('pt-BR')}</td>
                          <td style={{ color: 'var(--ok)', fontFamily: 'var(--mono)', fontWeight: 600 }}>+{m.seguidores_novos}</td>
                          <td style={{ color: m.seguidores_perdidos > 0 ? 'var(--er)' : 'var(--gr3)', fontFamily: 'var(--mono)' }}>-{m.seguidores_perdidos}</td>
                          <td style={{ fontWeight: 700, color: liquido >= 0 ? 'var(--ok)' : 'var(--er)', fontFamily: 'var(--mono)' }}>
                            {liquido >= 0 ? '+' : ''}{liquido}
                          </td>
                          <td style={{ fontFamily: 'var(--mono)' }}>{m.cliques_link + m.cliques_perfil}</td>
                          <td style={{ fontWeight: 700, color: parseFloat(engP) >= 3 ? 'var(--ok)' : parseFloat(engP) >= 1 ? 'var(--wr)' : 'var(--gr3)' }}>{engP}%</td>
                          <td>{m.campanhas_ativas > 0 ? <span className="tag t-ok">{m.campanhas_ativas} ativas</span> : <span className="tag t-gr">0</span>}</td>
                          <td>
                            <div className="ab">
                              <button className="ib" onClick={() => openEdit(m)}><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                              <button className="ib rd" onClick={() => confirmDialog('Excluir este registro de métricas?', () => remove.mutate(m.id))}><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de entrada de dados */}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar Métricas' : 'Registrar Métricas'} size="lg"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn p" onClick={handleSubmit} disabled={save.isPending}>{save.isPending ? 'Salvando...' : '✓ Salvar'}</button></>}>
        <form onSubmit={handleSubmit}>
          <div className="g2">
            <div className="fg"><label className="fl">Plataforma</label>
              <select className="sel" value={form.plataforma} onChange={e => set('plataforma', e.target.value)}>
                {PLATAFORMAS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Período (YYYY-MM)</label>
              <input className="inp" type="month" value={form.periodo} onChange={e => set('periodo', e.target.value)} required />
            </div>
          </div>

          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--or)', textTransform: 'uppercase', letterSpacing: '.1em', margin: '12px 0 8px' }}>Seguidores</div>
          <div className="g3">
            <div className="fg"><label className="fl">Total</label><input className="inp" type="number" min="0" value={form.seguidores_total} onChange={e => set('seguidores_total', parseInt(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Novos</label><input className="inp" type="number" min="0" value={form.seguidores_novos} onChange={e => set('seguidores_novos', parseInt(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Perdidos</label><input className="inp" type="number" min="0" value={form.seguidores_perdidos} onChange={e => set('seguidores_perdidos', parseInt(e.target.value)||0)} /></div>
          </div>

          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--cy)', textTransform: 'uppercase', letterSpacing: '.1em', margin: '12px 0 8px' }}>Alcance e Impressões</div>
          <div className="g3">
            <div className="fg"><label className="fl">Alcance (Seguidores)</label><input className="inp" type="number" min="0" value={form.alcance_seguidores} onChange={e => set('alcance_seguidores', parseInt(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Alcance (Não-seguidos)</label><input className="inp" type="number" min="0" value={form.alcance_nao_seguidores} onChange={e => set('alcance_nao_seguidores', parseInt(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Impressões</label><input className="inp" type="number" min="0" value={form.impressoes} onChange={e => set('impressoes', parseInt(e.target.value)||0)} /></div>
          </div>

          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ok)', textTransform: 'uppercase', letterSpacing: '.1em', margin: '12px 0 8px' }}>Engajamento</div>
          <div className="g4">
            <div className="fg"><label className="fl">Curtidas</label><input className="inp" type="number" min="0" value={form.curtidas} onChange={e => set('curtidas', parseInt(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Comentários</label><input className="inp" type="number" min="0" value={form.comentarios} onChange={e => set('comentarios', parseInt(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Compartilhamentos</label><input className="inp" type="number" min="0" value={form.compartilhamentos} onChange={e => set('compartilhamentos', parseInt(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Saves</label><input className="inp" type="number" min="0" value={form.saves} onChange={e => set('saves', parseInt(e.target.value)||0)} /></div>
          </div>

          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--wr)', textTransform: 'uppercase', letterSpacing: '.1em', margin: '12px 0 8px' }}>Cliques e Navegação</div>
          <div className="g4">
            <div className="fg"><label className="fl">Cliques no Link</label><input className="inp" type="number" min="0" value={form.cliques_link} onChange={e => set('cliques_link', parseInt(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Cliques no Perfil</label><input className="inp" type="number" min="0" value={form.cliques_perfil} onChange={e => set('cliques_perfil', parseInt(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Visitas ao Perfil</label><input className="inp" type="number" min="0" value={form.visitas_perfil} onChange={e => set('visitas_perfil', parseInt(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Views Stories</label><input className="inp" type="number" min="0" value={form.stories_visualizacoes} onChange={e => set('stories_visualizacoes', parseInt(e.target.value)||0)} /></div>
          </div>

          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--pu)', textTransform: 'uppercase', letterSpacing: '.1em', margin: '12px 0 8px' }}>Campanhas</div>
          <div className="g2">
            <div className="fg"><label className="fl">Campanhas Ativas</label><input className="inp" type="number" min="0" value={form.campanhas_ativas} onChange={e => set('campanhas_ativas', parseInt(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Campanhas Total</label><input className="inp" type="number" min="0" value={form.campanhas_total} onChange={e => set('campanhas_total', parseInt(e.target.value)||0)} /></div>
          </div>
          <div className="fg"><label className="fl">Observações</label><textarea className="txa" style={{ minHeight: '48px' }} value={form.observacoes ?? ''} onChange={e => set('observacoes', e.target.value)} /></div>
        </form>
      </Modal>
    </div>
  )
}
