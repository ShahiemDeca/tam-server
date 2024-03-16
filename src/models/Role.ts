import { Document, Schema, Model, model } from 'mongoose';

interface IRole {
  name: string;
}

interface IRoleDocument extends IRole, Document { }

interface IRoleModel extends Model<IRoleDocument> { }

const roleSchema = new Schema<IRoleDocument>({
  name: { type: String, required: true, unique: true },
});

export const RoleModel = model<IRoleDocument, IRoleModel>('Role', roleSchema);
