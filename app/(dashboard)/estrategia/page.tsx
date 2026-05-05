'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import KpiCard from '@/components/ui/KpiCard'
import StatusTag from '@/components/ui/StatusTag'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { showToast } from '@/components/ui/Toast'
import { confirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/lib/utils'
import type { Estrategia, EstrategiaInput, EstrategiaStatus, Prioridade } from '@/types'

const STATUS: EstrategiaStatus[] = ['Planejado','Em andamento','Concluído','Atrasado','Pausado']
const PRIOS: Prioridade[] = ['Alta','Média','Baixa']

const BLANK: EstrategiaInput = {
  objetivo: '', plano_acao: '', responsavel: '', prazo: '',
  prioridade: 'Média', status: 'Planejado', progresso: 0,
}

export default function EstrategiaPage() {
  const supabase = createClient()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<EstrategiaInput>(BLANK)
  const [editId, setEditId] = useState<string | null>(null)

  const { data: estrategias = [], isLoading } = useQuery({
    queryKey: ['estrategias'],
    queryFn: async () => {
      const { data, error } = await supabase.from('estrategias').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Estrategia[]
    },
  })

  const save = useMutation({
    mutationFn: async (p: EstrategiaInput & { id?: string }) => {
      const { id, ...rest } = p
      if (id) { const { error } = await supabase.from('estrategias').update(rest).eq('id', id); if (error) throw error }
      else { const { error } = await supabase.from('estrategias').insert(rest); if (error) throw error }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['estrategias'] }); showToast(editId ? 'Estratégia atualizada!' : 'Estratégia salva!'); setModal(false) },
    onError: () => showToast('Erro ao salvar.', 'er'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('estrategias').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['estrategias'] }); showToast('Excluído!') },
    onError: () => showToast('Erro ao excluir.', 'er'),
  })

  function openNew() { setForm(BLANK); setEditId(null); setModal(true) }
  function openEdit(e: Estrategia) {
    setForm({ objetivo: e.objetivo, plano_acao: e.plano_acao ?? '', responsavel: e.responsavel ?? '', prazo: e.prazo ?? '', prioridade: e.prioridade, status: e.status, progresso: e.progresso })
    setEditId(e.id); setModal(true)
  }
  function set(k: keyof EstrategiaInput, v: string | number) { setForm(f => ({ ...f, [k]: v })) }
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); save.mutate(editId ? { ...form, id: editId } : form) }

  const concluidas = estrategias.filter(e => e.status === 'Concluído').length
  const emAndamento = estrategias.filter(e => e.status === 'Em andamento').length
  const atrasadas = estrategias.filter(e => e.status === 'Atrasado').length

  const kpis = [
    { cor: 'var(--or)', icon: '<polyline points="22 4 12 14.01 9 11.01"/>', label: 'Total Ações', value: estrategias.length, sub: 'Estratégias cadastradas' },
    { cor: 'var(--ok)', icon: '<polyline points="20 6 9 17 4 12"/>', label: 'Concluídas', value: concluidas, sub: `${estrategias.length ? Math.round(concluidas/estrategias.length*100) : 0}% do total` },
    { cor: 'var(--cy)', icon: '<circle cx="12" cy="12" r="10"/>', label: 'Em Andamento', value: emAndamento, sub: 'Ações em execução' },
    { cor: 'var(--er)', icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>', label: 'Atrasadas', value: atrasadas, sub: atrasadas > 0 ? 'Atenção necessária' : 'Tudo no prazo' },
  ]

  const prioColor: Record<Prioridade, string> = { Alta: 'var(--er)', Média: 'var(--wr)', Baixa: 'var(--ok)' }

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-tt">Gerenciamento de Estratégia</div>
        <button className="btn p sm" onClick={openNew}>+ Nova Ação Estratégica</button>
      </div>

      <div className="kpi-grid">{kpis.map((k, i) => <KpiCard key={i} {...k} />)}</div>

      <div className="card">
        <div className="tw">
          <table>
            <thead>
              <tr><th>Objetivo</th><th>Plano de Ação</th><th>Responsável</th><th>Prazo</th><th>Prioridade</th><th>Status</th><th>Progresso</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {estrategias.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--gr3)' }}>Nenhuma estratégia registrada.</td></tr>
              ) : estrategias.map(e => (
                <tr key={e.id}>
                  <td style={{ maxWidth: '200px' }}><strong>{e.objetivo}</strong></td>
                  <td style={{ fontSize: '10.5px', color: 'var(--gr3)', maxWidth: '200px' }}>{e.plano_acao}</td>
                  <td>{e.responsavel}</td>
                  <td style={{ fontSize: '10.5px', color: e.status === 'Atrasado' ? 'var(--er)' : 'var(--gr3)' }}>{formatDate(e.prazo)}</td>
                  <td><span style={{ fontSize: '10px', fontWeight: 700, color: prioColor[e.prioridade] }}>● {e.prioridade}</span></td>
                  <td><StatusTag status={e.status} /></td>
                  <td style={{ minWidth: '120px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="prog" style={{ flex: 1 }}>
                        <div className="pb" style={{ width: `${e.progresso}%`, background: e.progresso >= 75 ? 'var(--ok)' : e.progresso >= 40 ? 'var(--wr)' : 'var(--or)' }} />
                      </div>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--gr3)', flexShrink: 0 }}>{e.progresso}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="ab">
                      <button className="ib" onClick={() => openEdit(e)}><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                      <button className="ib rd" onClick={() => confirmDialog('Excluir esta ação estratégica?', () => remove.mutate(e.id))}><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar Estratégia' : 'Nova Ação Estratégica'} size="lg"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn p" onClick={handleSubmit} disabled={save.isPending}>{save.isPending ? 'Salvando...' : '✓ Salvar'}</button></>}>
        <form onSubmit={handleSubmit}>
          <div className="fg"><label className="fl">Objetivo <span style={{ color: 'var(--er)' }}>*</span></label><input className="inp" value={form.objetivo} onChange={e => set('objetivo', e.target.value)} required placeholder="Ex: Gerar 80 leads qualificados em 60 dias" /></div>
          <div className="fg"><label className="fl">Plano de Ação</label><textarea className="txa" value={form.plano_acao ?? ''} onChange={e => set('plano_acao', e.target.value)} placeholder="Descreva as ações para atingir o objetivo" /></div>
          <div className="g2">
            <div className="fg"><label className="fl">Responsável</label><input className="inp" value={form.responsavel ?? ''} onChange={e => set('responsavel', e.target.value)} /></div>
            <div className="fg"><label className="fl">Prazo</label><input className="inp" type="date" value={form.prazo ?? ''} onChange={e => set('prazo', e.target.value)} /></div>
            <div className="fg"><label className="fl">Prioridade</label><select className="sel" value={form.prioridade} onChange={e => set('prioridade', e.target.value)}>{PRIOS.map(p => <option key={p}>{p}</option>)}</select></div>
            <div className="fg"><label className="fl">Status</label><select className="sel" value={form.status} onChange={e => set('status', e.target.value)}>{STATUS.map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="fg" style={{ gridColumn: '1 / -1' }}>
              <label className="fl">Progresso: {form.progresso}%</label>
              <input type="range" min="0" max="100" value={form.progresso} onChange={e => set('progresso', parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--or)' }} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
