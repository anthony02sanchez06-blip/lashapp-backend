import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

// Extender la interfaz Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export interface AuthRequest extends Request {
  user: IUser;
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Verificar si el token está en los headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado, token no proporcionado'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    
    // Buscar el usuario
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Verificar si es lashista
export const isLashista = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'lashista') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere cuenta de lashista.'
    });
  }
  next();
};

// Verificar si es cliente
export const isCliente = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'cliente') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere cuenta de cliente.'
    });
  }
  next();
};

// Verificar si el usuario es el propietario del recurso
export const isOwner = (req: Request, res: Response, next: NextFunction) => {
  const resourceUserId = req.params.userId || req.body.userId;
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  if (req.user._id.toString() !== resourceUserId && req.user.userType !== 'lashista') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a este recurso'
    });
  }

  next();
};