import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    const smtp = this.config.get('app.smtp');
    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
    });
  }

  async sendInvite(to: string, inviteUrl: string, companyName = 'your company') {
    const subject = `You've been invited to join ${companyName} on BHRM Teams`;
    const html = this.inviteTemplate(to, inviteUrl, companyName);
    await this.send(to, subject, html);
  }

  async sendPasswordReset(to: string, resetUrl: string) {
    const subject = 'Reset your BHRM Teams password';
    const html = this.resetTemplate(resetUrl);
    await this.send(to, subject, html);
  }

  private async send(to: string, subject: string, html: string) {
    const from = this.config.get<string>('app.smtp.from');
    try {
      await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      throw err;
    }
  }

  private inviteTemplate(email: string, inviteUrl: string, companyName: string) {
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
        <!-- Header -->
        <tr><td style="background:#111827;padding:28px 40px">
          <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px">BHRM Teams</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827">You're invited!</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6">
            You have been invited to join <strong style="color:#111827">${companyName}</strong> on BHRM Teams.<br>
            Click the button below to set up your account.
          </p>
          <a href="${inviteUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px">
            Accept Invitation
          </a>
          <p style="margin:24px 0 0;font-size:13px;color:#9ca3af">
            This link expires in 7 days. If you did not expect this invitation, you can safely ignore this email.
          </p>
          <p style="margin:16px 0 0;font-size:12px;color:#d1d5db;word-break:break-all">
            Or copy this link: ${inviteUrl}
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="border-top:1px solid #f3f4f6;padding:20px 40px">
          <p style="margin:0;font-size:12px;color:#9ca3af">BHRM Teams · Enterprise Task Execution Platform</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private resetTemplate(resetUrl: string) {
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
        <!-- Header -->
        <tr><td style="background:#111827;padding:28px 40px">
          <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px">BHRM Teams</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827">Reset your password</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6">
            We received a request to reset your password. Click the button below to choose a new one.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px">
            Reset Password
          </a>
          <p style="margin:24px 0 0;font-size:13px;color:#9ca3af">
            This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
          <p style="margin:16px 0 0;font-size:12px;color:#d1d5db;word-break:break-all">
            Or copy this link: ${resetUrl}
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="border-top:1px solid #f3f4f6;padding:20px 40px">
          <p style="margin:0;font-size:12px;color:#9ca3af">BHRM Teams · Enterprise Task Execution Platform</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
