import { Document, Schema, Model, model } from 'mongoose';

interface IUserRole {
  userId: Schema.Types.ObjectId | string; // Updated type to include string
  roleId: Schema.Types.ObjectId | string; // Updated type to include string
}

interface IUserRoleDocument extends IUserRole, Document { }

interface IUserRoleModel extends Model<IUserRoleDocument> { }

const userRoleSchema = new Schema<IUserRoleDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
});

export const UserRoleModel = model<IUserRoleDocument, IUserRoleModel>('UserRole', userRoleSchema);
