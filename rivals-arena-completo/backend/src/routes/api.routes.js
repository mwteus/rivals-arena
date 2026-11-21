const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const requireAuth = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const f = require('../utils/format');

// Embeds do PostgREST: como "partidas" tem DUAS ligações com "times" (A e B),
// é preciso dizer qual chave estrangeira usar com o "!nome_da_fk".
const TIME_A = 'time_a:times!partidas_time_a_id_fkey(nome, tag)';
const TIME_B = 'time_b:times!partidas_time_b_id_fkey(nome, tag)';

// --- JOGOS ---
router.get('/jogos', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('jogos').select('id, nome').order('nome');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}));

// --- CAMPEONATOS ---
router.get('/championships', asyncHandler(async (req, res) => {
  const [camps, parts] = await Promise.all([
    supabase.from('campeonatos').select('*, inscricoes(times(nome))').order('id', { ascending: true }),
    supabase.from('partidas')
      .select(`campeonato_id, status, placar_a, placar_b, ${TIME_A}, ${TIME_B}`)
      .order('data_hora', { ascending: true })
  ]);
  if (camps.error) return res.status(500).json({ error: camps.error.message });
  if (parts.error) return res.status(500).json({ error: parts.error.message });

  const formatted = camps.data.map(c => {
    const times = (c.inscricoes || []).map(i => i.times?.nome).filter(Boolean);
    // O banco não guarda "fase" da partida, então o chaveamento lista todos os confrontos
    // do campeonato na primeira etapa.
    const confrontos = parts.data
      .filter(p => p.campeonato_id === c.id)
      .map(p => p.status === 'agendada'
        ? `${p.time_a.nome} × ${p.time_b.nome} (agendada)`
        : `${p.time_a.nome} ${p.placar_a} × ${p.placar_b} ${p.time_b.nome}`);

    return {
      id: c.id,
      name: c.nome,
      game: c.jogo,
      prize: c.premio || 'A definir',
      slots: `${times.length} / ${c.vagas}`,
      date: f.rotuloDataCampeonato(c),
      status: f.STATUS_CAMPEONATO[c.status],
      description: c.descricao || '',
      teams: times,
      rounds: [confrontos.length ? confrontos : ['Aguardando confrontos'], ['A definir'], ['A definir']]
    };
  });

  res.json(formatted);
}));

router.post('/championships/:id/register', requireAuth, asyncHandler(async (req, res) => {
  const campId = Number(req.params.id);
  if (!Number.isInteger(campId)) return res.status(400).json({ error: 'Campeonato inválido.' });

  const { data: camp } = await supabase
    .from('campeonatos').select('id, nome, jogo, status, vagas').eq('id', campId).maybeSingle();
  if (!camp) return res.status(404).json({ error: 'Campeonato não encontrado.' });
  if (camp.status !== 'aberto') {
    return res.status(400).json({ error: 'As inscrições deste campeonato não estão abertas.' });
  }

  const { data: perfil } = await supabase
    .from('usuarios').select('id, nick, time_id, times(id, nome, jogo)').eq('id', req.user.id).maybeSingle();
  if (!perfil) return res.status(403).json({ error: 'Perfil não encontrado.' });

  const { count } = await supabase
    .from('inscricoes').select('id', { count: 'exact', head: true }).eq('campeonato_id', campId);
  if ((count || 0) >= camp.vagas) return res.status(400).json({ error: 'Este campeonato já está com as vagas preenchidas.' });

  let time = perfil.times;

  if (time) {
    if (time.jogo !== camp.jogo) {
      return res.status(400).json({ error: `Sua equipe joga ${time.jogo}, mas este campeonato é de ${camp.jogo}.` });
    }
  } else {
    // Jogador sem equipe: cria uma equipe nova com o nome informado
    const nome = String(req.body.team_name || '').trim();
    if (nome.length < 3 || nome.length > 40) {
      return res.status(400).json({ error: 'Você ainda não tem equipe. Informe um nome de equipe (3 a 40 caracteres).' });
    }

    const base = nome.normalize('NFD').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 3).padEnd(3, 'X');
    let criado = null;
    for (let i = 0; i < 10 && !criado; i++) {
      const tag = i === 0 ? base : base + i;
      const { data, error } = await supabaseAdmin
        .from('times').insert([{ nome, tag, jogo: camp.jogo }]).select('id, nome, jogo').single();
      if (!error) { criado = data; break; }
      if (error.code === '23505' && error.message.includes('times_nome_key')) {
        return res.status(409).json({ error: 'Já existe uma equipe com esse nome.' });
      }
      if (error.code !== '23505') return res.status(400).json({ error: error.message });
      // tag repetida: tenta a próxima variação
    }
    if (!criado) return res.status(400).json({ error: 'Não foi possível gerar uma tag para a equipe.' });

    await supabaseAdmin.from('usuarios').update({ time_id: criado.id }).eq('id', perfil.id);
    time = criado;
  }

  const { error } = await supabaseAdmin
    .from('inscricoes').insert([{ time_id: time.id, campeonato_id: campId }]);
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Sua equipe já está inscrita neste campeonato.' });
    return res.status(400).json({ error: 'Erro na inscrição: ' + error.message });
  }

  res.status(201).json({ message: `Inscrição de "${time.nome}" confirmada em ${camp.nome}!` });
}));

// --- TIMES ---
router.get('/teams', asyncHandler(async (req, res) => {
  const [times, finalizadas] = await Promise.all([
    supabase.from('times').select('*, usuarios(nick)').order('pontos', { ascending: false }),
    supabase.from('partidas').select('time_a_id, time_b_id, placar_a, placar_b').eq('status', 'finalizada')
  ]);
  if (times.error) return res.status(500).json({ error: times.error.message });
  if (finalizadas.error) return res.status(500).json({ error: finalizadas.error.message });

  // Vitórias e derrotas são calculadas a partir das partidas finalizadas
  const campanha = {};
  const conta = (id, campo) => {
    campanha[id] = campanha[id] || { wins: 0, losses: 0 };
    campanha[id][campo]++;
  };
  for (const p of finalizadas.data) {
    if (p.placar_a > p.placar_b) { conta(p.time_a_id, 'wins'); conta(p.time_b_id, 'losses'); }
    else if (p.placar_b > p.placar_a) { conta(p.time_b_id, 'wins'); conta(p.time_a_id, 'losses'); }
  }

  res.json(times.data.map(t => ({
    id: t.id,
    name: t.nome,
    tag: t.tag,
    game: t.jogo,
    points: t.pontos,
    members: t.usuarios?.length || 0,
    wins: campanha[t.id]?.wins || 0,
    losses: campanha[t.id]?.losses || 0,
    desc: t.descricao || '',
    players: (t.usuarios || []).map(u => u.nick)
  })));
}));

// --- JOGADORES ---
router.get('/players', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('nick, jogo, pontos, vitorias, derrotas, times(nome)')
    .order('pontos', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  res.json(data.map(p => ({
    nick: p.nick,
    team: p.times?.nome || 'Sem equipe',
    game: p.jogo,
    points: p.pontos,
    wins: p.vitorias,
    losses: p.derrotas
  })));
}));

// --- PARTIDAS ---
router.get('/matches', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('partidas')
    .select(`id, status, placar_a, placar_b, data_hora, campeonatos(nome, jogo), ${TIME_A}, ${TIME_B}`);
  if (error) return res.status(500).json({ error: error.message });

  // Ordem: ao vivo, depois as próximas (mais cedo primeiro), depois as finalizadas (mais recente primeiro)
  const ordem = { ao_vivo: 0, agendada: 1, finalizada: 2 };
  const ts = (p) => (p.data_hora ? new Date(p.data_hora).getTime() : 0);
  data.sort((a, b) => ordem[a.status] - ordem[b.status] || (a.status === 'finalizada' ? ts(b) - ts(a) : ts(a) - ts(b)));

  res.json(data.map(m => ({
    a: m.time_a.tag,
    b: m.time_b.tag,
    teamA: m.time_a.nome,
    teamB: m.time_b.nome,
    score: f.placar(m),
    game: m.campeonatos?.jogo || '',
    event: m.campeonatos?.nome || '',
    date: f.rotuloDataPartida(m.data_hora),
    state: f.STATUS_PARTIDA[m.status]
  })));
}));

// --- COMUNIDADE ---
router.get('/posts', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('publicacoes')
    .select('id, texto, categoria, created_at, usuarios(nick)')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });

  res.json(data.map(p => ({
    id: p.id,
    user: p.usuarios?.nick || 'Jogador',
    tag: f.CATEGORIA_PARA_ROTULO[p.categoria] || 'Discussão',
    time: f.rotuloPostagem(p.created_at),
    text: p.texto
  })));
}));

// Correção: antes qualquer pessoa (sem login) podia postar usando o nick de outra.
// Agora exige login e o autor é sempre o usuário logado.
router.post('/posts', requireAuth, asyncHandler(async (req, res) => {
  const text = String(req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Escreva uma mensagem.' });
  if (text.length > 280) return res.status(400).json({ error: 'A mensagem pode ter no máximo 280 caracteres.' });

  const categoria = f.ROTULO_PARA_CATEGORIA[req.body.tag] || 'discussao';

  const { data: perfil } = await supabase.from('usuarios').select('nick').eq('id', req.user.id).maybeSingle();
  if (!perfil) return res.status(403).json({ error: 'Perfil não encontrado.' });

  const { data, error } = await supabaseAdmin
    .from('publicacoes')
    .insert([{ texto: text, categoria, usuario_id: req.user.id }])
    .select('id, texto, categoria')
    .single();
  if (error) return res.status(400).json({ error: error.message });

  res.status(201).json({
    id: data.id,
    user: perfil.nick,
    tag: f.CATEGORIA_PARA_ROTULO[data.categoria],
    time: 'agora',
    text: data.texto
  });
}));

module.exports = router;
