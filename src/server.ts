import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database';
import { errorHandler, notFound } from './middleware/errorHandler';

// Importar rutas
import authRoutes from './routes/auth';
import lashistaRoutes from './routes/lashista';
import appointmentRoutes from './routes/appointments';

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por ventana de tiempo
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware de seguridad
app.use(helmet());
app.use(limiter);

// CORS
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Rutas de salud
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LashApp API está funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/lashista', lashistaRoutes);
app.use('/api/appointments', appointmentRoutes);

// Manejo de errores 404
app.use(notFound);

// Manejo global de errores
app.use(errorHandler);

// Configuración del puerto
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║            🚀 LashApp Server         ║
  ║                                      ║
  ║  ✅ Servidor iniciado exitosamente   ║
  ║  📡 Puerto: ${PORT}                    ║
  ║  🔗 URL: http://localhost:${PORT}      ║
  ║  🌍 Entorno: ${process.env.NODE_ENV}                ║
  ║                                      ║
  ║  📚 API Routes:                      ║
  ║  🔐 /api/auth                        ║
  ║  👩‍🎨 /api/lashista                   ║
  ║  📅 /api/appointments                ║
  ║                                      ║
  ║  ¡LashApp está listo para recibir   ║
  ║     solicitudes de las lashistas!   ║
  ╚══════════════════════════════════════╝
  `);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err: any, promise) => {
  console.log('Error no manejado:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.log('Error no capturado:', err.message);
  process.exit(1);
});

export default app;