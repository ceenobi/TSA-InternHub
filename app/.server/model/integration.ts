import mongoose, { Document, Schema } from "mongoose";

export type IntegrationProvider =
  | "slack"
  | "google_calendar"
  | "google_docs"
  | "github"
  | "notion"
  | "zoom"
  | "google_meet";

export type IntegrationEvent =
  | "submission_graded"
  | "stage_completed"
  | "stage_failed"
  | "project_started"
  | "project_completed"
  | "task_overdue"
  | "ticket_assigned"
  | "ticket_resolved"
  | "ticket_created";

export interface IIntegration extends Document {
  _id: mongoose.Types.ObjectId;
  cohortId: mongoose.Types.ObjectId;
  provider: IntegrationProvider;
  label: string;
  config: Record<string, any>;
  enabledEvents: IntegrationEvent[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema = new Schema<IIntegration>(
  {
    cohortId: {
      type: Schema.Types.ObjectId,
      ref: "Cohort",
      required: true,
    },
    provider: {
      type: String,
      required: true,
      enum: [
        "slack",
        "google_calendar",
        "google_docs",
        "github",
        "notion",
        "zoom",
        "google_meet",
      ],
    },
    label: { type: String, required: true },
    config: { type: Object, default: {} },
    enabledEvents: [{ type: String }],
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

IntegrationSchema.index({ cohortId: 1, provider: 1 });

const Integration =
  mongoose.models.Integration ||
  mongoose.model<IIntegration>(
    "Integration",
    IntegrationSchema,
    "integrations",
  );

export default Integration;
