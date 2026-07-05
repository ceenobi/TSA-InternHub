import mongoose, { Document, Schema } from "mongoose";

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  cohort: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  status: "upcoming" | "active" | "completed" | "on-hold";
  startDate?: Date;
  endDate?: Date;
  progress: number;
  meetingUrl?: string;
}

const projectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    cohort: {
      type: mongoose.Types.ObjectId,
      ref: "Cohort",
      required: true,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "on-hold"],
      default: "upcoming",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    meetingUrl: { type: String }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

projectSchema.index({ cohort: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ startDate: 1 });
projectSchema.index({ endDate: 1 });
projectSchema.index({ title: 1 });


const Project =
  mongoose.models.Project ||
  mongoose.model<IProject>("Project", projectSchema, "projects");

export default Project;
