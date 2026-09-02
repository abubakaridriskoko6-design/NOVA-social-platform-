import type { NextFunction, Request, Response } from 'express';
import env from '../config/env.js';

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = 'statusCode' in error && typeof (error as { statusCode?: number }).statusCode === 'number'
    ? Number((error as { statusCode?: number }).statusCode)
    : 500;

  const message = env.NODE_ENV === 'production' && statusCode >= 500
    ? 'An internal server error occurred.'
    : error.message || 'Internal server error';

  res.status(statusCode).json({ message });
}
