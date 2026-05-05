'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import type { Configuracao } from '@/types'

const supabase = createClient()

async function fetchConfig(): Promise<Configuracao> {
  const { data, error } = await supabase
    .from('configuracoes')
    .select('*')
    .single()
  if (error) throw error
  return data
}

async function saveConfig(cfg: Partial<Configuracao> & { id: string }) {
  const { id, ...rest } = cfg
  const { error } = await supabase
    .from('configuracoes')
    .update(rest)
    .eq('id', id)
  if (error) throw error
}

/* ─── Colour swatch input ─── */
function ColourField({ label, name, value, onChange }: {
  label: string; name: string; value: string
  onChange: (name: string, v: string) => void
}) {
  return (
    <div className="fg">
      <label className="fl">{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={value.startsWith('#') ? value : '#FF6A0D'}
          onChange={e => onChange(name, e.target.value)}
          style={{ width: 36, height: 36, border: 'none', background: 'none', padding: 0, cursor: 'pointer', borderRadius: 6 }}
        />
        <input
          className="inp"
          value={value}
          onChange={e => onChange(name, e.target.value)}
          placeholder="#FF6A0D"
          style={{ fontFamily: 'var(--mono)', fontSize: 12 }}
        />
      </div>
    </div>
  )
}

export default function ConfiguracoesPage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: cfg, isLoading } = useQuery({ queryKey: ['configuracoes'], queryFn: fetchConfig })

  const [form, setForm] = useState<Partial<Configuracao>>({})
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  // Sync form with loaded config
  useEffect(() => {
    if (cfg) setForm(cfg)
  }, [cfg])

  const setField = (k: string, v: string) =>
    setForm(f => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: saveConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['configuracoes'] })
      showToast('Configurações salvas com sucesso!', 'ok')
    },
    onError: (e: Error) => showToast(e.message, 'er'),
  })

  async function handleLogoUpload(file: File) {
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `logos/logo-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('assets')
        .upload(path, file, { upsert: true })
      if (upErr) { showToast(upErr.message, 'er'); return }

      const { data: urlData } = supabase.storage.from('assets').getPublicUrl(path)
      setField('logo_url', urlData.publicUrl)
      setPreview(urlData.publicUrl)
      showToast('Logo enviada!', 'ok')
    } finally {
      setUploading(false)
    }
  }

  function handleSave() {
    if (!cfg?.id) return
    mutation.mutate({ id: cfg.id, ...form })
  }

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--gr3)' }}>
      Carregando configurações…
    </div>
  )

  const logoSrc = preview || form.logo_url

  return (
    <div style={{ maxWidth: 800 }}>

      {/* Header */}
      <div className="sec-hd" style={{ marginBottom: 20 }}>
        <div className="sec-tt">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--or)" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
          </svg>
          Configurações do Sistema
        </div>
        <button className="btn p" onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando…' : '✓ Salvar Configurações'}
        </button>
      </div>

      {/* ── White Label ── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hd">
          <div className="card-tt">
            <svg viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M12 12h.01"/></svg>
            Identidade da Empresa
          </div>
        </div>
        <div className="card-bd">
          <div className="g2">
            <div className="fg">
              <label className="fl">Nome da Empresa</label>
              <input
                className="inp"
                value={form.empresa_nome ?? ''}
                onChange={e => setField('empresa_nome', e.target.value)}
                placeholder="Open Soluções Industriais"
              />
            </div>
            <div className="fg">
              <label className="fl">Slogan / Subtítulo</label>
              <input
                className="inp"
                value={form.empresa_slogan ?? ''}
                onChange={e => setField('empresa_slogan', e.target.value)}
                placeholder="Gestão Inteligente de Marketing"
              />
            </div>
          </div>

          {/* Logo */}
          <div className="fg">
            <label className="fl">Logo da Empresa</label>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Preview */}
              <div style={{
                width: 120, height: 80, borderRadius: 10,
                border: '1px solid var(--bk4)', background: 'var(--bk3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {logoSrc
                  ? <img src={logoSrc} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  : <span style={{ fontSize: 11, color: 'var(--gr3)' }}>Sem logo</span>
                }
              </div>
              <div style={{ flex: 1 }}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                />
                <button
                  className="btn"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  style={{ marginBottom: 8 }}
                >
                  {uploading ? 'Enviando…' : '↑ Upload de Logo'}
                </button>
                <div className="fg" style={{ marginBottom: 0 }}>
                  <label className="fl">Ou cole a URL da logo</label>
                  <input
                    className="inp"
                    value={form.logo_url ?? ''}
                    onChange={e => { setField('logo_url', e.target.value); setPreview(e.target.value) }}
                    placeholder="https://…"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Favicon */}
          <div className="fg" style={{ marginBottom: 0 }}>
            <label className="fl">URL do Favicon</label>
            <input
              className="inp"
              value={form.favicon_url ?? ''}
              onChange={e => setField('favicon_url', e.target.value)}
              placeholder="https://…/favicon.ico"
            />
          </div>
        </div>
      </div>

      {/* ── Cores ── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hd">
          <div className="card-tt">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            Paleta de Cores
          </div>
        </div>
        <div className="card-bd">
          <div className="g2">
            <ColourField
              label="Cor Primária"
              name="cor_primaria"
              value={form.cor_primaria ?? '#FF6A0D'}
              onChange={setField}
            />
            <ColourField
              label="Cor Primária (Hover)"
              name="cor_primaria_hover"
              value={form.cor_primaria_hover ?? '#FF8A3D'}
              onChange={setField}
            />
            <ColourField
              label="Sidebar Background"
              name="sidebar_bg"
              value={form.sidebar_bg ?? '#1A1A1A'}
              onChange={setField}
            />
            <ColourField
              label="Topbar Background"
              name="topbar_bg"
              value={form.topbar_bg ?? '#1A1A1A'}
              onChange={setField}
            />
          </div>

          {/* Live preview */}
          <div style={{ marginTop: 16 }}>
            <div className="fl" style={{ marginBottom: 8 }}>Pré-visualização</div>
            <div style={{
              background: form.sidebar_bg ?? '#1A1A1A',
              borderRadius: 10, padding: 16,
              border: '1px solid var(--bk4)',
              display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: form.cor_primaria ?? '#FF6A0D',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 18, color: '#fff',
              }}>n</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{form.empresa_nome || 'Open'}</div>
                <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '.15em' }}>{form.empresa_slogan || 'Soluções Industriais'}</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <div style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 11,
                  background: form.cor_primaria ?? '#FF6A0D', color: '#fff', fontWeight: 700,
                }}>Primária</div>
                <div style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 11,
                  background: form.cor_primaria_hover ?? '#FF8A3D', color: '#fff', fontWeight: 700,
                }}>Hover</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="card">
        <div className="card-hd">
          <div className="card-tt">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Informações
          </div>
        </div>
        <div className="card-bd">
          <p style={{ fontSize: 12, color: 'var(--gr3)', lineHeight: 1.7 }}>
            As alterações de identidade visual (cores e logo) serão salvas no banco de dados e aplicadas
            automaticamente na próxima atualização. Para que as variáveis de cor sejam aplicadas dinamicamente
            via CSS, configure um Provider de tema no layout raiz que leia essas configurações e injete as
            custom properties em tempo de execução.
          </p>
          <div className="dv" />
          <div className="info-row">
            <span className="info-k">ID da Configuração</span>
            <span className="info-v" style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{cfg?.id}</span>
          </div>
          <div className="info-row">
            <span className="info-k">Última atualização</span>
            <span className="info-v">
              {cfg?.updated_at ? new Date(cfg.updated_at).toLocaleString('pt-BR') : '—'}
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}
