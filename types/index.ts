// ══════════════════════════════════════════════════════════
// Open Soluções — Tipos TypeScript
// ══════════════════════════════════════════════════════════

export type Role = 'admin' | 'operacional'

export interface Profile {
  id: string
  nome: string
  role: Role
  avatar_url?: string | null
  created_at: string
  updated_at: string
}

// ──────────────────────────────────────────────────────────
// MÍDIA PAGA
// ──────────────────────────────────────────────────────────
export interface InvestimentoMidia {
  id: string
  plataforma: string
  tipo: string
  objetivo: string
  valor: number
  periodo: string
  publico?: string | null
  segmento?: string | null
  impressoes: number
  cliques: number
  leads: number
  vendas: number
  receita: number
  created_by?: string | null
  created_at: string
  updated_at: string
}

export type InvestimentoMidiaInput = Omit<InvestimentoMidia, 'id' | 'created_by' | 'created_at' | 'updated_at'>

// ──────────────────────────────────────────────────────────
// CAMPANHAS
// ──────────────────────────────────────────────────────────
export type CampanhaStatus = 'Ativa' | 'Pausada' | 'Escala' | 'Encerrada' | 'Rascunho'

export interface Campanha {
  id: string
  nome: string
  plataforma: string
  criativo?: string | null
  copy_texto?: string | null
  oferta?: string | null
  responsavel?: string | null
  data_inicio?: string | null
  data_fim?: string | null
  impressoes: number
  cliques: number
  leads: number
  vendas: number
  budget: number
  receita: number
  status: CampanhaStatus
  created_by?: string | null
  created_at: string
  updated_at: string
}

export type CampanhaInput = Omit<Campanha, 'id' | 'created_by' | 'created_at' | 'updated_at'>

// ──────────────────────────────────────────────────────────
// FUNIL MÉTRICAS
// ──────────────────────────────────────────────────────────
export interface FunilMetrica {
  id: string
  canal: string
  periodo: string
  alcance: number
  cliques: number
  leads: number
  vendas: number
  investimento: number
  receita: number
  created_by?: string | null
  created_at: string
  updated_at: string
}

export type FunilMetricaInput = Omit<FunilMetrica, 'id' | 'created_by' | 'created_at' | 'updated_at'>

// ──────────────────────────────────────────────────────────
// APRESENTAÇÃO — BLOCOS E SLIDES (Tab01 Funil)
// ──────────────────────────────────────────────────────────
export type SlideStatus = 'rascunho' | 'em_revisao' | 'aprovado' | 'entregue'

export interface ApresentacaoBloco {
  id: string
  nome: string
  slides_inicio: number
  slides_fim: number
  ordem: number
  cor: string
  created_at: string
  slides?: ApresentacaoSlide[]
}

export interface ApresentacaoSlide {
  id: string
  bloco_id: string
  numero: number
  titulo: string
  descricao?: string | null
  status: SlideStatus
  responsavel?: string | null
  observacoes?: string | null
  created_at: string
  updated_at: string
}

export type ApresentacaoSlideInput = Omit<ApresentacaoSlide, 'id' | 'created_at' | 'updated_at'>

// ──────────────────────────────────────────────────────────
// ANÁLISES
// ──────────────────────────────────────────────────────────
export interface Analise {
  id: string
  periodo: string
  responsavel?: string | null
  melhor_campanha?: string | null
  criativo_vencedor?: string | null
  publico_eficiente?: string | null
  canal_maior_roi?: string | null
  funcionou?: string | null
  nao_funcionou?: string | null
  otimizacoes?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export type AnaliseInput = Omit<Analise, 'id' | 'created_by' | 'created_at' | 'updated_at'>

// ──────────────────────────────────────────────────────────
// ESTRATÉGIAS
// ──────────────────────────────────────────────────────────
export type EstrategiaStatus = 'Planejado' | 'Em andamento' | 'Concluído' | 'Atrasado' | 'Pausado'
export type Prioridade = 'Alta' | 'Média' | 'Baixa'

export interface Estrategia {
  id: string
  objetivo: string
  plano_acao?: string | null
  responsavel?: string | null
  prazo?: string | null
  prioridade: Prioridade
  status: EstrategiaStatus
  progresso: number
  created_by?: string | null
  created_at: string
  updated_at: string
}

export type EstrategiaInput = Omit<Estrategia, 'id' | 'created_by' | 'created_at' | 'updated_at'>

// ──────────────────────────────────────────────────────────
// CHECKLIST
// ──────────────────────────────────────────────────────────
export type Frequencia = 'Diário' | 'Semanal' | 'Mensal' | 'Único'

export interface ChecklistItem {
  id: string
  texto: string
  categoria: string
  frequencia: Frequencia
  concluido: boolean
  responsavel?: string | null
  data_conclusao?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export type ChecklistItemInput = Omit<ChecklistItem, 'id' | 'created_by' | 'created_at' | 'updated_at'>

// ──────────────────────────────────────────────────────────
// CLIENTE OCULTO
// ──────────────────────────────────────────────────────────
export interface AvaliacaoClienteOculto {
  id: string
  data_avaliacao: string
  canal: string
  avaliador: string
  tempo_resposta?: string | null
  nota_qualidade?: number | null
  nota_abordagem?: number | null
  fechou?: string | null
  nota_geral?: number | null
  pontos_fortes?: string | null
  melhorias?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export type AvaliacaoClienteOcultoInput = Omit<AvaliacaoClienteOculto, 'id' | 'created_by' | 'created_at' | 'updated_at'>

// ──────────────────────────────────────────────────────────
// TREINAMENTOS
// ──────────────────────────────────────────────────────────
export type NivelTreinamento = 'Iniciante' | 'Intermediário' | 'Avançado'
export type Certificado = 'Sim' | 'Não' | 'Em emissão'

export interface Treinamento {
  id: string
  colaborador: string
  area: string
  nome_treinamento: string
  data_realizacao: string
  nivel: NivelTreinamento
  avaliacao?: number | null
  horas: number
  certificado: Certificado
  observacoes?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export type TreinamentoInput = Omit<Treinamento, 'id' | 'created_by' | 'created_at' | 'updated_at'>

// ──────────────────────────────────────────────────────────
// INTEGRAÇÃO
// ──────────────────────────────────────────────────────────
export type IntegracaoStatus = 'Ativa' | 'Inativa' | 'Pausada' | 'Encerrada'

export interface Integracao {
  id: string
  campanha_digital: string
  acao_fisica: string
  oferta?: string | null
  conversoes_offline: number
  canal_digital: string
  periodo: string
  status: IntegracaoStatus
  responsavel?: string | null
  observacoes?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export type IntegracaoInput = Omit<Integracao, 'id' | 'created_by' | 'created_at' | 'updated_at'>

// ──────────────────────────────────────────────────────────
// CONTEÚDOS ORGÂNICOS
// ──────────────────────────────────────────────────────────
export interface ConteudoOrganico {
  id: string
  data_publicacao: string
  plataforma: string
  tipo: string
  tema: string
  descricao?: string | null
  likes: number
  comentarios: number
  saves: number
  alcance: number
  seguidores_ganhos: number
  created_by?: string | null
  created_at: string
  updated_at: string
}

export type ConteudoOrganicoInput = Omit<ConteudoOrganico, 'id' | 'created_by' | 'created_at' | 'updated_at'>

// ──────────────────────────────────────────────────────────
// LEADS / PIPELINE
// ──────────────────────────────────────────────────────────
export type LeadEtapa = 'Lead Gerado' | 'Contato Realizado' | 'Proposta Enviada' | 'Negociação' | 'Fechado' | 'Perdido'
export type LeadTemperatura = 'hot' | 'warm' | 'cold'

export interface Lead {
  id: string
  nome: string
  contato?: string | null
  telefone?: string | null
  segmento?: string | null
  origem: string
  etapa: LeadEtapa
  valor_potencial: number
  responsavel?: string | null
  temperatura: LeadTemperatura
  observacoes?: string | null
  ordem_etapa: number
  created_by?: string | null
  created_at: string
  updated_at: string
}

export type LeadInput = Omit<Lead, 'id' | 'created_by' | 'created_at' | 'updated_at'>

export interface LeadHistorico {
  id: string
  lead_id: string
  evento: string
  detalhe?: string | null
  temperatura?: string | null
  responsavel?: string | null
  etapa_anterior?: string | null
  etapa_nova?: string | null
  created_at: string
}

// ──────────────────────────────────────────────────────────
// UI HELPERS
// ──────────────────────────────────────────────────────────
export interface KpiCardData {
  cor: string
  icon: string
  label: string
  value: string | number
  sub: string
}

export interface BarRowData {
  label: string
  pct: number
  color: string
  value: string
}

export interface FunnelStage {
  nome: string
  valor: number
  pct: number
  cor: string
}

export type Periodo = 'mes' | 'sem' | 'tri' | 'ano'
