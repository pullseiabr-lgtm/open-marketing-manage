'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Configuracao } from '@/types'
import { useSidebar } from './SidebarContext'

const supabase = createClient()

function useConfig() {
  return useQuery<Configuracao>({
    queryKey: ['configuracoes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('configuracoes').select('*').single()
      if (error) throw error
      return data
    },
    staleTime: 5 * 60_000,
  })
}

function useCurrentRole() {
  return useQuery<string | null>({
    queryKey: ['current-role'],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser()
      const uid = authData.user?.id
      if (!uid) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .single()
      if (error) return null
      return (data?.role as string | null) ?? null
    },
    staleTime: 60_000,
  })
}

const NAV = [
  { sec: 'Análise & BI' },
  { href: '/',                label: 'Visão Executiva',           icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' },
  { href: '/midia-paga',      label: 'Mídia Paga',                icon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
  { href: '/campanhas',       label: 'Gestão de Campanhas',       icon: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>' },
  { href: '/funil',           label: 'Funil Completo',            icon: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>' },
  { href: '/resultados',      label: 'Resultados & Análise',      icon: '<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>' },
  { sec: 'Operação' },
  { href: '/estrategia',      label: 'Estratégia',                icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' },
  { href: '/checklist',       label: 'Checklist Operacional',     icon: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
  { href: '/cliente-oculto',  label: 'Cliente Oculto',            icon: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>' },
  { href: '/treinamento',     label: 'Treinamento do Time',       icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
  { href: '/integracao',      label: 'Integração Digital+Off',    icon: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>' },
  { sec: 'Conteúdo & Vendas' },
  { href: '/organico',        label: 'Orgânico — Redes Sociais',  icon: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 13 19.79 19.79 0 0 1 1.07 4.4a2 2 0 0 1 1.98-2.17h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/>' },
  { href: '/pipeline',        label: 'Pipeline Comercial',        icon: '<rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="8" width="6" height="13" rx="1"/><rect x="16" y="6" width="6" height="15" rx="1"/>' },
  { href: '/metricas',        label: 'Métricas de Dados',         icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><polyline points="2 10 7 5 12 10 18 4"/>' },
]

const NAV_ADMIN = [
  { sec: 'Administração' },
  { href: '/configuracoes',   label: 'Configurações',             icon: '<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>' },
  { href: '/usuarios',        label: 'Usuários & Perfis',         icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', adminOnly: true },
]

export default function Sidebar({ user }: { user: Profile | null }) {
  const pathname = usePathname()
  const { open, close } = useSidebar()
  const { data: cfg } = useConfig()
  const { data: currentRole } = useCurrentRole()

  const normalizedRole = String(currentRole ?? user?.role ?? '').trim().toLowerCase()
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'superadmin'

  const initials = user?.nome
    ? user.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'OS'

  const roleLabel =
    normalizedRole === 'superadmin' ? 'Super Admin' :
    normalizedRole === 'admin'      ? 'Administrador' : 'Operacional'

  const empresaNome   = cfg?.empresa_nome   ?? 'Open'
  const empresaSlogan = cfg?.empresa_slogan ?? 'Soluções Industriais'
  const logoUrl       = cfg?.logo_url

  // close sidebar on route change (mobile)
  useEffect(() => { close() }, [pathname, close])

  const renderNav = (items: typeof NAV) =>
    items.map((item, i) => {
      if ('sec' in item) {
        return <div key={i} className="sb-sec">{item.sec}</div>
      }
      if ('adminOnly' in item && item.adminOnly && !isAdmin) return null
      const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
      return (
        <Link
          key={item.href}
          href={item.href}
          className={`ni${isActive ? ' act' : ''}`}
        >
          <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: item.icon }} />
          {item.label}
        </Link>
      )
    })

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="sb-backdrop"
          onClick={close}
          aria-hidden
        />
      )}

      <aside className={`sidebar${open ? ' sb-open' : ''}`}>
        <div className="sb-brand">
          <div className="logo">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={empresaNome}
                style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 7, flexShrink: 0 }}
              />
            ) : (
              <div className="logo-box">
                <span className="logo-n">{empresaNome[0]?.toLowerCase() ?? 'n'}</span>
              </div>
            )}
            <div>
              <div className="logo-txt">{empresaNome}</div>
              <div className="logo-sub">{empresaSlogan}</div>
            </div>
          </div>
          <div className="live-badge">
            <span className="live-dot" />
            Sistema Ativo · {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
          </div>
        </div>

        <nav className="sb-nav">
          {renderNav(NAV)}
          {isAdmin && renderNav(NAV_ADMIN)}
        </nav>

        <div className="sb-foot">
          <div className="sb-user">
            <div className="sb-av">{initials}</div>
            <div>
              <div className="sb-nm">{user?.nome ?? 'Gestão Open'}</div>
              <div className="sb-rl">{roleLabel}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
