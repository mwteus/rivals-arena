const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
// Aceita os nomes novos (publishable/secret) e os antigos (anon/service_role)
const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !publicKey || !secretKey) {
  console.error(
    '❌ Configure SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY e SUPABASE_SECRET_KEY no arquivo backend/.env\n' +
    '   (copie o .env.example para .env e preencha com os dados do seu projeto Supabase).'
  );
  process.exit(1);
}

// Servidor não guarda sessão de ninguém.
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

// Cliente só para LEITURA pública (respeita o RLS). Nunca use para login!
const supabase = createClient(url, publicKey, options);

// Cliente ADMIN (chave secreta, ignora o RLS): usado para escrever e administrar usuários.
const supabaseAdmin = createClient(url, secretKey, options);

// Correção: o código antigo fazia login no mesmo cliente compartilhado, e a sessão do
// último usuário que logou "vazava" para as requisições de todo mundo.
// Para login/cadastro/validar token, sempre crie um cliente novo e descartável.
const createAuthClient = () => createClient(url, publicKey, options);

module.exports = { supabase, supabaseAdmin, createAuthClient };
