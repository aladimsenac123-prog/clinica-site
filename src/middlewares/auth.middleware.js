// src/middlewares/auth.middleware.js
const config = require('../config/app.config');

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Acesso não autorizado: Token de autenticação ausente ou inválido.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Validar estrutura do token seguro BioHealth
    if (!token.startsWith('BIOSEC-')) {
      return res.status(401).json({ success: false, error: 'Token inválido ou expirado.' });
    }

    const payloadRaw = Buffer.from(token.replace('BIOSEC-', ''), 'base64').toString('utf-8');
    const [userId, timestamp] = payloadRaw.split(':');

    if (!userId || !timestamp) {
      return res.status(401).json({ success: false, error: 'Estrutura de token corrompida.' });
    }

    // Validação de expiração (Sessão de 8 horas)
    const tokenTime = parseInt(timestamp, 10);
    const maxAge = 8 * 60 * 60 * 1000;
    if (Date.now() - tokenTime > maxAge) {
      return res.status(401).json({ success: false, error: 'Sessão biométrica expirada. Faça login novamente.' });
    }

    // Injeta os dados do usuário autenticado na requisição
    req.authUser = { id: userId };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Falha na validação da sessão.' });
  }
}

module.exports = { requireAuth };
