-- Execute somente após revisar no SQL Editor do seu projeto Supabase.
-- Não cria tabelas nem altera saldos existentes. Depende do schema fornecido.
begin;

-- A aplicação usa a API do backend, com autorização explícita por usuário.
-- Não crie políticas permissivas para anon/authenticated nestas tabelas privadas.
-- Policies preexistentes precisam ser revisadas separadamente: ENABLE RLS não as remove.
alter table public.profiles enable row level security;
alter table public.servicos enable row level security;
alter table public.categorias enable row level security;
alter table public.pedidos enable row level security;
alter table public.pagamentos enable row level security;
alter table public.movimentacoes_creditos enable row level security;
alter table public.avaliacoes enable row level security;
alter table public.mensagens enable row level security;
alter table public.notificacoes enable row level security;
alter table public.portfolio enable row level security;

create or replace function public.tefreela_pagar_pedido(p_id_pedido bigint, p_id_cliente uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_pagamento public.pagamentos%rowtype;
  v_saldo numeric(12,2);
  v_taxa numeric(12,2);
  v_liquido numeric(12,2);
begin
  -- Bloqueio serializa pagamento e impede duplo débito em reenvios concorrentes.
  select * into v_pedido from public.pedidos where id_pedido = p_id_pedido for update;
  if not found or v_pedido.id_cliente <> p_id_cliente or v_pedido.status <> 'concluido'
     or v_pedido.id_cliente = v_pedido.id_freelancer then
    raise exception 'Pedido não pode ser pago';
  end if;
  select * into v_pagamento from public.pagamentos
    where id_pedido = p_id_pedido and status = 'processado' order by id_pagamento limit 1;
  if found then return to_jsonb(v_pagamento); end if;

  -- Ordem estável evita deadlock entre transferências envolvendo as mesmas contas.
  perform id from public.profiles where id in (v_pedido.id_cliente, v_pedido.id_freelancer) order by id for update;
  select saldo_creditos into v_saldo from public.profiles where id = p_id_cliente and tipo_usuario = 'cliente';
  if not found or v_saldo < v_pedido.valor then raise exception 'Saldo insuficiente'; end if;
  if not exists(select 1 from public.profiles where id = v_pedido.id_freelancer and tipo_usuario = 'freelancer') then
    raise exception 'Freelancer inválido';
  end if;
  v_taxa := round(v_pedido.valor * 0.05, 2);
  v_liquido := v_pedido.valor - v_taxa;
  update public.profiles set saldo_creditos = saldo_creditos - v_pedido.valor where id = p_id_cliente;
  update public.profiles set saldo_creditos = saldo_creditos + v_liquido where id = v_pedido.id_freelancer;
  insert into public.pagamentos(id_pedido,valor_servico,percentual_taxa,valor_taxa,valor_freelancer,status,data_pagamento)
    values(p_id_pedido,v_pedido.valor,5,v_taxa,v_liquido,'processado',now()) returning * into v_pagamento;
  insert into public.movimentacoes_creditos(id_usuario,id_pedido,tipo,valor,descricao) values
    (p_id_cliente,p_id_pedido,'debito',v_pedido.valor,'Pagamento acadêmico de pedido'),
    (v_pedido.id_freelancer,p_id_pedido,'pagamento',v_liquido,'Recebimento líquido, taxa acadêmica de 5%');
  insert into public.notificacoes(id_usuario,titulo,mensagem,tipo) values
    (v_pedido.id_freelancer,'Pagamento recebido','Créditos acadêmicos recebidos pelo pedido #' || p_id_pedido,'pagamento');
  return to_jsonb(v_pagamento);
end;
$$;
revoke all on function public.tefreela_pagar_pedido(bigint,uuid) from public, anon, authenticated;
grant execute on function public.tefreela_pagar_pedido(bigint,uuid) to service_role;
commit;
