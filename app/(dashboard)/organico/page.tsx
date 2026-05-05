'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import KpiCard from '@/components/ui/KpiCard'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { showToast } from '@/components/ui/Toast'
import { confirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate, engajamentoPct, platColor } from '@/lib/utils'
import type { ConteudoOrganico, ConteudoOrganicoInput } from '@/types'

const PLATAFORMAS = ['Instagram','YouTube','LinkedIn','TikTok','Facebook','Twitter/X']
const TIPOS = ['Reels','Feed','Stories','Vídeo','Artigo','Thread','Live','Carrossel']
const TEMAS = ['Autoridade','Prova Social','Educação','Entretenimento','Produto','Case','Bastidores']

const BLANK: ConteudoOrganicoInput = {
  data_publicacao: new Date().toISOString().slice(0, 10),
  plataforma: 'Instagram', tipo: 'Reels', tema: 'Autoridade',
  descricao: '', likes: 0, comentarios: 0, saves: 0, alcance: 0, seguidores_ganhos: 0,
}

export default function OrganicoPage() {
  const supabase = createClient()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<ConteudoOrganicoInput>(BLANK)
  const [editId, setEditId] = useState<string | null>(null)
  const [filtPlat, setFiltPlat] = useState('')

  const { data: conteudos = [], isLoading } = useQuery({
    queryKey: ['conteudos_organicos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('conteudos_organicos').select('*').order('data_publicacao', { ascending: false })
      if (error) throw error
      return data as ConteudoOrganico[]
    },
  })

  const save = useMutation({
    mutationFn: async (p: ConteudoOrganicoInput & { id?: string }) => {
      const { id, ...rest } = p
      if (id) { const { error } = await supabase.from('conteudos_organicos').update(rest).eq('id', id); if (error) throw error }
      else { const { error } = await supabase.from('conteudos_organicos').insert(rest); if (error) throw error }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['conteudos_organicos'] }); showToast('Conteúdo salvo!'); setModal(false) },
    onError: () => showToast('Erro ao salvar.', 'er'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('conteudos_organicos').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['conteudos_organicos'] }); showToast('Excluído!') },
    onError: () => showToast('Erro ao excluir.', 'er'),
  })

  function openNew() { setForm(BLANK); setEditId(null); setModal(true) }
  function openEdit(c: ConteudoOrganico) {
    setForm({ data_publicacao: c.data_publicacao, plataforma: c.plataforma, tipo: c.tipo, tema: c.tema, descricao: c.descricao ?? '', likes: c.likes, comentarios: c.comentarios, saves: c.saves, alcance: c.alcance, seguidores_ganhos: c.seguidores_ganhos })
    setEditId(c.id); setModal(true)
  }
  function set(k: keyof ConteudoOrganicoInput, v: string | number) { setForm(f => ({ ...f, [k]: v })) }
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); save.mutate(editId ? { ...form, id: editId } : form) }

  const filtered = conteudos.filter(c => !filtPlat || c.plataforma === filtPlat)

  const totAlcance = conteudos.reduce((s, c) => s + c.alcance, 0)
  const totSegs    = conteudos.reduce((s, c) => s + c.seguidores_ganhos, 0)
  const totLikes   = conteudos.reduce((s, c) => s + c.likes, 0)
  const avgEngaj   = conteudos.length ? conteudos.reduce((s, c) => s + parseFloat(engajamentoPct(c)), 0) / conteudos.length : 0

  const kpis = [
    { cor: 'var(--or)', icon: '<circle cx="12" cy="12" r="10"/>', label: 'Conteúdos', value: conteudos.length, sub: 'Posts publicados' },
    { cor: 'var(--cy)', icon: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>', label: 'Alcance Total', value: totAlcance >= 1000 ? `${(totAlcance/1000).toFixed(1)}K` : totAlcance, sub: 'Pessoas alcançadas' },
    { cor: 'var(--ok)', icon: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>', label: 'Seguidores Ganhos', value: `+${totSegs}`, sub: 'Crescimento orgânico' },
    { cor: 'var(--pu)', icon: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>', label: 'Engajamento Médio', value: `${avgEngaj.toFixed(1)}%`, sub: `${totLikes} curtidas acum.` },
  ]

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-tt">Orgânico — Redes Sociais</div>
        <button className="btn p sm" onClick={openNew}>+ Registrar Conteúdo</button>
      </div>

      <div className="kpi-grid">{kpis.map((k, i) => <KpiCard key={i} {...k} />)}</div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <select className="sel" style={{ width: 'auto', fontSize: '11px' }} value={filtPlat} onChange={e => setFiltPlat(e.target.value)}>
          <option value="">Todas plataformas</option>
          {PLATAFORMAS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="tw">
          <table>
            <thead>
              <tr><th>Data</th><th>Plataforma</th><th>Tipo</th><th>Tema</th><th>Likes</th><th>Comentários</th><th>Saves</th><th>Alcance</th><th>Seg. Ganhos</th><th>Engaj.%</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: '24px', color: 'var(--gr3)' }}>Nenhum conteúdo registrado.</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '11px' }}>{formatDate(c.data_publicacao)}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: platColor(c.plataforma), flexShrink: 0 }} />
                      {c.plataforma}
                    </span>
                  </td>
                  <td><span className="tag t-bl">{c.tipo}</span></td>
                  <td style={{ fontSize: '10.5px' }}>{c.tema}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{c.likes}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{c.comentarios}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{c.saves}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{c.alcance >= 1000 ? `${(c.alcance/1000).toFixed(1)}K` : c.alcance}</td>
                  <td style={{ fontWeight: 700, color: 'var(--ok)', fontFamily: 'var(--mono)' }}>+{c.seguidores_ganhos}</td>
                  <td style={{ fontWeight: 700, color: parseFloat(engajamentoPct(c)) >= 5 ? 'var(--ok)' : parseFloat(engajamentoPct(c)) >= 2 ? 'var(--wr)' : 'var(--gr3)' }}>{engajamentoPct(c)}</td>
                  <td>
                    <div className="ab">
                      <button className="ib" onClick={() => openEdit(c)}><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                      <button className="ib rd" onClick={() => confirmDialog('Excluir este conteúdo?', () => remove.mutate(c.id))}><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar Conteúdo' : 'Registrar Conteúdo Orgânico'} size="lg"
        footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn p" onClick={handleSubmit} disabled={save.isPending}>{save.isPending ? 'Salvando...' : '✓ Salvar'}</button></>}>
        <form onSubmit={handleSubmit}>
          <div className="g2">
            <div className="fg"><label className="fl">Data de Publicação</label><input className="inp" type="date" value={form.data_publicacao} onChange={e => set('data_publicacao', e.target.value)} required /></div>
            <div className="fg"><label className="fl">Plataforma</label><select className="sel" value={form.plataforma} onChange={e => set('plataforma', e.target.value)}>{PLATAFORMAS.map(p => <option key={p}>{p}</option>)}</select></div>
            <div className="fg"><label className="fl">Tipo</label><select className="sel" value={form.tipo} onChange={e => set('tipo', e.target.value)}>{TIPOS.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="fg"><label className="fl">Tema</label><select className="sel" value={form.tema} onChange={e => set('tema', e.target.value)}>{TEMAS.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="fg"><label className="fl">Likes</label><input className="inp" type="number" min="0" value={form.likes} onChange={e => set('likes', parseInt(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Comentários</label><input className="inp" type="number" min="0" value={form.comentarios} onChange={e => set('comentarios', parseInt(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Saves</label><input className="inp" type="number" min="0" value={form.saves} onChange={e => set('saves', parseInt(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Alcance</label><input className="inp" type="number" min="0" value={form.alcance} onChange={e => set('alcance', parseInt(e.target.value)||0)} /></div>
            <div className="fg"><label className="fl">Seguidores Ganhos</label><input className="inp" type="number" min="0" value={form.seguidores_ganhos} onChange={e => set('seguidores_ganhos', parseInt(e.target.value)||0)} /></div>
          </div>
          <div className="fg"><label className="fl">Descrição</label><textarea className="txa" style={{ minHeight: '48px' }} value={form.descricao ?? ''} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Diagnóstico ao vivo — motor travado" /></div>
        </form>
      </Modal>
    </div>
  )
}
