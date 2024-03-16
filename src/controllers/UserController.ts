import dotenv from 'dotenv';
import { UserModel } from "../models/User";
import { ValidationRules, Input } from "../core/ValidationRules";
import bcrypt from "bcrypt";
import jwt, { Secret } from 'jsonwebtoken';
import crypto from 'crypto';
import { serialize, parse } from 'cookie';
import { EmailSender } from "../services/EmailSender";


class UserController {
  emailSender: EmailSender;

  constructor() {
    dotenv.config();

    this.emailSender = new EmailSender();
  }

  register = async (req: any, res: any, next: any) => {
    try {
      const { username, password, email } = req.body;
      const inputs: Input[] = [
        { value: username, fieldName: "username", maxLength: 25, minLength: 2, isRequired: true, isUnique: true, model: UserModel },
        { value: email, fieldName: "email", isEmail: true, isRequired: true, isUnique: true, model: UserModel },
        { value: password, fieldName: "password", isRequired: true },
      ];

      const errors = await ValidationRules.validate(inputs);
      if (errors.length === 0) {
        const hashedPassword = await bcrypt.hash(password, 10);

        const activationCode = crypto.randomBytes(6).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const newUser = new UserModel({
          username,
          password: hashedPassword,
          email,
          activation_code: activationCode, // Include activation code in the user model
          created_at: new Date(),
        });

        await newUser.save();

        const emailSubject = 'Welcome to Tamuroo!';
        const emailBody = `
            <p>Hi ${username},</p>
            <p>Thank you for registering to Tamuroo! Please use the following activation code to activate your account:</p>
            <p><strong>${activationCode}</strong></p>
            <p>Visit our website and enter the activation code in the provided field to complete the registration process.</p>
        `;

        this.emailSender.sendEmail(email, emailSubject, emailBody).then(() => { }).catch((error: any) => console.error('Error sending email:', error));

        res.status(201).json({ message: 'User registered successfully' });
      } else {
        res.status(401).json({ message: errors });
      }
    } catch (error) {
      next(error);
    }
  }

  async login(req: any, res: any) {
    try {
      const { username, password } = req.body;

      const inputs: Input[] = [
        { value: username, fieldName: "username", isRequired: true },
        { value: password, fieldName: "password", isRequired: true },
      ];

      const errors = await ValidationRules.validate(inputs);
      if (errors.length === 0) {
        const user = await UserModel.findOne({ username });
        const isPasswordNotMatch = !(await ValidationRules.isPasswordMatch({ inputPassword: password, userPassword: user?.password }));

        if (!user || isPasswordNotMatch)
          return res.status(401).json({ message: 'Invalid username or password' });

        // if (!user.ban_expires_at || user.ban_expires_at > new Date())
        //   return res.status(403).json({ message: 'Your account has been banned. Reason: ' + user.ban_reason });

        const token = jwt.sign({ id: user.id, username: user.username, activated_at: user.activated_at }, process.env.JWT_SECRET as Secret, { expiresIn: process.env.JWT_EXPIRES_IN });

        res.setHeader('Set-Cookie', serialize('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // Set to true in production for HTTPS
          sameSite: 'strict',
          maxAge: 3600, // Token expiration time in seconds (1 hour)
          path: '/', // Adjust the path if needed
        }));

        console.log('Authentication success ', token);
        res.status(200).json({ message: 'Authentication successful!' });
      } else {
        res.status(401).json({ message: errors });
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  forgotPassword = async (req: any, res: any) => {
    try {
      const { email } = req.body;

      const user = await UserModel.findOne({ email });

      const inputs: Input[] = [
        { value: email, fieldName: "email", isEmail: true, isRequired: true },
      ];

      const errors = await ValidationRules.validate(inputs);
      if (errors.length === 0) {
        if (user) {
          const resetCode = crypto.randomBytes(6).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
          const resetCodeExpiry = Date.now() + Number(process.env.RESET_PASSWORD_EXPIRES_IN); // Token expires in 1 hour

          user.reset_password_code = resetCode;
          user.reset_password_at = resetCodeExpiry;

          await user.save();

          const emailSubject = 'Password Reset - Tamuroo';
          const emailBody = `
              <p>Hi ${user.username},</p>
              <p>We received a request to reset your Tamuroo account password. If you didn't make this request, you can ignore this email.</p>
              <p>Use the following code to reset your password:</p>
              <p><strong>${resetCode}</strong></p>
              <p>This code will expire in one hour. If you did not request a password reset, please disregard this email.</p>
          `;

          this.emailSender.sendEmail(email, emailSubject, emailBody).catch((error: any) => console.error('Error sending email:', error));

          res.status(200).json({ message: 'Password reset token sent to your email', resetCode });
        } else {
          res.status(200).json({ message: 'Password reset instructions sent to your email if an account exists.' });
        }
      } else {
        res.status(401).json({ message: errors });
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error });
    }
  }

  async resetPassword(req: any, res: any) {
    try {
      const { resetToken, newPassword } = req.body;

      const user = await UserModel.findOne({
        reset_password_code: resetToken,
        reset_password_at: { $gt: Date.now() },
      });

      if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

      const inputs: Input[] = [
        { value: newPassword, fieldName: "password", isRequired: true },
      ];

      const errors = await ValidationRules.validate(inputs);
      if (errors.length === 0) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.reset_password_code = null;
        user.reset_password_at = null;

        await user.save();

        res.status(200).json({ message: 'Password reset successfully' });
      } else {
        res.status(401).json({ message: errors });
      }
    } catch (error) {
      // res.status(500).json({ message: 'Internal server error' });
    }
  }

  verifyToken(req: any, res: any, next: any) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
      return res.status(401).json({ message: 'Unauthorized - No token provided' });

    jwt.verify(token, process.env.JWT_SECRET as Secret, (error: any, decoded: any) => {
      if (error)
        return res.status(401).json({ message: 'Unauthorized - Invalid token' });

      req.user = decoded;
      next();
    });
  }

  me(req: any, res: any) {
    const { user } = req;

    const cookies = parse(req.headers.cookie || ''); // Parse cookies from request headers
    const token = cookies.token; // Get the 'token' cookie

    if (!token)
      return res.status(401).json({ message: 'Unauthorized - No token provided' });

    res.status(200).json({ user });
  }

  logout(req: any, res: any) {
    try {
      req.user = null;

      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async activateAccount(req: any, res: any) {
    try {
      const { activationCode } = req.params;

      const user = await UserModel.findOne({ activation_code: activationCode });

      if (!user) return res.status(404).json({ message: 'Activation code not found' });
      if (user.activated_at) return res.status(400).json({ message: 'Account already activated' });

      user.activated_at = new Date();
      user.activation_code = null;
      await user.save();

      res.status(200).json({ message: 'Account activated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default UserController;
