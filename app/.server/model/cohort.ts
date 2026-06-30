import mongoose, { Document, Schema } from "mongoose";

export interface ICohort extends Document {
  _id: mongoose.Types.ObjectId;
  cohort: string;
  members: mongoose.Types.ObjectId[];
  status: "active" | "inactive";
  program: "full-stack" | "product-design" | "data-analysis" | "cyber-security";
}

const CohortSchema = new Schema<ICohort>(
  {
    cohort: {
      type: String,
      trim: true,
      required: true,
    },
    members: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
    ],
    program: {
      type: String,
      enum: ["full-stack", "product-design", "data-analysis", "cyber-security"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

CohortSchema.index({ status: 1 });
CohortSchema.index({ program: 1 });

const Cohort =
  mongoose.models.Cohort ||
  mongoose.model<ICohort>("Cohort", CohortSchema, "cohorts");

export default Cohort;
