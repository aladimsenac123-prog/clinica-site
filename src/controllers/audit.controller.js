const auditService = require('../services/audit.service');

class AuditController {
  getLogs(req, res, next) {
    try {
      const logs = auditService.getLogs();
      res.status(200).json({
        success: true,
        count: logs.length,
        logs
      });
    } catch (err) {
      next(err);
    }
  }

  logClientEvent(req, res, next) {
    try {
      const { action, userName, status, notes, confidence, livenessScore } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const entry = auditService.logAttempt({
        action: action || 'CLIENT_EVENT',
        userName: userName || 'Anônimo',
        ip,
        userAgent,
        status: status || 'INFO',
        confidence,
        livenessScore,
        notes
      });

      res.status(201).json({
        success: true,
        log: entry
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuditController();
