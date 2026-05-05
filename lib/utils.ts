// ══════════════════════════════════════════════════════════
// Utilitários — mesma lógica do HTML original
// ══════════════════════════════════════════════════════════

export function moneyK(v: number | null | undefined): string {
  if (!v) return 'R$ 0'
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(1)}M`
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
}

export function pct(a: number, b: number): string {
  return b ? `${((a / b) * 100).toFixed(1)}%` : '0%'
}

export function cpl(v: number, l: number): string {
  return l ? `R$ ${(v / l).toFixed(2)}` : '—'
}

export function roiStr(r: number, v: number): string {
  return v ? `${(r / v).toFixed(1)}x` : '—'
}

export function cpc(v: number, c: number): string {
  return c ? `R$ ${(v / c).toFixed(2)}` : '—'
}

export function cpm(v: number, i: number): string {
  return i ? `R$ ${(v / (i / 1000)).toFixed(2)}` : '—'
}

export function ctr(c: number, i: number): string {
  return i ? `${((c / i) * 100).toFixed(2)}%` : '0%'
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  const p = d.split('-')
  if (p.length === 2) return `${p[1]}/${p[0]}`
  if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`
  return d
}

export function engajamentoPct(item: {
  likes: number
  comentarios: number
  saves: number
  alcance: number
}): string {
  const total = item.likes + item.comentarios + item.saves
  return item.alcance ? `${((total / item.alcance) * 100).toFixed(1)}%` : '0%'
}

export function stars(n: number): string {
  let s = ''
  for (let i = 0; i < 5; i++) s += i < Math.round(n / 2) ? '★' : '☆'
  return s
}

export function tempLabel(t: string): string {
  return { hot: '🔥 Quente', warm: '🟡 Morno', cold: '🔵 Frio' }[t] ?? t
}

export function tempColor(t: string): string {
  return (
    { hot: 'var(--er)', warm: 'var(--wr)', cold: 'var(--bl)' }[t] ?? 'var(--gr3)'
  )
}

export function statusTagClass(s: string): string {
  const map: Record<string, string> = {
    Ativa: 't-ok', Ativo: 't-ok',
    Pausada: 't-wr', Pausado: 't-wr',
    Escala: 't-cy',
    'Em andamento': 't-or',
    'Concluído': 't-ok',
    Atrasado: 't-er',
    Planejado: 't-bl',
    Encerrada: 't-gr',
    'Lead Gerado': 't-bl',
    'Contato Realizado': 't-cy',
    'Proposta Enviada': 't-wr',
    Negociação: 't-or',
    Fechado: 't-ok',
    Perdido: 't-er',
    aprovado: 't-ok',
    em_revisao: 't-wr',
    rascunho: 't-gr',
    entregue: 't-cy',
  }
  return map[s] ?? 't-gr'
}

export function slideStatusLabel(s: string): string {
  return (
    { rascunho: 'Rascunho', em_revisao: 'Em revisão', aprovado: 'Aprovado', entregue: 'Entregue' }[s] ?? s
  )
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function uid(): string {
  return `id${Date.now()}${Math.random().toString(36).slice(2, 6)}`
}

export const PIPE_ETAPAS = [
  'Lead Gerado',
  'Contato Realizado',
  'Proposta Enviada',
  'Negociação',
  'Fechado',
] as const

export const PIPE_PROBS: Record<string, number> = {
  'Lead Gerado': 10,
  'Contato Realizado': 25,
  'Proposta Enviada': 50,
  'Negociação': 75,
  'Fechado': 100,
}

export const PLATAFORMAS = [
  'Google Ads',
  'Instagram',
  'LinkedIn',
  'YouTube',
  'WhatsApp',
  'TikTok',
  'Marketplace',
  'Pullse CRM',
]

export const PLAT_COLORS: Record<string, string> = {
  Google: 'var(--cy)',
  Instagram: '#E1306C',
  LinkedIn: '#0077B5',
  WhatsApp: '#25D366',
  TikTok: '#000',
  YouTube: '#FF0000',
  Marketplace: 'var(--wr)',
  Pullse: 'var(--or)',
}

export function platColor(plat: string): string {
  const key = Object.keys(PLAT_COLORS).find((k) => plat.startsWith(k))
  return key ? PLAT_COLORS[key] : 'var(--or)'
}
