'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import KpiCard from '@/components/ui/KpiCard'
import FunnelChart from '@/components/ui/FunnelChart'
import { BarChart } from '@/components/ui/BarChart'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { showToast } from '@/components/ui/Toast'
import { confirmDialog } from '@/components/ui/ConfirmDialog'
import { moneyK, cpl, roiStr, pct, platColor, formatDate } from '@/lib/utils'
import type { FunilMetrica, FunilMetricaInput } from '@/types'

const BLANK: FunilMetricaInput = {
  canal: 'Google Ads', periodo: new Date().toISOString().slice(0, 7),
  alcance: 0, cliques: 0, leads: 0, vendas: 0, investimento: 0, receita: 0,
}

const CANAIS = ['Google Ads', 'Instagram', 'LinkedIn', 'YouTube', 'WhatsApp', 'Marketplace', 'Orgânico']

export default function TabMetricas() {
  const supabase = createClient()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<FunilMetricaInput>(BLANK)
  const [editId, setEditId] = useState<string | null>(null)

  const { data: metricas = [], isLoading } = useQuery({
    queryKey: ['funil_metricas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funil_metricas').select('*').order('periodo', { ascending: false })
      if (error) throw error
      return data as FunilMetrica[]
    },
  })

  const save = useMutation({
    mutationFn: async (p: FunilMetricaInput & { id?: string }) => {
      const { id, ...rest } = p
      if (id) {
        const { error } = await supabase.from('funil_metricas').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('funil_metricas').insert(rest)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['funil_metricas'] })
      showToast(editId ? 'Métrica atualizada!' : 'Métrica salva!')
      setModal(false)
    },
    onError: () => showToast('Erro ao salvar.', 'er'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('funil_metricas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['funil_metricas'] })
      showToast('Excluído!')
    },
    onError: () => showToast('Erro ao excluir.', 'er'),
  })

  function openNew() { setForm(BLANK); setEditId(null); setModal(true) }
  function openEdit(m: FunilMetrica) {
    setForm({ canal: m.canal, periodo: m.periodo, alcance: m.alcance, cliques: m.cliques, leads: m.leads, vendas: m.vendas, investimento: m.investimento, receita: m.receita })
    setEditId(m.id); setModal(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    save.mutate(editId ? { ...form, id: editId } : form)
  }

  function set(k: keyof FunilMetricaInput, v: string | number) {
    setForm(f => ({ ...f, [k]: v }))
  }

  const totAlcance = metricas.reduce((s, m) => s + m.alcance, 0)
  const totCliques = metricas.reduce((s, m) => s + m.cliques, 0)
  const totLeads   = metricas.reduce((s, m) => s + m.leads, 0)
  const totVendas  = metricas.reduce((s, m) => s + m.vendas, 0)
  const totInv     = metricas.reduce((s, m) => s + m.investimento, 0)
  const totRec     = metricas.reduce((s, m) => s + m.receita, 0)

  const kpis = [
    { cor: 'var(--bl)', icon: '<circle cx="12" cy="12" r="10"/>', label: 'Alcance Total', value: totAlcance >= 1000 ? `${(totAlcance/1000).toFixed(1)}K` : totAlcance, sub: 'Impressões acumuladas' },
    { cor: 'var(--cy)', icon: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>', label: 'Cliques', value: totCliques, sub: `CTR: ${totAlcance ? ((totCliques/totAlcance)*100).toFixed(2) + '%' : '—'}` },
    { cor: 'var(--or)', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5"/>', label: 'Leads', value: totLeads, sub: `CPL: ${cpl(totInv, totLeads)}` },
    { cor: 'var(--ok)', icon: '<polyline points="20 6 9 17 4 12"/>', label: 'Conversões', value: totVendas, sub: `${pct(totVendas, totLeads)} conv.` },
    { cor: 'var(--or)', icon: '<line x1="12" y1="1" x2="12" y2="23"/>', label: 'Investimento', value: moneyK(totInv), sub: 'Total aportado' },
    { cor: 'var(--pu)', icon: '<line x1="18" y1="20" x2="18" y2="10"/>', label: 'ROI', value: roiStr(totRec, totInv), sub: `Receita: ${moneyK(totRec)}` },
  ]

  const funnelStages = [
    { nome: 'Alcance',     valor: totAlcance >= 1000 ? `${(totAlcance/1000).toFixed(1)}K` : totAlcance, pct: 100, cor: 'var(--or)' },
    { nome: 'Cliques',     valor: totCliques, pct: totAlcance ? parseFloat(((totCliques/totAlcance)*100).toFixed(1)) : 0, cor: '#CC5500' },
    { nome: 'Leads',       valor: totLeads, pct: totAlcance ? parseFloat(((totLeads/totAlcance)*100).toFixed(2)) : 0, cor: '#8B3A00' },
    { nome: 'Conversões',  valor: totVendas, pct: totLeads ? parseFloat(((totVendas/totLeads)*100).toFixed(1)) : 0, cor: 'var(--ok)' },
  ]

  const convByStage = [
    { label: 'Alcance→Cliques', pct: totAlcance ? Math.round((totCliques/totAlcance)*100) : 0, color: 'var(--cy)', value: `${totAlcance ? ((totCliques/totAlcance)*100).toFixed(2) : 0}%` },
    { label: 'Cliques→Leads',   pct: totCliques ? Math.round((totLeads/totCliques)*100) : 0, color: 'var(--wr)', value: `${totCliques ? ((totLeads/totCliques)*100).toFixed(1) : 0}%` },
    { label: 'Leads→Vendas',    pct: totLeads ? Math.round((totVendas/totLeads)*100) : 0, color: 'var(--ok)', value: `${totLeads ? ((totVendas/totLeads)*100).toFixed(1) : 0}%` },
  ]

  const maxRoi = Math.max(...metricas.map(m => m.investimento ? m.receita / m.investimento : 0), 1)
  const roiRows = metricas
    .filter(m => m.investimento > 0)
    .sort((a, b) => (b.receita/b.investimento) - (a.receita/a.investimento))
    .slice(0, 6)
    .map(m => {
      const r = m.receita / m.investimento
      return { label: m.canal, pct: Math.round((r / maxRoi) * 100), color: platColor(m.canal), value: `${r.toFixed(1)}x` }
    })

  // Gargalos
  const stageConvs = [
    { nome: 'Alcance→Cliques', val: totAlcance ? (totCliques/totAlcance)*100 : 0, min: 2 },
    { nome: 'Cliques→Leads',   val: totCliques ? (totLeads/totCliques)*100 : 0, min: 5 },
    { nome: 'Leads→Vendas',    val: totLeads ? (totVendas/totLeads)*100 : 0, min: 15 },
  ]
  const gargalos = stageConvs.filter(s => s.val < s.min && s.val > 0)

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <button className="btn p sm" onClick={openNew}>+ Registrar Métrica</button>
      </div>

      <div className="kpi-grid">
        {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      <div className="g11">
        <div className="card">
          <div className="card-hd"><div className="card-tt">Funil por Etapa</div></div>
          <div className="card-bd">
            {metricas.length > 0 ? <FunnelChart stages={funnelStages} /> : (
              <p style={{ color: 'var(--gr3)', fontSize: '12px' }}>Sem dados. Registre métricas por canal.</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-hd"><div className="card-tt">Taxa de Conversão por Etapa</div></div>
          <div className="card-bd">
            <BarChart rows={convByStage} />
            {gargalos.length > 0 && (
              <>
                <div className="dv" />
                <div style={{ background: 'var(--bk3)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--or)', marginBottom: '8px' }}>⚡ GARGALOS IDENTIFICADOS</div>
                  {gargalos.map(g => (
                    <div key={g.nome} style={{ fontSize: '11px', color: 'var(--er)', marginBottom: '4px' }}>
                      ⚠ {g.nome}: {g.val.toFixed(1)}% (meta &gt; {g.min}%)
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabela por canal */}
      <div className="card">
        <div className="card-hd"><div className="card-tt">Performance por Fonte de Tráfego</div></div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Canal</th><th>Período</th><th>Alcance</th><th>Cliques</th><th>Leads</th>
                <th>Vendas</th><th>CPL</th><th>Conversão</th><th>ROI</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {metricas.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '24px', color: 'var(--gr3)' }}>
                  Nenhuma métrica registrada.
                </td></tr>
              ) : metricas.map(m => (
                <tr key={m.id}>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: platColor(m.canal), flexShrink: 0 }} />
                      <strong>{m.canal}</strong>
                    </span>
                  </td>
                  <td style={{ color: 'var(--gr3)', fontSize: '10.5px' }}>{formatDate(m.periodo)}</td>
                  <td>{m.alcance >= 1000 ? `${(m.alcance/1000).toFixed(1)}K` : m.alcance}</td>
                  <td>{m.cliques}</td>
                  <td style={{ fontWeight: 700, color: 'var(--or)', fontFamily: 'var(--mono)' }}>{m.leads}</td>
                  <td style={{ fontWeight: 700, color: 'var(--ok)', fontFamily: 'var(--mono)' }}>{m.vendas}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{cpl(m.investimento, m.leads)}</td>
                  <td>{pct(m.vendas, m.leads)}</td>
                  <td style={{ fontWeight: 700, color: m.investimento && (m.receita/m.investimento) >= 2 ? 'var(--ok)' : 'var(--wr)' }}>
                    {roiStr(m.receita, m.investimento)}
                  </td>
                  <td>
                    <div className="ab">
                      <button className="ib" onClick={() => openEdit(m)}>
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="ib rd" onClick={() => confirmDialog('Excluir esta métrica?', () => remove.mutate(m.id))}>
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Editar Métrica' : 'Nova Métrica de Funil'}
        footer={
          <>
            <button className="btn" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn p" onClick={handleSubmit} disabled={save.isPending}>
              {save.isPending ? 'Salvando...' : '✓ Salvar'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="g2">
            <div className="fg">
              <label className="fl">Canal</label>
              <select className="sel" value={form.canal} onChange={e => set('canal', e.target.value)}>
                {CANAIS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Período (YYYY-MM)</label>
              <input className="inp" type="month" value={form.periodo} onChange={e => set('periodo', e.target.value)} required />
            </div>
            <div className="fg">
              <label className="fl">Alcance</label>
              <input className="inp" type="number" min="0" value={form.alcance} onChange={e => set('alcance', parseInt(e.target.value)||0)} />
            </div>
            <div className="fg">
              <label className="fl">Cliques</label>
              <input className="inp" type="number" min="0" value={form.cliques} onChange={e => set('cliques', parseInt(e.target.value)||0)} />
            </div>
            <div className="fg">
              <label className="fl">Leads</label>
              <input className="inp" type="number" min="0" value={form.leads} onChange={e => set('leads', parseInt(e.target.value)||0)} />
            </div>
            <div className="fg">
              <label className="fl">Vendas</label>
              <input className="inp" type="number" min="0" value={form.vendas} onChange={e => set('vendas', parseInt(e.target.value)||0)} />
            </div>
            <div className="fg">
              <label className="fl">Investimento (R$)</label>
              <input className="inp" type="number" min="0" step="0.01" value={form.investimento} onChange={e => set('investimento', parseFloat(e.target.value)||0)} />
            </div>
            <div className="fg">
              <label className="fl">Receita (R$)</label>
              <input className="inp" type="number" min="0" step="0.01" value={form.receita} onChange={e => set('receita', parseFloat(e.target.value)||0)} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
