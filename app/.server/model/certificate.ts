import mongoose, { Document, Schema } from "mongoose";

export interface ICertificate extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  cohort: mongoose.Types.ObjectId;
  program?:
    | "full-stack"
    | "product-design"
    | "data-analysis"
    | "cyber-security";
  type: "completion";
  score?: number;
  certificateId: string;
  issuedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: mongoose.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    cohort: {
      type: mongoose.Types.ObjectId,
      ref: "Cohort",
      required: true,
    },
    program: {
      type: String,
      enum: [
        "full-stack",
        "product-design",
        "data-analysis",
        "cyber-security",
      ],
    },
    type: {
      type: String,
      enum: ["completion"],
      default: "completion",
    },
    score: {
      type: Number,
    },
    certificateId: {
      type: String,
      required: true,
      unique: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

certificateSchema.index({ user: 1, project: 1 }, { unique: true });

const Certificate =
  mongoose.models.Certificate ||
  mongoose.model<ICertificate>(
    "Certificate",
    certificateSchema,
    "certificates",
  );

export default Certificate;
