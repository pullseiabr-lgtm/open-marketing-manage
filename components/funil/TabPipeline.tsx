'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { showToast } from '@/components/ui/Toast'
import { confirmDialog } from '@/components/ui/ConfirmDialog'
import { slideStatusLabel, statusTagClass } from '@/lib/utils'
import type { ApresentacaoBloco, ApresentacaoSlide, ApresentacaoSlideInput, SlideStatus } from '@/types'

const STATUS: SlideStatus[] = ['rascunho', 'em_revisao', 'aprovado', 'entregue']

const STATUS_COLORS: Record<SlideStatus, string> = {
  rascunho: 'var(--gr3)',
  em_revisao: 'var(--wr)',
  aprovado: 'var(--ok)',
  entregue: 'var(--cy)',
}

const BLANK_SLIDE: Omit<ApresentacaoSlideInput, 'bloco_id'> = {
  numero: 1, titulo: '', descricao: '', status: 'rascunho', responsavel: '', observacoes: '',
}

export default function TabPipeline() {
  const supabase = createClient()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<ApresentacaoSlideInput>({ bloco_id: '', ...BLANK_SLIDE })
  const [editId, setEditId] = useState<string | null>(null)
  const [expandedBloco, setExpandedBloco] = useState<string | null>(null)

  const { data: blocos = [], isLoading: loadingBlocos } = useQuery({
    queryKey: ['apresentacao_blocos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apresentacao_blocos')
        .select('*, slides:apresentacao_slides(*)')
        .order('ordem')
      if (error) throw error
      return data as (ApresentacaoBloco & { slides: ApresentacaoSlide[] })[]
    },
  })

  const saveSlide = useMutation({
    mutationFn: async (p: ApresentacaoSlideInput & { id?: string }) => {
      const { id, ...rest } = p
      if (id) {
        const { error } = await supabase.from('apresentacao_slides').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('apresentacao_slides').insert(rest)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['apresentacao_blocos'] })
      showToast(editId ? 'Slide atualizado!' : 'Slide adicionado!')
      setModal(false)
    },
    onError: () => showToast('Erro ao salvar.', 'er'),
  })

  const removeSlide = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('apresentacao_slides').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['apresentacao_blocos'] })
      showToast('Slide removido!')
    },
    onError: () => showToast('Erro ao excluir.', 'er'),
  })

  const updateSlideStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SlideStatus }) => {
      const { error } = await supabase.from('apresentacao_slides').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['apresentacao_blocos'] }),
    onError: () => showToast('Erro ao atualizar status.', 'er'),
  })

  function openNew(blocoId: string) {
    setForm({ bloco_id: blocoId, ...BLANK_SLIDE })
    setEditId(null); setModal(true)
  }

  function openEdit(slide: ApresentacaoSlide) {
    setForm({
      bloco_id: slide.bloco_id, numero: slide.numero, titulo: slide.titulo,
      descricao: slide.descricao ?? '', status: slide.status,
      responsavel: slide.responsavel ?? '', observacoes: slide.observacoes ?? '',
    })
    setEditId(slide.id); setModal(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    saveSlide.mutate(editId ? { ...form, id: editId } : form)
  }

  function set(k: keyof ApresentacaoSlideInput, v: string | number) {
    setForm(f => ({ ...f, [k]: v }))
  }

  // Aggregate stats
  const totalSlides = blocos.reduce((s, b) => s + (b.slides?.length ?? 0), 0)
  const aprovados   = blocos.flatMap(b => b.slides ?? []).filter(s => s.status === 'aprovado' || s.status === 'entregue').length
  const pctConcl    = totalSlides ? Math.round((aprovados / totalSlides) * 100) : 0

  if (loadingBlocos) return <LoadingSpinner />

  return (
    <div>
      {/* Progresso geral */}
      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="card-hd">
          <div className="card-tt">Progresso da Apresentação</div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--or)', fontFamily: 'var(--mono)' }}>
            {aprovados}/{totalSlides} slides prontos
          </span>
        </div>
        <div className="card-bd">
          <div style={{ marginBottom: '10px' }}>
            <div className="prog">
              <div className="pb" style={{ width: `${pctConcl}%`, background: pctConcl >= 75 ? 'var(--ok)' : pctConcl >= 40 ? 'var(--wr)' : 'var(--or)' }} />
            </div>
            <div style={{ fontSize: '10px', color: 'var(--gr3)', marginTop: '4px', textAlign: 'right' }}>{pctConcl}% concluído</div>
          </div>

          {/* Status por bloco */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {STATUS.map(s => {
              const count = blocos.flatMap(b => b.slides ?? []).filter(sl => sl.status === s).length
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLORS[s] }} />
                  <span style={{ fontSize: '10.5px', color: 'var(--gr3)' }}>{slideStatusLabel(s)}: </span>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--wh)', fontFamily: 'var(--mono)' }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Blocos */}
      {blocos.map(bloco => {
        const slides = (bloco.slides ?? []).sort((a, b) => a.numero - b.numero)
        const isExpanded = expandedBloco === bloco.id
        const blocoAprov = slides.filter(s => s.status === 'aprovado' || s.status === 'entregue').length
        const blocoPct = slides.length ? Math.round((blocoAprov / slides.length) * 100) : 0

        return (
          <div key={bloco.id} className="card" style={{ marginBottom: '10px' }}>
            <div
              className="card-hd"
              style={{ cursor: 'pointer' }}
              onClick={() => setExpandedBloco(isExpanded ? null : bloco.id)}
            >
              <div className="card-tt">
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: bloco.cor, flexShrink: 0, display: 'inline-block' }} />
                {bloco.nome}
                <span style={{ fontSize: '9px', color: 'var(--gr3)', fontWeight: 400 }}>
                  Slides {bloco.slides_inicio}–{bloco.slides_fim}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '10px', color: 'var(--gr3)' }}>
                  {blocoAprov}/{slides.length}
                  <span style={{ display: 'inline-block', marginLeft: '6px', width: '60px', height: '4px', background: 'var(--bk4)', borderRadius: '4px', verticalAlign: 'middle', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${blocoPct}%`, background: bloco.cor, borderRadius: '4px' }} />
                  </span>
                </div>
                <button className="btn sm" onClick={e => { e.stopPropagation(); openNew(bloco.id) }}>+ Slide</button>
                <span style={{ color: 'var(--gr3)', fontSize: '12px' }}>{isExpanded ? '▲' : '▼'}</span>
              </div>
            </div>

            {isExpanded && (
              <div className="card-bd" style={{ padding: 0 }}>
                {slides.length === 0 ? (
                  <div className="empty">Nenhum slide neste bloco.</div>
                ) : (
                  <div className="tw">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: '48px' }}>Nº</th>
                          <th>Título</th>
                          <th>Responsável</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slides.map(slide => (
                          <tr key={slide.id}>
                            <td style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--gr3)' }}>
                              {String(slide.numero).padStart(2, '0')}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{slide.titulo}</div>
                              {slide.descricao && (
                                <div style={{ fontSize: '10.5px', color: 'var(--gr3)' }}>{slide.descricao}</div>
                              )}
                            </td>
                            <td style={{ fontSize: '10.5px', color: 'var(--gr3)' }}>{slide.responsavel || '—'}</td>
                            <td>
                              <select
                                className="sel"
                                style={{ width: 'auto', fontSize: '10px', padding: '3px 6px' }}
                                value={slide.status}
                                onChange={e => updateSlideStatus.mutate({ id: slide.id, status: e.target.value as SlideStatus })}
                              >
                                {STATUS.map(s => (
                                  <option key={s} value={s}>{slideStatusLabel(s)}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <div className="ab">
                                <button className="ib" onClick={() => openEdit(slide)}>
                                  <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button className="ib rd" onClick={() => confirmDialog(`Excluir slide "${slide.titulo}"?`, () => removeSlide.mutate(slide.id))}>
                                  <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Tabela resumo por bloco */}
      <div className="card">
        <div className="card-hd"><div className="card-tt">Resumo por Bloco</div></div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Bloco</th><th>Slides</th><th>Total</th><th>Rascunho</th><th>Em Revisão</th><th>Aprovado</th><th>Entregue</th><th>Progresso</th>
              </tr>
            </thead>
            <tbody>
              {blocos.map(bloco => {
                const slides = bloco.slides ?? []
                const counts: Record<SlideStatus, number> = { rascunho: 0, em_revisao: 0, aprovado: 0, entregue: 0 }
                slides.forEach(s => { counts[s.status]++ })
                const done = counts.aprovado + counts.entregue
                const p = slides.length ? Math.round((done / slides.length) * 100) : 0
                return (
                  <tr key={bloco.id}>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '3px', background: bloco.cor, flexShrink: 0 }} />
                        <strong>{bloco.nome}</strong>
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: '10.5px', color: 'var(--gr3)' }}>{bloco.slides_inicio}–{bloco.slides_fim}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{slides.length}</td>
                    <td><span className="tag t-gr">{counts.rascunho}</span></td>
                    <td><span className="tag t-wr">{counts.em_revisao}</span></td>
                    <td><span className="tag t-ok">{counts.aprovado}</span></td>
                    <td><span className="tag t-cy">{counts.entregue}</span></td>
                    <td style={{ minWidth: '100px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="prog" style={{ flex: 1 }}>
                          <div className="pb" style={{ width: `${p}%`, background: bloco.cor }} />
                        </div>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--gr3)', flexShrink: 0 }}>{p}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal slide */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Editar Slide' : 'Novo Slide'}
        footer={
          <>
            <button className="btn" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn p" onClick={handleSubmit} disabled={saveSlide.isPending}>
              {saveSlide.isPending ? 'Salvando...' : '✓ Salvar'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="g2">
            <div className="fg">
              <label className="fl">Bloco</label>
              <select className="sel" value={form.bloco_id} onChange={e => set('bloco_id', e.target.value)}>
                {blocos.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Número do Slide</label>
              <input className="inp" type="number" min="1" max="100" value={form.numero} onChange={e => set('numero', parseInt(e.target.value) || 1)} required />
            </div>
            <div className="fg" style={{ gridColumn: '1 / -1' }}>
              <label className="fl">Título <span style={{ color: 'var(--er)' }}>*</span></label>
              <input className="inp" value={form.titulo} onChange={e => set('titulo', e.target.value)} required placeholder="Ex: DNA da Marca" />
            </div>
            <div className="fg">
              <label className="fl">Status</label>
              <select className="sel" value={form.status} onChange={e => set('status', e.target.value as SlideStatus)}>
                {STATUS.map(s => <option key={s} value={s}>{slideStatusLabel(s)}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Responsável</label>
              <input className="inp" value={form.responsavel ?? ''} onChange={e => set('responsavel', e.target.value)} placeholder="Nome do responsável" />
            </div>
          </div>
          <div className="fg">
            <label className="fl">Descrição</label>
            <textarea className="txa" value={form.descricao ?? ''} onChange={e => set('descricao', e.target.value)} placeholder="O que este slide deve conter" />
          </div>
          <div className="fg">
            <label className="fl">Observações</label>
            <textarea className="txa" style={{ minHeight: '48px' }} value={form.observacoes ?? ''} onChange={e => set('observacoes', e.target.value)} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
