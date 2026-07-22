function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode === 500
      ? "Sunucuda beklenmeyen bir hata oluştu."
      : err.message;

  if (statusCode >= 500) {
    console.error("Sunucu hatası:", err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || null,
  });
}

module.exports = errorMiddleware;
