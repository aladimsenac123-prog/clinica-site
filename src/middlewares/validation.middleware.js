const biometricService = require('../services/biometric.service');

function validateRegistration(req, res, next) {
  const { name, badgeNumber, department, descriptor, consentAccepted } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Nome do profissional é obrigatório e deve ter no mínimo 3 caracteres.'
    });
  }

  if (!badgeNumber || typeof badgeNumber !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Matrícula/ID do crachá é obrigatória.'
    });
  }

  if (!consentAccepted) {
    return res.status(400).json({
      success: false,
      error: 'O consentimento dos Termos de Uso e LGPD é obrigatório para cadastro biométrico.'
    });
  }

  if (!biometricService.validateDescriptor(descriptor)) {
    return res.status(400).json({
      success: false,
      error: 'Vetor biométrico inválido. Certifique-se de que a câmera capturou os 128 pontos faciais corretamente.'
    });
  }

  next();
}

function validateVerification(req, res, next) {
  const { descriptor } = req.body;

  if (!biometricService.validateDescriptor(descriptor)) {
    return res.status(400).json({
      success: false,
      error: 'Descritor biométrico fornecido é inválido ou incompleto.'
    });
  }

  next();
}

module.exports = {
  validateRegistration,
  validateVerification
};
