const request = require('supertest');
const app = require('../server');

describe('🔒 BioHealth Security & Biometrics API Suite', () => {
  // Generate valid 128D vector
  const testDescriptor = Array.from({ length: 128 }, () => Math.random() * 0.4 - 0.2);
  let createdUserId = null;
  let authToken = null;

  describe('1. Blindagem de Acesso Não Autorizado (BOLA & Missing Auth)', () => {
    it('deve retornar 401 para GET /api/v1/auth/users sem token', async () => {
      const res = await request(app).get('/api/v1/auth/users');
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 401 para GET /api/v1/dashboard/clinical-data sem token', async () => {
      const res = await request(app).get('/api/v1/dashboard/clinical-data');
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 401 para GET /api/v1/audit/logs sem token', async () => {
      const res = await request(app).get('/api/v1/audit/logs');
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Validação de Schemas e Vetores Biométricos', () => {
    it('deve rejeitar cadastro sem consentimento LGPD (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Dra. Luiza Martins',
          badgeNumber: 'BIO-TEST-01',
          descriptor: testDescriptor,
          consentAccepted: false
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('deve rejeitar vetor biométrico com dimensão diferente de 128D (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Dra. Luiza Martins',
          badgeNumber: 'BIO-TEST-02',
          descriptor: [0.1, 0.2, 0.3], // Inválido: apenas 3 dimensões
          consentAccepted: true
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Cadastro, Autenticação Facial e Proteção de Dados (LGPD)', () => {
    it('deve cadastrar um novo profissional com vetor 128D legítimo (HTTP 201)', async () => {
      const uniqueBadge = 'BIO-QA-' + Date.now();
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Dra. Camila Vasconcelos',
          badgeNumber: uniqueBadge,
          role: 'Geneticista Sênior',
          department: 'Genômica & Fármacos',
          descriptor: testDescriptor,
          consentAccepted: true
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBeDefined();
      createdUserId = res.body.user.id;
    });

    it('deve autenticar biometricamente e emitir token seguro de sessão (HTTP 200)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify')
        .send({
          descriptor: testDescriptor,
          livenessPassed: true,
          livenessScore: 0.98
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.confidence).toBeGreaterThanOrEqual(90);
      authToken = res.body.token;
    });

    it('deve omitir o vetor biométrico (descriptor) na listagem autenticada de usuários (LGPD)', async () => {
      const res = await request(app)
        .get('/api/v1/auth/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.users)).toBe(true);
      res.body.users.forEach(u => {
        expect(u.descriptor).toBeUndefined(); // Proteção ativa de dados sensíveis!
      });
    });

    it('deve liberar o acesso aos dados clínicos confidenciais com token válido (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/clinical-data')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.activeTrials).toBeDefined();
    });
  });

  describe('4. Anti-Spoofing & Prevenção a Fraudes', () => {
    it('deve bloquear login se livenessPassed for falso (Ataque de Foto Estática - HTTP 403)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify')
        .send({
          descriptor: testDescriptor,
          livenessPassed: false,
          livenessScore: 0.1
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.spoofDetected).toBe(true);
    });
  });

  describe('5. Direito à Eliminação de Dados (LGPD Art. 18)', () => {
    it('deve impedir que um usuário apague o perfil de outro usuário (HTTP 403)', async () => {
      const res = await request(app)
        .delete('/api/v1/auth/users/USR-DIFFERENT-ID-999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
    });

    it('deve permitir que o próprio titular autenticado exclua sua biometria (HTTP 200)', async () => {
      const res = await request(app)
        .delete(`/api/v1/auth/users/${createdUserId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });
});
