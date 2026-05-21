export function errorHandler(err, req, res, next) {
  const status = err.status ?? err.statusCode ?? 500
  const isProd = process.env.NODE_ENV === 'production'
  res.status(status).json({
    success: false,
    error: isProd && status === 500 ? 'INTERNAL_ERROR' : (err.message ?? 'INTERNAL_ERROR'),
  })
}
