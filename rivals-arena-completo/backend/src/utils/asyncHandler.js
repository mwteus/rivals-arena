// Express 4 não captura erros de funções async sozinho: sem isso, uma falha de rede
// com o Supabase derrubava o servidor inteiro. Com o wrapper, vira uma resposta 500.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
