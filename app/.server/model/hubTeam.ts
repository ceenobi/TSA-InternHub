import mongoose, { Document, Schema } from "mongoose";

export interface IHubTeam extends Document {
  _id: mongoose.Types.ObjectId;
  cohort: mongoose.Types.ObjectId;
  stage5: mongoose.Types.ObjectId;
  teamLeader?: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  meetingUrl?: string;
}

const hubTeamSchema = new Schema<IHubTeam>(
  {
    cohort: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cohort",
      required: true,
    },
    stage5: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stage",
      required: true,
    },
    teamLeader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    meetingUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

hubTeamSchema.index({ cohort: 1 }, { unique: true });
hubTeamSchema.index({ teamLeader: 1 });

const HubTeam =
  mongoose.models.HubTeam ||
  mongoose.model<IHubTeam>("HubTeam", hubTeamSchema, "hubTeams");

export default HubTeam;
