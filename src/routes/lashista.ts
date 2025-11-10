import express from 'express';
import { body } from 'express-validator';
import * as lashistaController from '../controllers/lashistaController';
import { protect, isLashista } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/errorHandler';
import { fileService } from '../services/FileService';

const router = express.Router();

// Aplicar protección y verificar que sea lashista en todas las rutas
router.use(protect);
router.use(isLashista);

// Validaciones
const updateProfileValidation = [
  body('studioName')
    .notEmpty()
    .withMessage('El nombre del estudio es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre del estudio debe tener entre 2 y 100 caracteres'),
  
  body('description')
    .notEmpty()
    .withMessage('La descripción es requerida')
    .isLength({ min: 10, max: 500 })
    .withMessage('La descripción debe tener entre 10 y 500 caracteres'),
  
  body('depositAmount')
    .isNumeric()
    .withMessage('El monto del depósito debe ser un número')
    .isFloat({ min: 0 })
    .withMessage('El monto del depósito debe ser mayor o igual a 0'),
  
  body('bankAccount.bankName')
    .notEmpty()
    .withMessage('El nombre del banco es requerido'),
  
  body('bankAccount.accountHolder')
    .notEmpty()
    .withMessage('El nombre del titular es requerido'),
  
  body('bankAccount.accountNumber')
    .notEmpty()
    .withMessage('El número de cuenta es requerido'),
  
  body('bankAccount.documentType')
    .isIn(['DNI', 'RUT', 'CC', 'Pasaporte'])
    .withMessage('Tipo de documento inválido'),
  
  body('bankAccount.documentNumber')
    .notEmpty()
    .withMessage('El número de documento es requerido')
];

const serviceValidation = [
  body('name')
    .notEmpty()
    .withMessage('El nombre del servicio es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre del servicio debe tener entre 2 y 100 caracteres'),
  
  body('description')
    .notEmpty()
    .withMessage('La descripción del servicio es requerida')
    .isLength({ min: 10, max: 300 })
    .withMessage('La descripción debe tener entre 10 y 300 caracteres'),
  
  body('duration')
    .isInt({ min: 15, max: 480 })
    .withMessage('La duración debe estar entre 15 y 480 minutos'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser mayor o igual a 0')
];

const workingHoursValidation = [
  body('*.day')
    .isInt({ min: 0, max: 6 })
    .withMessage('El día debe estar entre 0 (domingo) y 6 (sábado)'),
  
  body('*.start')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de hora de inicio inválido (HH:MM)'),
  
  body('*.end')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de hora de fin inválido (HH:MM)')
];

// Rutas
router.get('/profile', lashistaController.getProfile);
router.put('/profile', updateProfileValidation, handleValidationErrors, lashistaController.updateProfile);

// Subir logo
router.post('/logo', fileService.getMulterConfig().single('logo'), lashistaController.uploadLogo);

// Gestión de servicios
router.get('/services', lashistaController.getServices);
router.post('/services', serviceValidation, handleValidationErrors, lashistaController.createService);
router.put('/services/:serviceId', serviceValidation, handleValidationErrors, lashistaController.updateService);
router.delete('/services/:serviceId', lashistaController.deleteService);

// Gestión de horarios
router.get('/working-hours', lashistaController.getWorkingHours);
router.put('/working-hours', workingHoursValidation, handleValidationErrors, lashistaController.updateWorkingHours);

// Gestión de descansos
router.get('/breaks', lashistaController.getBreaks);
router.post('/breaks', lashistaController.createBreak);
router.put('/breaks/:breakId', lashistaController.updateBreak);
router.delete('/breaks/:breakId', lashistaController.deleteBreak);

// Obtener disponibilidad
router.get('/availability/:date', lashistaController.getAvailability);

// Obtener información pública
router.get('/public/:lashistaId', lashistaController.getPublicInfo);

export default router;