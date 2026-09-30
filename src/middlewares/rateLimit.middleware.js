// In-memory lightweight rate limiter to prevent spamming
const requestCounts = new Map();

function rateLimiter(limit = 60, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    const record = requestCounts.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count++;
    }

    requestCounts.set(ip, record);

    if (record.count > limit) {
      return res.status(429).json({
        success: false,
        error: 'Limite de requisições excedido. Aguarde alguns segundos para tentar novamente.'
      });
    }

    next();
  };
}

module.exports = rateLimiter;
