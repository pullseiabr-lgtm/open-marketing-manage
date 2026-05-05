'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import KpiCard from '@/components/ui/KpiCard'
import KanbanBoard from '@/components/kanban/KanbanBoard'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { showToast } from '@/components/ui/Toast'
import { confirmDialog } from '@/components/ui/ConfirmDialog'
import { moneyK, PIPE_PROBS, tempLabel } from '@/lib/utils'
import type { Lead, LeadInput, LeadEtapa, LeadTemperatura } from '@/types'

const ETAPAS: LeadEtapa[] = ['Lead Gerado','Contato Realizado','Proposta Enviada','Negociação','Fechado','Perdido']
const TEMPS: LeadTemperatura[] = ['hot','warm','cold']
const ORIGENS = ['Google Ads','Instagram','WhatsApp','LinkedIn','Indicação','YouTube','Marketplace','Prospecção']
const SEGS = ['Metalúrgico','Industrial','Químico','Têxtil','Alimentício','Logística','Automotivo','Outro']

const BLANK: LeadInput = {
  nome: '', contato: '', telefone: '', segmento: 'Industrial',
  origem: 'WhatsApp', etapa: 'Lead Gerado', valor_potencial: 0,
  responsavel: '', temperatura: 'cold', observacoes: '', ordem_etapa: 0,
}

export default function PipelinePage() {
  const supabase = createClient()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<LeadInput>(BLANK)
  const [editId, setEditId] = useState<string | null>(null)
  const [filtResp, setFiltResp] = useState('')

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Lead[]
    },
  })

  const save = useMutation({
    mutationFn: async (p: LeadInput & { id?: string }) => {
      const { id, ...rest } = p
      if (id) {
        const lead = leads.find(l => l.id === id)
        const { error } = await supabase.from('leads').update(rest).eq('id', id)
        if (error) throw error
        if (lead && lead.etapa !== rest.etapa) {
          await supabase.from('lead_historico').insert({
            lead_id: id, evento: 'Etapa alterada', detalhe: `${lead.etapa} → ${rest.etapa}`,
            temperatura: rest.temperatura, responsavel: rest.responsavel,
            etapa_anterior: lead.etapa, etapa_nova: rest.etapa,
          })
        }
      } else {
        const { data: newLead, error } = await supabase.from('leads').insert(rest).select().single()
        if (error) throw error
        await supabase.from('lead_historico').insert({
          lead_id: newLead.id, evento: 'Lead cadastrado',
          detalhe: `Origem: ${rest.origem}`,
          temperatura: rest.temperatura, responsavel: rest.responsavel,
          etapa_nova: rest.etapa,
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      showToast(editId ? 'Lead atualizado!' : 'Lead cadastrado!')
      setModal(false)
    },
    onError: () => showToast('Erro ao salvar.', 'er'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); showToast('Lead removido!') },
    onError: () => showToast('Erro ao excluir.', 'er'),
  })

  const moveCard = useMutation({
    mutationFn: async ({ leadId, newEtapa }: { leadId: string; newEtapa: LeadEtapa }) => {
      const lead = leads.find(l => l.id === leadId)
      if (!lead || lead.etapa === newEtapa) return
      const { error } = await supabase.from('leads').update({ etapa: newEtapa }).eq('id', leadId)
      if (error) throw error
      await supabase.from('lead_historico').insert({
        lead_id: leadId, evento: 'Movido no kanban',
        detalhe: `${lead.etapa} → ${newEtapa}`,
        temperatura: lead.temperatura, responsavel: lead.responsavel,
        etapa_anterior: lead.etapa, etapa_nova: newEtapa,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
    onError: () => showToast('Erro ao mover card.', 'er'),
  })

  function openNew() { setForm(BLANK); setEditId(null); setModal(true) }
  function openEdit(lead: Lead) {
    setForm({
      nome: lead.nome, contato: lead.contato ?? '', telefone: lead.telefone ?? '',
      segmento: lead.segmento ?? 'Industrial', origem: lead.origem, etapa: lead.etapa,
      valor_potencial: lead.valor_potencial, responsavel: lead.responsavel ?? '',
      temperatura: lead.temperatura, observacoes: lead.observacoes ?? '', ordem_etapa: lead.ordem_etapa,
    })
    setEditId(lead.id); setModal(true)
  }
  function handleDelete(lead: Lead) {
    confirmDialog(`Excluir lead "${lead.nome}"?`, () => remove.mutate(lead.id))
  }
  function set(k: keyof LeadInput, v: string | number) { setForm(f => ({ ...f, [k]: v })) }
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); save.mutate(editId ? { ...form, id: editId } : form) }

  const filtered = leads.filter(l => !filtResp || l.responsavel === filtResp)
  const responsaveis = [...new Set(leads.map(l => l.responsavel).filter(Boolean))] as string[]

  const fechados = leads.filter(l => l.etapa === 'Fechado')
  const totValor = leads.reduce((s, l) => s + l.valor_potencial, 0)
  const forecast = leads.reduce((s, l) => {
    const idx = ETAPAS.indexOf(l.etapa)
    return s + l.valor_potencial * (PIPE_PROBS[l.etapa] ?? 0) / 100
  }, 0)

  const kpis = [
    { cor: 'var(--or)', icon: '<line x1="12" y1="1" x2="12" y2="23"/>', label: 'Pipeline Total', value: moneyK(totValor), sub: 'Valor potencial' },
    { cor: 'var(--ok)', icon: '<polyline points="20 6 9 17 4 12"/>', label: 'Fechados', value: fechados.length, sub: `${moneyK(fechados.reduce((s,l) => s+l.valor_potencial,0))} gerado` },
    { cor: 'var(--wr)', icon: '<circle cx="12" cy="12" r="10"/>', label: 'Forecast Pond.', value: moneyK(forecast), sub: 'Ponderado por etapa' },
    { cor: 'var(--cy)', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5"/>', label: 'Em Negociação', value: leads.filter(l => l.etapa === 'Negociação').length, sub: 'Alta probabilidade' },
    { cor: 'var(--er)', icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', label: 'Quentes 🔥', value: leads.filter(l => l.temperatura === 'hot').length, sub: 'Atenção imediata' },
  ]

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-tt">Pipeline Comercial</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select className="sel" style={{ width: 'auto', fontSize: '11px' }} value={filtResp} onChange={e => setFiltResp(e.target.value)}>
            <option value="">Todos responsáveis</option>
            {responsaveis.map(r => <option key={r}>{r}</option>)}
          </select>
          <button className="btn p sm" onClick={openNew}>+ Novo Lead</button>
        </div>
      </div>

      <div className="kpi-grid">{kpis.map((k, i) => <KpiCard key={i} {...k} />)}</div>

      <KanbanBoard
        leads={filtered}
        onMoveCard={(leadId, newEtapa) => moveCard.mutate({ leadId, newEtapa })}
        onEditCard={openEdit}
        onDeleteCard={handleDelete}
      />

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? `Editar Lead — ${form.nome}` : 'Novo Lead'}
        size="lg"
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
            <div className="fg"><label className="fl">Nome / Empresa <span style={{ color: 'var(--er)' }}>*</span></label><input className="inp" value={form.nome} onChange={e => set('nome', e.target.value)} required placeholder="Ex: Metalúrgica Souza Ltda" /></div>
            <div className="fg"><label className="fl">Contato</label><input className="inp" value={form.contato ?? ''} onChange={e => set('contato', e.target.value)} placeholder="Nome e cargo" /></div>
            <div className="fg"><label className="fl">Telefone</label><input className="inp" value={form.telefone ?? ''} onChange={e => set('telefone', e.target.value)} placeholder="(11) 99999-0000" /></div>
            <div className="fg"><label className="fl">Segmento</label><select className="sel" value={form.segmento ?? 'Industrial'} onChange={e => set('segmento', e.target.value)}>{SEGS.map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="fg"><label className="fl">Origem</label><select className="sel" value={form.origem} onChange={e => set('origem', e.target.value)}>{ORIGENS.map(o => <option key={o}>{o}</option>)}</select></div>
            <div className="fg"><label className="fl">Etapa</label><select className="sel" value={form.etapa} onChange={e => set('etapa', e.target.value as LeadEtapa)}>{ETAPAS.map(e => <option key={e}>{e}</option>)}</select></div>
            <div className="fg"><label className="fl">Valor Potencial (R$)</label><input className="inp" type="number" min="0" step="0.01" value={form.valor_potencial} onChange={e => set('valor_potencial', parseFloat(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Responsável</label><input className="inp" value={form.responsavel ?? ''} onChange={e => set('responsavel', e.target.value)} placeholder="Nome do vendedor" /></div>
            <div className="fg"><label className="fl">Temperatura</label>
              <select className="sel" value={form.temperatura} onChange={e => set('temperatura', e.target.value as LeadTemperatura)}>
                {TEMPS.map(t => <option key={t} value={t}>{tempLabel(t)}</option>)}
              </select>
            </div>
          </div>
          <div className="fg"><label className="fl">Observações</label><textarea className="txa" value={form.observacoes ?? ''} onChange={e => set('observacoes', e.target.value)} placeholder="Detalhes do equipamento, urgência, etc." /></div>
        </form>
      </Modal>
    </div>
  )
}
