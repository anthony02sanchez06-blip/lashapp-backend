import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController';
import { protect } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/errorHandler';

const router = express.Router();

// Validaciones
const registerValidation = [
  body('name')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail(),
  
  body('phone')
    .notEmpty()
    .withMessage('El teléfono es requerido')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('El teléfono debe ser válido'),
  
  body('whatsappNumber')
    .notEmpty()
    .withMessage('El número de WhatsApp es requerido')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('El número de WhatsApp debe ser válido'),
  
  body('userType')
    .isIn(['lashista', 'cliente'])
    .withMessage('El tipo de usuario debe ser lashista o cliente'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

const loginValidation = [
  body('phone')
    .notEmpty()
    .withMessage('El teléfono es requerido'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// Rutas públicas
router.post('/register', registerValidation, handleValidationErrors, authController.register);
router.post('/login', loginValidation, handleValidationErrors, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:resettoken', authController.resetPassword);

// Rutas protegidas
router.get('/me', protect, authController.getMe);
router.put('/update-profile', protect, authController.updateProfile);
router.put('/change-password', protect, authController.changePassword);

export default router;