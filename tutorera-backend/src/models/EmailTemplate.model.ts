import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEmailTemplate extends Document {
  key: string;
  name: string;
  description?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  variables: string[];
  isActive: boolean;
  category: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    key: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    description: { type: String },
    subject: { type: String, required: true },
    htmlBody: { type: String, required: true },
    textBody: { type: String },
    variables: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    category: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true }
);

EmailTemplateSchema.index({ key: 1 });
EmailTemplateSchema.index({ category: 1, isActive: 1 });

export default mongoose.model<IEmailTemplate>("EmailTemplate", EmailTemplateSchema);
