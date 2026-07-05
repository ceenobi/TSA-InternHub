import mongoose, { Document, Schema } from "mongoose";

export interface IAnnouncement extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  createdBy: mongoose.Types.ObjectId;
  target: "all" | "cohort" | "program";
  targetCohort?: mongoose.Types.ObjectId;
  targetProgram?: "full-stack" | "product-design" | "data-analysis" | "cyber-security";
  priority: "low" | "normal" | "high" | "urgent";
  pinned: boolean;
  expiresAt?: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    target: {
      type: String,
      enum: ["all", "cohort", "program"],
      default: "all",
    },
    targetCohort: {
      type: mongoose.Types.ObjectId,
      ref: "Cohort",
    },
    targetProgram: {
      type: String,
      enum: ["full-stack", "product-design", "data-analysis", "cyber-security"],
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

announcementSchema.index({ pinned: -1, createdAt: -1 });
announcementSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
announcementSchema.index({ target: 1, targetCohort: 1 });

const Announcement =
  mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>("Announcement", announcementSchema, "announcements");

export default Announcement;
