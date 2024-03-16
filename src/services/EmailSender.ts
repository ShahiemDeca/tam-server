import * as nodemailer from 'nodemailer';

export class EmailSender {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure the email transporter
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // upgrade later with STARTTLS
      auth: {
        user: "shahiem.mail@gmail.com",
        pass: "ikqp othv hzed rpqt",
      },
    });
  }

  /**
   * Send an email to a user.
   * @param to Email address of the recipient.
   * @param subject Subject of the email.
   * @param body Body of the email.
   */
  public sendEmail(to: string, subject: string, body: string): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: 'talktous@tamuroo.com', // Your Gmail email address
      to,
      subject,
      html: body
    };

    return new Promise((resolve, reject) => {
      this.transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          reject(error);
        } else {
          console.log('Email sent: ' + info.response);
          resolve();
        }
      });
    });
  }
}

