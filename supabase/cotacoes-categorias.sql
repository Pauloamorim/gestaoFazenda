-- SÓ RODE ISTO se você já rodou o cotacoes.sql anterior (o que só tinha novilha).
-- Instalando do zero, o cotacoes.sql atual já cria esta coluna.

alter table lotes add column categoria text;

-- As cotações já guardadas são de novilha; a coluna categoria já vinha com
-- esse valor por padrão, então não há nada para corrigir no histórico.
