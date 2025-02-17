import nodemailer from "nodemailer";
import SMTPTransport = require("nodemailer/lib/smtp-transport");
interface EmailOptios {
  email: string;
  subject: string;
  message: string;
}
const sendEmail = async (options: EmailOptios) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  } as SMTPTransport.Options);

  const mailOptions = {
    from: "Dom Nguyen <domnguyen@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
