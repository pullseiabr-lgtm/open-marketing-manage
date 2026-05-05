'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import KpiCard from '@/components/ui/KpiCard'
import Modal from '@/components/ui/Modal'
import StatusTag from '@/components/ui/StatusTag'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { showToast } from '@/components/ui/Toast'
import { confirmDialog } from '@/components/ui/ConfirmDialog'
import { moneyK, cpc, cpm, ctr, cpl, roiStr, platColor, formatDate, PLATAFORMAS } from '@/lib/utils'
import type { InvestimentoMidia, InvestimentoMidiaInput } from '@/types'

const BLANK: InvestimentoMidiaInput = {
  plataforma: 'Google Ads', tipo: 'Pesquisa', objetivo: 'Conversão',
  valor: 0, periodo: new Date().toISOString().slice(0, 7),
  publico: '', segmento: '', impressoes: 0, cliques: 0, leads: 0, vendas: 0, receita: 0,
}

export default function MidiaPagaPage() {
  const supabase = createClient()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<InvestimentoMidiaInput>(BLANK)
  const [editId, setEditId] = useState<string | null>(null)

  const { data: midias = [], isLoading } = useQuery({
    queryKey: ['investimentos_midia'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investimentos_midia')
        .select('*')
        .order('periodo', { ascending: false })
      if (error) throw error
      return data as InvestimentoMidia[]
    },
  })

  const save = useMutation({
    mutationFn: async (payload: InvestimentoMidiaInput & { id?: string }) => {
      const { id, ...rest } = payload
      if (id) {
        const { error } = await supabase.from('investimentos_midia').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('investimentos_midia').insert(rest)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investimentos_midia'] })
      showToast(editId ? 'Investimento atualizado!' : 'Investimento salvo!')
      setModal(false)
    },
    onError: () => showToast('Erro ao salvar.', 'er'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('investimentos_midia').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investimentos_midia'] })
      showToast('Excluído!')
    },
    onError: () => showToast('Erro ao excluir.', 'er'),
  })

  function openNew() {
    setForm(BLANK); setEditId(null); setModal(true)
  }

  function openEdit(m: InvestimentoMidia) {
    setForm({
      plataforma: m.plataforma, tipo: m.tipo, objetivo: m.objetivo,
      valor: m.valor, periodo: m.periodo, publico: m.publico ?? '',
      segmento: m.segmento ?? '', impressoes: m.impressoes, cliques: m.cliques,
      leads: m.leads, vendas: m.vendas, receita: m.receita,
    })
    setEditId(m.id)
    setModal(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    save.mutate(editId ? { ...form, id: editId } : form)
  }

  function set(k: keyof InvestimentoMidiaInput, v: string | number) {
    setForm(f => ({ ...f, [k]: v }))
  }

  const totInv    = midias.reduce((s, m) => s + m.valor, 0)
  const totLeads  = midias.reduce((s, m) => s + m.leads, 0)
  const totVendas = midias.reduce((s, m) => s + m.vendas, 0)
  const totRec    = midias.reduce((s, m) => s + m.receita, 0)

  const kpis = [
    { cor: 'var(--or)', icon: '<line x1="12" y1="1" x2="12" y2="23"/>', label: 'Total Investido', value: moneyK(totInv), sub: 'Período atual' },
    { cor: 'var(--ok)', icon: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>', label: 'ROI Total', value: roiStr(totRec, totInv), sub: '<span class="up">Retorno gerado</span>' },
    { cor: 'var(--cy)', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5"/>', label: 'Total Leads', value: totLeads, sub: `CPL: ${cpl(totInv, totLeads)}` },
    { cor: 'var(--wr)', icon: '<polyline points="20 6 9 17 4 12"/>', label: 'Conversões', value: totVendas, sub: `CAC: ${cpl(totInv, totVendas)}` },
  ]

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-tt">Controle de Investimento — Mídia Paga</div>
        <button className="btn p sm" onClick={openNew}>+ Adicionar Investimento</button>
      </div>

      <div className="kpi-grid">
        {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      <div className="card">
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Plataforma</th><th>Tipo</th><th>Objetivo</th><th>Investido</th>
                <th>CPC</th><th>CPM</th><th>CTR</th><th>CPL</th><th>ROI</th>
                <th>Período</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {midias.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: '24px', color: 'var(--gr3)' }}>
                  Nenhum investimento registrado.
                </td></tr>
              ) : midias.map(m => {
                const roi = m.receita && m.valor ? `${(m.receita / m.valor).toFixed(1)}x` : '—'
                const roiN = parseFloat(roi)
                const roiColor = roiN >= 3 ? 'var(--ok)' : roiN >= 1.5 ? 'var(--wr)' : 'var(--er)'
                return (
                  <tr key={m.id}>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: platColor(m.plataforma), flexShrink: 0 }} />
                        <strong>{m.plataforma}</strong>
                      </span>
                    </td>
                    <td>{m.tipo}</td>
                    <td><span className="tag t-bl">{m.objetivo}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--or)', fontFamily: 'var(--mono)' }}>{moneyK(m.valor)}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{cpc(m.valor, m.cliques)}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{cpm(m.valor, m.impressoes)}</td>
                    <td>{ctr(m.cliques, m.impressoes)}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{cpl(m.valor, m.leads)}</td>
                    <td style={{ fontWeight: 700, color: roiColor }}>{roi}</td>
                    <td>{formatDate(m.periodo)}</td>
                    <td>
                      <div className="ab">
                        <button className="ib" onClick={() => openEdit(m)}>
                          <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="ib rd" onClick={() => confirmDialog('Excluir este investimento? Não pode ser desfeito.', () => remove.mutate(m.id))}>
                          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Editar Investimento' : 'Novo Investimento'}
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
              <label className="fl">Plataforma</label>
              <select className="sel" value={form.plataforma} onChange={e => set('plataforma', e.target.value)}>
                {PLATAFORMAS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Tipo</label>
              <select className="sel" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                {['Pesquisa','Social','Sponsored','Display','Vídeo','Shopping'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Objetivo</label>
              <select className="sel" value={form.objetivo} onChange={e => set('objetivo', e.target.value)}>
                {['Conversão','Branding','Lead','Tráfego','Engajamento'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Período (YYYY-MM)</label>
              <input className="inp" type="month" value={form.periodo} onChange={e => set('periodo', e.target.value)} required />
            </div>
            <div className="fg">
              <label className="fl">Valor Investido (R$)</label>
              <input className="inp" type="number" min="0" step="0.01" value={form.valor} onChange={e => set('valor', parseFloat(e.target.value) || 0)} required />
            </div>
            <div className="fg">
              <label className="fl">Receita Gerada (R$)</label>
              <input className="inp" type="number" min="0" step="0.01" value={form.receita} onChange={e => set('receita', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="fg">
              <label className="fl">Impressões</label>
              <input className="inp" type="number" min="0" value={form.impressoes} onChange={e => set('impressoes', parseInt(e.target.value) || 0)} />
            </div>
            <div className="fg">
              <label className="fl">Cliques</label>
              <input className="inp" type="number" min="0" value={form.cliques} onChange={e => set('cliques', parseInt(e.target.value) || 0)} />
            </div>
            <div className="fg">
              <label className="fl">Leads</label>
              <input className="inp" type="number" min="0" value={form.leads} onChange={e => set('leads', parseInt(e.target.value) || 0)} />
            </div>
            <div className="fg">
              <label className="fl">Vendas</label>
              <input className="inp" type="number" min="0" value={form.vendas} onChange={e => set('vendas', parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="fg">
            <label className="fl">Público-alvo</label>
            <input className="inp" value={form.publico ?? ''} onChange={e => set('publico', e.target.value)} placeholder="Ex: Gerentes industriais 35-55a SP" />
          </div>
          <div className="fg">
            <label className="fl">Segmento</label>
            <input className="inp" value={form.segmento ?? ''} onChange={e => set('segmento', e.target.value)} placeholder="Ex: Indústria, manutenção" />
          </div>
        </form>
      </Modal>
    </div>
  )
}
