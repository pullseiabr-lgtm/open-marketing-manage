'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSidebar } from './SidebarContext'

const PAGE_TITLES: Record<string, string> = {
  '/':               'Visão Executiva',
  '/midia-paga':     'Mídia Paga',
  '/campanhas':      'Gestão de Campanhas',
  '/funil':          'Funil Completo',
  '/resultados':     'Resultados & Análise',
  '/estrategia':     'Estratégia',
  '/checklist':      'Checklist Operacional',
  '/cliente-oculto': 'Cliente Oculto',
  '/treinamento':    'Treinamento do Time',
  '/integracao':     'Integração Digital + Offline',
  '/organico':       'Orgânico — Redes Sociais',
  '/pipeline':       'Pipeline Comercial',
  '/metricas':       'Métricas de Dados',
  '/configuracoes':  'Configurações',
  '/usuarios':       'Usuários & Perfis',
}

export default function Topbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const { toggle } = useSidebar()

  const title = PAGE_TITLES[pathname] ?? 'Open Soluções'

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="topbar">
      {/* Hamburger — mobile only */}
      <button
        className="ham-btn"
        onClick={toggle}
        aria-label="Abrir menu"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6"  x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div className="tb-title">{title}</div>

      <div className="tb-period">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8"  y1="2" x2="8"  y2="6"/>
          <line x1="3"  y1="10" x2="21" y2="10"/>
        </svg>
        <select style={{ fontSize: '11px', color: 'var(--lgt)', background: 'none', border: 'none', outline: 'none', cursor: 'pointer' }}>
          <option value="mes">Mês atual</option>
          <option value="sem">Esta semana</option>
          <option value="tri">Trimestre</option>
          <option value="ano">Ano</option>
        </select>
      </div>

      <button className="btn sm" onClick={handleLogout} title="Sair">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span className="tb-logout-txt">Sair</span>
      </button>
    </header>
  )
}
