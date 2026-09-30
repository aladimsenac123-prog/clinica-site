function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Erro interno do servidor',
    code: err.code || 'INTERNAL_ERROR'
  });
}

module.exports = errorHandler;
