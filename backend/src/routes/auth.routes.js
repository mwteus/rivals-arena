const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin, createAuthClient } = require('../config/supabase');
const requireAuth = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const NICK_REGEX = /^[\p{L}\p{N}_.-]{3,30}$/u;

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const nick = String(req.body.nick || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const game = String(req.body.game || 'Valorant');

  if (!nick || !email || !password) {
    return res.status(400).json({ error: 'Nickname, e-mail e senha são obrigatórios.' });
  }
  if (!NICK_REGEX.test(nick)) {
    return res.status(400).json({ error: 'O nickname deve ter de 3 a 30 caracteres (letras, números, _ . -).' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
  }

  // O jogo precisa existir na tabela "jogos"
  const { data: jogo } = await supabase.from('jogos').select('nome').eq('nome', game).maybeSingle();
  if (!jogo) return res.status(400).json({ error: 'Jogo inválido.' });

  // Nick livre? (checa ANTES de criar a conta, para não deixar conta sem perfil)
  const { data: nickEmUso } = await supabase.from('usuarios').select('id').eq('nick', nick).maybeSingle();
  if (nickEmUso) return res.status(409).json({ error: 'Esse nickname já está em uso.' });

  const { data, error } = await createAuthClient().auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  // Com confirmação de e-mail ligada, o Supabase devolve um usuário "falso" sem identities
  // quando o e-mail já existe.
  if (!data.user || data.user.identities?.length === 0) {
    return res.status(409).json({ error: 'Esse e-mail já está cadastrado.' });
  }

  const { error: perfilErr } = await supabaseAdmin
    .from('usuarios')
    .insert([{ id: data.user.id, nick, jogo: game }]);

  if (perfilErr) {
    // Desfaz a conta criada, para não sobrar usuário no Auth sem perfil
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    if (perfilErr.code === '23505') return res.status(409).json({ error: 'Esse nickname já está em uso.' });
    return res.status(400).json({ error: 'Erro ao criar perfil: ' + perfilErr.message });
  }

  const session = data.session
    ? { access_token: data.session.access_token, refresh_token: data.session.refresh_token, expires_at: data.session.expires_at }
    : null;

  res.status(201).json({
    message: session
      ? 'Conta criada com sucesso!'
      : 'Conta criada! Confirme seu e-mail (veja sua caixa de entrada) para poder entrar.',
    session,
    profile: { id: data.user.id, nick, jogo: game }
  });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ error: 'Informe e-mail e senha.' });

  const { data, error } = await createAuthClient().auth.signInWithPassword({ email, password });
  if (error) {
    if (/not confirmed/i.test(error.message)) {
      return res.status(401).json({ error: 'Confirme seu e-mail antes de entrar.' });
    }
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  }

  const { data: profile } = await supabase.from('usuarios').select('*').eq('id', data.user.id).maybeSingle();
  if (!profile) {
    return res.status(403).json({ error: 'Esse usuário não tem perfil na arena. Crie sua conta pela página de cadastro.' });
  }

  res.json({
    message: 'Login realizado!',
    session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token, expires_at: data.session.expires_at },
    profile
  });
}));

// GET /api/auth/me
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { data: profile } = await supabase.from('usuarios').select('*').eq('id', req.user.id).maybeSingle();
  res.json({ profile });
}));

module.exports = router;
