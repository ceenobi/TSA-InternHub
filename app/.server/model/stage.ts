import mongoose, { Document, Schema } from "mongoose";

export interface IStage extends Document {
  _id: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  order: number;
  title: string;
  description?: string;
  passPercentage: number;
  startDate?: Date;
  endDate?: Date;
  lateGraceHours: number;
  latePenaltyPerDay: number;
}

const stageSchema = new Schema<IStage>(
  {
    project: {
      type: mongoose.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    passPercentage: {
      type: Number,
      required: true,
      default: 70,
      min: 0,
      max: 100,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    lateGraceHours: {
      type: Number,
      default: 24,
    },
    latePenaltyPerDay: {
      type: Number,
      default: 20,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

stageSchema.index({ project: 1, order: 1 }, { unique: true });

const Stage =
  mongoose.models.Stage ||
  mongoose.model<IStage>("Stage", stageSchema, "stages");

export default Stage;
