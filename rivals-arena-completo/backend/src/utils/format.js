// Funções que traduzem o formato do banco (snake_case, status curtos) para o
// formato que o frontend espera (rótulos em português para exibir na tela).

const TZ = 'America/Sao_Paulo';

const STATUS_CAMPEONATO = { aberto: 'Inscrições abertas', andamento: 'Em andamento', encerrado: 'Encerrado' };
const STATUS_PARTIDA = { agendada: 'Agendada', ao_vivo: 'Em andamento', finalizada: 'Finalizada' };

const CATEGORIA_PARA_ROTULO = {
  geral: 'Discussão', discussao: 'Discussão', 'procura-time': 'Procura time', dicas: 'Dicas', clipes: 'Clipes'
};
const ROTULO_PARA_CATEGORIA = {
  'Discussão': 'discussao', 'Procura time': 'procura-time', 'Dicas': 'dicas', 'Clipes': 'clipes'
};

const dia = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: TZ }); // AAAA-MM-DD

function horaCurta(d) {
  return new Date(d).toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
}

function dataCurta(d) {
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: TZ, day: '2-digit', month: 'short' })
    .replace(/ de /g, ' ').replace('.', '');
}

// "Hoje · 19:30", "Ontem · 18:00", "12 nov · 20:00"
function rotuloDataPartida(iso) {
  if (!iso) return 'A definir';
  const diff = Math.round((new Date(dia(iso)) - new Date(dia(new Date()))) / 86400000);
  const hora = horaCurta(iso);
  if (diff === 0) return `Hoje · ${hora}`;
  if (diff === 1) return `Amanhã · ${hora}`;
  if (diff === -1) return `Ontem · ${hora}`;
  return `${dataCurta(iso)} · ${hora}`;
}

// "05 dez 2026" (ou o próprio status, quando já começou/acabou)
function rotuloDataCampeonato(c) {
  if (c.status === 'andamento') return 'Em andamento';
  if (c.status === 'encerrado') return 'Encerrado';
  if (!c.data_inicio) return 'A definir';
  const [a, m, d] = c.data_inicio.split('-').map(Number);
  const mes = new Date(Date.UTC(a, m - 1, d)).toLocaleDateString('pt-BR', { timeZone: 'UTC', month: 'short' }).replace('.', '');
  return `${String(d).padStart(2, '0')} ${mes} ${a}`;
}

function rotuloPostagem(iso) {
  return `${dataCurta(iso)} · ${horaCurta(iso)}`;
}

const placar = (p) => (p.status === 'agendada' ? '—' : `${p.placar_a} — ${p.placar_b}`);

module.exports = {
  STATUS_CAMPEONATO, STATUS_PARTIDA, CATEGORIA_PARA_ROTULO, ROTULO_PARA_CATEGORIA,
  rotuloDataPartida, rotuloDataCampeonato, rotuloPostagem, placar
};
