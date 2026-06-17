import mongoose, { Schema, Document, Model } from "mongoose";

// 1. TypeScript interface — describes the shape of a User document
export interface IUser extends Document {
  name: string;
  email: string;
  contact: string;
  createdAt: Date;
}

// 2. Schema — defines fields, types, and validation rules
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    contact: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true, // auto-adds createdAt and updatedAt
  }
);

// 3. Model — prevents OverwriteModelError during hot-reload in dev
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
