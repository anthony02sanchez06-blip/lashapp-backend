import express from 'express';
import { body } from 'express-validator';
import * as appointmentController from '../controllers/appointmentController';
import { protect, isCliente } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/errorHandler';
import { fileService } from '../services/FileService';

const router = express.Router();

// Rutas públicas
router.get('/public/:lashistaId', appointmentController.getPublicAppointments);

// Rutas protegidas
router.use(protect);

// Validaciones
const createAppointmentValidation = [
  body('lashistaId')
    .notEmpty()
    .withMessage('La ID de la lashista es requerida'),
  
  body('serviceId')
    .notEmpty()
    .withMessage('La ID del servicio es requerida'),
  
  body('appointmentDate')
    .notEmpty()
    .withMessage('La fecha de la cita es requerida')
    .isISO8601()
    .withMessage('Formato de fecha inválido'),
  
  body('startTime')
    .notEmpty()
    .withMessage('La hora de inicio es requerida')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de hora inválido (HH:MM)'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden tener más de 500 caracteres')
];

const updateAppointmentValidation = [
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'completed', 'payment_pending'])
    .withMessage('Estado inválido'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden tener más de 500 caracteres'),
  
  body('cancellationReason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('La razón de cancelación no puede tener más de 200 caracteres')
];

// Rutas para clientes
router.get('/my-appointments', appointmentController.getMyAppointments);
router.get('/:id', appointmentController.getAppointment);
router.post('/', isCliente, createAppointmentValidation, handleValidationErrors, appointmentController.createAppointment);
router.put('/:id', updateAppointmentValidation, handleValidationErrors, appointmentController.updateAppointment);
router.delete('/:id', appointmentController.cancelAppointment);

// Subir comprobante de depósito
router.post('/:id/deposit-proof', fileService.getMulterConfig().single('proof'), appointmentController.uploadDepositProof);

// Rutas para lashistas
router.get('/lashista/my-appointments', appointmentController.getLashistaAppointments);
router.get('/lashista/:id', appointmentController.getLashistaAppointment);
router.put('/lashista/:id/confirm', appointmentController.confirmAppointment);
router.put('/lashista/:id/reject', appointmentController.rejectAppointment);
router.put('/lashista/:id/complete', appointmentController.completeAppointment);

export default router;