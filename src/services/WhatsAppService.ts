import axios from 'axios';
import { IAppointment } from '../models/Appointment';
import { IUser } from '../models/User';

export class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  // Enviar mensaje de texto
  async sendMessage(to: string, message: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('WhatsApp message sent:', response.data);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  // Enviar mensaje de confirmación de cita
  async sendAppointmentConfirmation(appointment: IAppointment, client: IUser, lashista: IUser): Promise<boolean> {
    const message = `
🔔 *Confirmación de Cita - LashApp*

¡Hola ${client.name}! 

Tu cita ha sido confirmada:

👩‍🎨 *Lashista:* ${lashista.name}
💅 *Servicio:* ${appointment.serviceName}
📅 *Fecha:* ${this.formatDate(appointment.appointmentDate)}
⏰ *Hora:* ${appointment.startTime}
💰 *Precio:* $${appointment.servicePrice}

🏦 *Depósito:* $${appointment.servicePrice} (Monto del depósito)

Te recordamos llegar 10 minutos antes de tu cita. 

Si tienes alguna pregunta, puedes contactarnos por este mismo WhatsApp.

¡Gracias por elegirnos! 💕

---
*Enviado desde LashApp*
    `.trim();

    return await this.sendMessage(client.whatsappNumber, message);
  }

  // Enviar recordatorio de cita
  async sendAppointmentReminder(appointment: IAppointment, client: IUser, lashista: IUser, hoursBefore: number): Promise<boolean> {
    const message = `
⏰ *Recordatorio de Cita - LashApp*

¡Hola ${client.name}! 

Te recordamos tu cita en ${hoursBefore === 24 ? '1 día' : '8 horas'}:

👩‍🎨 *Lashista:* ${lashista.name}
💅 *Servicio:* ${appointment.serviceName}
📅 *Fecha:* ${this.formatDate(appointment.appointmentDate)}
⏰ *Hora:* ${appointment.startTime}

Por favor, asegúrate de llegar a tiempo. 

Si necesitas reprogramar, contáctanos lo antes posible.

¡Nos vemos pronto! 💕

---
*Enviado desde LashApp*
    `.trim();

    return await this.sendMessage(client.whatsappNumber, message);
  }

  // Notificar a la lashista sobre nueva cita
  async notifyLashistaNewAppointment(appointment: IAppointment, client: IUser): Promise<boolean> {
    const message = `
🆕 *Nueva Cita Recibida - LashApp*

Has recibido una nueva solicitud de cita:

👤 *Cliente:* ${client.name}
💅 *Servicio:* ${appointment.serviceName}
📅 *Fecha:* ${this.formatDate(appointment.appointmentDate)}
⏰ *Hora:* ${appointment.startTime}
💰 *Precio:* $${appointment.servicePrice}

*Estado:* Pendiente de confirmación

Por favor, revisa la aplicación para confirmar o rechazar la cita.

---
*Enviado desde LashApp*
    `.trim();

    return await this.sendMessage(appointment.lashistaId.toString(), message);
  }

  // Notificar sobre comprobante subido
  async notifyDepositProof(appointment: IAppointment, client: IUser): Promise<boolean> {
    const message = `
💰 *Comprobante de Depósito - LashApp*

El cliente ${client.name} ha subido el comprobante de pago para:

📅 *Cita:* ${this.formatDate(appointment.appointmentDate)} a las ${appointment.startTime}
💅 *Servicio:* ${appointment.serviceName}

Por favor, revisa el comprobante en la aplicación y confirma la cita.

---
*Enviado desde LashApp*
    `.trim();

    return await this.sendMessage(appointment.lashistaId.toString(), message);
  }

  // Notificar cancelación de cita
  async notifyCancellation(appointment: IAppointment, client: IUser, lashista: IUser, reason?: string): Promise<boolean> {
    const message = `
❌ *Cita Cancelada - LashApp*

Se ha cancelado la siguiente cita:

👩‍🎨 *Lashista:* ${lashista.name}
👤 *Cliente:* ${client.name}
💅 *Servicio:* ${appointment.serviceName}
📅 *Fecha:* ${this.formatDate(appointment.appointmentDate)}
⏰ *Hora:* ${appointment.startTime}

${reason ? `📝 *Razón:* ${reason}` : ''}

${reason ? 'Lamentamos cualquier inconveniente.' : 'La cita ha sido cancelada.'}

---
*Enviado desde LashApp*
    `.trim();

    // Enviar tanto al cliente como a la lashista
    await this.sendMessage(client.whatsappNumber, message);
    return await this.sendMessage(appointment.lashistaId.toString(), message);
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
    return !!(this.accessToken && this.phoneNumberId);
  }
}