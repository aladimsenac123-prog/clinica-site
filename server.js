const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./src/config/app.config');
const apiRoutes = require('./src/routes/api.routes');
const viewRoutes = require('./src/routes/view.routes');
const errorHandler = require('./src/middlewares/errorHandler.middleware');

const app = express();

// Security Middlewares
// Note: relax Content Security Policy slightly to allow loading WebAssembly/WebGL models from local face-api
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({ origin: config.security.corsOrigin }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Assets
app.use(express.static(config.paths.publicDir));

// Routes
app.use('/', viewRoutes);
app.use('/api/v1', apiRoutes);

// 404 Handler
app.use((req, res, next) => {
  if (req.accepts('html')) {
    res.status(404).sendFile(path.join(config.paths.publicDir, 'index.html'));
  } else {
    res.status(404).json({ success: false, error: 'Endpoint não encontrado' });
  }
});

// Central Error Handler
app.use(errorHandler);

// Start Server
const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🏥 BioHealth Labs - Sistema de Acesso Biométrico Facial`);
  console.log(`🌐 Servidor ativo em: http://localhost:${config.port}`);
  console.log(`🔒 Compliance LGPD Ativo (Art. 11, II, g)`);
  console.log(`====================================================`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Encerrando servidor com segurança...');
  server.close(() => {
    console.log('Servidor encerrado.');
    process.exit(0);
  });
});
