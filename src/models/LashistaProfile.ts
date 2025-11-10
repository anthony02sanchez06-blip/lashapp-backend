import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkingHours {
  day: number; // 0 = Domingo, 1 = Lunes, etc.
  start: string; // "09:00"
  end: string; // "17:00"
  isWorking: boolean;
}

export interface IBreak {
  start: string; // "12:00"
  end: string; // "13:00"
  description: string;
}

export interface ILashistaProfile extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  studioName: string;
  logo?: string;
  description: string;
  services: mongoose.Types.DocumentArray<IService>;
  workingHours: IWorkingHours[];
  breaks: IBreak[];
  depositAmount: number;
  bankAccount: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    documentType: string;
    documentNumber: string;
  };
  socialMedia: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IService extends mongoose.Document {
  _id: string;
  name: string;
  description: string;
  duration: number; // en minutos
  price: number;
  isActive: boolean;
}

const serviceSchema = new Schema<IService>({
  name: {
    type: String,
    required: [true, 'El nombre del servicio es requerido'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La descripción del servicio es requerida'],
    trim: true
  },
  duration: {
    type: Number,
    required: [true, 'La duración es requerida'],
    min: [15, 'La duración mínima es 15 minutos']
  },
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const workingHoursSchema = new Schema<IWorkingHours>({
  day: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  start: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
  },
  end: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
  },
  isWorking: {
    type: Boolean,
    default: true
  }
});

const breakSchema = new Schema<IBreak>({
  start: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
  },
  end: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
  },
  description: {
    type: String,
    required: true,
    trim: true
  }
});

const lashistaProfileSchema = new Schema<ILashistaProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  studioName: {
    type: String,
    required: [true, 'El nombre del estudio es requerido'],
    trim: true,
    maxlength: [100, 'El nombre del estudio no puede tener más de 100 caracteres']
  },
  logo: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true,
    maxlength: [500, 'La descripción no puede tener más de 500 caracteres']
  },
  services: [serviceSchema],
  workingHours: [workingHoursSchema],
  breaks: [breakSchema],
  depositAmount: {
    type: Number,
    required: [true, 'El monto del depósito es requerido'],
    min: [0, 'El monto del depósito no puede ser negativo']
  },
  bankAccount: {
    bankName: {
      type: String,
      required: [true, 'El nombre del banco es requerido'],
      trim: true
    },
    accountHolder: {
      type: String,
      required: [true, 'El nombre del titular es requerido'],
      trim: true
    },
    accountNumber: {
      type: String,
      required: [true, 'El número de cuenta es requerido'],
      trim: true
    },
    documentType: {
      type: String,
      required: [true, 'El tipo de documento es requerido'],
      enum: ['DNI', 'RUT', 'CC', 'Pasaporte']
    },
    documentNumber: {
      type: String,
      required: [true, 'El número de documento es requerido'],
      trim: true
    }
  },
  socialMedia: {
    instagram: {
      type: String,
      trim: true
    },
    facebook: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const LashistaProfile = mongoose.model<ILashistaProfile>('LashistaProfile', lashistaProfileSchema);