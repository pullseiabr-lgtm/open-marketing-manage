'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Profile } from '@/types'

const NAV = [
  { sec: 'Análise & BI' },
  { href: '/',           label: 'Visão Executiva',        icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' },
  { href: '/midia-paga', label: 'Mídia Paga',             icon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
  { href: '/campanhas',  label: 'Gestão de Campanhas',    icon: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>' },
  { href: '/funil',      label: 'Funil Completo',         icon: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>' },
  { href: '/resultados', label: 'Resultados & Análise',   icon: '<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>' },
  { sec: 'Operação' },
  { href: '/estrategia', label: 'Estratégia',             icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' },
  { href: '/checklist',  label: 'Checklist Operacional',  icon: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
  { href: '/cliente-oculto', label: 'Cliente Oculto',     icon: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>' },
  { href: '/treinamento',label: 'Treinamento do Time',    icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
  { href: '/integracao', label: 'Integração Digital+Off', icon: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>' },
  { sec: 'Conteúdo & Vendas' },
  { href: '/organico',   label: 'Orgânico — Redes Sociais', icon: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 13 19.79 19.79 0 0 1 1.07 4.4a2 2 0 0 1 1.98-2.17h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/>' },
  { href: '/pipeline',   label: 'Pipeline Comercial',     icon: '<rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="8" width="6" height="13" rx="1"/><rect x="16" y="6" width="6" height="15" rx="1"/>' },
]

export default function Sidebar({ user }: { user: Profile | null }) {
  const pathname = usePathname()

  const initials = user?.nome
    ? user.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'OS'

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="logo">
          <div className="logo-box"><span className="logo-n">n</span></div>
          <div>
            <div className="logo-txt">Open</div>
            <div className="logo-sub">Soluções Industriais</div>
          </div>
        </div>
        <div className="live-badge">
          <span className="live-dot" />
          Sistema Ativo · {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
        </div>
      </div>

      <nav className="sb-nav">
        {NAV.map((item, i) => {
          if ('sec' in item) {
            return <div key={i} className="sb-sec">{item.sec}</div>
          }
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
        })}
      </nav>

      <div className="sb-foot">
        <div className="sb-user">
          <div className="sb-av">{initials}</div>
          <div>
            <div className="sb-nm">{user?.nome ?? 'Gestão Open'}</div>
            <div className="sb-rl">{user?.role === 'admin' ? 'Administrador' : 'Operacional'}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
