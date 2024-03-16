import { Document, Schema, Model, model } from 'mongoose';

// Define the user interface
interface IUser {
  username: string;
  password: string;
  email: string;
  birthday: Date;
  look: string;
  activated_at?: Date;
  activation_code?: String | null;
  reset_password_at?: number | null;
  reset_password_code?: String | null;
  ban_expires_at?: Date | null;
  ban_reason?: string | null;
}

interface IUserDocument extends IUser, Document { }

interface IUserModel extends Model<IUserDocument> {
  getAllUsers(): Promise<IUserDocument[]>;
}

// Create the user model
const userSchema = new Schema<IUserDocument>(
  {
    id: { type: Number, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    birthday: { type: Date },
    look: { type: String },
    activated_at: { type: Date },
    activation_code: { type: String },
    reset_password_at: { type: Number },
    reset_password_code: { type: String },
    ban_expires_at: { type: Date, default: null },
    ban_reason: { type: String, default: null },
  },
  { timestamps: true } // This will add createdAt and updatedAt fields automatically
);

userSchema.pre('save', async function (next) {
  const user = this as IUserDocument;

  if (!user.isNew) return next(); // Skip if the document is not new (updating)

  try {
    const count = await this.model('User').countDocuments();
    user.id = count + 1;
    next();
  } catch (error: any) {
    next(error);
  }
});

userSchema.index({ id: 1 }, { unique: true });

export const UserModel = model<IUserDocument, IUserModel>('User', userSchema);

class User {

  constructor(private model: Model<IUserDocument> = UserModel) { }

  async save(user: IUser): Promise<void> {
    try {
      await this.model.create(user);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  static async getAllUsers(): Promise<IUserDocument[]> {
    try {
      const users = await UserModel.find();
      return users;
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  static async findByUsername(username: string): Promise<IUserDocument | null> {
    try {
      const user = await UserModel.findOne({ username });
      return user;
    } catch (error) {
      console.error(`Error finding user by username ${username}:`, error);
      return null;
    }
  }
}

export default User;
