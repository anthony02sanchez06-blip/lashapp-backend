import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export class FileService {
  private upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB máximo
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|pdf/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos JPEG, JPG, PNG y PDF'));
      }
    }
  });

  // Obtener configuración de multer
  getMulterConfig() {
    return this.upload;
  }

  // Subir imagen a Cloudinary
  async uploadImage(file: Express.Multer.File, folder: string = 'lashapp'): Promise<string> {
    try {
      const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      
      const result = await cloudinary.uploader.upload(base64File, {
        folder: folder,
        resource_type: 'auto',
        quality: 'auto:good',
        transformation: [
          { width: 800, height: 600, crop: 'limit' }
        ]
      });

      return result.secure_url;
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      throw new Error('Error subiendo la imagen');
    }
  }

  // Subir comprobante de depósito
  async uploadDepositProof(file: Express.Multer.File, appointmentId: string): Promise<string> {
    const folder = `lashapp/deposit-proofs/${appointmentId}`;
    return await this.uploadImage(file, folder);
  }

  // Subir foto de perfil/logo
  async uploadProfileImage(file: Express.Multer.File, userId: string, type: 'profile' | 'logo' = 'profile'): Promise<string> {
    const folder = `lashapp/${type}s/${userId}`;
    return await this.uploadImage(file, folder);
  }

  // Eliminar imagen de Cloudinary
  async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      if (!imageUrl) return false;
      
      // Extraer public_id de la URL
      const publicId = this.extractPublicIdFromUrl(imageUrl);
      if (!publicId) return false;

      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      return false;
    }
  }

  // Extraer public_id de una URL de Cloudinary
  private extractPublicIdFromUrl(url: string): string | null {
    try {
      // URL de Cloudinary típicamente: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[public_id].[ext]
      const matches = url.match(/\/upload\/[^/]+\/(.+)\.[^.]+$/);
      return matches ? matches[1] : null;
    } catch (error) {
      return null;
    }
  }

  // Generar URL de imagen redimensionada
  generateResizedImageUrl(imageUrl: string, width: number, height: number): string {
    try {
      const publicId = this.extractPublicIdFromUrl(imageUrl);
      if (!publicId) return imageUrl;

      return cloudinary.url(publicId, {
        width,
        height,
        crop: 'fill',
        quality: 'auto:good',
        format: 'auto'
      });
    } catch (error) {
      return imageUrl;
    }
  }

  // Verificar si el servicio está configurado
  isConfigured(): boolean {
    return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  }
}

export const fileService = new FileService();