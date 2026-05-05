'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import StatusTag from '@/components/ui/StatusTag'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { showToast } from '@/components/ui/Toast'
import { confirmDialog } from '@/components/ui/ConfirmDialog'
import { pct, formatDate, PLATAFORMAS } from '@/lib/utils'
import type { Campanha, CampanhaInput, CampanhaStatus } from '@/types'

const STATUS: CampanhaStatus[] = ['Ativa','Pausada','Escala','Encerrada','Rascunho']

const BLANK: CampanhaInput = {
  nome: '', plataforma: 'Google Ads', criativo: '', copy_texto: '', oferta: '',
  responsavel: '', data_inicio: '', data_fim: '', impressoes: 0, cliques: 0,
  leads: 0, vendas: 0, budget: 0, receita: 0, status: 'Ativa',
}

export default function CampanhasPage() {
  const supabase = createClient()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<CampanhaInput>(BLANK)
  const [editId, setEditId] = useState<string | null>(null)
  const [filtPlat, setFiltPlat] = useState('')
  const [filtStatus, setFiltStatus] = useState('')

  const { data: campanhas = [], isLoading } = useQuery({
    queryKey: ['campanhas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campanhas').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Campanha[]
    },
  })

  const save = useMutation({
    mutationFn: async (p: CampanhaInput & { id?: string }) => {
      const { id, ...rest } = p
      if (id) {
        const { error } = await supabase.from('campanhas').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('campanhas').insert(rest)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campanhas'] })
      showToast(editId ? 'Campanha atualizada!' : 'Campanha salva!')
      setModal(false)
    },
    onError: () => showToast('Erro ao salvar.', 'er'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campanhas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campanhas'] })
      showToast('Excluído!')
    },
    onError: () => showToast('Erro ao excluir.', 'er'),
  })

  function openNew() { setForm(BLANK); setEditId(null); setModal(true) }
  function openEdit(c: Campanha) {
    setForm({
      nome: c.nome, plataforma: c.plataforma, criativo: c.criativo ?? '',
      copy_texto: c.copy_texto ?? '', oferta: c.oferta ?? '',
      responsavel: c.responsavel ?? '', data_inicio: c.data_inicio ?? '',
      data_fim: c.data_fim ?? '', impressoes: c.impressoes, cliques: c.cliques,
      leads: c.leads, vendas: c.vendas, budget: c.budget, receita: c.receita, status: c.status,
    })
    setEditId(c.id); setModal(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    save.mutate(editId ? { ...form, id: editId } : form)
  }

  function set(k: keyof CampanhaInput, v: string | number) {
    setForm(f => ({ ...f, [k]: v }))
  }

  const filtered = campanhas.filter(c =>
    (!filtPlat   || c.plataforma === filtPlat) &&
    (!filtStatus || c.status === filtStatus)
  )

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-tt">Gestão de Campanhas</div>
        <button className="btn p sm" onClick={openNew}>+ Nova Campanha</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <select className="sel" style={{ width: 'auto', fontSize: '11px' }} value={filtPlat} onChange={e => setFiltPlat(e.target.value)}>
          <option value="">Todas plataformas</option>
          {PLATAFORMAS.map(p => <option key={p}>{p}</option>)}
        </select>
        <select className="sel" style={{ width: 'auto', fontSize: '11px' }} value={filtStatus} onChange={e => setFiltStatus(e.target.value)}>
          <option value="">Todos status</option>
          {STATUS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Campanha</th><th>Plataforma</th><th>Criativo</th><th>Oferta</th>
                <th>Impressões</th><th>Cliques</th><th>Leads</th><th>Vendas</th>
                <th>Conv.%</th><th>Status</th><th>Período</th><th>Resp.</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={13} style={{ textAlign: 'center', padding: '24px', color: 'var(--gr3)' }}>
                  Nenhuma campanha encontrada.
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.nome}</strong></td>
                  <td><span className="tag t-bl">{c.plataforma}</span></td>
                  <td style={{ fontSize: '10.5px', maxWidth: '140px', color: 'var(--gr3)' }}>{c.criativo}</td>
                  <td style={{ fontSize: '10.5px', maxWidth: '120px' }}>{c.oferta}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{c.impressoes >= 1000 ? `${(c.impressoes / 1000).toFixed(1)}K` : c.impressoes}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{c.cliques}</td>
                  <td style={{ fontWeight: 700, color: 'var(--or)', fontFamily: 'var(--mono)' }}>{c.leads}</td>
                  <td style={{ fontWeight: 700, color: 'var(--ok)', fontFamily: 'var(--mono)' }}>{c.vendas}</td>
                  <td>{pct(c.vendas, c.leads)}</td>
                  <td><StatusTag status={c.status} /></td>
                  <td style={{ fontSize: '10.5px', color: 'var(--gr3)' }}>{formatDate(c.data_inicio)} – {formatDate(c.data_fim)}</td>
                  <td>{c.responsavel}</td>
                  <td>
                    <div className="ab">
                      <button className="ib" onClick={() => openEdit(c)}>
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="ib rd" onClick={() => confirmDialog('Excluir esta campanha?', () => remove.mutate(c.id))}>
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
        title={editId ? 'Editar Campanha' : 'Nova Campanha'}
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
            <div className="fg" style={{ gridColumn: '1 / -1' }}>
              <label className="fl">Nome da Campanha <span style={{ color: 'var(--er)' }}>*</span></label>
              <input className="inp" value={form.nome} onChange={e => set('nome', e.target.value)} required placeholder="Ex: Google — Pesquisa Intenção Direta" />
            </div>
            <div className="fg">
              <label className="fl">Plataforma</label>
              <select className="sel" value={form.plataforma} onChange={e => set('plataforma', e.target.value)}>
                {PLATAFORMAS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Status</label>
              <select className="sel" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Criativo</label>
              <input className="inp" value={form.criativo ?? ''} onChange={e => set('criativo', e.target.value)} placeholder="Ex: Carrossel — Diagnóstico ao vivo" />
            </div>
            <div className="fg">
              <label className="fl">Oferta</label>
              <input className="inp" value={form.oferta ?? ''} onChange={e => set('oferta', e.target.value)} placeholder="Ex: Diagnóstico gratuito" />
            </div>
            <div className="fg">
              <label className="fl">Data Início</label>
              <input className="inp" type="date" value={form.data_inicio ?? ''} onChange={e => set('data_inicio', e.target.value)} />
            </div>
            <div className="fg">
              <label className="fl">Data Fim</label>
              <input className="inp" type="date" value={form.data_fim ?? ''} onChange={e => set('data_fim', e.target.value)} />
            </div>
            <div className="fg">
              <label className="fl">Budget (R$)</label>
              <input className="inp" type="number" min="0" step="0.01" value={form.budget} onChange={e => set('budget', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="fg">
              <label className="fl">Receita (R$)</label>
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
            <div className="fg">
              <label className="fl">Responsável</label>
              <input className="inp" value={form.responsavel ?? ''} onChange={e => set('responsavel', e.target.value)} placeholder="Nome do responsável" />
            </div>
          </div>
          <div className="fg">
            <label className="fl">Copy / Texto do anúncio</label>
            <textarea className="txa" value={form.copy_texto ?? ''} onChange={e => set('copy_texto', e.target.value)} placeholder="Texto principal do anúncio" />
          </div>
        </form>
      </Modal>
    </div>
  )
}
