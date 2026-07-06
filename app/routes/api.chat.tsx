import { z } from "zod";
import { checkRateLimit } from "~/.server/utils/rate-limit";
import { handleChat, handleChatStream, handleTicketChat } from "~/.server/action/chat.server";
import type { Route } from "./+types/api.chat";

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(50),
  stream: z.boolean().optional().default(false),
});

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ message: "Method not allowed" }, { status: 405 });
  }

  await checkRateLimit(request, "strict");

  try {
    const data = await request.json();
    const result = ChatRequestSchema.safeParse(data);
    if (!result.success) {
      return Response.json(
        {
          success: false,
          message: "Invalid request",
          errors: z.treeifyError(result.error),
        },
        { status: 400 },
      );
    }

    const lastMessage = result.data.messages.filter((m) => m.role === "user").pop()?.content || "";
    const isTicketIntent = /\b(?:ticket|issue|bug|problem|broken|not working|error|help|support)\b/i.test(lastMessage) && /(?:create|open|submit|file|report|make|raise|cannot|can't|unable)/i.test(lastMessage);

    if (isTicketIntent) {
      return handleTicketChat(request, result.data.messages);
    }

    if (result.data.stream) {
      return handleChatStream(request, result.data.messages);
    }

    return handleChat(request, result.data.messages);
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return Response.json(
      {
        success: false,
        message: "Invalid JSON payload",
      },
      { status: 400 },
    );
  }
}
