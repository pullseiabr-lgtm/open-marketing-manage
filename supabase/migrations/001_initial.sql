-- ══════════════════════════════════════════════════════════
-- Open Soluções — Sistema de Gestão Inteligente
-- Migration 001: Schema inicial completo
-- ══════════════════════════════════════════════════════════

-- Habilitar extensões
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────
-- PROFILES (extensão do auth.users do Supabase)
-- ──────────────────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text not null default '',
  role text not null default 'operacional' check (role in ('admin', 'operacional')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Usuário vê próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admin vê todos os perfis"
  on public.profiles for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "Usuário atualiza próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: criar profile ao criar usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), 'operacional');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────────────────────
-- MÍDIA PAGA (investimentos por plataforma)
-- ──────────────────────────────────────────────────────────
create table public.investimentos_midia (
  id uuid primary key default gen_random_uuid(),
  plataforma text not null,
  tipo text not null default 'Pesquisa',
  objetivo text not null default 'Conversão',
  valor numeric(12,2) not null default 0,
  periodo date not null,
  publico text,
  segmento text,
  impressoes integer not null default 0,
  cliques integer not null default 0,
  leads integer not null default 0,
  vendas integer not null default 0,
  receita numeric(12,2) not null default 0,
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.investimentos_midia enable row level security;
create policy "Autenticado pode tudo em midia" on public.investimentos_midia
  for all using (auth.uid() is not null);

-- ──────────────────────────────────────────────────────────
-- CAMPANHAS
-- ──────────────────────────────────────────────────────────
create table public.campanhas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  plataforma text not null,
  criativo text,
  copy_texto text,
  oferta text,
  responsavel text,
  data_inicio date,
  data_fim date,
  impressoes integer not null default 0,
  cliques integer not null default 0,
  leads integer not null default 0,
  vendas integer not null default 0,
  budget numeric(12,2) not null default 0,
  receita numeric(12,2) not null default 0,
  status text not null default 'Ativa' check (status in ('Ativa','Pausada','Escala','Encerrada','Rascunho')),
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.campanhas enable row level security;
create policy "Autenticado pode tudo em campanhas" on public.campanhas
  for all using (auth.uid() is not null);

-- ──────────────────────────────────────────────────────────
-- FUNIL — ETAPAS (lookup)
-- ──────────────────────────────────────────────────────────
create table public.funil_etapas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ordem integer not null default 0,
  cor text not null default 'var(--or)'
);

alter table public.funil_etapas enable row level security;
create policy "Autenticado lê etapas" on public.funil_etapas
  for select using (auth.uid() is not null);
create policy "Admin gerencia etapas" on public.funil_etapas
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

insert into public.funil_etapas (nome, ordem, cor) values
  ('Alcance',      1, 'var(--or)'),
  ('Engajamento',  2, '#CC5500'),
  ('Cliques',      3, '#8B3A00'),
  ('Leads',        4, 'var(--cy)'),
  ('Conversões',   5, 'var(--ok)');

-- ──────────────────────────────────────────────────────────
-- FUNIL — MÉTRICAS por canal/período
-- ──────────────────────────────────────────────────────────
create table public.funil_metricas (
  id uuid primary key default gen_random_uuid(),
  canal text not null,
  periodo date not null,
  alcance integer not null default 0,
  cliques integer not null default 0,
  leads integer not null default 0,
  vendas integer not null default 0,
  investimento numeric(12,2) not null default 0,
  receita numeric(12,2) not null default 0,
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.funil_metricas enable row level security;
create policy "Autenticado pode tudo em funil_metricas" on public.funil_metricas
  for all using (auth.uid() is not null);

-- ──────────────────────────────────────────────────────────
-- APRESENTAÇÃO — BLOCOS (Tab01 Funil Completo)
-- ──────────────────────────────────────────────────────────
create table public.apresentacao_blocos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slides_inicio integer not null default 1,
  slides_fim integer not null default 1,
  ordem integer not null default 0,
  cor text not null default 'var(--or)',
  created_at timestamptz not null default now()
);

alter table public.apresentacao_blocos enable row level security;
create policy "Autenticado pode tudo em blocos" on public.apresentacao_blocos
  for all using (auth.uid() is not null);

create table public.apresentacao_slides (
  id uuid primary key default gen_random_uuid(),
  bloco_id uuid references public.apresentacao_blocos on delete cascade not null,
  numero integer not null,
  titulo text not null,
  descricao text,
  status text not null default 'rascunho' check (status in ('rascunho','em_revisao','aprovado','entregue')),
  responsavel text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.apresentacao_slides enable row level security;
create policy "Autenticado pode tudo em slides" on public.apresentacao_slides
  for all using (auth.uid() is not null);

-- Seed: blocos da apresentação Open
insert into public.apresentacao_blocos (nome, slides_inicio, slides_fim, ordem, cor) values
  ('Identidade',      1,  6,  1, 'var(--or)'),
  ('Comunicação',     7,  8,  2, 'var(--cy)'),
  ('Canais Digitais', 9,  16, 3, 'var(--bl)'),
  ('Automação',       17, 19, 4, 'var(--pu)'),
  ('Estratégia',      20, 21, 5, 'var(--wr)'),
  ('Execução',        22, 26, 6, 'var(--ok)'),
  ('Fechamento',      27, 28, 7, 'var(--gr3)');

-- Seed: slides por bloco
with b as (select id, nome from public.apresentacao_blocos)
insert into public.apresentacao_slides (bloco_id, numero, titulo, status) select
  b.id, v.num, v.titulo, v.status
from b
join (values
  -- Identidade
  ('Identidade', 1,  'Capa',                           'aprovado'),
  ('Identidade', 2,  'Agenda',                         'aprovado'),
  ('Identidade', 3,  'DNA da Marca',                   'aprovado'),
  ('Identidade', 4,  'Golden Circle',                  'em_revisao'),
  ('Identidade', 5,  'Posicionamento',                 'em_revisao'),
  ('Identidade', 6,  'Mapa Mental de Gatilhos',        'rascunho'),
  -- Comunicação
  ('Comunicação', 7, 'Linguagem Unificada',            'em_revisao'),
  ('Comunicação', 8, 'Treinamento de Atendimento',     'rascunho'),
  -- Canais Digitais
  ('Canais Digitais', 9,  'Visão Geral Canais',        'aprovado'),
  ('Canais Digitais', 10, 'Funil Estratégico',         'aprovado'),
  ('Canais Digitais', 11, 'WhatsApp',                  'aprovado'),
  ('Canais Digitais', 12, 'Instagram',                 'aprovado'),
  ('Canais Digitais', 13, 'Google Ads',                'em_revisao'),
  ('Canais Digitais', 14, 'YouTube',                   'rascunho'),
  ('Canais Digitais', 15, 'LinkedIn',                  'rascunho'),
  ('Canais Digitais', 16, 'Marketplace',               'rascunho'),
  -- Automação
  ('Automação', 17, 'Pullse CRM',                      'em_revisao'),
  ('Automação', 18, 'Fluxograma Lead→Venda',           'rascunho'),
  ('Automação', 19, 'WhatsApp Segmentado',             'rascunho'),
  -- Estratégia
  ('Estratégia', 20, 'Organograma 360° Campanhas',     'rascunho'),
  ('Estratégia', 21, 'Frases de Autoridade e Gatilhos','rascunho'),
  -- Execução
  ('Execução', 22, 'Investimento Budget R$9.000/mês',  'aprovado'),
  ('Execução', 23, 'Cronograma 30 dias',               'em_revisao'),
  ('Execução', 24, 'Cronograma 60 dias',               'rascunho'),
  ('Execução', 25, 'KPIs',                             'rascunho'),
  ('Execução', 26, 'Fluxograma Completo',              'rascunho'),
  -- Fechamento
  ('Fechamento', 27, 'Próximos Passos (6 ações)',      'rascunho'),
  ('Fechamento', 28, 'Encerramento',                   'rascunho')
) as v(bloco_nome, num, titulo, status) on b.nome = v.bloco_nome;

-- ──────────────────────────────────────────────────────────
-- ANÁLISES
-- ──────────────────────────────────────────────────────────
create table public.analises (
  id uuid primary key default gen_random_uuid(),
  periodo date not null,
  responsavel text,
  melhor_campanha text,
  criativo_vencedor text,
  publico_eficiente text,
  canal_maior_roi text,
  funcionou text,
  nao_funcionou text,
  otimizacoes text,
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.analises enable row level security;
create policy "Autenticado pode tudo em analises" on public.analises
  for all using (auth.uid() is not null);

-- ──────────────────────────────────────────────────────────
-- ESTRATÉGIAS
-- ──────────────────────────────────────────────────────────
create table public.estrategias (
  id uuid primary key default gen_random_uuid(),
  objetivo text not null,
  plano_acao text,
  responsavel text,
  prazo date,
  prioridade text not null default 'Média' check (prioridade in ('Alta','Média','Baixa')),
  status text not null default 'Planejado' check (status in ('Planejado','Em andamento','Concluído','Atrasado','Pausado')),
  progresso integer not null default 0 check (progresso between 0 and 100),
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.estrategias enable row level security;
create policy "Autenticado pode tudo em estrategias" on public.estrategias
  for all using (auth.uid() is not null);

-- ──────────────────────────────────────────────────────────
-- CHECKLIST
-- ──────────────────────────────────────────────────────────
create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  texto text not null,
  categoria text not null default 'Geral',
  frequencia text not null default 'Semanal' check (frequencia in ('Diário','Semanal','Mensal','Único')),
  concluido boolean not null default false,
  responsavel text,
  data_conclusao timestamptz,
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.checklist_items enable row level security;
create policy "Autenticado pode tudo em checklist" on public.checklist_items
  for all using (auth.uid() is not null);

-- ──────────────────────────────────────────────────────────
-- CLIENTE OCULTO
-- ──────────────────────────────────────────────────────────
create table public.avaliacoes_cliente_oculto (
  id uuid primary key default gen_random_uuid(),
  data_avaliacao date not null,
  canal text not null,
  avaliador text not null,
  tempo_resposta text,
  nota_qualidade numeric(4,1) check (nota_qualidade between 0 and 10),
  nota_abordagem numeric(4,1) check (nota_abordagem between 0 and 10),
  fechou text,
  nota_geral numeric(4,1) check (nota_geral between 0 and 10),
  pontos_fortes text,
  melhorias text,
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.avaliacoes_cliente_oculto enable row level security;
create policy "Autenticado pode tudo em oculto" on public.avaliacoes_cliente_oculto
  for all using (auth.uid() is not null);

-- ──────────────────────────────────────────────────────────
-- TREINAMENTOS
-- ──────────────────────────────────────────────────────────
create table public.treinamentos (
  id uuid primary key default gen_random_uuid(),
  colaborador text not null,
  area text not null,
  nome_treinamento text not null,
  data_realizacao date not null,
  nivel text not null default 'Iniciante' check (nivel in ('Iniciante','Intermediário','Avançado')),
  avaliacao numeric(4,1) check (avaliacao between 0 and 10),
  horas integer not null default 0,
  certificado text not null default 'Não' check (certificado in ('Sim','Não','Em emissão')),
  observacoes text,
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.treinamentos enable row level security;
create policy "Autenticado pode tudo em treinamentos" on public.treinamentos
  for all using (auth.uid() is not null);

-- ──────────────────────────────────────────────────────────
-- INTEGRAÇÃO DIGITAL + OFFLINE
-- ──────────────────────────────────────────────────────────
create table public.integracoes (
  id uuid primary key default gen_random_uuid(),
  campanha_digital text not null,
  acao_fisica text not null,
  oferta text,
  conversoes_offline integer not null default 0,
  canal_digital text not null,
  periodo date not null,
  status text not null default 'Ativa' check (status in ('Ativa','Inativa','Pausada','Encerrada')),
  responsavel text,
  observacoes text,
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.integracoes enable row level security;
create policy "Autenticado pode tudo em integracoes" on public.integracoes
  for all using (auth.uid() is not null);

-- ──────────────────────────────────────────────────────────
-- CONTEÚDOS ORGÂNICOS
-- ──────────────────────────────────────────────────────────
create table public.conteudos_organicos (
  id uuid primary key default gen_random_uuid(),
  data_publicacao date not null,
  plataforma text not null,
  tipo text not null,
  tema text not null,
  descricao text,
  likes integer not null default 0,
  comentarios integer not null default 0,
  saves integer not null default 0,
  alcance integer not null default 0,
  seguidores_ganhos integer not null default 0,
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.conteudos_organicos enable row level security;
create policy "Autenticado pode tudo em organicos" on public.conteudos_organicos
  for all using (auth.uid() is not null);

-- ──────────────────────────────────────────────────────────
-- LEADS (Pipeline Comercial)
-- ──────────────────────────────────────────────────────────
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  contato text,
  telefone text,
  segmento text,
  origem text not null default 'WhatsApp',
  etapa text not null default 'Lead Gerado' check (etapa in (
    'Lead Gerado','Contato Realizado','Proposta Enviada','Negociação','Fechado','Perdido'
  )),
  valor_potencial numeric(12,2) not null default 0,
  responsavel text,
  temperatura text not null default 'cold' check (temperatura in ('hot','warm','cold')),
  observacoes text,
  ordem_etapa integer not null default 0,
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads enable row level security;
create policy "Autenticado pode tudo em leads" on public.leads
  for all using (auth.uid() is not null);

-- Histórico de movimentações do lead
create table public.lead_historico (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads on delete cascade not null,
  evento text not null,
  detalhe text,
  temperatura text,
  responsavel text,
  etapa_anterior text,
  etapa_nova text,
  created_at timestamptz not null default now()
);

alter table public.lead_historico enable row level security;
create policy "Autenticado pode tudo em lead_historico" on public.lead_historico
  for all using (auth.uid() is not null);

-- ──────────────────────────────────────────────────────────
-- FUNÇÃO: updated_at automático
-- ──────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers updated_at
do $$ declare t text; begin
  foreach t in array array[
    'investimentos_midia','campanhas','funil_metricas','apresentacao_slides',
    'analises','estrategias','checklist_items','avaliacoes_cliente_oculto',
    'treinamentos','integracoes','conteudos_organicos','leads','profiles'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t
    );
  end loop;
end $$;

-- ──────────────────────────────────────────────────────────
-- ÍNDICES para performance
-- ──────────────────────────────────────────────────────────
create index idx_investimentos_periodo    on public.investimentos_midia(periodo);
create index idx_campanhas_status         on public.campanhas(status);
create index idx_campanhas_plataforma     on public.campanhas(plataforma);
create index idx_funil_metricas_periodo   on public.funil_metricas(periodo);
create index idx_leads_etapa              on public.leads(etapa);
create index idx_leads_responsavel        on public.leads(responsavel);
create index idx_leads_temperatura        on public.leads(temperatura);
create index idx_lead_historico_lead      on public.lead_historico(lead_id);
create index idx_checklist_categoria      on public.checklist_items(categoria);
create index idx_slides_bloco             on public.apresentacao_slides(bloco_id);
create index idx_organicos_plataforma     on public.conteudos_organicos(plataforma);
create index idx_estrategias_status       on public.estrategias(status);
