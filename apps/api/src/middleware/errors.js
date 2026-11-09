export class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
export const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof ApiError) return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  if (error?.name === 'ZodError') return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Check the submitted fields.', details: error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) } });
  if (error?.code === 'P2002') return res.status(409).json({ error: { code: 'CONFLICT', message: 'This record already exists.' } });
  if (error?.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Record not found.' } });
  if (error?.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } });
  console.error(JSON.stringify({ level: 'error', requestId: req.id, name: error?.name, message: error?.message }));
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' } });
}