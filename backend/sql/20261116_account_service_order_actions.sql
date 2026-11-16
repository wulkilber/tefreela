-- Tefreela: suporte seguro a exclusão lógica e cancelamento de solicitações.
-- Execute no SQL Editor do Supabase antes de usar os novos endpoints.

alter table if exists public.profiles
  add column if not exists ativo boolean not null default true,
  add column if not exists deletado_em timestamptz;

alter table if exists public.servicos
  add column if not exists ativo boolean not null default true,
  add column if not exists deletado_em timestamptz;

alter table if exists public.pedidos
  add column if not exists cancelado_em timestamptz,
  add column if not exists cancelado_por text,
  add column if not exists motivo_cancelamento text;

alter table if exists public.notificacoes
  add column if not exists usuario_id uuid,
  add column if not exists titulo text,
  add column if not exists mensagem text,
  add column if not exists lida boolean not null default false,
  add column if not exists criado_em timestamptz not null default now();

create index if not exists idx_servicos_freelancer_ativos
  on public.servicos (freelancer_id)
  where deletado_em is null;

create index if not exists idx_pedidos_cliente_status
  on public.pedidos (cliente_id, status);

create index if not exists idx_pedidos_freelancer_status
  on public.pedidos (freelancer_id, status);
