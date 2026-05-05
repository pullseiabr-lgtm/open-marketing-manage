import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import Providers from '@/components/Providers'
import type { Configuracao } from '@/types'

/** Build a <style> block that overrides CSS vars from the DB config */
function themeStyle(cfg: Configuracao | null): string {
  if (!cfg) return ''
  const hex = (v: string | null | undefined, fallback: string) =>
    v && v.startsWith('#') ? v : fallback

  const or      = hex(cfg.cor_primaria,        '#FF6A0D')
  const or2     = hex(cfg.cor_primaria_hover,   '#FF8A3D')
  // derive or3 (dark) and orb (transparent) automatically
  const sidebarBg = hex(cfg.sidebar_bg, '#1A1A1A')
  const topbarBg  = hex(cfg.topbar_bg,  '#1A1A1A')

  // parse hex → r,g,b for rgba()
  const hexToRgb = (h: string): string => {
    const c = h.replace('#', '')
    const r = parseInt(c.substring(0, 2), 16)
    const g = parseInt(c.substring(2, 4), 16)
    const b = parseInt(c.substring(4, 6), 16)
    return `${r},${g},${b}`
  }

  const rgb = hexToRgb(or)

  return `:root {
    --or: ${or};
    --or2: ${or2};
    --or3: color-mix(in srgb, ${or} 80%, black);
    --orb: rgba(${rgb},.10);
    --orb2: rgba(${rgb},.18);
    --bk2: ${sidebarBg};
  }
  .topbar { background: ${topbarBg} !important; }
  .sidebar { background: ${sidebarBg} !important; }
  `
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: cfg }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('configuracoes').select('*').single(),
  ])

  const theme = themeStyle(cfg)

  return (
    <Providers>
      {/* SSR-injected theme overrides — zero client-side flash */}
      {theme && (
        <style dangerouslySetInnerHTML={{ __html: theme }} />
      )}
      <div className="app">
        <Sidebar user={profile} />
        <main className="main">
          <Topbar />
          <div className="content">{children}</div>
        </main>
      </div>
    </Providers>
  )
}
