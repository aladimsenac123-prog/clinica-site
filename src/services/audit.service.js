const storageService = require('./storage.service');

class AuditService {
  /**
   * Log an access attempt to the immutable audit trail.
   * @param {object} params
   */
  logAttempt({
    action, // 'REGISTER', 'AUTH_SUCCESS', 'AUTH_FAILED', 'SPOOF_ATTEMPT', 'UNENROLLED_FACE'
    userId = null,
    userName = 'Desconhecido',
    badgeNumber = null,
    ip = '127.0.0.1',
    userAgent = 'Webcam Browser Client',
    confidence = 0,
    distance = null,
    livenessScore = null,
    status = 'DENIED', // 'GRANTED', 'DENIED', 'BLOCKED'
    notes = ''
  }) {
    const entry = {
      id: 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      action,
      userId,
      userName,
      badgeNumber,
      ip,
      userAgent: userAgent ? userAgent.substring(0, 100) : 'Unknown',
      confidence: confidence ? `${confidence}%` : 'N/A',
      distance: distance !== null ? distance : 'N/A',
      livenessScore: livenessScore !== null ? `${Math.round(livenessScore * 100)}%` : 'N/A',
      status,
      legalBasis: 'LGPD Art. 11, II, g (Prevenção à fraude e segurança do titular)',
      notes
    };

    storageService.addAuditLog(entry);
    return entry;
  }

  getLogs() {
    return storageService.getAuditLogs();
  }
}

module.exports = new AuditService();
