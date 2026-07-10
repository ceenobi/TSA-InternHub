import { z } from "zod";
import { auth } from "~/.server/services/better-auth";
import logger from "~/.server/config/logger";
import type { Route } from "./+types/api.chat.feedback";

const FeedbackSchema = z.object({
  rating: z.union([z.literal(1), z.literal(-1)]),
  message: z.string().min(1).max(4000),
  response: z.string().min(1).max(8000),
  topics: z.array(z.string()).optional().default([]),
});

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ message: "Method not allowed" }, { status: 405 });
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const parsed = FeedbackSchema.safeParse(data);
    if (!parsed.success) {
      return Response.json({ success: false, message: "Invalid feedback data" }, { status: 400 });
    }

    const ChatFeedback = (await import("~/.server/model/chatFeedback")).default;
    await ChatFeedback.create({
      userId: session.user.id,
      rating: parsed.data.rating,
      message: parsed.data.message,
      response: parsed.data.response,
      topics: parsed.data.topics,
    });

    return Response.json({ success: true });
  } catch (error) {
    logger.error(error, "Failed to save chat feedback");
    return Response.json({ success: false, message: "Failed to save feedback" }, { status: 500 });
  }
}
