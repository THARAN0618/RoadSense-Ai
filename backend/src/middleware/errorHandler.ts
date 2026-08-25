import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const isProd = process.env.NODE_ENV === 'production';

  // Sanitize error logging to ensure passwords/credentials are not leaked to console
  const safeMessage = err?.message || 'An unexpected error occurred';
  if (isProd) {
    console.error(`[SERVER ERROR] ${safeMessage}`);
  } else {
    console.error('API Error:', safeMessage, err.stack || '');
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors?.map((e: any) => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: `File upload error: ${err.message}`,
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  
  // In production, do not expose raw internal database stack traces or internal secrets
  const clientMessage = isProd && statusCode === 500
    ? 'An internal server error occurred.'
    : safeMessage;

  return res.status(statusCode).json({
    error: clientMessage,
    ...(!isProd ? { stack: err.stack } : {}),
  });
};
