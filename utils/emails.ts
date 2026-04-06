import pug from 'pug';
import { IUserEmail } from '../@types';
import path = require('path');
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// import { fileURLToPath } from 'url';
// import path from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const Email = class Email {
  private to: string;
  private firstName: string;
  private url: string;
  private from: string;
  private otp: string;
  constructor(user: IUserEmail, url?: string, otp?: string) {
    this.to = user.email || '';
    this.firstName = user.fullName?.split(' ')[0] || '';
    this.url = url || '';
    this.otp = otp || '';
    this.from = `Domique Fusion <${process.env.EMAIL_FROM}>`;
  }

  // Send the actual email
  async send(template: string, subject: string): Promise<void> {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(
      path.join(__dirname, '../views/email', `${template}.pug`),
      {
        firstName: this.firstName,
        url: this.url,
        otp: this.otp,
        subject,
      },
    );

    console.log(
      'templatePath:',
      path.join(__dirname, '../views/email', `${template}.pug`),
    );

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: subject,
    };

    // 3) Create a transport and send email
    try {
      await resend.emails.send(mailOptions);
      console.log('✅ Email sent');
    } catch (err) {
      console.error('❌ Email send failed:', err);
    }
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Domique Fusion!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)',
    );
  }

  async sendOTP() {
    await this.send('sendOTP', 'Your OTP register (valid for only 5 minutes)');
  }
};

export default Email;
