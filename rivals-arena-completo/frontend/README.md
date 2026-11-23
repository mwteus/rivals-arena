# Rivals Arena — Frontend

Site em **HTML5, CSS3 e JavaScript puro**. Os dados vêm da API do backend (`/api/...`), que lê e grava no Supabase.

## Como abrir
- **Recomendado:** suba o backend (`cd ../backend && npm run dev`) e acesse `http://localhost:3000`. O backend serve o site e a API juntos.
- Também funciona pelo Live Server do VS Code (porta 5500), desde que o backend esteja rodando na porta 3000.
- Se o backend estiver desligado, o site cai para os dados de demonstração de `js/data.js` (não é o banco de verdade).

## Páginas
`index.html` (início) · `campeonatos.html` / `campeonato.html` · `times.html` / `time.html` · `jogadores.html` · `partidas.html` · `comunidade.html` · `jogo.html` (Last Fuse) · `login.html` / `cadastro.html` · `sobre.html`

## Arquivos principais
- `js/app.js`: renderização das páginas e chamadas à API
- `js/data.js`: lista de jogos (usada nos filtros) e dados de demonstração para o modo offline
- `css/style.css`: estilos (cores oficiais: `#F26118`, `#CCFF00`, `#732EE6`, `#402D80`)

## Funcionalidades
- Campeonatos, times, ranking de jogadores, partidas e feed da comunidade lidos do banco
- Cadastro e login reais (Supabase Auth)
- Inscrição em campeonatos e publicações no feed (exigem login)
- Filtros, busca e layout responsivo
