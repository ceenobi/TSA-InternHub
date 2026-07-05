import mongoose, { Document, Schema } from "mongoose";

export interface IHubTask extends Document {
  _id: mongoose.Types.ObjectId;
  hubTeam: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  assignedTo: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  status: "todo" | "in-progress" | "in-review" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  completedAt?: Date;
}

const hubTaskSchema = new Schema<IHubTask>(
  {
    hubTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HubTeam",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "in-review", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    dueDate: {
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

hubTaskSchema.index({ hubTeam: 1, status: 1 });
hubTaskSchema.index({ assignedTo: 1 });
hubTaskSchema.index({ createdBy: 1 });

const HubTask =
  mongoose.models.HubTask ||
  mongoose.model<IHubTask>("HubTask", hubTaskSchema, "hubTasks");

export default HubTask;
