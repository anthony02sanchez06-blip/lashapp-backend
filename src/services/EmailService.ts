import nodemailer from 'nodemailer';
import { IAppointment } from '../models/Appointment';
import { IUser } from '../models/User';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Enviar email de confirmación de cita
  async sendAppointmentConfirmation(appointment: IAppointment, client: IUser, lashista: IUser): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: client.email || '',
        subject: 'Confirmación de Cita - LashApp',
        html: this.generateConfirmationHTML(appointment, client, lashista)
      };

      if (client.email) {
        await this.transporter.sendMail(mailOptions);
        console.log('Email de confirmación enviado a:', client.email);
      }
      return true;
    } catch (error) {
      console.error('Error enviando email de confirmación:', error);
      return false;
    }
  }

  // Enviar recordatorio por email
  async sendAppointmentReminder(appointment: IAppointment, client: IUser, lashista: IUser, hoursBefore: number): Promise<boolean> {
    try {
      if (!client.email) return false;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: client.email,
        subject: `Recordatorio de Cita - ${hoursBefore === 24 ? '24 horas' : '8 horas'} antes`,
        html: this.generateReminderHTML(appointment, client, lashista, hoursBefore)
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Email de recordatorio enviado a:', client.email);
      return true;
    } catch (error) {
      console.error('Error enviando email de recordatorio:', error);
      return false;
    }
  }

  // Generar HTML para confirmación de cita
  private generateConfirmationHTML(appointment: IAppointment, client: IUser, lashista: IUser): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Confirmación de Cita</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b9d, #ff9a9e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .detail-label { font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔔 ¡Cita Confirmada!</h1>
                <p>¡Hola ${client.name}!</p>
            </div>
            <div class="content">
                <p>Tu cita ha sido confirmada exitosamente. Aquí están los detalles:</p>
                
                <div class="appointment-details">
                    <div class="detail-row">
                        <span class="detail-label">👩‍🎨 Lashista:</span>
                        <span>${lashista.name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">💅 Servicio:</span>
                        <span>${appointment.serviceName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">📅 Fecha:</span>
                        <span>${this.formatDate(appointment.appointmentDate)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">⏰ Hora:</span>
                        <span>${appointment.startTime}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">💰 Precio:</span>
                        <span>$${appointment.servicePrice}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">🏦 Depósito:</span>
                        <span>$${appointment.servicePrice}</span>
                    </div>
                </div>
                
                <p><strong>📋 Recordatorios importantes:</strong></p>
                <ul>
                    <li>Llega 10 minutos antes de tu cita</li>
                    <li>Trae tu identificación</li>
                    <li>Si necesitas cancelar, hazlo con al menos 24 horas de anticipación</li>
                </ul>
                
                <p>¡Gracias por elegirnos! No dudes en contactarnos si tienes alguna pregunta.</p>
            </div>
            <div class="footer">
                <p>Este email fue enviado automáticamente desde LashApp</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Generar HTML para recordatorio
  private generateReminderHTML(appointment: IAppointment, client: IUser, lashista: IUser, hoursBefore: number): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Recordatorio de Cita</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .detail-label { font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏰ Recordatorio de Cita</h1>
                <p>¡Hola ${client.name}!</p>
            </div>
            <div class="content">
                <p>Te recordamos tu cita que es en <strong>${hoursBefore === 24 ? '1 día' : '8 horas'}</strong>:</p>
                
                <div class="appointment-details">
                    <div class="detail-row">
                        <span class="detail-label">👩‍🎨 Lashista:</span>
                        <span>${lashista.name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">💅 Servicio:</span>
                        <span>${appointment.serviceName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">📅 Fecha:</span>
                        <span>${this.formatDate(appointment.appointmentDate)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">⏰ Hora:</span>
                        <span>${appointment.startTime}</span>
                    </div>
                </div>
                
                <p><strong>📋 Recuerda:</strong></p>
                <ul>
                    <li>Llega 10 minutos antes</li>
                    <li>Si necesitas cancelar, contáctanos lo antes posible</li>
                </ul>
                
                <p>¡Nos vemos pronto!</p>
            </div>
            <div class="footer">
                <p>Este email fue enviado automáticamente desde LashApp</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Formatear fecha en español
  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Verificar si el servicio está configurado
  isConfigured(): boolean {
    return !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
  }
}