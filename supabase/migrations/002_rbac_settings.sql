-- ══════════════════════════════════════════════════════════
-- Open Soluções — Migration 002
-- RBAC + Configurações White Label + Métricas Sociais
-- ══════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────
-- CONFIGURAÇÕES (White Label — single row por tenant)
-- ──────────────────────────────────────────────────────────
create table public.configuracoes (
  id uuid primary key default gen_random_uuid(),
  empresa_nome text not null default 'Open Soluções Industriais',
  empresa_slogan text default 'Gestão Inteligente de Marketing',
  logo_url text,
  cor_primaria text not null default '#FF6A0D',
  cor_primaria_hover text not null default '#FF8A3D',
  cor_primaria_bg text not null default 'rgba(255,106,13,0.10)',
  sidebar_bg text not null default '#1A1A1A',
  topbar_bg text not null default '#1A1A1A',
  favicon_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.configuracoes enable row level security;

create policy "Qualquer autenticado pode ler config" on public.configuracoes
  for select using (auth.uid() is not null);

create policy "Somente superadmin edita config" on public.configuracoes
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'superadmin')
    )
  );

-- Seed default
insert into public.configuracoes (empresa_nome) values ('Open Soluções Industriais');

-- ──────────────────────────────────────────────────────────
-- ROLES (Papeis)
-- ──────────────────────────────────────────────────────────
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.roles enable row level security;
create policy "Autenticado lê roles" on public.roles
  for select using (auth.uid() is not null);
create policy "Superadmin gerencia roles" on public.roles
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','superadmin'))
  );

-- ──────────────────────────────────────────────────────────
-- PERMISSIONS (Permissões granulares)
-- ──────────────────────────────────────────────────────────
create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  modulo text not null,
  acao text not null, -- 'read', 'create', 'update', 'delete'
  descricao text,
  unique (modulo, acao)
);

alter table public.permissions enable row level security;
create policy "Autenticado lê permissions" on public.permissions
  for select using (auth.uid() is not null);
create policy "Superadmin gerencia permissions" on public.permissions
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','superadmin'))
  );

-- ──────────────────────────────────────────────────────────
-- ROLE_PERMISSIONS (Junção)
-- ──────────────────────────────────────────────────────────
create table public.role_permissions (
  role_id uuid references public.roles(id) on delete cascade,
  permission_id uuid references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

alter table public.role_permissions enable row level security;
create policy "Autenticado lê role_permissions" on public.role_permissions
  for select using (auth.uid() is not null);
create policy "Superadmin gerencia role_permissions" on public.role_permissions
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','superadmin'))
  );

-- ──────────────────────────────────────────────────────────
-- ATUALIZAR PROFILES — adicionar superadmin e campos extras
-- ──────────────────────────────────────────────────────────
-- Remove CHECK antigo primeiro (001 aceitava só admin/operacional)
alter table public.profiles
  drop constraint if exists profiles_role_check;

-- Normaliza roles legadas antes de reforçar o CHECK
update public.profiles
set role = case
  when role is null then 'operacional'
  when lower(trim(role)) in ('superadmin', 'super_admin', 'super-admin') then 'superadmin'
  when lower(trim(role)) in ('admin', 'administrador', 'administrator') then 'admin'
  when lower(trim(role)) in ('operacional', 'operacao', 'operador', 'operator', 'user', 'usuario') then 'operacional'
  else 'operacional'
end;

alter table public.profiles
  add constraint profiles_role_check check (role in ('superadmin','admin','operacional'));

alter table public.profiles
  add column if not exists email text,
  add column if not exists is_active boolean not null default true,
  add column if not exists last_login_at timestamptz;

-- ──────────────────────────────────────────────────────────
-- MÉTRICAS SOCIAIS (snapshot periódico)
-- ──────────────────────────────────────────────────────────
create table public.metricas_sociais (
  id uuid primary key default gen_random_uuid(),
  plataforma text not null,
  periodo date not null,
  -- Seguidores
  seguidores_total integer not null default 0,
  seguidores_novos integer not null default 0,
  seguidores_perdidos integer not null default 0,
  -- Alcance
  alcance_seguidores integer not null default 0,
  alcance_nao_seguidores integer not null default 0,
  impressoes integer not null default 0,
  -- Engajamento
  curtidas integer not null default 0,
  comentarios integer not null default 0,
  compartilhamentos integer not null default 0,
  saves integer not null default 0,
  cliques_link integer not null default 0,
  cliques_perfil integer not null default 0,
  -- Campanhas
  campanhas_ativas integer not null default 0,
  campanhas_total integer not null default 0,
  -- Extras
  visitas_perfil integer not null default 0,
  stories_visualizacoes integer not null default 0,
  observacoes text,
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(plataforma, periodo)
);

alter table public.metricas_sociais enable row level security;
create policy "Autenticado pode tudo em metricas_sociais" on public.metricas_sociais
  for all using (auth.uid() is not null);

-- Trigger updated_at para novas tabelas
create trigger set_updated_at_configuracoes before update on public.configuracoes
  for each row execute function public.set_updated_at();
create trigger set_updated_at_roles before update on public.roles
  for each row execute function public.set_updated_at();
create trigger set_updated_at_metricas_sociais before update on public.metricas_sociais
  for each row execute function public.set_updated_at();

-- ──────────────────────────────────────────────────────────
-- SEED: Roles e Permissões do sistema
-- ──────────────────────────────────────────────────────────
insert into public.roles (nome, descricao, is_system) values
  ('Superadmin',   'Acesso total ao sistema, incluindo configurações e usuários', true),
  ('Administrador','Acesso completo à gestão de marketing, sem área de usuários', true),
  ('Operacional',  'Acesso de leitura e entrada de dados operacionais', true),
  ('Analista',     'Acesso às métricas e dashboards, sem edição de campanhas', false),
  ('Conteúdo',     'Acesso às seções de orgânico, checklist e treinamento', false);

-- Seed permissões por módulo
insert into public.permissions (modulo, acao, descricao) values
  -- Visão Executiva
  ('exec',          'read',   'Visualizar Visão Executiva'),
  -- Mídia Paga
  ('midia',         'read',   'Visualizar Mídia Paga'),
  ('midia',         'create', 'Adicionar investimento de mídia'),
  ('midia',         'update', 'Editar investimento de mídia'),
  ('midia',         'delete', 'Excluir investimento de mídia'),
  -- Campanhas
  ('campanhas',     'read',   'Visualizar campanhas'),
  ('campanhas',     'create', 'Criar campanhas'),
  ('campanhas',     'update', 'Editar campanhas'),
  ('campanhas',     'delete', 'Excluir campanhas'),
  -- Funil
  ('funil',         'read',   'Visualizar Funil Completo'),
  ('funil',         'create', 'Adicionar métricas ao funil'),
  ('funil',         'update', 'Editar funil'),
  ('funil',         'delete', 'Excluir dados do funil'),
  -- Resultados
  ('resultados',    'read',   'Visualizar análises'),
  ('resultados',    'create', 'Registrar análise'),
  ('resultados',    'update', 'Editar análise'),
  ('resultados',    'delete', 'Excluir análise'),
  -- Estratégia
  ('estrategia',    'read',   'Visualizar estratégias'),
  ('estrategia',    'create', 'Criar estratégia'),
  ('estrategia',    'update', 'Editar estratégia'),
  ('estrategia',    'delete', 'Excluir estratégia'),
  -- Checklist
  ('checklist',     'read',   'Visualizar checklist'),
  ('checklist',     'create', 'Adicionar item'),
  ('checklist',     'update', 'Marcar item / editar'),
  ('checklist',     'delete', 'Excluir item'),
  -- Cliente Oculto
  ('oculto',        'read',   'Visualizar avaliações'),
  ('oculto',        'create', 'Registrar avaliação'),
  ('oculto',        'update', 'Editar avaliação'),
  ('oculto',        'delete', 'Excluir avaliação'),
  -- Treinamento
  ('treinamento',   'read',   'Visualizar treinamentos'),
  ('treinamento',   'create', 'Registrar treinamento'),
  ('treinamento',   'update', 'Editar treinamento'),
  ('treinamento',   'delete', 'Excluir treinamento'),
  -- Integração
  ('integracao',    'read',   'Visualizar integrações'),
  ('integracao',    'create', 'Criar integração'),
  ('integracao',    'update', 'Editar integração'),
  ('integracao',    'delete', 'Excluir integração'),
  -- Orgânico
  ('organico',      'read',   'Visualizar conteúdos orgânicos'),
  ('organico',      'create', 'Registrar conteúdo'),
  ('organico',      'update', 'Editar conteúdo'),
  ('organico',      'delete', 'Excluir conteúdo'),
  -- Pipeline
  ('pipeline',      'read',   'Visualizar pipeline comercial'),
  ('pipeline',      'create', 'Criar lead'),
  ('pipeline',      'update', 'Mover/editar lead'),
  ('pipeline',      'delete', 'Excluir lead'),
  -- Métricas
  ('metricas',      'read',   'Visualizar métricas sociais'),
  ('metricas',      'create', 'Registrar métrica'),
  ('metricas',      'update', 'Editar métrica'),
  ('metricas',      'delete', 'Excluir métrica'),
  -- Admin
  ('usuarios',      'read',   'Visualizar usuários'),
  ('usuarios',      'create', 'Criar usuário'),
  ('usuarios',      'update', 'Editar usuário'),
  ('usuarios',      'delete', 'Desativar usuário'),
  ('configuracoes', 'read',   'Visualizar configurações'),
  ('configuracoes', 'update', 'Editar configurações do sistema');

-- Índices
create index idx_metricas_sociais_plat  on public.metricas_sociais(plataforma);
create index idx_metricas_sociais_per   on public.metricas_sociais(periodo);
create index idx_role_permissions_role  on public.role_permissions(role_id);
