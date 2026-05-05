'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import { confirmDialog } from '@/components/ui/ConfirmDialog'
import Modal from '@/components/ui/Modal'
import type { Profile, RoleItem, Permission } from '@/types'
import { MODULOS } from '@/types'

const supabase = createClient()

/* ── Data fetchers ── */
async function fetchUsers(): Promise<Profile[]> {
  const res = await fetch('/api/admin/users')
  if (!res.ok) throw new Error('Erro ao carregar usuários')
  return res.json()
}

async function fetchRoles(): Promise<RoleItem[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*, permissions:role_permissions(permission_id, permissions(*))')
    .order('created_at')
  if (error) throw error
  // flatten: transform nested join
  return (data as any[]).map(r => ({
    ...r,
    permissions: r.permissions?.map((rp: any) => rp.permissions).filter(Boolean) ?? [],
  }))
}

async function fetchPermissions(): Promise<Permission[]> {
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('modulo')
    .order('acao')
  if (error) throw error
  return data
}

/* ── Role badge colours ── */
const ROLE_CLS: Record<string, string> = {
  superadmin: 't-pu',
  admin:      't-or',
  operacional:'t-bl',
}

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  operacional: 'Operacional',
}

const ACOES = ['read', 'create', 'update', 'delete'] as const
const ACAO_LABEL: Record<string, string> = { read:'Ver', create:'Criar', update:'Editar', delete:'Excluir' }

/* ══════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════ */
export default function UsuariosPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'users' | 'roles' | 'perms'>('users')

  /* ── Queries ── */
  const { data: users = [], isLoading: loadU } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
  const { data: roles = [], isLoading: loadR } = useQuery({ queryKey: ['roles'], queryFn: fetchRoles })
  const { data: permissions = [] } = useQuery({ queryKey: ['permissions'], queryFn: fetchPermissions })

  /* ─────────────────────────────────────────────
     Tab: Usuários
  ───────────────────────────────────────────── */
  const [showNewUser, setShowNewUser] = useState(false)
  const [newUser, setNewUser] = useState({ nome: '', email: '', password: '', role: 'operacional' as Profile['role'] })

  const createUser = useMutation({
    mutationFn: async (u: typeof newUser) => {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(u),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setShowNewUser(false)
      setNewUser({ nome: '', email: '', password: '', role: 'operacional' })
      showToast('Usuário criado com sucesso!', 'ok')
    },
    onError: (e: Error) => showToast(e.message, 'er'),
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      showToast('Usuário atualizado!', 'ok')
    },
    onError: (e: Error) => showToast(e.message, 'er'),
  })

  const changeRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Profile['role'] }) => {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      showToast('Perfil alterado!', 'ok')
    },
    onError: (e: Error) => showToast(e.message, 'er'),
  })

  /* ─────────────────────────────────────────────
     Tab: Roles
  ───────────────────────────────────────────── */
  const [showNewRole, setShowNewRole] = useState(false)
  const [newRole, setNewRole] = useState({ nome: '', descricao: '' })

  const createRole = useMutation({
    mutationFn: async (r: typeof newRole) => {
      const { error } = await supabase.from('roles').insert(r)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      setShowNewRole(false)
      setNewRole({ nome: '', descricao: '' })
      showToast('Papel criado!', 'ok')
    },
    onError: (e: Error) => showToast(e.message, 'er'),
  })

  const deleteRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('roles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      showToast('Papel removido!', 'ok')
    },
    onError: (e: Error) => showToast(e.message, 'er'),
  })

  /* ─────────────────────────────────────────────
     Tab: Permissions
  ───────────────────────────────────────────── */
  const [selectedRole, setSelectedRole] = useState<string>('')

  const currentRole = roles.find(r => r.id === selectedRole)
  const grantedIds = new Set(currentRole?.permissions?.map((p: Permission) => p.id) ?? [])

  const togglePerm = useMutation({
    mutationFn: async ({ roleId, permId, grant }: { roleId: string; permId: string; grant: boolean }) => {
      if (grant) {
        const { error } = await supabase.from('role_permissions').insert({ role_id: roleId, permission_id: permId })
        if (error) throw error
      } else {
        const { error } = await supabase.from('role_permissions')
          .delete()
          .eq('role_id', roleId)
          .eq('permission_id', permId)
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
    onError: (e: Error) => showToast(e.message, 'er'),
  })

  /* ── Group permissions by modulo ── */
  const permsByModulo: Record<string, Permission[]> = {}
  for (const p of permissions) {
    if (!permsByModulo[p.modulo]) permsByModulo[p.modulo] = []
    permsByModulo[p.modulo].push(p)
  }

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div className="sec-hd">
        <div className="sec-tt">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--or)" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Usuários & Perfis
        </div>

        {tab === 'users' && (
          <button className="btn p" onClick={() => setShowNewUser(true)}>
            + Novo Usuário
          </button>
        )}
        {tab === 'roles' && (
          <button className="btn p" onClick={() => setShowNewRole(true)}>
            + Novo Papel
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab-btn${tab === 'users' ? ' act' : ''}`} onClick={() => setTab('users')}>
          👤 Usuários ({users.length})
        </button>
        <button className={`tab-btn${tab === 'roles' ? ' act' : ''}`} onClick={() => setTab('roles')}>
          🎭 Papéis ({roles.length})
        </button>
        <button className={`tab-btn${tab === 'perms' ? ' act' : ''}`} onClick={() => setTab('perms')}>
          🔑 Permissões
        </button>
      </div>

      {/* ══════════ TAB: USUÁRIOS ══════════ */}
      {tab === 'users' && (
        <div className="card">
          <div className="card-hd">
            <div className="card-tt">
              <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              Lista de Usuários
            </div>
            <span className="tag t-gr">{users.filter(u => u.is_active !== false).length} ativos</span>
          </div>
          {loadU ? (
            <div className="empty">Carregando…</div>
          ) : (
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Papel</th>
                    <th>Status</th>
                    <th>Cadastrado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                            background: 'var(--or)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff',
                          }}>
                            {u.nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--wh)' }}>{u.nome}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{u.email ?? '—'}</td>
                      <td>
                        <select
                          className="sel"
                          value={u.role}
                          onChange={e => changeRole.mutate({ id: u.id, role: e.target.value as Profile['role'] })}
                          style={{ width: 'auto', padding: '3px 7px', fontSize: 11 }}
                        >
                          <option value="superadmin">Super Admin</option>
                          <option value="admin">Admin</option>
                          <option value="operacional">Operacional</option>
                        </select>
                      </td>
                      <td>
                        <span className={`tag ${u.is_active !== false ? 't-ok' : 't-er'}`}>
                          {u.is_active !== false ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--gr3)', fontSize: 11 }}>
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td>
                        <div className="ab">
                          <button
                            className={`ib ${u.is_active !== false ? 'rd' : ''}`}
                            title={u.is_active !== false ? 'Desativar' : 'Reativar'}
                            onClick={() => confirmDialog(
                              u.is_active !== false
                                ? `Desativar ${u.nome}?`
                                : `Reativar ${u.nome}?`,
                              () => toggleActive.mutate({ id: u.id, is_active: !(u.is_active !== false) })
                            )}
                          >
                            {u.is_active !== false ? (
                              <svg viewBox="0 0 24 24"><path d="M18.36 6.64A9 9 0 0 1 20.77 15"/><path d="M6.16 6.16a9 9 0 1 0 12.68 12.68"/><path d="M12 2v4"/><path d="m2 2 20 20"/></svg>
                            ) : (
                              <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="empty">Nenhum usuário encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════ TAB: PAPÉIS ══════════ */}
      {tab === 'roles' && (
        <div>
          {loadR ? (
            <div className="empty">Carregando…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {roles.map(r => (
                <div key={r.id} className="card" style={{ marginBottom: 0 }}>
                  <div className="card-hd">
                    <div className="card-tt">
                      <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                      {r.nome}
                      {r.is_system && <span className="tag t-gr" style={{ marginLeft: 4, fontSize: 8 }}>Sistema</span>}
                    </div>
                    {!r.is_system && (
                      <button
                        className="ib rd"
                        title="Remover papel"
                        onClick={() => confirmDialog(`Remover papel "${r.nome}"?`, () => deleteRole.mutate(r.id))}
                      >
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                      </button>
                    )}
                  </div>
                  <div className="card-bd">
                    {r.descricao && (
                      <p style={{ fontSize: 11, color: 'var(--gr3)', marginBottom: 10, lineHeight: 1.5 }}>{r.descricao}</p>
                    )}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {(r.permissions ?? []).length === 0
                        ? <span style={{ fontSize: 10, color: 'var(--gr3)' }}>Sem permissões</span>
                        : (r.permissions ?? []).slice(0, 6).map((p: Permission) => (
                            <span key={p.id} className="tag t-gr" style={{ fontSize: 9 }}>
                              {p.modulo}.{p.acao}
                            </span>
                          ))
                      }
                      {(r.permissions ?? []).length > 6 && (
                        <span className="tag t-or" style={{ fontSize: 9 }}>
                          +{(r.permissions ?? []).length - 6}
                        </span>
                      )}
                    </div>
                    <button
                      className="btn sm"
                      style={{ marginTop: 10, width: '100%' }}
                      onClick={() => { setSelectedRole(r.id); setTab('perms') }}
                    >
                      Gerenciar Permissões →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ TAB: PERMISSÕES ══════════ */}
      {tab === 'perms' && (
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <label className="fl" style={{ marginBottom: 0 }}>Papel:</label>
            <select
              className="sel"
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              style={{ width: 'auto', minWidth: 200 }}
            >
              <option value="">— Selecione um papel —</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
            {currentRole && (
              <span style={{ fontSize: 11, color: 'var(--gr3)' }}>
                {grantedIds.size} permissão(ões) ativa(s)
              </span>
            )}
          </div>

          {!selectedRole && (
            <div className="empty" style={{ padding: 40 }}>
              Selecione um papel para gerenciar suas permissões.
            </div>
          )}

          {selectedRole && (
            <div className="card">
              <div className="card-hd">
                <div className="card-tt">
                  🔑 Permissões — {currentRole?.nome}
                </div>
                <span className="tag t-ok">{grantedIds.size} ativas</span>
              </div>
              <div className="card-bd" style={{ padding: '10px 15px' }}>

                {/* Header row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '160px repeat(4, 1fr)',
                  gap: 4, padding: '6px 8px',
                  borderBottom: '1px solid var(--bk4)',
                  marginBottom: 6,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--gr3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Módulo</div>
                  {ACOES.map(a => (
                    <div key={a} style={{ fontSize: 9, fontWeight: 700, color: 'var(--gr3)', textTransform: 'uppercase', letterSpacing: '.08em', textAlign: 'center' }}>
                      {ACAO_LABEL[a]}
                    </div>
                  ))}
                </div>

                {/* Permission rows */}
                {MODULOS.map(mod => {
                  const modPerms = permsByModulo[mod] ?? []
                  if (modPerms.length === 0) return null
                  return (
                    <div
                      key={mod}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '160px repeat(4, 1fr)',
                        gap: 4, padding: '5px 8px',
                        borderRadius: 6, marginBottom: 2,
                        background: 'var(--bk3)',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--lgt)', alignSelf: 'center' }}>
                        {mod}
                      </div>
                      {ACOES.map(acao => {
                        const perm = modPerms.find(p => p.acao === acao)
                        if (!perm) return <div key={acao} />
                        const checked = grantedIds.has(perm.id)
                        return (
                          <div key={acao} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <button
                              onClick={() => togglePerm.mutate({ roleId: selectedRole, permId: perm.id, grant: !checked })}
                              disabled={togglePerm.isPending}
                              title={perm.descricao ?? `${mod}.${acao}`}
                              style={{
                                width: 22, height: 22, borderRadius: 5,
                                border: checked ? '2px solid var(--ok)' : '2px solid var(--bk4)',
                                background: checked ? 'rgba(34,197,94,.15)' : 'var(--bk4)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', transition: '.13s',
                              }}
                            >
                              {checked && (
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--ok)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ Modal: Novo Usuário ══ */}
      <Modal
        open={showNewUser}
        onClose={() => setShowNewUser(false)}
        title="Novo Usuário"
        footer={
          <>
            <button className="btn" onClick={() => setShowNewUser(false)}>Cancelar</button>
            <button
              className="btn p"
              onClick={() => createUser.mutate(newUser)}
              disabled={createUser.isPending || !newUser.nome || !newUser.email || !newUser.password}
            >
              {createUser.isPending ? 'Criando…' : 'Criar Usuário'}
            </button>
          </>
        }
      >
        <div className="g2">
          <div className="fg">
            <label className="fl">Nome Completo *</label>
            <input className="inp" value={newUser.nome} onChange={e => setNewUser(u => ({ ...u, nome: e.target.value }))} placeholder="João Silva" />
          </div>
          <div className="fg">
            <label className="fl">Papel *</label>
            <select className="sel" value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value as Profile['role'] }))}>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="operacional">Operacional</option>
            </select>
          </div>
        </div>
        <div className="fg">
          <label className="fl">E-mail *</label>
          <input className="inp" type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} placeholder="joao@empresa.com" />
        </div>
        <div className="fg">
          <label className="fl">Senha Inicial *</label>
          <input className="inp" type="password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} placeholder="Mín. 6 caracteres" />
        </div>
        <p style={{ fontSize: 11, color: 'var(--gr3)', marginTop: 4 }}>
          O usuário poderá alterar sua senha após o primeiro acesso.
        </p>
      </Modal>

      {/* ══ Modal: Novo Papel ══ */}
      <Modal
        open={showNewRole}
        onClose={() => setShowNewRole(false)}
        title="Novo Papel (Role)"
        footer={
          <>
            <button className="btn" onClick={() => setShowNewRole(false)}>Cancelar</button>
            <button
              className="btn p"
              onClick={() => createRole.mutate(newRole)}
              disabled={createRole.isPending || !newRole.nome}
            >
              {createRole.isPending ? 'Criando…' : 'Criar Papel'}
            </button>
          </>
        }
      >
        <div className="fg">
          <label className="fl">Nome do Papel *</label>
          <input className="inp" value={newRole.nome} onChange={e => setNewRole(r => ({ ...r, nome: e.target.value }))} placeholder="Ex: Analista" />
        </div>
        <div className="fg">
          <label className="fl">Descrição</label>
          <textarea className="txa" value={newRole.descricao} onChange={e => setNewRole(r => ({ ...r, descricao: e.target.value }))} placeholder="Descreva as responsabilidades deste papel…" />
        </div>
      </Modal>
    </div>
  )
}
