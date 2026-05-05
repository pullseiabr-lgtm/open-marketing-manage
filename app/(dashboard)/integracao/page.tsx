'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import StatusTag from '@/components/ui/StatusTag'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { showToast } from '@/components/ui/Toast'
import { confirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate, PLATAFORMAS } from '@/lib/utils'
import type { Integracao, IntegracaoInput, IntegracaoStatus } from '@/types'

const STATUS: IntegracaoStatus[] = ['Ativa','Inativa','Pausada','Encerrada']

const BLANK: IntegracaoInput = {
  campanha_digital: '', acao_fisica: '', oferta: '', conversoes_offline: 0,
  canal_digital: 'Instagram', periodo: new Date().toISOString().slice(0, 7),
  status: 'Ativa', responsavel: '', observacoes: '',
}

export default function IntegracaoPage() {
  const supabase = createClient()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<IntegracaoInput>(BLANK)
  const [editId, setEditId] = useState<string | null>(null)

  const { data: integracoes = [], isLoading } = useQuery({
    queryKey: ['integracoes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('integracoes').select('*').order('periodo', { ascending: false })
      if (error) throw error
      return data as Integracao[]
    },
  })

  const save = useMutation({
    mutationFn: async (p: IntegracaoInput & { id?: string }) => {
      const { id, ...rest } = p
      if (id) { const { error } = await supabase.from('integracoes').update(rest).eq('id', id); if (error) throw error }
      else { const { error } = await supabase.from('integracoes').insert(rest); if (error) throw error }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['integracoes'] }); showToast('Integração salva!'); setModal(false) },
    onError: () => showToast('Erro ao salvar.', 'er'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('integracoes').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['integracoes'] }); showToast('Excluído!') },
    onError: () => showToast('Erro ao excluir.', 'er'),
  })

  function openNew() { setForm(BLANK); setEditId(null); setModal(true) }
  function openEdit(i: Integracao) {
    setForm({ campanha_digital: i.campanha_digital, acao_fisica: i.acao_fisica, oferta: i.oferta ?? '', conversoes_offline: i.conversoes_offline, canal_digital: i.canal_digital, periodo: i.periodo, status: i.status, responsavel: i.responsavel ?? '', observacoes: i.observacoes ?? '' })
    setEditId(i.id); setModal(true)
  }
  function set(k: keyof IntegracaoInput, v: string | number) { setForm(f => ({ ...f, [k]: v })) }
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); save.mutate(editId ? { ...form, id: editId } : form) }

  const totalConv = integracoes.reduce((s, i) => s + i.conversoes_offline, 0)

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-tt">Integração Digital + Offline</div>
        <button className="btn p sm" onClick={openNew}>+ Nova Integração</button>
      </div>

      {/* KPI resumo */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi" style={{ borderTop: '2px solid var(--or)' }}>
          <div className="kpi-l">TOTAL INTEGRAÇÕES</div>
          <div className="kpi-v">{integracoes.length}</div>
          <div className="kpi-s">{integracoes.filter(i => i.status === 'Ativa').length} ativas</div>
        </div>
        <div className="kpi" style={{ borderTop: '2px solid var(--ok)' }}>
          <div className="kpi-l">CONV. OFFLINE</div>
          <div className="kpi-v">{totalConv}</div>
          <div className="kpi-s">Total de conversões físicas</div>
        </div>
        <div className="kpi" style={{ borderTop: '2px solid var(--cy)' }}>
          <div className="kpi-l">CANAIS ATIVOS</div>
          <div className="kpi-v">{new Set(integracoes.filter(i => i.status === 'Ativa').map(i => i.canal_digital)).size}</div>
          <div className="kpi-s">Canais digitais integrados</div>
        </div>
      </div>

      <div className="card">
        <div className="tw">
          <table>
            <thead>
              <tr><th>Campanha Digital</th><th>Ação Física</th><th>Oferta</th><th>Conv. Offline</th><th>Canal Digital</th><th>Período</th><th>Status</th><th>Resp.</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {integracoes.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: 'var(--gr3)' }}>Nenhuma integração registrada.</td></tr>
              ) : integracoes.map(i => (
                <tr key={i.id}>
                  <td><strong>{i.campanha_digital}</strong></td>
                  <td style={{ fontSize: '10.5px', color: 'var(--gr3)' }}>{i.acao_fisica}</td>
                  <td style={{ fontSize: '10.5px' }}>{i.oferta}</td>
                  <td style={{ fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--ok)' }}>{i.conversoes_offline}</td>
                  <td><span className="tag t-bl">{i.canal_digital}</span></td>
                  <td style={{ fontSize: '10.5px', color: 'var(--gr3)' }}>{formatDate(i.periodo)}</td>
                  <td><StatusTag status={i.status} /></td>
                  <td>{i.responsavel}</td>
                  <td>
                    <div className="ab">
                      <button className="ib" onClick={() => openEdit(i)}><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                      <button className="ib rd" onClick={() => confirmDialog('Excluir esta integração?', () => remove.mutate(i.id))}><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar Integração' : 'Nova Integração'} size="lg"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn p" onClick={handleSubmit} disabled={save.isPending}>{save.isPending ? 'Salvando...' : '✓ Salvar'}</button></>}>
        <form onSubmit={handleSubmit}>
          <div className="g2">
            <div className="fg" style={{ gridColumn: '1 / -1' }}><label className="fl">Campanha Digital <span style={{ color: 'var(--er)' }}>*</span></label><input className="inp" value={form.campanha_digital} onChange={e => set('campanha_digital', e.target.value)} required placeholder="Ex: Instagram — Campanha Autoridade" /></div>
            <div className="fg" style={{ gridColumn: '1 / -1' }}><label className="fl">Ação Física <span style={{ color: 'var(--er)' }}>*</span></label><input className="inp" value={form.acao_fisica} onChange={e => set('acao_fisica', e.target.value)} required placeholder="Ex: Cupom QR Code no PDV" /></div>
            <div className="fg"><label className="fl">Oferta</label><input className="inp" value={form.oferta ?? ''} onChange={e => set('oferta', e.target.value)} placeholder="Ex: 10% desconto na 1ª peça" /></div>
            <div className="fg"><label className="fl">Conversões Offline</label><input className="inp" type="number" min="0" value={form.conversoes_offline} onChange={e => set('conversoes_offline', parseInt(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Canal Digital</label><select className="sel" value={form.canal_digital} onChange={e => set('canal_digital', e.target.value)}>{PLATAFORMAS.map(p => <option key={p}>{p}</option>)}</select></div>
            <div className="fg"><label className="fl">Período</label><input className="inp" type="month" value={form.periodo} onChange={e => set('periodo', e.target.value)} required /></div>
            <div className="fg"><label className="fl">Status</label><select className="sel" value={form.status} onChange={e => set('status', e.target.value)}>{STATUS.map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="fg"><label className="fl">Responsável</label><input className="inp" value={form.responsavel ?? ''} onChange={e => set('responsavel', e.target.value)} /></div>
          </div>
          <div className="fg"><label className="fl">Observações</label><textarea className="txa" style={{ minHeight: '48px' }} value={form.observacoes ?? ''} onChange={e => set('observacoes', e.target.value)} /></div>
        </form>
      </Modal>
    </div>
  )
}
