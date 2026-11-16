-- Tefreela: migration alinhada ao schema real do Supabase.
-- Pode ser executada mais de uma vez com segurança.

alter table public.profiles
  add column if not exists ativo boolean not null default true,
  add column if not exists deletado_em timestamptz;

alter table public.servicos
  add column if not exists ativo boolean not null default true,
  add column if not exists deletado_em timestamptz;

alter table public.pedidos
  add column if not exists cancelado_em timestamptz,
  add column if not exists cancelado_por text,
  add column if not exists motivo_cancelamento text;

create index if not exists idx_servicos_freelancer_ativos
  on public.servicos (id_freelancer)
  where deletado_em is null;

create index if not exists idx_pedidos_cliente_status
  on public.pedidos (id_cliente, status);

create index if not exists idx_pedidos_freelancer_status
  on public.pedidos (id_freelancer, status);
