import { AppError } from '../shared/errors/AppError.js';

/**
 * Guard de roles. Uso: requireRole('admin', 'doctor')
 */
export const requireRole = (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError('Acceso denegado: permisos insuficientes', 403));
    }
    next();
  };
