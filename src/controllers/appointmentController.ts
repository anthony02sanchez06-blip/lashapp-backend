import { Request, Response } from 'express';
import { Appointment } from '../models/Appointment';
import { User } from '../models/User';
import { LashistaProfile } from '../models/LashistaProfile';
import { WhatsAppService } from '../services/WhatsAppService';
import { EmailService } from '../services/EmailService';
import { fileService } from '../services/FileService';

const whatsappService = new WhatsAppService();
const emailService = new EmailService();

// @desc    Crear nueva cita
// @route   POST /api/appointments
// @access  Private (Cliente)
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { lashistaId, serviceId, appointmentDate, startTime, notes } = req.body;
    const clientId = req.user?._id;

    // Verificar que la lashista existe
    const lashista = await User.findById(lashistaId);
    if (!lashista || lashista.userType !== 'lashista') {
      return res.status(404).json({
        success: false,
        message: 'Lashista no encontrada'
      });
    }

    // Verificar que el servicio existe
    const lashistaProfile = await LashistaProfile.findOne({ userId: lashistaId });
    if (!lashistaProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de lashista no encontrado'
      });
    }

    const service = lashistaProfile.services.id(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado o inactivo'
      });
    }

    // Verificar disponibilidad
    const requestedDate = new Date(appointmentDate);
    const isAvailable = await checkAvailability(lashistaId, requestedDate, startTime, service.duration);
    
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'El horario seleccionado no está disponible'
      });
    }

    // Calcular hora de fin
    const startTimeMinutes = timeToMinutes(startTime);
    const endTimeMinutes = startTimeMinutes + service.duration;
    const endTime = minutesToTime(endTimeMinutes);

    // Crear la cita
    const appointment = await Appointment.create({
      lashistaId,
      clientId,
      serviceId,
      serviceName: service.name,
      serviceDuration: service.duration,
      servicePrice: service.price,
      appointmentDate: requestedDate,
      startTime,
      endTime,
      status: 'pending',
      notes
    });

    // Poblar datos para las respuestas
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('clientId', 'name whatsappNumber')
      .populate('lashistaId', 'name whatsappNumber');

    // Enviar notificación a la lashista
    if (whatsappService.isConfigured()) {
      await whatsappService.notifyLashistaNewAppointment(
        appointment,
        req.user!,
        lashista
      );
    }

    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
      appointment: populatedAppointment
    });
  } catch (error) {
    console.error('Error creando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener mis citas
// @route   GET /api/appointments/my-appointments
// @access  Private
export const getMyAppointments = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user?._id;

    const filter: any = {
      $or: [
        { clientId: userId },
        { lashistaId: userId }
      ]
    };

    if (status) {
      filter.status = status;
    }

    const appointments = await Appointment.find(filter)
      .populate('clientId', 'name whatsappNumber')
      .populate('lashistaId', 'name whatsappNumber')
      .sort({ appointmentDate: -1, startTime: 1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      appointments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error obteniendo citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener citas de la lashista
// @route   GET /api/appointments/lashista/my-appointments
// @access  Private (Lashista)
export const getLashistaAppointments = async (req: Request, res: Response) => {
  try {
    const { status, date, page = 1, limit = 10 } = req.query;
    const lashistaId = req.user?._id;

    const filter: any = { lashistaId };

    if (status) {
      filter.status = status;
    }

    if (date) {
      const requestedDate = new Date(date as string);
      const startOfDay = new Date(requestedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(requestedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(filter)
      .populate('clientId', 'name whatsappNumber')
      .populate('lashistaId', 'name whatsappNumber')
      .sort({ appointmentDate: -1, startTime: 1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      appointments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error obteniendo citas de lashista:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener cita por ID
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .populate('clientId', 'name whatsappNumber email')
      .populate('lashistaId', 'name whatsappNumber');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Verificar que el usuario tenga acceso a esta cita
    const hasAccess = appointment.clientId._id.toString() === req.user?._id.toString() ||
                     appointment.lashistaId._id.toString() === req.user?._id.toString();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta cita'
      });
    }

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Error obteniendo cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Confirmar cita (solo lashista)
// @route   PUT /api/appointments/lashista/:id/confirm
// @access  Private (Lashista)
export const confirmAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .populate('clientId')
      .populate('lashistaId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    if (appointment.lashistaId._id.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para confirmar esta cita'
      });
    }

    appointment.status = 'confirmed';
    await appointment.save();

    // Enviar confirmación al cliente
    if (whatsappService.isConfigured()) {
      await whatsappService.sendAppointmentConfirmation(
        appointment,
        appointment.clientId as any,
        appointment.lashistaId as any
      );
    }

    // Enviar email si está configurado
    if (emailService.isConfigured() && (appointment.clientId as any).email) {
      await emailService.sendAppointmentConfirmation(
        appointment,
        appointment.clientId as any,
        appointment.lashistaId as any
      );
    }

    res.json({
      success: true,
      message: 'Cita confirmada exitosamente',
      appointment
    });
  } catch (error) {
    console.error('Error confirmando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Rechazar cita (solo lashista)
// @route   PUT /api/appointments/lashista/:id/reject
// @access  Private (Lashista)
export const rejectAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(id)
      .populate('clientId')
      .populate('lashistaId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    if (appointment.lashistaId._id.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para rechazar esta cita'
      });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = reason;
    await appointment.save();

    res.json({
      success: true,
      message: 'Cita rechazada exitosamente',
      appointment
    });
  } catch (error) {
    console.error('Error rechazando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Marcar cita como completada (solo lashista)
// @route   PUT /api/appointments/lashista/:id/complete
// @access  Private (Lashista)
export const completeAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .populate('clientId')
      .populate('lashistaId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    if (appointment.lashistaId._id.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para completar esta cita'
      });
    }

    appointment.status = 'completed';
    await appointment.save();

    res.json({
      success: true,
      message: 'Cita marcada como completada',
      appointment
    });
  } catch (error) {
    console.error('Error completando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Actualizar cita
// @route   PUT /api/appointments/:id
// @access  Private
export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes, cancellationReason } = req.body;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Verificar permisos
    const isClient = appointment.clientId.toString() === req.user?._id.toString();
    const isLashista = appointment.lashistaId.toString() === req.user?._id.toString();

    if (!isClient && !isLashista) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar esta cita'
      });
    }

    // Los clientes solo pueden cancelar, las lashistas pueden cambiar status
    if (isClient && status && status !== 'cancelled') {
      return res.status(403).json({
        success: false,
        message: 'Los clientes solo pueden cancelar citas'
      });
    }

    if (notes !== undefined) appointment.notes = notes;
    if (cancellationReason !== undefined) appointment.cancellationReason = cancellationReason;
    if (status !== undefined) appointment.status = status;

    await appointment.save();

    res.json({
      success: true,
      message: 'Cita actualizada exitosamente',
      appointment
    });
  } catch (error) {
    console.error('Error actualizando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Cancelar cita
// @route   DELETE /api/appointments/:id
// @access  Private
export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(id)
      .populate('clientId')
      .populate('lashistaId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Verificar permisos
    const isClient = appointment.clientId._id.toString() === req.user?._id.toString();
    const isLashista = appointment.lashistaId._id.toString() === req.user?._id.toString();

    if (!isClient && !isLashista) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cancelar esta cita'
      });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = reason || 'Cancelado por el usuario';
    await appointment.save();

    // Enviar notificación de cancelación
    if (whatsappService.isConfigured()) {
      await whatsappService.notifyCancellation(
        appointment,
        appointment.clientId as any,
        appointment.lashistaId as any,
        reason
      );
    }

    res.json({
      success: true,
      message: 'Cita cancelada exitosamente'
    });
  } catch (error) {
    console.error('Error cancelando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Subir comprobante de depósito
// @route   POST /api/appointments/:id/deposit-proof
// @access  Private (Cliente)
export const uploadDepositProof = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    const appointment = await Appointment.findById(id)
      .populate('clientId')
      .populate('lashistaId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    if (appointment.clientId._id.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para subir comprobante a esta cita'
      });
    }

    // Subir imagen
    const proofUrl = await fileService.uploadDepositProof(req.file, id);
    
    appointment.depositProof = proofUrl;
    appointment.status = 'payment_pending';
    await appointment.save();

    // Notificar a la lashista
    if (whatsappService.isConfigured()) {
      await whatsappService.notifyDepositProof(
        appointment,
        appointment.clientId as any
      );
    }

    res.json({
      success: true,
      message: 'Comprobante subido exitosamente',
      proofUrl
    });
  } catch (error) {
    console.error('Error subiendo comprobante:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener citas públicas de una lashista
// @route   GET /api/appointments/public/:lashistaId
// @access  Public
export const getPublicAppointments = async (req: Request, res: Response) => {
  try {
    const { lashistaId } = req.params;

    // Verificar que la lashista existe
    const lashista = await User.findById(lashistaId);
    if (!lashista || lashista.userType !== 'lashista') {
      return res.status(404).json({
        success: false,
        message: 'Lashista no encontrada'
      });
    }

    // Obtener solo citas confirmadas
    const appointments = await Appointment.find({
      lashistaId,
      status: 'confirmed',
      appointmentDate: { $gte: new Date() }
    })
    .populate('clientId', 'name')
    .select('appointmentDate startTime endTime serviceName')
    .sort({ appointmentDate: 1, startTime: 1 })
    .limit(10);

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Error obteniendo citas públicas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Funciones auxiliares
async function checkAvailability(lashistaId: string, date: Date, startTime: string, duration: number): Promise<boolean> {
  const startTimeMinutes = timeToMinutes(startTime);
  const endTimeMinutes = startTimeMinutes + duration;
  const endTime = minutesToTime(endTimeMinutes);

  // Verificar solapamiento con citas existentes
  const conflictingAppointments = await Appointment.find({
    lashistaId,
    appointmentDate: date,
    status: { $in: ['pending', 'confirmed', 'payment_pending'] }
  });

  for (const appointment of conflictingAppointments) {
    const appointmentStart = timeToMinutes(appointment.startTime);
    const appointmentEnd = timeToMinutes(appointment.endTime);

    if (
      (startTimeMinutes >= appointmentStart && startTimeMinutes < appointmentEnd) ||
      (endTimeMinutes > appointmentStart && endTimeMinutes <= appointmentEnd) ||
      (startTimeMinutes <= appointmentStart && endTimeMinutes >= appointmentEnd)
    ) {
      return false;
    }
  }

  return true;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}