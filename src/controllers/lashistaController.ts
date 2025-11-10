import { Request, Response } from 'express';
import { LashistaProfile, IService } from '../models/LashistaProfile';
import { Appointment } from '../models/Appointment';
import { fileService } from '../services/FileService';
import { IWorkingHours } from '../models/LashistaProfile';

// @desc    Obtener perfil de lashista
// @route   GET /api/lashista/profile
// @access  Private (Lashista)
export const getProfile = async (req: Request, res: Response) => {
  try {
    const profile = await LashistaProfile.findOne({ userId: req.user?._id })
      .populate('userId', 'name email phone whatsappNumber profileImage');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de lashista no encontrado'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Actualizar perfil de lashista
// @route   PUT /api/lashista/profile
// @access  Private (Lashista)
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { 
      studioName, 
      description, 
      depositAmount, 
      bankAccount, 
      socialMedia 
    } = req.body;

    const profile = await LashistaProfile.findOneAndUpdate(
      { userId: req.user?._id },
      {
        studioName,
        description,
        depositAmount,
        bankAccount,
        socialMedia
      },
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone whatsappNumber profileImage');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de lashista no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      profile
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Subir logo del estudio
// @route   POST /api/lashista/logo
// @access  Private (Lashista)
export const uploadLogo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    const logoUrl = await fileService.uploadProfileImage(
      req.file, 
      req.user?._id as string, 
      'logo'
    );

    const profile = await LashistaProfile.findOneAndUpdate(
      { userId: req.user?._id },
      { logo: logoUrl },
      { new: true }
    ).populate('userId', 'name email phone whatsappNumber profileImage');

    res.json({
      success: true,
      message: 'Logo actualizado exitosamente',
      logo: logoUrl,
      profile
    });
  } catch (error) {
    console.error('Error subiendo logo:', error);
    res.status(500).json({
      success: false,
      message: 'Error subiendo el logo'
    });
  }
};

// @desc    Obtener servicios
// @route   GET /api/lashista/services
// @access  Private (Lashista)
export const getServices = async (req: Request, res: Response) => {
  try {
    const profile = await LashistaProfile.findOne({ userId: req.user?._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de lashista no encontrado'
      });
    }

    res.json({
      success: true,
      services: profile.services
    });
  } catch (error) {
    console.error('Error obteniendo servicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Crear servicio
// @route   POST /api/lashista/services
// @access  Private (Lashista)
export const createService = async (req: Request, res: Response) => {
  try {
    const { name, description, duration, price } = req.body;

    const profile = await LashistaProfile.findOne({ userId: req.user?._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de lashista no encontrado'
      });
    }

    const newService: IService = {
      _id: new (require('mongoose').Types.ObjectId)().toString(),
      name,
      description,
      duration,
      price,
      isActive: true
    } as any;

    profile.services.push(newService);
    await profile.save();

    res.status(201).json({
      success: true,
      message: 'Servicio creado exitosamente',
      service: newService
    });
  } catch (error) {
    console.error('Error creando servicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Actualizar servicio
// @route   PUT /api/lashista/services/:serviceId
// @access  Private (Lashista)
export const updateService = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { name, description, duration, price, isActive } = req.body;

    const profile = await LashistaProfile.findOne({ userId: req.user?._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de lashista no encontrado'
      });
    }

    const serviceIndex = profile.services.findIndex(
      (service: any) => service._id.toString() === serviceId
    );

    if (serviceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    profile.services[serviceIndex] = {
      ...profile.services[serviceIndex].toObject(),
      name,
      description,
      duration,
      price,
      isActive
    };

    await profile.save();

    res.json({
      success: true,
      message: 'Servicio actualizado exitosamente',
      service: profile.services[serviceIndex]
    });
  } catch (error) {
    console.error('Error actualizando servicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Eliminar servicio
// @route   DELETE /api/lashista/services/:serviceId
// @access  Private (Lashista)
export const deleteService = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;

    const profile = await LashistaProfile.findOne({ userId: req.user?._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de lashista no encontrado'
      });
    }

    const serviceIndex = profile.services.findIndex(
      (service: any) => service._id.toString() === serviceId
    );

    if (serviceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    profile.services.splice(serviceIndex, 1);
    await profile.save();

    res.json({
      success: true,
      message: 'Servicio eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando servicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener horarios de trabajo
// @route   GET /api/lashista/working-hours
// @access  Private (Lashista)
export const getWorkingHours = async (req: Request, res: Response) => {
  try {
    const profile = await LashistaProfile.findOne({ userId: req.user?._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de lashista no encontrado'
      });
    }

    res.json({
      success: true,
      workingHours: profile.workingHours
    });
  } catch (error) {
    console.error('Error obteniendo horarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Actualizar horarios de trabajo
// @route   PUT /api/lashista/working-hours
// @access  Private (Lashista)
export const updateWorkingHours = async (req: Request, res: Response) => {
  try {
    const { workingHours } = req.body;

    const profile = await LashistaProfile.findOneAndUpdate(
      { userId: req.user?._id },
      { workingHours },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de lashista no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Horarios actualizados exitosamente',
      workingHours: profile.workingHours
    });
  } catch (error) {
    console.error('Error actualizando horarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener descansos
// @route   GET /api/lashista/breaks
// @access  Private (Lashista)
export const getBreaks = async (req: Request, res: Response) => {
  try {
    const profile = await LashistaProfile.findOne({ userId: req.user?._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de lashista no encontrado'
      });
    }

    res.json({
      success: true,
      breaks: profile.breaks
    });
  } catch (error) {
    console.error('Error obteniendo descansos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Crear descanso
// @route   POST /api/lashista/breaks
// @access  Private (Lashista)
export const createBreak = async (req: Request, res: Response) => {
  try {
    const { start, end, description } = req.body;

    const profile = await LashistaProfile.findOne({ userId: req.user?._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de lashista no encontrado'
      });
    }

    const newBreak = {
      _id: new (require('mongoose').Types.ObjectId)().toString(),
      start,
      end,
      description
    };

    profile.breaks.push(newBreak as any);
    await profile.save();

    res.status(201).json({
      success: true,
      message: 'Descanso creado exitosamente',
      break: newBreak
    });
  } catch (error) {
    console.error('Error creando descanso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Actualizar descanso
// @route   PUT /api/lashista/breaks/:breakId
// @access  Private (Lashista)
export const updateBreak = async (req: Request, res: Response) => {
  try {
    const { breakId } = req.params;
    const { start, end, description } = req.body;

    const profile = await LashistaProfile.findOne({ userId: req.user?._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de lashista no encontrado'
      });
    }

    const breakIndex = profile.breaks.findIndex(
      (brk: any) => brk._id.toString() === breakId
    );

    if (breakIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Descanso no encontrado'
      });
    }

    profile.breaks[breakIndex] = {
      ...profile.breaks[breakIndex].toObject(),
      start,
      end,
      description
    };

    await profile.save();

    res.json({
      success: true,
      message: 'Descanso actualizado exitosamente',
      break: profile.breaks[breakIndex]
    });
  } catch (error) {
    console.error('Error actualizando descanso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Eliminar descanso
// @route   DELETE /api/lashista/breaks/:breakId
// @access  Private (Lashista)
export const deleteBreak = async (req: Request, res: Response) => {
  try {
    const { breakId } = req.params;

    const profile = await LashistaProfile.findOne({ userId: req.user?._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de lashista no encontrado'
      });
    }

    const breakIndex = profile.breaks.findIndex(
      (brk: any) => brk._id.toString() === breakId
    );

    if (breakIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Descanso no encontrado'
      });
    }

    profile.breaks.splice(breakIndex, 1);
    await profile.save();

    res.json({
      success: true,
      message: 'Descanso eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando descanso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener disponibilidad para una fecha
// @route   GET /api/lashista/availability/:date
// @access  Private (Lashista)
export const getAvailability = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const requestedDate = new Date(date);
    
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha inválida'
      });
    }

    const profile = await LashistaProfile.findOne({ userId: req.user?._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de lashista no encontrado'
      });
    }

    // Obtener día de la semana (0 = domingo, 1 = lunes, etc.)
    const dayOfWeek = requestedDate.getDay();
    const workingDay = profile.workingHours.find((wh: IWorkingHours) => wh.day === dayOfWeek && wh.isWorking);

    if (!workingDay) {
      return res.json({
        success: true,
        available: false,
        message: 'No se trabaja este día',
        slots: []
      });
    }

    // Obtener citas existentes para esa fecha
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      lashistaId: req.user?._id,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Calcular slots disponibles
    const availableSlots = calculateAvailableSlots(
      workingDay.start,
      workingDay.end,
      existingAppointments,
      profile.breaks
    );

    res.json({
      success: true,
      available: availableSlots.length > 0,
      date: requestedDate,
      workingHours: workingDay,
      slots: availableSlots
    });
  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener información pública de lashista
// @route   GET /api/lashista/public/:lashistaId
// @access  Public
export const getPublicInfo = async (req: Request, res: Response) => {
  try {
    const { lashistaId } = req.params;

    const profile = await LashistaProfile.findOne({ userId: lashistaId })
      .populate('userId', 'name profileImage');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Lashista no encontrada'
      });
    }

    // Filtrar solo servicios activos
    const activeServices = profile.services.filter(service => service.isActive);

    res.json({
      success: true,
      lashista: {
        id: profile.userId._id,
        name: profile.userId.name,
        profileImage: profile.userId.profileImage,
        studioName: profile.studioName,
        logo: profile.logo,
        description: profile.description,
        services: activeServices,
        socialMedia: profile.socialMedia
      }
    });
  } catch (error) {
    console.error('Error obteniendo información pública:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Función auxiliar para calcular slots disponibles
function calculateAvailableSlots(
  startTime: string,
  endTime: string,
  existingAppointments: any[],
  breaks: any[]
) {
  const slots = [];
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  const slotDuration = 30; // 30 minutos por slot

  // Convertir citas existentes a minutos desde el inicio del día
  const bookedSlots = existingAppointments.map(apt => {
    const aptStart = new Date(`2000-01-01T${apt.startTime}:00`);
    const aptEnd = new Date(`2000-01-01T${apt.endTime}:00`);
    return {
      start: Math.floor((aptStart.getTime() - start.getTime()) / 60000),
      end: Math.floor((aptEnd.getTime() - start.getTime()) / 60000)
    };
  });

  // Filtrar slots que están en descanso
  const breakSlots = breaks.map(brk => {
    const brkStart = new Date(`2000-01-01T${brk.start}:00`);
    const brkEnd = new Date(`2000-01-01T${brk.end}:00`);
    return {
      start: Math.floor((brkStart.getTime() - start.getTime()) / 60000),
      end: Math.floor((brkEnd.getTime() - start.getTime()) / 60000)
    };
  });

  // Generar slots disponibles
  for (let time = 0; time < (end.getTime() - start.getTime()) / 60000; time += slotDuration) {
    const slotStart = time;
    const slotEnd = time + slotDuration;

    // Verificar si el slot está en descanso
    const isInBreak = breakSlots.some(brk => 
      (slotStart >= brk.start && slotStart < brk.end) ||
      (slotEnd > brk.start && slotEnd <= brk.end) ||
      (slotStart <= brk.start && slotEnd >= brk.end)
    );

    if (isInBreak) continue;

    // Verificar si el slot está ocupado
    const isBooked = bookedSlots.some(apt =>
      (slotStart >= apt.start && slotStart < apt.end) ||
      (slotEnd > apt.start && slotEnd <= apt.end) ||
      (slotStart <= apt.start && slotEnd >= apt.end)
    );

    if (!isBooked) {
      const hours = Math.floor(slotStart / 60);
      const minutes = slotStart % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }

  return slots;
}