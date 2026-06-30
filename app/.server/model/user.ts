import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  cohort?: string;
  name: string;
  email: string;
  password: string;
  emailVerified: boolean;
  phone: string;
  role: "user" | "admin";
  gender?: "male" | "female" | "other";
  program?:
    | "full-stack"
    | "product-design"
    | "data-analysis"
    | "cyber-security";
  isOnboarded: boolean;
  isSuspended: boolean;
  failedLoginAttempts: number;
  lockoutUntil?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin", "super_admin"],
      default: "user",
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: {
      type: Date,
    },
    cohort: {
      type: String,
      trim: true,
    },
    program: {
      type: String,
      trim: true,
      enum: ["full-stack", "product-design", "data-analysis", "cyber-security"],
    },
    gender: {
      type: String,
      trim: true,
      enum: ["male", "female", "other"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

UserSchema.index({ name: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ isOnboarded: 1 });
UserSchema.index({ isSuspended: 1 });
UserSchema.index({ cohort: 1 });
UserSchema.index({ program: 1 });
UserSchema.index({ gender: 1 });

const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema, "user");

export default User;
