import nodemailer from 'nodemailer';
import { storage } from './storage';

interface MailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
    from: string;
}

export async function getMailConfig(): Promise<MailConfig | null> {
    // 1. Try to get from Database Integrations
    try {
        const integrations = await storage.getIntegrations({ category: 'email' });
        const activeSmtp = integrations?.find(i => i.status === 'active');

        if (activeSmtp && activeSmtp.fields) {
            const getField = (key: string) => activeSmtp.fields?.find(f => f.key === key)?.value;

            const host = getField('host');
            const port = Number(getField('port'));
            const user = getField('user');
            const pass = getField('pass');
            const from = getField('from');

            if (host && port && user && pass) {
                console.log('Using SMTP config from Database Integration');
                return {
                    host,
                    port,
                    secure: port === 465, // SSL for 465, TLS usually for 587
                    auth: { user, pass },
                    from: from || process.env.SMTP_FROM || '"HabilitFy" <noreply@habilitfy.com>'
                };
            }
        }
    } catch (err) {
        console.error('Error fetching email integration:', err);
    }

    // 2. Fallback to Environment Variables
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log('Using SMTP config from Environment Variables');
        return {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            from: process.env.SMTP_FROM || '"HabilitFy" <noreply@habilitfy.com>'
        };
    }

    return null;
}

export async function sendVerificationEmail(to: string, token: string): Promise<boolean> {
    try {
        const config = await getMailConfig();

        if (!config) {
            console.warn('SMTP Configuration not found. Skipping email verification.');
            return false;
        }

        const transporter = nodemailer.createTransport(config);

        // Determine Base URL (Assuming request context might differ, let's use Env or default)
        // Ideally this comes from the request, but for helper functions, Env is safer.
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const verificationLink = `${baseUrl}/verify-email?token=${token}`;

        const info = await transporter.sendMail({
            from: config.from,
            to,
            subject: 'Verifique sua conta no HabilitFy',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2E7D32;">Bem-vindo ao HabilitFy!</h2>
          <p>Obrigado por se cadastrar. Para ativar sua conta e acessar todos os recursos, por favor verifique seu e-mail.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verificar E-mail</a>
          </div>
          <p style="font-size: 12px; color: #666;">Ou cole este link no seu navegador:</p>
          <p style="font-size: 12px; color: #666; word-break: break-all;">${verificationLink}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">Se você não criou esta conta, ignore este e-mail.</p>
        </div>
      `,
        });

        console.log(`Verification email sent to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        return false;
    }
}
