import mongoose, { Document, Schema } from "mongoose";

export interface IStageProgress extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  stage: mongoose.Types.ObjectId;
  status: "locked" | "active" | "completed" | "failed";
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  passed: boolean;
  startedAt?: Date;
  completedAt?: Date;
}

const stageProgressSchema = new Schema<IStageProgress>(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stage: {
      type: mongoose.Types.ObjectId,
      ref: "Stage",
      required: true,
    },
    status: {
      type: String,
      enum: ["locked", "active", "completed", "failed"],
      default: "locked",
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    maxPossibleScore: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

stageProgressSchema.index({ user: 1, stage: 1 }, { unique: true });
stageProgressSchema.index({ stage: 1, status: 1 });

const StageProgress =
  mongoose.models.StageProgress ||
  mongoose.model<IStageProgress>(
    "StageProgress",
    stageProgressSchema,
    "stageProgress",
  );

export default StageProgress;
