import mongoose, { Document, Schema } from "mongoose";

export interface IChatFeedback extends Document {
  userId?: mongoose.Types.ObjectId | null;
  rating: 1 | -1;
  message: string;
  response: string;
  topics: string[];
}

const ChatFeedbackSchema = new Schema<IChatFeedback>(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    rating: {
      type: Number,
      enum: [1, -1],
      required: true,
    },
    message: { type: String, required: true },
    response: { type: String, required: true },
    topics: [{ type: String }],
  },
  {
    timestamps: true,
  },
);

ChatFeedbackSchema.index({ userId: 1, createdAt: -1 });

const ChatFeedback =
  mongoose.models.ChatFeedback ||
  mongoose.model<IChatFeedback>("ChatFeedback", ChatFeedbackSchema, "chatFeedback");
export default ChatFeedback;
