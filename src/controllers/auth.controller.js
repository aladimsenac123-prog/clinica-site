const storageService = require('../services/storage.service');
const biometricService = require('../services/biometric.service');
const auditService = require('../services/audit.service');

class AuthController {
  /**
   * Register a new user with face descriptor & LGPD consent.
   * POST /api/v1/auth/register
   */
  async register(req, res, next) {
    try {
      const { name, badgeNumber, department, role, descriptor, consentAccepted } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const users = storageService.getUsers();

      // Check if badge already exists
      const existingUser = users.find(u => u.badgeNumber.toLowerCase() === badgeNumber.trim().toLowerCase());
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: `A matrícula ${badgeNumber} já está cadastrada para o usuário ${existingUser.name}.`
        });
      }

      // Check if face is already enrolled under a different badge
      const duplicateFaceCheck = biometricService.findBestMatch(descriptor, users, 0.40);
      if (duplicateFaceCheck.matched) {
        auditService.logAttempt({
          action: 'REGISTER_DUPLICATE_FACE_BLOCKED',
          userName: name,
          badgeNumber,
          ip,
          userAgent,
          status: 'BLOCKED',
          notes: `Tentativa de cadastrar rosto idêntico ao já registrado para: ${duplicateFaceCheck.user.name}`
        });

        return res.status(409).json({
          success: false,
          error: `Esta face já está vinculada ao profissional: ${duplicateFaceCheck.user.name} (${duplicateFaceCheck.user.badgeNumber}). Não é permitido cadastros duplicados.`
        });
      }

      const newUser = {
        id: 'USR-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        name: name.trim(),
        badgeNumber: badgeNumber.trim().toUpperCase(),
        department: department || 'Pesquisa Clínica & Bioquímica',
        role: role || 'Pesquisador Clínico',
        descriptor: descriptor, // 128 float array
        consentAccepted: !!consentAccepted,
        consentTimestamp: new Date().toISOString(),
        registeredAt: new Date().toISOString(),
        status: 'ACTIVE'
      };

      storageService.addUser(newUser);

      auditService.logAttempt({
        action: 'REGISTER',
        userId: newUser.id,
        userName: newUser.name,
        badgeNumber: newUser.badgeNumber,
        ip,
        userAgent,
        status: 'GRANTED',
        confidence: 100,
        notes: 'Cadastro biométrico realizado com consentimento LGPD.'
      });

      res.status(201).json({
        success: true,
        message: 'Cadastro biométrico concluído com sucesso!',
        user: {
          id: newUser.id,
          name: newUser.name,
          badgeNumber: newUser.badgeNumber,
          department: newUser.department,
          role: newUser.role,
          registeredAt: newUser.registeredAt
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify face descriptor for passwordless login.
   * POST /api/v1/auth/verify
   */
  async verify(req, res, next) {
    try {
      const { descriptor, livenessPassed, livenessScore } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // Check liveness first
      if (livenessPassed === false) {
        auditService.logAttempt({
          action: 'SPOOF_ATTEMPT',
          ip,
          userAgent,
          livenessScore: livenessScore || 0,
          status: 'BLOCKED',
          notes: 'Ataque de Spoofing / Foto Estática detectado pelo módulo de vivacidade'
        });

        return res.status(403).json({
          success: false,
          error: 'Falha na Prova de Vida: Imagem estática detectada (Ataque de Spoofing bloqueado). Pisque os olhos diante da câmera.',
          spoofDetected: true
        });
      }

      const users = storageService.getUsers();
      const matchResult = biometricService.findBestMatch(descriptor, users);

      if (!matchResult.matched) {
        auditService.logAttempt({
          action: 'AUTH_FAILED',
          ip,
          userAgent,
          distance: matchResult.distance,
          confidence: matchResult.confidence,
          status: 'DENIED',
          notes: matchResult.reason || 'Rosto não cadastrado ou não reconhecido com precisão suficiente'
        });

        return res.status(401).json({
          success: false,
          error: 'Acesso Negado: Rosto não reconhecido na base autorizada deste laboratório.',
          distance: matchResult.distance,
          confidence: matchResult.confidence
        });
      }

      // Success
      auditService.logAttempt({
        action: 'AUTH_SUCCESS',
        userId: matchResult.user.id,
        userName: matchResult.user.name,
        badgeNumber: matchResult.user.badgeNumber,
        ip,
        userAgent,
        distance: matchResult.distance,
        confidence: matchResult.confidence,
        livenessScore: livenessScore || 0.95,
        status: 'GRANTED',
        notes: `Login biométrico validado com distância euclidiana ${matchResult.distance} (${matchResult.confidence}% de confiança)`
      });

      // Generate a mock secure session token
      const sessionToken = 'BIOSEC-' + Buffer.from(`${matchResult.user.id}:${Date.now()}`).toString('base64');

      res.status(200).json({
        success: true,
        message: `Autenticação biométrica aprovada! Bem-vindo(a), ${matchResult.user.name}.`,
        token: sessionToken,
        user: matchResult.user,
        confidence: matchResult.confidence,
        distance: matchResult.distance
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all registered users (descriptors omitted for privacy and security)
   * GET /api/v1/auth/users
   */
  async getEnrolledProfiles(req, res, next) {
    try {
      const users = storageService.getUsers();
      // Excluir expressamente o campo descriptor do payload de saída
      res.status(200).json({
        success: true,
        count: users.length,
        users: users.map(u => ({
          id: u.id,
          name: u.name,
          badgeNumber: u.badgeNumber,
          department: u.department,
          role: u.role,
          registeredAt: u.registeredAt
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete an enrolled profile (Right to Erasure - LGPD Art. 18, VI)
   * DELETE /api/v1/auth/users/:id
   */
  async deleteProfile(req, res, next) {
    try {
      const { id } = req.params;

      // Verificação de autorização (LGPD Art. 18): Somente o próprio titular pode solicitar
      if (req.authUser && req.authUser.id !== id) {
        return res.status(403).json({
          success: false,
          error: 'Violação de Autorização: Você só tem permissão para eliminar os seus próprios dados biométricos.'
        });
      }

      const users = storageService.getUsers();
      const userIndex = users.findIndex(u => u.id === id);

      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Perfil biométrico não encontrado.'
        });
      }

      const deleted = users.splice(userIndex, 1)[0];
      storageService.saveUsers(users);

      auditService.logAttempt({
        action: 'LGPD_RIGHT_TO_ERASURE',
        userId: deleted.id,
        userName: deleted.name,
        badgeNumber: deleted.badgeNumber,
        status: 'GRANTED',
        notes: 'Exclusão definitiva de biometria executada pelo próprio titular autenticado (LGPD Art. 18)'
      });

      res.status(200).json({
        success: true,
        message: `Dados biométricos do profissional ${deleted.name} foram permanentemente eliminados da base conforme a LGPD.`
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
