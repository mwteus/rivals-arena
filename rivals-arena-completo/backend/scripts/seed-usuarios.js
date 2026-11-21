// Cria os 4 usuários de demonstração (Auth + tabela usuarios) e as publicações de exemplo.
// Uso:  npm run seed:usuarios      (rode DEPOIS do 02_inserir_dados.sql)
// Pode ser rodado mais de uma vez: usuários que já existem são reaproveitados.
const { supabaseAdmin } = require('../src/config/supabase');

const SENHA_DEMO = 'demo1234';

const DEMO = [
  { nick: 'Kairo', email: 'kairo@demo.com', jogo: 'Valorant',          pontos: 980, vitorias: 41, derrotas: 12, tag: 'FRG' },
  { nick: 'Lume',  email: 'lume@demo.com',  jogo: 'League of Legends', pontos: 910, vitorias: 37, derrotas: 15, tag: 'CRX' },
  { nick: 'Brisa', email: 'brisa@demo.com', jogo: 'Counter-Strike 2',  pontos: 860, vitorias: 33, derrotas: 18, tag: 'TTB' },
  { nick: 'Vexa',  email: 'vexa@demo.com',  jogo: 'Valorant',          pontos: 790, vitorias: 29, derrotas: 20, tag: 'ECL' }
];

const POSTS = [
  { nick: 'Kairo', categoria: 'procura-time', texto: 'Alguém para completar o time no Valorant? Procuro duelista.' },
  { nick: 'Lume',  categoria: 'dicas',        texto: 'Dica: treinem o posicionamento antes de pensar em mira.' }
];

async function acharUsuarioAuthPorEmail(email) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const achou = data.users.find(u => u.email === email);
    if (achou) return achou;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  const ids = {};

  for (const u of DEMO) {
    let authUser;
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: SENHA_DEMO,
      email_confirm: true // já entra confirmado, sem precisar de e-mail
    });

    if (error) {
      authUser = await acharUsuarioAuthPorEmail(u.email);
      if (!authUser) throw new Error(`Não foi possível criar ${u.email}: ${error.message}`);
      console.log(`↺ ${u.email} já existia no Auth, reaproveitando.`);
    } else {
      authUser = data.user;
      console.log(`✓ ${u.email} criado no Auth.`);
    }

    const { data: time } = await supabaseAdmin.from('times').select('id').eq('tag', u.tag).single();
    if (!time) throw new Error(`Time com tag ${u.tag} não encontrado. Rodou o 02_inserir_dados.sql?`);

    const { error: upErr } = await supabaseAdmin.from('usuarios').upsert({
      id: authUser.id, nick: u.nick, jogo: u.jogo,
      pontos: u.pontos, vitorias: u.vitorias, derrotas: u.derrotas, time_id: time.id
    });
    if (upErr) throw new Error(`Erro ao salvar usuário ${u.nick}: ${upErr.message}`);
    ids[u.nick] = authUser.id;
  }

  // Publicações só são criadas se ainda não houver nenhuma
  const { count } = await supabaseAdmin.from('publicacoes').select('id', { count: 'exact', head: true });
  if (!count) {
    const { error } = await supabaseAdmin.from('publicacoes').insert(
      POSTS.map(p => ({ texto: p.texto, categoria: p.categoria, usuario_id: ids[p.nick] }))
    );
    if (error) throw new Error('Erro ao criar publicações: ' + error.message);
    console.log('✓ Publicações de exemplo criadas.');
  }

  console.log(`\nPronto! Entre no site com qualquer e-mail acima e a senha "${SENHA_DEMO}".`);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
