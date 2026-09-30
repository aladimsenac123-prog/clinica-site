const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const auditController = require('../controllers/audit.controller');
const dashboardController = require('../controllers/dashboard.controller');
const { validateRegistration, validateVerification } = require('../middlewares/validation.middleware');
const rateLimiter = require('../middlewares/rateLimit.middleware');

// Authentication & Biometrics
router.post('/auth/register', rateLimiter(30, 60000), validateRegistration, (req, res, next) => authController.register(req, res, next));
router.post('/auth/verify', rateLimiter(60, 60000), validateVerification, (req, res, next) => authController.verify(req, res, next));
router.get('/auth/users', (req, res, next) => authController.getEnrolledProfiles(req, res, next));
router.delete('/auth/users/:id', (req, res, next) => authController.deleteProfile(req, res, next));

// Audit Trail & Logs (LGPD Art. 11/18)
router.get('/audit/logs', (req, res, next) => auditController.getLogs(req, res, next));
router.post('/audit/client-event', (req, res, next) => auditController.logClientEvent(req, res, next));

// Confidential Clinical Dashboard Data
router.get('/dashboard/clinical-data', (req, res, next) => dashboardController.getRestrictedData(req, res, next));

module.exports = router;
