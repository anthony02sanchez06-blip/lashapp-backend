import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  whatsappNumber: string;
  userType: 'lashista' | 'cliente';
  profileImage?: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede tener más de 100 caracteres']
  },
  email: {
    type: String,
    required: false,
    unique: false,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    unique: true,
    trim: true
  },
  whatsappNumber: {
    type: String,
    required: [true, 'El número de WhatsApp es requerido'],
    trim: true
  },
  userType: {
    type: String,
    enum: ['lashista', 'cliente'],
    required: [true, 'El tipo de usuario es requerido']
  },
  profileImage: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    select: false // No incluir en consultas por defecto
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para populate automático
userSchema.virtual('lashistaProfile', {
  ref: 'LashistaProfile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

export const User = mongoose.model<IUser>('User', userSchema);