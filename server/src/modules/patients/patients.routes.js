import { Router } from 'express';
import { body } from 'express-validator';
import { PatientController } from './patients.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();
const ctrl   = new PatientController();

router.use(authMiddleware);

const createValidators = [
  body('fullName').trim().notEmpty().withMessage('El nombre es requerido'),
  body('gender').isIn(['masculino', 'femenino', 'otro']).withMessage('Género inválido'),
  body('documentId').trim().notEmpty().withMessage('El documento es requerido'),
  body('birthDate').isISO8601().withMessage('Fecha de nacimiento inválida'),
  body('phone').optional({ nullable: true, checkFalsy: true }).trim(),
  body('email').optional({ nullable: true, checkFalsy: true }).trim().isEmail().withMessage('Email inválido'),
  body('insurance').optional({ nullable: true, checkFalsy: true }).trim(),
  body('allergies').optional({ nullable: true, checkFalsy: true }).trim(),
  body('conditions').optional({ nullable: true, checkFalsy: true }).trim(),
  body('medications').optional({ nullable: true, checkFalsy: true }).trim(),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim(),
];

router.post('/', createValidators, ctrl.create);
router.get('/',  ctrl.list);

export default router;
