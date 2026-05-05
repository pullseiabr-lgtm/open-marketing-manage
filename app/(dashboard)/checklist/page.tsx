'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { showToast } from '@/components/ui/Toast'
import { confirmDialog } from '@/components/ui/ConfirmDialog'
import type { ChecklistItem, ChecklistItemInput, Frequencia } from '@/types'

const FREQS: Frequencia[] = ['Diário','Semanal','Mensal','Único']
const CATS = ['Mídia','Comercial','Conteúdo','Atendimento','Operação','Geral']

const BLANK: ChecklistItemInput = {
  texto: '', categoria: 'Geral', frequencia: 'Semanal', concluido: false, responsavel: '',
}

export default function ChecklistPage() {
  const supabase = createClient()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<ChecklistItemInput>(BLANK)
  const [editId, setEditId] = useState<string | null>(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['checklist_items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checklist_items').select('*').order('categoria').order('created_at')
      if (error) throw error
      return data as ChecklistItem[]
    },
  })

  const save = useMutation({
    mutationFn: async (p: ChecklistItemInput & { id?: string }) => {
      const { id, ...rest } = p
      if (id) { const { error } = await supabase.from('checklist_items').update(rest).eq('id', id); if (error) throw error }
      else { const { error } = await supabase.from('checklist_items').insert(rest); if (error) throw error }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['checklist_items'] }); showToast('Item salvo!'); setModal(false) },
    onError: () => showToast('Erro ao salvar.', 'er'),
  })

  const toggle = useMutation({
    mutationFn: async ({ id, concluido }: { id: string; concluido: boolean }) => {
      const { error } = await supabase.from('checklist_items')
        .update({ concluido, data_conclusao: concluido ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklist_items'] }),
    onError: () => showToast('Erro ao atualizar.', 'er'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('checklist_items').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['checklist_items'] }); showToast('Item removido!') },
    onError: () => showToast('Erro ao excluir.', 'er'),
  })

  const resetAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('checklist_items').update({ concluido: false, data_conclusao: null }).neq('id', '')
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['checklist_items'] }); showToast('Checklist resetado!') },
    onError: () => showToast('Erro ao resetar.', 'er'),
  })

  function openNew() { setForm(BLANK); setEditId(null); setModal(true) }
  function openEdit(item: ChecklistItem) {
    setForm({ texto: item.texto, categoria: item.categoria, frequencia: item.frequencia, concluido: item.concluido, responsavel: item.responsavel ?? '' })
    setEditId(item.id); setModal(true)
  }
  function set(k: keyof ChecklistItemInput, v: string | boolean) { setForm(f => ({ ...f, [k]: v })) }
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); save.mutate(editId ? { ...form, id: editId } : form) }

  // Agrupar por categoria
  const byCategory: Record<string, ChecklistItem[]> = {}
  items.forEach(item => { if (!byCategory[item.categoria]) byCategory[item.categoria] = []; byCategory[item.categoria].push(item) })

  const done = items.filter(i => i.concluido).length
  const total = items.length
  const pct = total ? Math.round((done / total) * 100) : 0

  const freqBadge: Record<Frequencia, string> = {
    'Diário': 't-or', 'Semanal': 't-cy', 'Mensal': 't-bl', 'Único': 't-pu'
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-tt">Checklist Operacional</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn sm" onClick={() => confirmDialog('Resetar todo o checklist?', () => resetAll.mutate())}>↻ Reset</button>
          <button className="btn p sm" onClick={openNew}>+ Item</button>
        </div>
      </div>

      {/* Progresso */}
      <div style={{ marginBottom: '14px', background: 'var(--bk2)', border: '1px solid var(--bk4)', borderRadius: 'var(--r2)', padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--wh)' }}>Progresso semanal</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--or)', fontWeight: 700 }}>{done}/{total} — {pct}%</span>
        </div>
        <div className="prog" style={{ height: '6px' }}>
          <div className="pb" style={{ width: `${pct}%`, background: pct >= 75 ? 'var(--ok)' : pct >= 40 ? 'var(--wr)' : 'var(--or)' }} />
        </div>
      </div>

      {/* Colunas por categoria */}
      <div className="g3">
        {Object.entries(byCategory).map(([cat, catItems]) => (
          <div key={cat}>
            <div className="chk-sec">
              {cat} <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', color: 'var(--gr3)' }}>
                {catItems.filter(i => i.concluido).length}/{catItems.length}
              </span>
            </div>
            {catItems.map(item => (
              <div key={item.id} style={{ position: 'relative' }}>
                <button
                  className={`chk-item${item.concluido ? ' done' : ''}`}
                  onClick={() => toggle.mutate({ id: item.id, concluido: !item.concluido })}
                >
                  <div className={`chk-ico${item.concluido ? ' done' : ''}`} style={item.concluido ? { background: 'rgba(34,197,94,.15)', color: 'var(--ok)', borderColor: 'rgba(34,197,94,.3)' } : {}}>
                    {item.concluido ? '✓' : ''}
                  </div>
                  <div className="chk-txt">
                    {item.texto}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      <span className={`tag ${freqBadge[item.frequencia as Frequencia] ?? 't-gr'}`} style={{ fontSize: '8.5px' }}>{item.frequencia}</span>
                    </div>
                  </div>
                </button>
                <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '2px' }}>
                  <button className="ib" style={{ width: '20px', height: '20px' }} onClick={e => { e.stopPropagation(); openEdit(item) }}>
                    <svg viewBox="0 0 24 24" style={{ width: '9px', height: '9px' }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className="ib rd" style={{ width: '20px', height: '20px' }} onClick={e => { e.stopPropagation(); confirmDialog(`Excluir "${item.texto}"?`, () => remove.mutate(item.id)) }}>
                    <svg viewBox="0 0 24 24" style={{ width: '9px', height: '9px' }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="empty"><p>Nenhum item no checklist. Clique em "+ Item" para adicionar.</p></div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar Item' : 'Novo Item de Checklist'}
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn p" onClick={handleSubmit} disabled={save.isPending}>{save.isPending ? 'Salvando...' : '✓ Salvar'}</button></>}>
        <form onSubmit={handleSubmit}>
          <div className="fg"><label className="fl">Tarefa <span style={{ color: 'var(--er)' }}>*</span></label><input className="inp" value={form.texto} onChange={e => set('texto', e.target.value)} required placeholder="Ex: Revisar campanhas ativas" /></div>
          <div className="g2">
            <div className="fg"><label className="fl">Categoria</label><select className="sel" value={form.categoria} onChange={e => set('categoria', e.target.value)}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div className="fg"><label className="fl">Frequência</label><select className="sel" value={form.frequencia} onChange={e => set('frequencia', e.target.value)}>{FREQS.map(f => <option key={f}>{f}</option>)}</select></div>
            <div className="fg"><label className="fl">Responsável</label><input className="inp" value={form.responsavel ?? ''} onChange={e => set('responsavel', e.target.value)} /></div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
