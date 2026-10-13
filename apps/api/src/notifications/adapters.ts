import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export type NotificationChannel = 'push' | 'whatsapp' | 'email';

export interface OutgoingMessage {
  to: string;
  subject: string;
  body: string;
}

export interface NotificationChannelAdapter {
  readonly channel: NotificationChannel;
  send(message: OutgoingMessage): Promise<{ providerId: string }>;
}

/** Correo en desarrollo: escribe el mensaje en la consola (sin credenciales). */
export class ConsoleEmailAdapter implements NotificationChannelAdapter {
  readonly channel = 'email' as const;

  async send(message: OutgoingMessage): Promise<{ providerId: string }> {
    console.log(
      `[notificaciones:email:consola] para ${message.to} — ${message.subject}\n${message.body}`,
    );
    return { providerId: `console-${Date.now()}` };
  }
}

/** Correo real cuando existe SMTP_URL (despliegue). */
export class SmtpEmailAdapter implements NotificationChannelAdapter {
  readonly channel = 'email' as const;
  private readonly transporter: Transporter;

  constructor(smtpUrl: string, private readonly from: string) {
    this.transporter = nodemailer.createTransport(smtpUrl);
  }

  async send(message: OutgoingMessage): Promise<{ providerId: string }> {
    const info = await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.body,
    });
    return { providerId: info.messageId };
  }
}

/**
 * WhatsApp y push quedan como adaptadores pendientes de configuración
 * (trámite Meta en ADR-0001 y VAPID en el despliegue). Al no estar
 * configurados reportan error y la cascada pasa al siguiente canal.
 */
export class WhatsAppAdapter implements NotificationChannelAdapter {
  readonly channel = 'whatsapp' as const;

  async send(): Promise<{ providerId: string }> {
    throw new Error(
      'Canal WhatsApp no configurado (trámite Meta pendiente, ADR-0001)',
    );
  }
}

export class PushAdapter implements NotificationChannelAdapter {
  readonly channel = 'push' as const;

  async send(): Promise<{ providerId: string }> {
    throw new Error('Canal push no configurado (VAPID pendiente de despliegue)');
  }
}

export function buildAdapters(): NotificationChannelAdapter[] {
  const smtpUrl = process.env.SMTP_URL;
  const email: NotificationChannelAdapter = smtpUrl
    ? new SmtpEmailAdapter(
        smtpUrl,
        process.env.SMTP_FROM ?? 'BienestarPro <no-reply@bienestarpro.local>',
      )
    : new ConsoleEmailAdapter();
  return [new PushAdapter(), new WhatsAppAdapter(), email];
}
