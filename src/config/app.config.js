require('dotenv').config();
const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  biometrics: {
    // Euclidean distance threshold: standard is 0.5 - 0.6. Lower is stricter.
    matchThreshold: parseFloat(process.env.FACE_MATCH_THRESHOLD) || 0.52,
    // Expected dimension of face-api.js descriptor
    descriptorDimension: 128,
    // Minimum liveness score required
    minLivenessScore: 0.75
  },
  paths: {
    dataDir: process.env.VERCEL ? path.join('/tmp', 'data') : path.join(__dirname, '../data'),
    usersFile: process.env.VERCEL ? path.join('/tmp', 'data', 'users.json') : path.join(__dirname, '../data/users.json'),
    auditLogsFile: process.env.VERCEL ? path.join('/tmp', 'data', 'access_logs.json') : path.join(__dirname, '../data/access_logs.json'),
    publicDir: path.join(__dirname, '../../public'),
    modelsDir: path.join(__dirname, '../../public/models')
  },
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'biohealth-super-secure-jwt-secret-key-2026',
    corsOrigin: process.env.CORS_ORIGIN || '*'
  }
};
