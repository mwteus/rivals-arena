// Servidor LOCAL (npm run dev): API + frontend na mesma porta.
const path = require('path');
const express = require('express');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('./app');

// Serve o frontend estático (rotas /api já foram tratadas pelo app)
app.use(express.static(path.join(__dirname, '../../frontend')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Rivals Arena (Frontend + Backend) rodando em http://localhost:${PORT}`);
});
