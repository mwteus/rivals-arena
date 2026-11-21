# Guia do banco de dados — Rivals Arena + Supabase

Este guia mostra como colocar o banco no ar, como ele é organizado e como usá-lo no dia a dia.

> **Resumo do que mudou:** o banco antigo do projeto (tabelas em inglês: `profiles`, `teams`, `matches`...) foi **removido** e
> substituído pelo banco do segundo ZIP (`Times`, `Usuarios`, `Campeonatos`, `Inscricaos`, `Partidas`, `Publicacaos`, `Jogos`).
> Esse banco era **MySQL**; o Supabase usa **PostgreSQL**, então ele foi convertido (a lista de ajustes está no fim do guia).

---

## 1. Colocando no ar (passo a passo)

### 1.1 Criar o projeto no Supabase
1. Entre em <https://supabase.com>, faça login e clique em **New project**.
2. Dê um nome (ex.: `rivals-arena`), defina e **guarde a senha do banco** e escolha a região (por exemplo *South America – São Paulo*).
3. Aguarde alguns minutos até o projeto ficar pronto.

### 1.2 Criar as tabelas e os dados
No menu lateral do Supabase, abra **SQL Editor** → **New query**. Para cada arquivo abaixo (pasta `rivals-arena-completo/backend/database/`), abra o arquivo, copie todo o conteúdo, cole no editor e clique em **Run**:

| Ordem | Arquivo | Para quê |
|---|---|---|
| 0 (opcional) | `00_remover_banco_antigo.sql` | Só se você já tinha rodado o `schema.sql` antigo. Apaga as tabelas em inglês. |
| 1 | `01_criar_tabelas.sql` | Cria as 7 tabelas, índices, regras de segurança (RLS) e gatilhos. |
| 2 | `02_inserir_dados.sql` | Insere jogos, times, campeonatos, inscrições e partidas de demonstração. |

Depois confira em **Table Editor**: devem aparecer `jogos`, `times`, `usuarios`, `campeonatos`, `inscricoes`, `partidas` e `publicacoes`.

> ⚠️ O `01` apaga e recria as tabelas. Rode quando o banco ainda não tiver dados importantes. O `02` deve ser rodado **uma vez só** (rodar de novo dá erro de duplicidade).

### 1.3 Pegar a URL e as chaves
No Supabase, vá em **Project Settings → API Keys** (a URL do projeto aparece no botão **Connect**, no topo).

| Valor | Onde fica | Vai em |
|---|---|---|
| URL do projeto (`https://xxxx.supabase.co`) | botão **Connect** | `SUPABASE_URL` |
| **Publishable key** (`sb_publishable_...`) | aba *Publishable and secret API keys* | `SUPABASE_PUBLISHABLE_KEY` |
| **Secret key** (`sb_secret_...`) | mesma aba (se não existir, clique em *Create new API Keys*) | `SUPABASE_SECRET_KEY` |

Se o seu projeto ainda usa as chaves antigas (`anon` e `service_role`, aba *Legacy*), funciona do mesmo jeito: `anon` = publishable e `service_role` = secret. O projeto aceita também os nomes `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.

### 1.4 Configurar e rodar o backend
```bash
cd rivals-arena-completo/backend
cp .env.example .env        # no Windows: copy .env.example .env
# abra o .env e cole a URL e as duas chaves
npm install
npm run seed:usuarios       # cria os 4 usuários de demonstração + 2 publicações
npm run dev                 # sobe em http://localhost:3000
```
Abra <http://localhost:3000>. Para entrar, use `kairo@demo.com` (ou `lume@`, `brisa@`, `vexa@`) com a senha `demo1234`.

### 1.5 Configuração do login (importante)
Em **Authentication → Providers → Email** (o nome do menu pode variar um pouco conforme a versão do painel) existe a opção **Confirm email**:
- **Ligada** (padrão): quem se cadastra precisa clicar no link enviado por e-mail antes de entrar. O site avisa isso após o cadastro.
- **Desligada**: o cadastro já entra direto. É mais prático para testar. Ligue de novo antes de publicar o site.

Para ver quem se cadastrou: **Authentication → Users**.

---

## 2. Como o banco é organizado

```
jogos ──────────────┬──< times ──────────┬──< usuarios >── (auth.users: e-mail/senha)
(lista de jogos)    │      │             │        │
                    │      ├──< inscricoes >── campeonatos
                    │      └──< partidas (time A × time B) >── campeonatos
                    └──────────────────────────────────────────┘
                                         usuarios ──< publicacoes (feed)
```

| Tabela | O que guarda | Colunas principais |
|---|---|---|
| `jogos` | Jogos disponíveis | `nome` |
| `times` | Equipes | `nome`, `tag` (até 5 letras, única), `jogo`, `descricao`, `pontos` |
| `usuarios` | Perfil público do jogador | `id` (mesmo id do login), `nick`, `jogo`, `pontos`, `vitorias`, `derrotas`, `time_id` |
| `campeonatos` | Torneios | `nome`, `jogo`, `status` (`aberto`/`andamento`/`encerrado`), `premio`, `vagas`, `data_inicio`, `descricao` |
| `inscricoes` | Qual time está em qual campeonato | `time_id`, `campeonato_id` (par único) |
| `partidas` | Confrontos | `campeonato_id`, `time_a_id`, `time_b_id`, `placar_a`, `placar_b`, `status` (`agendada`/`ao_vivo`/`finalizada`), `data_hora` |
| `publicacoes` | Posts do feed | `texto`, `categoria`, `usuario_id` |

Todas as tabelas têm também `id`, `created_at` (criado em) e `updated_at` (atualizado em, preenchido sozinho por um gatilho).

**Onde ficam e-mail e senha?** Não nas suas tabelas. O Supabase Auth guarda em `auth.users` (com a senha criptografada). A tabela `usuarios` usa o **mesmo `id`** desse login: é assim que “quem logou” vira “qual jogador é”.

**Chaves estrangeiras (FK)** são as ligações entre tabelas. Exemplo: `usuarios.time_id` só aceita um id que exista em `times`. Apagar um time deixa o `time_id` dos jogadores vazio; apagar um campeonato apaga suas inscrições e partidas.

---

## 3. Como o site usa o banco

```
Navegador (frontend)  ──►  Backend Node (/api/...)  ──►  Supabase (PostgreSQL + Auth)
```

- **Leitura** (campeonatos, times, jogadores, partidas, posts): o backend lê com a chave pública. Qualquer pessoa pode ler, pois o RLS libera `SELECT`.
- **Escrita** (cadastro, inscrição, post): o backend confere se você está logado, valida as regras e só então grava com a chave secreta.
- **Ninguém escreve direto no banco pela internet.** O RLS (*Row Level Security*) e as permissões de tabela do `01_criar_tabelas.sql` bloqueiam `INSERT/UPDATE/DELETE` para a chave pública. Por isso, mesmo que alguém descubra a chave pública, não consegue alterar pontos nem postar como outra pessoa.

| Endpoint | O que faz | Precisa de login? |
|---|---|---|
| `GET /api/championships` | Campeonatos, times inscritos e confrontos | não |
| `GET /api/teams` | Times com integrantes, vitórias e derrotas (calculadas das partidas finalizadas) | não |
| `GET /api/players` | Ranking de jogadores | não |
| `GET /api/matches` | Partidas (ao vivo → próximas → finalizadas) | não |
| `GET /api/posts` | Feed da comunidade | não |
| `GET /api/jogos` | Lista de jogos | não |
| `POST /api/auth/register` | Cria conta e perfil | não |
| `POST /api/auth/login` | Login | não |
| `GET /api/auth/me` | Perfil de quem está logado | sim |
| `POST /api/posts` | Publica no feed (o autor é sempre quem está logado) | sim |
| `POST /api/championships/:id/register` | Inscreve a equipe do jogador | sim |

Regras da inscrição: o campeonato precisa estar `aberto` e com vaga; a equipe precisa jogar o mesmo jogo do campeonato; não dá para se inscrever duas vezes. Se o jogador ainda não tem equipe, o nome digitado no formulário cria uma equipe nova e ele entra nela.

---

## 4. Usando o banco no dia a dia

### 4.1 Pelo painel (sem código)
**Table Editor** funciona como uma planilha: escolha a tabela, clique numa célula para editar, use **Insert row** para criar uma linha. É o jeito mais fácil de, por exemplo, mudar o `status` de um campeonato de `aberto` para `andamento`.

### 4.2 Pelo SQL Editor
Consultas úteis (cole e clique em **Run**):

```sql
-- Ranking de times
SELECT nome, tag, jogo, pontos FROM times ORDER BY pontos DESC;

-- Quem está em cada time
SELECT t.nome AS time, u.nick
FROM usuarios u JOIN times t ON t.id = u.time_id
ORDER BY t.nome, u.nick;

-- Times inscritos em cada campeonato, com vagas usadas
SELECT c.nome AS campeonato, count(i.id) AS inscritos, c.vagas
FROM campeonatos c LEFT JOIN inscricoes i ON i.campeonato_id = c.id
GROUP BY c.id ORDER BY c.nome;

-- Partidas com nome dos times
SELECT p.id, ta.nome AS time_a, p.placar_a, p.placar_b, tb.nome AS time_b, p.status, p.data_hora
FROM partidas p
JOIN times ta ON ta.id = p.time_a_id
JOIN times tb ON tb.id = p.time_b_id
ORDER BY p.data_hora DESC;
```

Alterando dados:

```sql
-- Novo campeonato
INSERT INTO campeonatos (nome, jogo, premio, vagas, data_inicio, descricao)
VALUES ('Copa Verão', 'Valorant', 'R$ 1.500', 16, '2027-01-15', 'Torneio de verão.');

-- Marcar partida como finalizada e lançar o placar
UPDATE partidas SET status = 'finalizada', placar_a = 13, placar_b = 7 WHERE id = 1;

-- Somar pontos a um time
UPDATE times SET pontos = pontos + 25 WHERE tag = 'FRG';

-- Agendar uma partida (inclua o fuso: -03 = horário de Brasília)
INSERT INTO partidas (campeonato_id, time_a_id, time_b_id, status, data_hora)
VALUES (1, 1, 4, 'agendada', '2026-12-10 20:00:00-03');
```

> ⚠️ Sempre use `WHERE` em `UPDATE` e `DELETE`. Sem ele, a alteração vale para **todas** as linhas.
> Os valores `status` e `categoria` só aceitam as opções listadas na seção 2; outro valor dá erro de `CHECK`.

### 4.3 Pelo código (backend, com `supabase-js`)
Os arquivos em `backend/src/routes/` já fazem isso. Os padrões principais:

```js
// Ler (SELECT) com filtro e ordenação
const { data, error } = await supabase
  .from('times').select('nome, tag, pontos')
  .eq('jogo', 'Valorant').order('pontos', { ascending: false }).limit(10);

// Ler com junção: jogadores já com o nome do time
const { data } = await supabase.from('usuarios').select('nick, pontos, times(nome)');

// Inserir
await supabaseAdmin.from('times').insert([{ nome: 'Novo Time', tag: 'NVT', jogo: 'Valorant' }]);

// Atualizar
await supabaseAdmin.from('campeonatos').update({ status: 'andamento' }).eq('id', 1);

// Apagar
await supabaseAdmin.from('publicacoes').delete().eq('id', 5);
```
Sempre confira `error`: o `supabase-js` não lança exceção, ele devolve `{ data, error }`.
`supabase` (chave pública) só **lê**. `supabaseAdmin` (chave secreta) escreve e **ignora o RLS**: use apenas no servidor, depois de validar o usuário.

### 4.4 Quando as partidas mudam, o site muda
Vitórias/derrotas dos times são calculadas a partir das partidas `finalizada`. Basta lançar o placar e a tela de times se atualiza. Já os `pontos` (times) e `pontos/vitorias/derrotas` (jogadores) **não são automáticos**: atualize-os manualmente (SQL acima) ou crie essa regra no backend.

---

## 4.5 Publicar na Vercel
O projeto já vem preparado (`vercel.json`, `api/index.js` e `package.json` dentro de `rivals-arena-completo/`). Na Vercel, defina **Root Directory = `rivals-arena-completo`** e cadastre as variáveis `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY` (as mesmas do `.env`). O `npm run dev` local continua funcionando igual.

## 5. Segurança — o essencial
- O arquivo `backend/.env` contém a **chave secreta**. Nunca envie para o GitHub (o `.gitignore` já ignora) e nunca coloque no frontend. Se vazar, crie uma nova em *Settings → API Keys* e apague a antiga.
- Não desative o RLS. Se um dia quiser permitir escrita direta do navegador, crie políticas específicas (por exemplo, “só edita a própria linha”) em vez de liberar tudo.
- Faça backup antes de rodar o `01_criar_tabelas.sql` de novo (ele apaga os dados).

## 6. Problemas comuns

| Sintoma | Causa provável / solução |
|---|---|
| `❌ Configure SUPABASE_URL...` ao iniciar | O `.env` não existe ou está incompleto. Copie o `.env.example` e preencha. |
| Site mostra dados “de mentira” | Backend desligado: o site cai para `js/data.js`. Rode `npm run dev`. |
| `relation "public.usuarios" does not exist` | O `01_criar_tabelas.sql` não foi executado. |
| `seed:usuarios` diz “Time com tag FRG não encontrado” | Falta rodar o `02_inserir_dados.sql` antes. |
| Cadastro funciona mas não consigo entrar | “Confirm email” está ligado: confirme o e-mail ou desligue a opção (item 1.5). |
| “Sessão inválida ou expirada” | O login vale por cerca de 1 hora. Entre de novo. |
| `Failed to fetch` no navegador | O backend não está rodando na porta 3000. |
| Erro `23505` / “duplicate key” | Tentou repetir algo único (nome/tag de time, nick, inscrição). |
| Erro `23503` / “foreign key” | Referência a um id que não existe (ex.: `time_id` de um time apagado). |

---

## 7. O que foi corrigido e convertido

**Conversão MySQL → PostgreSQL**
- Removidos `CREATE DATABASE`, `USE`, `SET FOREIGN_KEY_CHECKS` e `ENGINE=InnoDB` (no Supabase o projeto já é o banco). O script original também tinha erros de sintaxe (faltava `;` e havia linhas soltas de `CHARACTER SET`).
- `AUTO_INCREMENT` → `GENERATED ALWAYS AS IDENTITY`; `DATETIME` → `TIMESTAMPTZ`; `ENUM` → `VARCHAR` com `CHECK`; `ON UPDATE CURRENT_TIMESTAMP` → gatilho `set_updated_at`; `NOW()/DATE_ADD` → `now() + interval`; `INSERT IGNORE` → inserção única.
- Nomes padronizados em `snake_case` minúsculo (evita aspas no PostgreSQL): `createdAt` → `created_at`, `TimeId` → `time_id`, `dataInicio` → `data_inicio`, `placarA` → `placar_a`, `UsuarioId` → `usuario_id` etc.
- Tabelas com nome corrigido (eram artefatos de pluralização automática em inglês): `Inscricaos` → `inscricoes`, `Publicacaos` → `publicacoes`.

**Problemas do banco original corrigidos**
- `Usuarios` guardava e-mail e senha: agora isso fica no Supabase Auth. O `id` do usuário passou a ser o mesmo do login. (Os hashes de senha do MySQL não são aproveitados; os usuários de demonstração são recriados com a senha `demo1234`.)
- Chaves estrangeiras opcionais em `inscricoes`, `partidas` e `publicacoes` (permitiam linhas sem time/campeonato/autor): agora são obrigatórias.
- `inscricoes` aceitava o mesmo time duas vezes no mesmo campeonato: agora há restrição de unicidade. Partidas com o mesmo time nos dois lados também são barradas.
- `tag` do time e `nick` (sem diferenciar maiúsculas) agora são únicos.
- Jogos com nomes divergentes do site (`CS2`/`Counter-Strike 2`, `EA FC`/`EA Sports FC`): padronizados com a lista do frontend. `times.jogo`, `usuarios.jogo` e `campeonatos.jogo` agora só aceitam jogos da tabela `jogos`.
- Dados de demonstração incoerentes (ex.: partida de League of Legends entre um time de LoL e um de Valorant): ajustados. Foram acrescentados os times **Lobos** e **Vortex** e as inscrições deles; Lume e Brisa passaram a jogar o mesmo jogo do seu time.

**Correções no projeto (backend e frontend)**
- Login/cadastro usavam o mesmo cliente Supabase das leituras, então a sessão do último usuário podia “vazar” para as outras requisições. Agora cada login usa um cliente novo.
- Qualquer pessoa, sem login, podia publicar no feed com o nick de outra. Agora publicar exige login.
- As políticas antigas deixavam o jogador editar os próprios pontos e vitórias direto pela API. Agora a escrita só passa pelo backend.
- Falha de rede com o Supabase podia derrubar o servidor (erros em rotas `async` sem tratamento). Foi adicionado tratamento global de erros.
- Se o perfil falhava ao criar, sobrava uma conta no Auth sem perfil. Agora a conta é desfeita. O cadastro também avisa e-mail e nick já em uso.
- Falha de segurança XSS: o site montava HTML com textos vindos do banco (posts, nicks, nomes de times) sem escapar, e o parâmetro `?q=` da busca era refletido na página. Corrigido.
- Frontend: o endereço da API fixo em `localhost:3000` agora se ajusta sozinho; a partida “ao vivo” e o campeonato em destaque da página inicial estavam escritos no código e agora vêm do banco; o login que expira é tratado; imagens de 3 jogos que não existiam na pasta (`overwatch2`, `pubg`, `minecraft`) não geram mais imagem quebrada.
- Inscrição em campeonato agora valida status, vagas, jogo da equipe e duplicidade (antes aceitava qualquer nome de equipe como texto solto).
- `.env` não estava protegido no `.gitignore` da raiz: corrigido. READMEs desatualizados foram reescritos.

**Limitações conhecidas**
- O banco não tem “fase” da partida (quartas, semifinal, final): o chaveamento do site lista todos os confrontos na primeira etapa. Para ter fases, acrescente uma coluna `fase` em `partidas`.
- O banco não tem capitão/função de jogador nem avatar: a página do time mostra todos como “Jogador”.
- Pontos de times e jogadores são atualizados manualmente (item 4.4).
- Não há limite de requisições (rate limit) no backend; antes de publicar na internet, considere adicionar.
