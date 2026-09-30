const express = require('express');
const router = express.Router();
const path = require('path');
const config = require('../config/app.config');

// Serve clean HTML pages
router.get('/', (req, res) => {
  res.sendFile(path.join(config.paths.publicDir, 'index.html'));
});

router.get('/cadastro', (req, res) => {
  res.sendFile(path.join(config.paths.publicDir, 'cadastro.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(config.paths.publicDir, 'login.html'));
});

router.get('/dashboard', (req, res) => {
  res.sendFile(path.join(config.paths.publicDir, 'dashboard.html'));
});

module.exports = router;
