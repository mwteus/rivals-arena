// Aplicação Express (somente a API). É usada de duas formas:
//  - localmente: backend/src/server.js importa este app, serve o frontend e dá app.listen
//  - na Vercel: api/index.js exporta este app como função serverless
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const apiRoutes = require('./routes/api.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// Tratamento de erros (qualquer exceção nas rotas cai aqui)
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

module.exports = app;
