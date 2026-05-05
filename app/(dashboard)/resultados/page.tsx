'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { showToast } from '@/components/ui/Toast'
import { confirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/lib/utils'
import type { Analise, AnaliseInput } from '@/types'

const BLANK: AnaliseInput = {
  periodo: new Date().toISOString().slice(0, 7),
  responsavel: '', melhor_campanha: '', criativo_vencedor: '',
  publico_eficiente: '', canal_maior_roi: '', funcionou: '', nao_funcionou: '', otimizacoes: '',
}

export default function ResultadosPage() {
  const supabase = createClient()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<AnaliseInput>(BLANK)
  const [editId, setEditId] = useState<string | null>(null)

  const { data: analises = [], isLoading } = useQuery({
    queryKey: ['analises'],
    queryFn: async () => {
      const { data, error } = await supabase.from('analises').select('*').order('periodo', { ascending: false })
      if (error) throw error
      return data as Analise[]
    },
  })

  const save = useMutation({
    mutationFn: async (p: AnaliseInput & { id?: string }) => {
      const { id, ...rest } = p
      if (id) {
        const { error } = await supabase.from('analises').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('analises').insert(rest)
        if (error) throw error
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['analises'] }); showToast('Análise salva!'); setModal(false) },
    onError: () => showToast('Erro ao salvar.', 'er'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('analises').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['analises'] }); showToast('Excluído!') },
    onError: () => showToast('Erro ao excluir.', 'er'),
  })

  function openNew() { setForm(BLANK); setEditId(null); setModal(true) }
  function openEdit(a: Analise) {
    setForm({
      periodo: a.periodo, responsavel: a.responsavel ?? '', melhor_campanha: a.melhor_campanha ?? '',
      criativo_vencedor: a.criativo_vencedor ?? '', publico_eficiente: a.publico_eficiente ?? '',
      canal_maior_roi: a.canal_maior_roi ?? '', funcionou: a.funcionou ?? '',
      nao_funcionou: a.nao_funcionou ?? '', otimizacoes: a.otimizacoes ?? '',
    })
    setEditId(a.id); setModal(true)
  }

  function set(k: keyof AnaliseInput, v: string) { setForm(f => ({ ...f, [k]: v })) }
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); save.mutate(editId ? { ...form, id: editId } : form) }

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-tt">Resultados & Análise Estratégica</div>
        <button className="btn p sm" onClick={openNew}>+ Nova Análise</button>
      </div>

      {/* Destaques */}
      {analises.length > 0 && (
        <div className="g11" style={{ marginBottom: '14px' }}>
          <div className="card">
            <div className="card-hd"><div className="card-tt">🏆 Vencedores do Período</div></div>
            <div className="card-bd">
              {analises.slice(0, 3).map(a => (
                <div key={a.id} style={{ display: 'flex', gap: '8px', marginBottom: '10px', padding: '10px', background: 'var(--bk3)', borderRadius: 'var(--r)', borderLeft: '3px solid var(--ok)' }}>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--gr3)', marginBottom: '2px' }}>{formatDate(a.periodo)}</div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600 }}>📣 Campanha: <span style={{ color: 'var(--or)' }}>{a.melhor_campanha}</span></div>
                    <div style={{ fontSize: '11px', color: 'var(--gr3)', marginTop: '2px' }}>Canal ROI: {a.canal_maior_roi} · Criativo: {a.criativo_vencedor}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-hd"><div className="card-tt">📉 Oportunidades de Melhoria</div></div>
            <div className="card-bd">
              {analises.slice(0, 3).map(a => a.nao_funcionou ? (
                <div key={a.id} style={{ display: 'flex', gap: '8px', marginBottom: '10px', padding: '10px', background: 'var(--bk3)', borderRadius: 'var(--r)', borderLeft: '3px solid var(--er)' }}>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--gr3)', marginBottom: '2px' }}>{formatDate(a.periodo)}</div>
                    <div style={{ fontSize: '11px' }}>{a.nao_funcionou}</div>
                    {a.otimizacoes && <div style={{ fontSize: '10.5px', color: 'var(--or)', marginTop: '4px' }}>→ {a.otimizacoes}</div>}
                  </div>
                </div>
              ) : null)}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-hd"><div className="card-tt">Análises Registradas</div></div>
        <div className="tw">
          <table>
            <thead>
              <tr><th>Período</th><th>Melhor Campanha</th><th>Criativo Vencedor</th><th>Público</th><th>Canal ROI</th><th>Resp.</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {analises.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--gr3)' }}>Nenhuma análise registrada.</td></tr>
              ) : analises.map(a => (
                <tr key={a.id}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '11px' }}>{formatDate(a.periodo)}</td>
                  <td><strong>{a.melhor_campanha}</strong></td>
                  <td style={{ color: 'var(--gr3)', fontSize: '10.5px' }}>{a.criativo_vencedor}</td>
                  <td style={{ color: 'var(--gr3)', fontSize: '10.5px' }}>{a.publico_eficiente}</td>
                  <td><span className="tag t-ok">{a.canal_maior_roi}</span></td>
                  <td>{a.responsavel}</td>
                  <td>
                    <div className="ab">
                      <button className="ib" onClick={() => openEdit(a)}><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                      <button className="ib rd" onClick={() => confirmDialog('Excluir esta análise?', () => remove.mutate(a.id))}><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar Análise' : 'Nova Análise'} size="lg"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn p" onClick={handleSubmit} disabled={save.isPending}>{save.isPending ? 'Salvando...' : '✓ Salvar'}</button></>}>
        <form onSubmit={handleSubmit}>
          <div className="g2">
            <div className="fg"><label className="fl">Período</label><input className="inp" type="month" value={form.periodo} onChange={e => set('periodo', e.target.value)} required /></div>
            <div className="fg"><label className="fl">Responsável</label><input className="inp" value={form.responsavel ?? ''} onChange={e => set('responsavel', e.target.value)} /></div>
            <div className="fg"><label className="fl">Melhor Campanha</label><input className="inp" value={form.melhor_campanha ?? ''} onChange={e => set('melhor_campanha', e.target.value)} /></div>
            <div className="fg"><label className="fl">Criativo Vencedor</label><input className="inp" value={form.criativo_vencedor ?? ''} onChange={e => set('criativo_vencedor', e.target.value)} /></div>
            <div className="fg"><label className="fl">Público Eficiente</label><input className="inp" value={form.publico_eficiente ?? ''} onChange={e => set('publico_eficiente', e.target.value)} /></div>
            <div className="fg"><label className="fl">Canal com Maior ROI</label><input className="inp" value={form.canal_maior_roi ?? ''} onChange={e => set('canal_maior_roi', e.target.value)} /></div>
          </div>
          <div className="fg"><label className="fl">O que funcionou</label><textarea className="txa" value={form.funcionou ?? ''} onChange={e => set('funcionou', e.target.value)} /></div>
          <div className="fg"><label className="fl">O que não funcionou</label><textarea className="txa" value={form.nao_funcionou ?? ''} onChange={e => set('nao_funcionou', e.target.value)} /></div>
          <div className="fg"><label className="fl">Otimizações recomendadas</label><textarea className="txa" value={form.otimizacoes ?? ''} onChange={e => set('otimizacoes', e.target.value)} /></div>
        </form>
      </Modal>
    </div>
  )
}
