-- MIGRAÇÃO APOSENTADA. Não executar.
-- O modelo de créditos foi substituído por 002_taxas_plataforma.sql.
-- O código anterior permanece apenas no histórico Git para auditoria.
-- A remoção física opcional das estruturas antigas está comentada em 003.
do $$ begin
 raise exception 'Migração 001 aposentada. Use 002_taxas_plataforma.sql.';
end $$;
