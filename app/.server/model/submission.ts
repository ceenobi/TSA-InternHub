import mongoose, { Document, Schema } from "mongoose";

export interface ISubmission extends Document {
  _id: mongoose.Types.ObjectId;
  task: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  content?: string;
  fileUrls: { name: string; url: string }[];
  status: "submitted" | "graded" | "returned";
  score?: number;
  maxScore: number;
  percentage?: number;
  feedback?: string;
  gradedBy?: mongoose.Types.ObjectId;
  attemptNumber: number;
  submittedAt: Date;
  gradedAt?: Date;
  isLate: boolean;
  latePenalty: number;
}

const submissionSchema = new Schema<ISubmission>(
  {
    task: {
      type: mongoose.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
    },
    fileUrls: [
      {
        name: { type: String },
        url: { type: String },
        _id: false,
      },
    ],
    status: {
      type: String,
      enum: ["submitted", "graded", "returned"],
      default: "submitted",
    },
    score: {
      type: Number,
    },
    maxScore: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
    },
    feedback: {
      type: String,
    },
    gradedBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    gradedAt: {
      type: Date,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    latePenalty: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

submissionSchema.index({ task: 1, user: 1 });
submissionSchema.index({ user: 1, status: 1 });
submissionSchema.index(
  { task: 1, user: 1, attemptNumber: 1 },
  { unique: true },
);

const Submission =
  mongoose.models.Submission ||
  mongoose.model<ISubmission>("Submission", submissionSchema, "submissions");

export default Submission;
