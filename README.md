# Open Soluções — Sistema de Gestão Inteligente

Sistema completo de gestão de marketing para a Open Soluções Industriais.  
Stack: **Next.js 14 + TypeScript + Supabase (PostgreSQL) + Tailwind CSS + dnd-kit**

---

## Estrutura do Projeto

```
open-gestao-marketing/
├── app/
│   ├── login/                    # Página de autenticação
│   └── (dashboard)/              # Área protegida
│       ├── page.tsx              # Visão Executiva
│       ├── midia-paga/           # Controle de Investimentos
│       ├── campanhas/            # Gestão de Campanhas
│       ├── funil/                # Funil Completo (2 tabs)
│       ├── resultados/           # Resultados & Análise
│       ├── estrategia/           # Estratégias
│       ├── checklist/            # Checklist Operacional
│       ├── cliente-oculto/       # Avaliações Cliente Oculto
│       ├── treinamento/          # Treinamento do Time
│       ├── integracao/           # Integração Digital+Offline
│       ├── organico/             # Orgânico — Redes Sociais
│       └── pipeline/             # Pipeline Comercial (Kanban)
├── components/
│   ├── layout/                   # Sidebar, Topbar
│   ├── ui/                       # KpiCard, Modal, Toast, etc.
│   ├── kanban/                   # Board, Column, Card (dnd-kit)
│   └── funil/                    # TabPipeline, TabMetricas
├── lib/
│   ├── supabase/                 # client.ts, server.ts
│   └── utils.ts                  # Funções de formatação
├── types/index.ts                # Tipagem TypeScript completa
├── middleware.ts                 # Proteção de rotas
└── supabase/
    └── migrations/
        └── 001_initial.sql       # Schema completo do banco
```

---

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (free tier funciona)

---

## Configuração

### 1. Clonar / abrir o projeto

```bash
cd open-gestao-marketing
npm install
```

### 2. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) → **New Project**
2. Copie a **URL** e a **anon key** (Settings → API)
3. Copie a **service_role key** se for usar RLS avançado

### 3. Criar o arquivo `.env.local`

```bash
cp .env.example .env.local
```

Preencha com suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### 4. Rodar a migration no Supabase

No [Supabase Dashboard](https://app.supabase.com):

1. Vá em **SQL Editor**
2. Abra o arquivo `supabase/migrations/001_initial.sql`
3. Cole e execute o conteúdo completo

Isso cria todas as tabelas, políticas RLS, índices, triggers e dados iniciais (blocos da apresentação).

### 5. Criar o primeiro usuário

No Supabase Dashboard → **Authentication → Users → Invite user**

Ou via SQL Editor:
```sql
-- Criar usuário admin (substitua o email)
insert into auth.users (email, encrypted_password, email_confirmed_at, role)
values ('admin@opensol.com.br', crypt('senha123', gen_salt('bf')), now(), 'authenticated');
```

Depois atualize o perfil para admin:
```sql
update public.profiles set role = 'admin' where id = (
  select id from auth.users where email = 'admin@opensol.com.br'
);
```

### 6. Rodar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## Deploy (Vercel — recomendado)

```bash
npm install -g vercel
vercel
```

Configure as variáveis de ambiente no painel da Vercel (mesmo conteúdo do `.env.local`).

---

## Funcionalidades

| Módulo | Funcionalidades |
|--------|----------------|
| Visão Executiva | KPIs consolidados, funil resumido, ROI por canal |
| Mídia Paga | CRUD completo, cálculo automático CPC/CPM/CTR/CPL/ROI |
| Campanhas | CRUD com filtros por plataforma e status |
| Funil Completo | **Tab 1**: Pipeline da Apresentação (27 slides em 7 blocos, status por slide) · **Tab 2**: Métricas digitais por canal com gargalos automáticos |
| Resultados | Análises estratégicas, vencedores/melhorias do período |
| Estratégia | Objetivos com progresso, prioridade e prazo |
| Checklist | Toggle persistente, agrupado por categoria, reset semanal |
| Cliente Oculto | Avaliações com notas, fechamento, pontos fortes/melhorias |
| Treinamento | Colaboradores, áreas, avaliações, certificados |
| Integração | Ações digital+offline com conversões físicas rastreadas |
| Orgânico | Posts por plataforma, métricas de engajamento |
| Pipeline | **Kanban drag-and-drop** com histórico automático de movimentações |

---

## Perfis de Acesso

| Perfil | Acesso |
|--------|--------|
| `admin` | Total — lê e grava tudo |
| `operacional` | Lê e grava todos os dados (RLS por `auth.uid()`) |

Para expandir permissões diferenciadas, edite as políticas RLS em `001_initial.sql`.

---

## Portabilidade

O sistema roda em qualquer ambiente Node.js 18+ com as variáveis de ambiente configuradas.  
Sem dependência de serviços proprietários além do Supabase (que pode ser auto-hospedado via `supabase/cli`).

Para migrar para outro banco:
1. Adapte o `001_initial.sql` para MySQL/SQLite se necessário
2. Substitua `@supabase/ssr` + `@supabase/supabase-js` por outro client ORM

---

## Tecnologias

- **Next.js 14** (App Router, Server + Client Components)
- **TypeScript** (tipagem completa)
- **Supabase** (PostgreSQL + Auth + Row Level Security)
- **TanStack Query** (cache, loading states, invalidation)
- **@dnd-kit** (Kanban drag-and-drop persistente)
- **Tailwind CSS** + CSS Variables (design system fiel ao protótipo)
- **Sora + Space Mono** (tipografia original)
