-- ============================================================================
-- RIVALS ARENA - 01: CRIA AS TABELAS (PostgreSQL / Supabase)
-- ----------------------------------------------------------------------------
-- Convertido do banco MySQL "rivals_arena_front" para PostgreSQL.
-- Rode no SQL Editor do Supabase. Pode ser rodado de novo: ele recria as tabelas
-- (APAGA os dados que estiverem nelas).
-- No Supabase NÃO existe CREATE DATABASE: o projeto já é o banco.
-- ============================================================================

-- Limpa versões anteriores (ordem: das tabelas "filhas" para as "mães")
DROP TABLE IF EXISTS public.publicacoes CASCADE;
DROP TABLE IF EXISTS public.partidas    CASCADE;
DROP TABLE IF EXISTS public.inscricoes  CASCADE;
DROP TABLE IF EXISTS public.usuarios    CASCADE;
DROP TABLE IF EXISTS public.campeonatos CASCADE;
DROP TABLE IF EXISTS public.times       CASCADE;
DROP TABLE IF EXISTS public.jogos       CASCADE;

-- Atualiza "updated_at" automaticamente (no MySQL era ON UPDATE CURRENT_TIMESTAMP)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1. JOGOS ------------------------------------------------------------------
CREATE TABLE public.jogos (
  id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome       VARCHAR(40) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TIMES ------------------------------------------------------------------
CREATE TABLE public.times (
  id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome       VARCHAR(40) NOT NULL UNIQUE,
  tag        VARCHAR(5)  NOT NULL UNIQUE,
  jogo       VARCHAR(40) NOT NULL REFERENCES public.jogos(nome) ON UPDATE CASCADE,
  descricao  VARCHAR(300),
  pontos     INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. USUARIOS (perfil público do jogador) ------------------------------------
-- O e-mail e a senha NÃO ficam aqui: o Supabase Auth guarda isso em auth.users.
-- O "id" abaixo é o mesmo id do usuário no Auth (é assim que as duas tabelas se ligam).
CREATE TABLE public.usuarios (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nick       VARCHAR(30) NOT NULL UNIQUE,
  jogo       VARCHAR(40) NOT NULL DEFAULT 'Valorant' REFERENCES public.jogos(nome) ON UPDATE CASCADE,
  pontos     INT NOT NULL DEFAULT 0,
  vitorias   INT NOT NULL DEFAULT 0,
  derrotas   INT NOT NULL DEFAULT 0,
  time_id    INT REFERENCES public.times(id) ON DELETE SET NULL ON UPDATE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CAMPEONATOS ------------------------------------------------------------
CREATE TABLE public.campeonatos (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome        VARCHAR(80) NOT NULL,
  jogo        VARCHAR(40) NOT NULL REFERENCES public.jogos(nome) ON UPDATE CASCADE,
  status      VARCHAR(12) NOT NULL DEFAULT 'aberto'
              CHECK (status IN ('aberto', 'andamento', 'encerrado')),
  premio      VARCHAR(40),
  vagas       INT NOT NULL DEFAULT 16 CHECK (vagas > 0),
  data_inicio DATE,
  descricao   VARCHAR(400),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. INSCRICOES (qual time está em qual campeonato) ---------------------------
-- Correção: no original as chaves eram opcionais (NULL) e ON DELETE SET NULL, o que
-- deixava inscrições "órfãs". Agora são obrigatórias e somem junto com o time/campeonato.
CREATE TABLE public.inscricoes (
  id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  time_id       INT NOT NULL REFERENCES public.times(id)       ON DELETE CASCADE ON UPDATE CASCADE,
  campeonato_id INT NOT NULL REFERENCES public.campeonatos(id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (time_id, campeonato_id)  -- o mesmo time não se inscreve duas vezes
);

-- 6. PARTIDAS ---------------------------------------------------------------
CREATE TABLE public.partidas (
  id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  campeonato_id INT NOT NULL REFERENCES public.campeonatos(id) ON DELETE CASCADE ON UPDATE CASCADE,
  time_a_id     INT NOT NULL,
  time_b_id     INT NOT NULL,
  placar_a      INT NOT NULL DEFAULT 0,
  placar_b      INT NOT NULL DEFAULT 0,
  status        VARCHAR(12) NOT NULL DEFAULT 'agendada'
                CHECK (status IN ('agendada', 'ao_vivo', 'finalizada')),
  data_hora     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT partidas_time_a_id_fkey FOREIGN KEY (time_a_id) REFERENCES public.times(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT partidas_time_b_id_fkey FOREIGN KEY (time_b_id) REFERENCES public.times(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT partidas_times_diferentes CHECK (time_a_id <> time_b_id)
);

-- 7. PUBLICACOES (feed da comunidade) ------------------------------------------
CREATE TABLE public.publicacoes (
  id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  texto      VARCHAR(500) NOT NULL CHECK (length(btrim(texto)) > 0),
  categoria  VARCHAR(20)  NOT NULL DEFAULT 'geral'
             CHECK (categoria IN ('geral', 'discussao', 'procura-time', 'dicas', 'clipes')),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices nas colunas usadas em filtros/ordenação
-- Nickname único sem diferenciar maiúsculas/minúsculas ("Kairo" e "kairo" são o mesmo nick)
CREATE UNIQUE INDEX idx_usuarios_nick_lower ON public.usuarios(lower(nick));
CREATE INDEX idx_usuarios_time       ON public.usuarios(time_id);
CREATE INDEX idx_usuarios_pontos     ON public.usuarios(pontos DESC);
CREATE INDEX idx_times_pontos        ON public.times(pontos DESC);
CREATE INDEX idx_inscricoes_camp     ON public.inscricoes(campeonato_id);
CREATE INDEX idx_partidas_camp       ON public.partidas(campeonato_id);
CREATE INDEX idx_partidas_time_a     ON public.partidas(time_a_id);
CREATE INDEX idx_partidas_time_b     ON public.partidas(time_b_id);
CREATE INDEX idx_publicacoes_criado  ON public.publicacoes(created_at DESC);

-- Gatilhos de updated_at
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['jogos','times','usuarios','campeonatos','inscricoes','partidas','publicacoes']
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END $$;

-- ============================================================================
-- SEGURANÇA (Row Level Security)
-- ----------------------------------------------------------------------------
-- Regra do projeto: QUALQUER pessoa pode LER os dados públicos; NINGUÉM escreve
-- direto pela API pública do Supabase. Toda escrita passa pelo backend (Node),
-- que valida login e regras e usa a chave secreta (service_role), que ignora o RLS.
-- (Isso corrige o schema antigo, que deixava qualquer um criar posts e permitia
--  que o usuário editasse os próprios pontos/vitórias direto pela API.)
-- ============================================================================
ALTER TABLE public.jogos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.times       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscricoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publicacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leitura publica jogos"       ON public.jogos       FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "leitura publica times"       ON public.times       FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "leitura publica usuarios"    ON public.usuarios    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "leitura publica campeonatos" ON public.campeonatos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "leitura publica inscricoes"  ON public.inscricoes  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "leitura publica partidas"    ON public.partidas    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "leitura publica publicacoes" ON public.publicacoes FOR SELECT TO anon, authenticated USING (true);

-- Permissões de tabela: só leitura para anon/authenticated
REVOKE ALL ON public.jogos, public.times, public.usuarios, public.campeonatos,
              public.inscricoes, public.partidas, public.publicacoes
  FROM anon, authenticated;
GRANT SELECT ON public.jogos, public.times, public.usuarios, public.campeonatos,
                public.inscricoes, public.partidas, public.publicacoes
  TO anon, authenticated;
