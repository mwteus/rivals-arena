const { createAuthClient } = require('../config/supabase');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Você precisa estar logado para realizar esta ação.' });
    }

    const token = authHeader.split(' ')[1];
    const { data, error } = await createAuthClient().auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada. Entre novamente.' });
    }

    req.user = data.user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Erro interno na autenticação.' });
  }
}

module.exports = requireAuth;
