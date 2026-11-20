const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/auth.routes');
const apiRoutes = require('./routes/api.routes');

const app = express();
app.use(cors());
app.use(express.json());

// Rotas da API
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// Serve o frontend estático pela mesma porta
app.use(express.static(path.join(__dirname, '../../frontend')));

// Tratamento de erros (qualquer exceção nas rotas cai aqui)
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Rivals Arena (Frontend + Backend) rodando em http://localhost:${PORT}`);
});
