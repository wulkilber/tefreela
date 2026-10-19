-- Exclusão lógica por participante. Não apaga mensagens nem a cópia do contato.
begin;
alter table public.mensagens add column if not exists ocultada_remetente boolean not null default false;
alter table public.mensagens add column if not exists ocultada_destinatario boolean not null default false;

create or replace function public.tefreela_excluir_conversa(p_usuario_id uuid,p_contato_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare quantidade integer;
begin
 if p_usuario_id=p_contato_id then raise exception 'Escolha outro contato' using errcode='P0001'; end if;
 -- A mesma instrução marca as duas direções; novas mensagens continuam visíveis.
 update public.mensagens set
  ocultada_remetente=case when id_remetente=p_usuario_id then true else ocultada_remetente end,
  ocultada_destinatario=case when id_destinatario=p_usuario_id then true else ocultada_destinatario end
 where (id_remetente=p_usuario_id and id_destinatario=p_contato_id)
    or (id_remetente=p_contato_id and id_destinatario=p_usuario_id);
 get diagnostics quantidade=row_count;
 return jsonb_build_object('mensagem','Conversa excluída do seu histórico.','mensagens_afetadas',quantidade);
end $$;
revoke all on function public.tefreela_excluir_conversa(uuid,uuid) from public,anon,authenticated;
grant execute on function public.tefreela_excluir_conversa(uuid,uuid) to service_role;
notify pgrst,'reload schema';
commit;
