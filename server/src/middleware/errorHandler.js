// Converts thrown errors into consistent JSON responses without leaking internals.
export function notFound(_req, res) {
  res.status(404).json({ error: 'API endpoint not found.' });
}

export function errorHandler(err, _req, res, next) {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
  if (err instanceof SyntaxError && 'body' in err) return res.status(400).json({ error: 'Invalid JSON.' });
  const constraint = typeof err.code === 'string' && err.code.startsWith('ERR_SQLITE') && /constraint/i.test(err.message);
  const status = constraint ? 409 : err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    error: status === 500 ? 'Internal server error.'
      : constraint ? 'This operation conflicts with existing data. Please refresh and try again.'
        : err.message,
  });
}
