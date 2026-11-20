-- ============================================================================
-- RIVALS ARENA - 02: DADOS DE DEMONSTRAÇÃO
-- ----------------------------------------------------------------------------
-- Rode DEPOIS do 01_criar_tabelas.sql, uma única vez (rodar de novo duplicaria/daria erro).
-- Usuários e publicações NÃO são criados aqui: precisam existir no Supabase Auth.
-- Eles são criados pelo comando:  npm run seed:usuarios   (veja o GUIA_BANCO_DE_DADOS.md)
-- ============================================================================

-- Jogos: mesma lista (e mesmos nomes) usada nos filtros do site.
-- Correção: o original tinha "CS2" e "Counter-Strike 2" e "EA FC" fora do padrão do frontend.
INSERT INTO public.jogos (nome) VALUES
  ('Valorant'), ('League of Legends'), ('Counter-Strike 2'), ('Fortnite'),
  ('Rocket League'), ('Free Fire'), ('Rainbow Six Siege'), ('Dota 2'),
  ('Apex Legends'), ('EA Sports FC'), ('Overwatch 2'), ('PUBG'), ('Minecraft');

-- Times
-- Lobos e Vortex foram ACRESCENTADOS para que as partidas de demonstração façam sentido
-- (antes, uma partida de League of Legends era entre um time de LoL e um de Valorant).
INSERT INTO public.times (nome, tag, jogo, pontos, descricao) VALUES
  ('Fragmentos', 'FRG', 'Valorant',          1840, 'Time de demonstração focado em jogadas coordenadas.'),
  ('Cinza Roxo', 'CRX', 'League of Legends', 1620, 'Time de demonstração com foco em macro jogo.'),
  ('Tatu Bola',  'TTB', 'Counter-Strike 2',  1495, 'Time de demonstração, rápido e agressivo.'),
  ('Eclipse BR', 'ECL', 'Valorant',          1310, 'Time de demonstração em ascensão.'),
  ('Lobos',      'LOB', 'League of Legends', 1180, 'Time de demonstração, resistente na defesa.'),
  ('Vortex',     'VTX', 'Counter-Strike 2',  1090, 'Time de demonstração com jogadas rápidas de entrada.');

-- Campeonatos
INSERT INTO public.campeonatos (nome, jogo, status, premio, vagas, data_inicio, descricao) VALUES
  ('Copa Arena Open',   'Valorant',          'aberto',    'R$ 2.000', 16, '2026-12-05', 'Torneio aberto de demonstração, eliminatória simples.'),
  ('Liga Rivals',       'League of Legends', 'andamento', 'R$ 5.000',  8, '2026-10-20', 'Liga de demonstração em pontos corridos.'),
  ('Desafio Fragmento', 'Counter-Strike 2',  'encerrado', 'R$ 1.000',  8, '2026-09-01', 'Edição encerrada, usada como exemplo.');

-- Inscrições (procura os ids pela tag/nome, sem depender da ordem de criação)
INSERT INTO public.inscricoes (time_id, campeonato_id)
SELECT t.id, c.id
FROM (VALUES
  ('FRG', 'Copa Arena Open'),
  ('ECL', 'Copa Arena Open'),
  ('CRX', 'Liga Rivals'),
  ('LOB', 'Liga Rivals'),
  ('TTB', 'Desafio Fragmento'),
  ('VTX', 'Desafio Fragmento')
) AS v(tag, campeonato)
JOIN public.times t       ON t.tag  = v.tag
JOIN public.campeonatos c ON c.nome = v.campeonato;

-- Partidas
INSERT INTO public.partidas (campeonato_id, time_a_id, time_b_id, status, placar_a, placar_b, data_hora)
SELECT c.id, ta.id, tb.id, v.status, v.pa, v.pb, v.quando
FROM (VALUES
  ('Liga Rivals',       'CRX', 'LOB', 'ao_vivo',    1,  1, now()),
  ('Copa Arena Open',   'FRG', 'ECL', 'agendada',   0,  0, now() + interval '3 days'),
  ('Desafio Fragmento', 'TTB', 'VTX', 'finalizada', 13, 9, now() - interval '30 days')
) AS v(campeonato, tag_a, tag_b, status, pa, pb, quando)
JOIN public.campeonatos c ON c.nome = v.campeonato
JOIN public.times ta      ON ta.tag = v.tag_a
JOIN public.times tb      ON tb.tag = v.tag_b;
