const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const auditController = require('../controllers/audit.controller');
const dashboardController = require('../controllers/dashboard.controller');
const { validateRegistration, validateVerification } = require('../middlewares/validation.middleware');
const { requireAuth } = require('../middlewares/auth.middleware');
const rateLimiter = require('../middlewares/rateLimit.middleware');

// Autenticação & Cadastro
router.post('/auth/register', rateLimiter(30, 60000), validateRegistration, (req, res, next) => authController.register(req, res, next));
router.post('/auth/verify', rateLimiter(60, 60000), validateVerification, (req, res, next) => authController.verify(req, res, next));

// Rotas Protegidas por Autenticação (LGPD & Biossegurança)
router.get('/auth/users', requireAuth, (req, res, next) => authController.getEnrolledProfiles(req, res, next));
router.delete('/auth/users/:id', requireAuth, (req, res, next) => authController.deleteProfile(req, res, next));

// Trilha de Auditoria (Restrita)
router.get('/audit/logs', requireAuth, (req, res, next) => auditController.getLogs(req, res, next));
router.post('/audit/client-event', requireAuth, (req, res, next) => auditController.logClientEvent(req, res, next));

// Dados Clínicos Confidenciais
router.get('/dashboard/clinical-data', requireAuth, (req, res, next) => dashboardController.getRestrictedData(req, res, next));

module.exports = router;
