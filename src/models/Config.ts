import mongoose, { Document, Schema } from 'mongoose';

export interface IConfig extends Document {
  _id: string;
  whatsappSettings: {
    accessToken: string;
    phoneNumberId: string;
    verifyToken: string;
    isEnabled: boolean;
  };
  emailSettings: {
    host: string;
    port: number;
    secure: boolean;
    from: string;
    isEnabled: boolean;
  };
  systemSettings: {
    reminderHours: number[];
    maxAdvanceBookingDays: number;
    defaultAppointmentDuration: number;
    bufferTimeBetweenAppointments: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const configSchema = new Schema<IConfig>({
  whatsappSettings: {
    accessToken: {
      type: String,
      required: true
    },
    phoneNumberId: {
      type: String,
      required: true
    },
    verifyToken: {
      type: String,
      required: true
    },
    isEnabled: {
      type: Boolean,
      default: false
    }
  },
  emailSettings: {
    host: {
      type: String,
      required: true
    },
    port: {
      type: Number,
      required: true,
      default: 587
    },
    secure: {
      type: Boolean,
      default: false
    },
    from: {
      type: String,
      required: true
    },
    isEnabled: {
      type: Boolean,
      default: false
    }
  },
  systemSettings: {
    reminderHours: {
      type: [Number],
      default: [24, 8]
    },
    maxAdvanceBookingDays: {
      type: Number,
      default: 30
    },
    defaultAppointmentDuration: {
      type: Number,
      default: 60
    },
    bufferTimeBetweenAppointments: {
      type: Number,
      default: 15
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Crear un documento de configuración por defecto si no existe
configSchema.statics.getDefaultConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

export const Config = mongoose.model<IConfig>('Config', configSchema);