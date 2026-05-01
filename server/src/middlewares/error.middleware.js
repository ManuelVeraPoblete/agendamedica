import { AppError } from '../shared/errors/AppError.js';

// eslint-disable-next-line no-unused-vars
export const errorMiddleware = (err, _req, res, _next) => {
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  console.error('[Error inesperado]', err);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
};
