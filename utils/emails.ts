import nodemailer from "nodemailer";
import SMTPTransport = require("nodemailer/lib/smtp-transport");
import pug from "pug";
import { IUserEmail } from "../@types";
import htmlToText from "html-to-text";

// import { fileURLToPath } from 'url';
// import path from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
interface EmailOptios {
  email: string;
  subject: string;
  message: string;
}
const Email = class Email {
  private to: string;
  private firstName: string;
  private url: string;
  private from: string;
  private otp: string;
  constructor(user: IUserEmail, url?: string, otp?: string) {
    this.to = user.email || "";
    this.firstName = user.fullName?.split(" ")[0] || "";
    this.url = url || "";
    this.otp = otp || "";
    this.from = `Dom Nguyen <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // Sendgrid
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      } as SMTPTransport.Options);
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    } as SMTPTransport.Options);
  }

  // Send the actual email
  async send(template: string, subject: string): Promise<void> {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      otp: this.otp,
      subject,
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: subject,
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the Natours Family!");
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for only 10 minutes)"
    );
  }

  async sendOTP() {
    await this.send("sendOTP", "Your OTP register (valid for only 5 minutes)");
  }
};

export default Email;
