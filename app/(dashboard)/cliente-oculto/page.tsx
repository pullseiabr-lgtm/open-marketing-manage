'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import KpiCard from '@/components/ui/KpiCard'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { showToast } from '@/components/ui/Toast'
import { confirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate, stars } from '@/lib/utils'
import type { AvaliacaoClienteOculto, AvaliacaoClienteOcultoInput } from '@/types'

const CANAIS = ['WhatsApp','Instagram','Google','Telefone','Presencial','E-mail']

const BLANK: AvaliacaoClienteOcultoInput = {
  data_avaliacao: new Date().toISOString().slice(0, 10),
  canal: 'WhatsApp', avaliador: '', tempo_resposta: '',
  nota_qualidade: 8, nota_abordagem: 8, fechou: 'Não',
  nota_geral: 8, pontos_fortes: '', melhorias: '',
}

export default function ClienteOcultoPage() {
  const supabase = createClient()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<AvaliacaoClienteOcultoInput>(BLANK)
  const [editId, setEditId] = useState<string | null>(null)

  const { data: avaliacoes = [], isLoading } = useQuery({
    queryKey: ['avaliacoes_cliente_oculto'],
    queryFn: async () => {
      const { data, error } = await supabase.from('avaliacoes_cliente_oculto').select('*').order('data_avaliacao', { ascending: false })
      if (error) throw error
      return data as AvaliacaoClienteOculto[]
    },
  })

  const save = useMutation({
    mutationFn: async (p: AvaliacaoClienteOcultoInput & { id?: string }) => {
      const { id, ...rest } = p
      if (id) { const { error } = await supabase.from('avaliacoes_cliente_oculto').update(rest).eq('id', id); if (error) throw error }
      else { const { error } = await supabase.from('avaliacoes_cliente_oculto').insert(rest); if (error) throw error }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['avaliacoes_cliente_oculto'] }); showToast('Avaliação salva!'); setModal(false) },
    onError: () => showToast('Erro ao salvar.', 'er'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('avaliacoes_cliente_oculto').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['avaliacoes_cliente_oculto'] }); showToast('Excluído!') },
    onError: () => showToast('Erro ao excluir.', 'er'),
  })

  function openNew() { setForm(BLANK); setEditId(null); setModal(true) }
  function openEdit(a: AvaliacaoClienteOculto) {
    setForm({ data_avaliacao: a.data_avaliacao, canal: a.canal, avaliador: a.avaliador, tempo_resposta: a.tempo_resposta ?? '', nota_qualidade: a.nota_qualidade ?? 8, nota_abordagem: a.nota_abordagem ?? 8, fechou: a.fechou ?? 'Não', nota_geral: a.nota_geral ?? 8, pontos_fortes: a.pontos_fortes ?? '', melhorias: a.melhorias ?? '' })
    setEditId(a.id); setModal(true)
  }
  function set(k: keyof AvaliacaoClienteOcultoInput, v: string | number) { setForm(f => ({ ...f, [k]: v })) }
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); save.mutate(editId ? { ...form, id: editId } : form) }

  const avgGeral = avaliacoes.length ? (avaliacoes.reduce((s, a) => s + (a.nota_geral ?? 0), 0) / avaliacoes.length).toFixed(1) : '—'
  const avgQual  = avaliacoes.length ? (avaliacoes.reduce((s, a) => s + (a.nota_qualidade ?? 0), 0) / avaliacoes.length).toFixed(1) : '—'
  const fechados = avaliacoes.filter(a => a.fechou === 'Sim').length

  const kpis = [
    { cor: 'var(--or)', icon: '<circle cx="12" cy="12" r="10"/>', label: 'Avaliações', value: avaliacoes.length, sub: 'Total realizadas' },
    { cor: 'var(--ok)', icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', label: 'Nota Geral Média', value: avgGeral, sub: 'Escala 0–10' },
    { cor: 'var(--cy)', icon: '<polyline points="22 4 12 14.01 9 11.01"/>', label: 'Atendimento Médio', value: avgQual, sub: 'Qualidade percebida' },
    { cor: 'var(--pu)', icon: '<polyline points="20 6 9 17 4 12"/>', label: 'Taxa de Fechamento', value: `${avaliacoes.length ? Math.round(fechados/avaliacoes.length*100) : 0}%`, sub: `${fechados} vendas no teste` },
  ]

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-tt">Cliente Oculto — Experiência</div>
        <button className="btn p sm" onClick={openNew}>+ Nova Avaliação</button>
      </div>

      <div className="kpi-grid">{kpis.map((k, i) => <KpiCard key={i} {...k} />)}</div>

      <div className="card">
        <div className="tw">
          <table>
            <thead>
              <tr><th>Data</th><th>Canal</th><th>Avaliador</th><th>T. Resposta</th><th>Atendimento</th><th>Abordagem</th><th>Fechou?</th><th>Nota Geral</th><th>Pontos Fortes</th><th>Melhorias</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {avaliacoes.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: '24px', color: 'var(--gr3)' }}>Nenhuma avaliação registrada.</td></tr>
              ) : avaliacoes.map(a => (
                <tr key={a.id}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '11px' }}>{formatDate(a.data_avaliacao)}</td>
                  <td><span className="tag t-bl">{a.canal}</span></td>
                  <td>{a.avaliador}</td>
                  <td style={{ color: 'var(--gr3)', fontSize: '10.5px' }}>{a.tempo_resposta || '—'}</td>
                  <td><span style={{ color: 'var(--wr)' }}>{stars(a.nota_qualidade ?? 0)}</span></td>
                  <td><span style={{ color: 'var(--wr)' }}>{stars(a.nota_abordagem ?? 0)}</span></td>
                  <td>{a.fechou === 'Sim' ? <span className="tag t-ok">Sim</span> : a.fechou === 'Em negociação' ? <span className="tag t-wr">Negociação</span> : <span className="tag t-gr">Não</span>}</td>
                  <td style={{ fontWeight: 700, fontFamily: 'var(--mono)', color: (a.nota_geral ?? 0) >= 8 ? 'var(--ok)' : (a.nota_geral ?? 0) >= 6 ? 'var(--wr)' : 'var(--er)' }}>{a.nota_geral}</td>
                  <td style={{ fontSize: '10.5px', maxWidth: '140px', color: 'var(--gr3)' }}>{a.pontos_fortes}</td>
                  <td style={{ fontSize: '10.5px', maxWidth: '140px', color: 'var(--gr3)' }}>{a.melhorias}</td>
                  <td>
                    <div className="ab">
                      <button className="ib" onClick={() => openEdit(a)}><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                      <button className="ib rd" onClick={() => confirmDialog('Excluir esta avaliação?', () => remove.mutate(a.id))}><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar Avaliação' : 'Nova Avaliação — Cliente Oculto'} size="lg"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn p" onClick={handleSubmit} disabled={save.isPending}>{save.isPending ? 'Salvando...' : '✓ Salvar'}</button></>}>
        <form onSubmit={handleSubmit}>
          <div className="g2">
            <div className="fg"><label className="fl">Data</label><input className="inp" type="date" value={form.data_avaliacao} onChange={e => set('data_avaliacao', e.target.value)} required /></div>
            <div className="fg"><label className="fl">Canal</label><select className="sel" value={form.canal} onChange={e => set('canal', e.target.value)}>{CANAIS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div className="fg"><label className="fl">Avaliador</label><input className="inp" value={form.avaliador} onChange={e => set('avaliador', e.target.value)} required placeholder="Nome do avaliador" /></div>
            <div className="fg"><label className="fl">Tempo de Resposta</label><input className="inp" value={form.tempo_resposta ?? ''} onChange={e => set('tempo_resposta', e.target.value)} placeholder="Ex: 1min 32s" /></div>
            <div className="fg"><label className="fl">Nota Qualidade (0-10)</label><input className="inp" type="number" min="0" max="10" step="0.1" value={form.nota_qualidade ?? 8} onChange={e => set('nota_qualidade', parseFloat(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Nota Abordagem (0-10)</label><input className="inp" type="number" min="0" max="10" step="0.1" value={form.nota_abordagem ?? 8} onChange={e => set('nota_abordagem', parseFloat(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Fechou?</label><select className="sel" value={form.fechou ?? 'Não'} onChange={e => set('fechou', e.target.value)}><option>Sim</option><option>Não</option><option>Em negociação</option></select></div>
            <div className="fg"><label className="fl">Nota Geral (0-10)</label><input className="inp" type="number" min="0" max="10" step="0.1" value={form.nota_geral ?? 8} onChange={e => set('nota_geral', parseFloat(e.target.value)||0)} /></div>
          </div>
          <div className="fg"><label className="fl">Pontos Fortes</label><textarea className="txa" value={form.pontos_fortes ?? ''} onChange={e => set('pontos_fortes', e.target.value)} placeholder="O que funcionou bem no atendimento" /></div>
          <div className="fg"><label className="fl">Pontos de Melhoria</label><textarea className="txa" value={form.melhorias ?? ''} onChange={e => set('melhorias', e.target.value)} placeholder="O que precisa melhorar" /></div>
        </form>
      </Modal>
    </div>
  )
}
