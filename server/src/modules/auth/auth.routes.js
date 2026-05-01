import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from './auth.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();
const ctrl   = new AuthController();

const loginValidators = [
  body('username').trim().notEmpty().withMessage('El username es requerido'),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
];

router.post('/login', loginValidators, ctrl.login);
router.get('/me',    authMiddleware,   ctrl.me);

export default router;
