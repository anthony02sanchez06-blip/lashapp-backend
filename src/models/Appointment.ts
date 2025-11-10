import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  _id: string;
  lashistaId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'payment_pending';
  depositProof?: string;
  notes?: string;
  cancellationReason?: string;
  reminders: {
    twentyFourHours: boolean;
    eightHours: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>({
  lashistaId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'La ID de la lashista es requerida']
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'La ID del cliente es requerida']
  },
  serviceId: {
    type: Schema.Types.ObjectId,
    required: [true, 'La ID del servicio es requerida']
  },
  serviceName: {
    type: String,
    required: [true, 'El nombre del servicio es requerido'],
    trim: true
  },
  serviceDuration: {
    type: Number,
    required: [true, 'La duración del servicio es requerida'],
    min: [15, 'La duración mínima es 15 minutos']
  },
  servicePrice: {
    type: Number,
    required: [true, 'El precio del servicio es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  appointmentDate: {
    type: Date,
    required: [true, 'La fecha de la cita es requerida'],
    validate: {
      validator: function(date: Date) {
        return date > new Date();
      },
      message: 'La fecha de la cita debe ser en el futuro'
    }
  },
  startTime: {
    type: String,
    required: [true, 'La hora de inicio es requerida'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'La hora de fin es requerida'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'payment_pending'],
    default: 'pending',
    required: true
  },
  depositProof: {
    type: String,
    required: false
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Las notas no pueden tener más de 500 caracteres']
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [200, 'La razón de cancelación no puede tener más de 200 caracteres']
  },
  reminders: {
    twentyFourHours: {
      type: Boolean,
      default: false
    },
    eightHours: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índice para optimizar consultas de disponibilidad
appointmentSchema.index({ lashistaId: 1, appointmentDate: 1, status: 1 });
appointmentSchema.index({ clientId: 1, appointmentDate: 1 });

// Validación de que la hora de fin sea después de la hora de inicio
appointmentSchema.pre('save', function(next) {
  if (this.startTime >= this.endTime) {
    return next(new Error('La hora de fin debe ser posterior a la hora de inicio'));
  }
  next();
});

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);