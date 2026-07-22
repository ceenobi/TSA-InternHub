import mongoose, { Document, Schema } from "mongoose";

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  stage: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  instructions?: string;
  resources?: {
    name: string;
    url: string;
  }[];
  type: "individual" | "group";
  maxScore: number;
  isBonus: boolean;
  order: number;
  dueDate?: Date;
  maxAttempts: number;
  allowLate: boolean;
  latePenaltyPercent: number;
}

const taskSchema = new Schema<ITask>(
  {
    stage: {
      type: mongoose.Types.ObjectId,
      ref: "Stage",
      required: true,
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
    instructions: {
      type: String,
    },
    type: {
      type: String,
      enum: ["individual", "group"],
      required: true,
      default: "individual",
    },
    resources: [
      {
        name: { type: String },
        url: { type: String },
        _id: false,
      },
    ],
    maxScore: {
      type: Number,
      required: true,
      min: 0,
    },
    isBonus: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    maxAttempts: {
      type: Number,
      default: 2,
      min: 1,
    },
    allowLate: {
      type: Boolean,
      default: true,
    },
    latePenaltyPercent: {
      type: Number,
      default: 3,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

taskSchema.index({ stage: 1, order: 1 });

const Task =
  mongoose.models.Task || mongoose.model<ITask>("Task", taskSchema, "tasks");

export default Task;
