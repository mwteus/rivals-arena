-- ============================================================================
-- RIVALS ARENA - 00: REMOVE O BANCO ANTIGO (tabelas em inglês)
-- ----------------------------------------------------------------------------
-- Rode UMA vez, no SQL Editor do Supabase, SOMENTE se você já tinha executado
-- o schema.sql antigo do projeto. Se o seu Supabase é novo/vazio, pule este arquivo.
-- ATENÇÃO: apaga tudo o que estiver nessas tabelas. Não afeta o login (auth.users).
-- ============================================================================

DROP TABLE IF EXISTS public.community_posts            CASCADE;
DROP TABLE IF EXISTS public.championship_registrations CASCADE;
DROP TABLE IF EXISTS public.matches                    CASCADE;
DROP TABLE IF EXISTS public.team_members               CASCADE;
DROP TABLE IF EXISTS public.championships              CASCADE;
DROP TABLE IF EXISTS public.teams                      CASCADE;
DROP TABLE IF EXISTS public.profiles                   CASCADE;
