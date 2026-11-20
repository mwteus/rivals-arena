# Rivals Arena — Projeto completo (Frontend + Backend Node.js + Supabase)

- `/frontend`: o site (HTML, CSS e JavaScript puro), já conectado à API do backend.
- `/backend`: servidor Node.js + Express + Supabase e os scripts SQL do banco (`backend/database`).

## Como rodar (resumo)

1. No **SQL Editor** do Supabase, rode em ordem: `backend/database/01_criar_tabelas.sql` e `02_inserir_dados.sql`
   (se você já tinha o banco antigo em inglês, rode antes o `00_remover_banco_antigo.sql`).
2. Na pasta `backend/`, copie `.env.example` para `.env` e preencha a URL e as chaves do seu projeto.
3. Instale, crie os usuários de demonstração e inicie:
   ```bash
   cd backend
   npm install
   npm run seed:usuarios
   npm run dev
   ```
4. Abra `http://localhost:3000` (o backend também serve o site).

Passo a passo completo, explicação do banco e como usá-lo: **`../GUIA_BANCO_DE_DADOS.md`**.

Contas de demonstração (criadas pelo `seed:usuarios`): `kairo@demo.com`, `lume@demo.com`, `brisa@demo.com`, `vexa@demo.com` — senha `demo1234`.
