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
import type { Treinamento, TreinamentoInput, NivelTreinamento, Certificado } from '@/types'

const NIVEIS: NivelTreinamento[] = ['Iniciante','Intermediário','Avançado']
const CERTS: Certificado[] = ['Sim','Não','Em emissão']
const AREAS = ['Atendimento','Comercial','Marketing','Operações','Técnico','Gestão']

const BLANK: TreinamentoInput = {
  colaborador: '', area: 'Atendimento', nome_treinamento: '',
  data_realizacao: new Date().toISOString().slice(0, 10),
  nivel: 'Iniciante', avaliacao: 8, horas: 4, certificado: 'Não', observacoes: '',
}

export default function TreinamentoPage() {
  const supabase = createClient()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<TreinamentoInput>(BLANK)
  const [editId, setEditId] = useState<string | null>(null)

  const { data: treinamentos = [], isLoading } = useQuery({
    queryKey: ['treinamentos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('treinamentos').select('*').order('data_realizacao', { ascending: false })
      if (error) throw error
      return data as Treinamento[]
    },
  })

  const save = useMutation({
    mutationFn: async (p: TreinamentoInput & { id?: string }) => {
      const { id, ...rest } = p
      if (id) { const { error } = await supabase.from('treinamentos').update(rest).eq('id', id); if (error) throw error }
      else { const { error } = await supabase.from('treinamentos').insert(rest); if (error) throw error }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treinamentos'] }); showToast('Treinamento salvo!'); setModal(false) },
    onError: () => showToast('Erro ao salvar.', 'er'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('treinamentos').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treinamentos'] }); showToast('Excluído!') },
    onError: () => showToast('Erro ao excluir.', 'er'),
  })

  function openNew() { setForm(BLANK); setEditId(null); setModal(true) }
  function openEdit(t: Treinamento) {
    setForm({ colaborador: t.colaborador, area: t.area, nome_treinamento: t.nome_treinamento, data_realizacao: t.data_realizacao, nivel: t.nivel, avaliacao: t.avaliacao ?? 8, horas: t.horas, certificado: t.certificado, observacoes: t.observacoes ?? '' })
    setEditId(t.id); setModal(true)
  }
  function set(k: keyof TreinamentoInput, v: string | number) { setForm(f => ({ ...f, [k]: v })) }
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); save.mutate(editId ? { ...form, id: editId } : form) }

  const totalHoras = treinamentos.reduce((s, t) => s + t.horas, 0)
  const avgAval = treinamentos.length ? (treinamentos.reduce((s, t) => s + (t.avaliacao ?? 0), 0) / treinamentos.length).toFixed(1) : '—'
  const comCert = treinamentos.filter(t => t.certificado === 'Sim').length

  const kpis = [
    { cor: 'var(--or)', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5"/><circle cx="9" cy="7" r="4"/>', label: 'Colaboradores', value: new Set(treinamentos.map(t => t.colaborador)).size, sub: 'Treinados' },
    { cor: 'var(--cy)', icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', label: 'Carga Horária', value: `${totalHoras}h`, sub: 'Total acumulado' },
    { cor: 'var(--ok)', icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', label: 'Avaliação Média', value: avgAval, sub: 'Escala 0–10' },
    { cor: 'var(--pu)', icon: '<polyline points="22 4 12 14.01 9 11.01"/>', label: 'Certificados', value: comCert, sub: `${treinamentos.length ? Math.round(comCert/treinamentos.length*100) : 0}% do total` },
  ]

  const nivelColor: Record<NivelTreinamento, string> = { Iniciante: 'var(--bl)', Intermediário: 'var(--wr)', Avançado: 'var(--ok)' }

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-tt">Treinamento do Time</div>
        <button className="btn p sm" onClick={openNew}>+ Registrar Treinamento</button>
      </div>

      <div className="kpi-grid">{kpis.map((k, i) => <KpiCard key={i} {...k} />)}</div>

      <div className="card">
        <div className="tw">
          <table>
            <thead>
              <tr><th>Colaborador</th><th>Área</th><th>Treinamento</th><th>Data</th><th>Nível</th><th>Avaliação</th><th>Horas</th><th>Certificado</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {treinamentos.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: 'var(--gr3)' }}>Nenhum treinamento registrado.</td></tr>
              ) : treinamentos.map(t => (
                <tr key={t.id}>
                  <td><strong>{t.colaborador}</strong></td>
                  <td><span className="tag t-bl">{t.area}</span></td>
                  <td>{t.nome_treinamento}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '11px' }}>{formatDate(t.data_realizacao)}</td>
                  <td><span style={{ fontSize: '10.5px', fontWeight: 700, color: nivelColor[t.nivel] }}>● {t.nivel}</span></td>
                  <td><span style={{ color: 'var(--wr)' }}>{stars(t.avaliacao ?? 0)}</span></td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{t.horas}h</td>
                  <td>{t.certificado === 'Sim' ? <span className="tag t-ok">Sim</span> : t.certificado === 'Em emissão' ? <span className="tag t-wr">Em emissão</span> : <span className="tag t-gr">Não</span>}</td>
                  <td>
                    <div className="ab">
                      <button className="ib" onClick={() => openEdit(t)}><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                      <button className="ib rd" onClick={() => confirmDialog('Excluir este treinamento?', () => remove.mutate(t.id))}><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar Treinamento' : 'Registrar Treinamento'} size="lg"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn p" onClick={handleSubmit} disabled={save.isPending}>{save.isPending ? 'Salvando...' : '✓ Salvar'}</button></>}>
        <form onSubmit={handleSubmit}>
          <div className="g2">
            <div className="fg"><label className="fl">Colaborador <span style={{ color: 'var(--er)' }}>*</span></label><input className="inp" value={form.colaborador} onChange={e => set('colaborador', e.target.value)} required placeholder="Nome do colaborador" /></div>
            <div className="fg"><label className="fl">Área</label><select className="sel" value={form.area} onChange={e => set('area', e.target.value)}>{AREAS.map(a => <option key={a}>{a}</option>)}</select></div>
            <div className="fg" style={{ gridColumn: '1 / -1' }}><label className="fl">Nome do Treinamento <span style={{ color: 'var(--er)' }}>*</span></label><input className="inp" value={form.nome_treinamento} onChange={e => set('nome_treinamento', e.target.value)} required placeholder="Ex: Tom de Voz Open — Módulo 1" /></div>
            <div className="fg"><label className="fl">Data de Realização</label><input className="inp" type="date" value={form.data_realizacao} onChange={e => set('data_realizacao', e.target.value)} required /></div>
            <div className="fg"><label className="fl">Nível</label><select className="sel" value={form.nivel} onChange={e => set('nivel', e.target.value)}>{NIVEIS.map(n => <option key={n}>{n}</option>)}</select></div>
            <div className="fg"><label className="fl">Avaliação (0-10)</label><input className="inp" type="number" min="0" max="10" step="0.1" value={form.avaliacao ?? 0} onChange={e => set('avaliacao', parseFloat(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Carga Horária (h)</label><input className="inp" type="number" min="0" value={form.horas} onChange={e => set('horas', parseInt(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Certificado</label><select className="sel" value={form.certificado} onChange={e => set('certificado', e.target.value)}>{CERTS.map(c => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div className="fg"><label className="fl">Observações</label><textarea className="txa" style={{ minHeight: '48px' }} value={form.observacoes ?? ''} onChange={e => set('observacoes', e.target.value)} /></div>
        </form>
      </Modal>
    </div>
  )
}
