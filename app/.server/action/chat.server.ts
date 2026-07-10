import { createTicketSchema } from "~/lib/schemaValidation";
import { generateTicketId } from "~/lib/utils";
import { helpdeskKnowledgeBase } from "~/lib/knowledge-base";
import type { CreateTicketSchemaType } from "~/types";
import { env } from "~/.server/config/keys";
import { auth } from "~/.server/services/better-auth";
import { invalidateCache } from "~/.server/utils/cache";
import logger from "~/.server/config/logger";

export type ChatMessage = {
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls?: { id: string; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
};

function getRelevantArticles(query: string, maxCount = 3) {
  const q = query.toLowerCase();
  const scored = helpdeskKnowledgeBase.map((article) => {
    let score = 0;
    if (article.title.toLowerCase().includes(q)) score += 10;
    if (article.keywords.some((k) => k.toLowerCase().includes(q))) score += 5;
    if (article.content.toLowerCase().includes(q)) score += 2;
    return { article, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCount)
    .map((s) => s.article);
}

function needsScoreContext(query: string) {
  const scoreKeywords = [
    "score", "scores", "grade", "grading", "graded",
    "performance", "average", "rank", "ranking", "leaderboard",
    "progress", "stats", "statistics", "how am i doing",
    "my score", "my grade", "my progress",
    "improve", "improvement", "better", "weak", "weakness",
    "resource", "study", "learn", "tip", "advice", "help",
    "feedback", "trend", "pass", "fail", "failed", "returned",
    "submission", "resubmit", "resubmission",
  ];
  const q = query.toLowerCase();
  return scoreKeywords.some((k) => q.includes(k));
}

function buildSystemPrompt(
  userName: string,
  userRole: string,
  userProgram: string | undefined,
  articles: ReturnType<typeof getRelevantArticles>,
  scoreContext: string | null,
  history?: { ratings?: number; recentTopics: string[] },
) {
  let prompt = `You are a helpful AI assistant for TSA InternHub, a platform that manages internship tasks, submissions, grading, and project tracking.

You are talking to ${userName}${userRole !== "user" ? ` (${userRole})` : ""}${userProgram ? ` from the ${userProgram} program` : ""}.

### Quality Standards (MANDATORY)
- Use correct spelling, grammar, and capitalization in every response.
- Proofread your response before sending. Fix typos, missing words, and awkward phrasing.
- Be concise but complete — don't cut off mid-sentence.
- Use proper punctuation and sentence structure.
- Format with markdown: **bold** for emphasis, bullet points for lists, code blocks for technical content.

### Guidelines
- Answer platform questions using the knowledge base articles provided below.
- For general questions, use your own knowledge.
- Be concise, friendly, and helpful. Use a warm, conversational tone.
- When relevant, suggest next steps or related features the user might want to explore.
- A user whose role is ${userRole === "user"} can be referred to as Intern or student.
- If you don't know something about the platform, be honest and suggest the Knowledge Base or support.

`;

  if (history && history.recentTopics.length > 0) {
    prompt += `### Previous Conversation Topics\n${history.recentTopics.map((t) => `- ${t}`).join("\n")}\n\n`;
    if (history.ratings !== undefined) {
      const qualityNote = history.ratings < 2
        ? "The user has not been satisfied with recent responses. Be extra careful with accuracy and clarity."
        : "";
      if (qualityNote) prompt += `${qualityNote}\n\n`;
    }
  }

  if (articles.length > 0) {
    prompt += "## Relevant Knowledge Base Articles\n\n";
    for (const article of articles) {
      prompt += `### ${article.title}\n${article.content}\n\n`;
    }
  }

  if (scoreContext) {
    prompt += `## User's Current Performance\n\n${scoreContext}\n\n`;

    prompt += `### How to Use Performance Data

When performance data is available, you should:
1. **Analyze their scores** — identify which stages they passed and which they struggled with
2. **Point out areas needing improvement** — stages below the pass percentage need attention
3. **Give actionable advice** — review grader feedback, resubmit returned tasks, read task instructions/resources
4. **Suggest resources** — recommend relevant Knowledge Base articles like "Understanding Your Scores", "How Grading Works", "Stage Progression & Unlocking"
5. **Encourage next steps** — submit pending tasks, unlock next stages, check the scoreboard for motivation
6. **Track trends** — mention if their scores are improving or declining over time

Keep recommendations specific to their actual data. Don't give generic advice — use their stage scores, submission status, and trends.

`;
  }

  prompt += `## Creating Support Tickets

If the user reports an issue, bug, or requests help, you can create a support ticket on their behalf using the \`create_ticket\` tool. Collect all necessary information from the user before creating the ticket:
- **title** (required): Short summary of the issue
- **description** (required): Detailed explanation
- **category** (required): One of: account, security, task, other
- **priority** (optional): low, medium, high, critical (default: low)

Do NOT ask if they want to create a ticket — if they describe an issue, just gather the needed details and create it. Inform the user once the ticket is created with the ticket ID.
`;

  return prompt;
}

async function fetchUserScoreContext(request: Request): Promise<string | null> {
  try {
    const { getTaskStatsForUser } = await import("~/.server/action/task");
    const response = await getTaskStatsForUser(request);
    const data = await response.json();
    if (!data.success) return null;

    const body = data.body;
    const summary = body?.summary;
    if (!summary) return null;

    const lines: string[] = [];

    lines.push("### Summary");
    lines.push(`- Tasks completed: ${summary.tasksCompleted} / ${summary.totalTasks}`);
    lines.push(`- Average score: ${summary.averageScore}%`);
    lines.push(`- On-time rate: ${summary.onTimeRate}%`);
    lines.push(`- Stage progress: ${summary.stageProgress}%`);

    const breakDown = body?.stageBreakdown;
    if (Array.isArray(breakDown) && breakDown.length > 0) {
      lines.push("");
      lines.push("### Stage Breakdown");
      for (const stage of breakDown) {
        const pct = stage.percentage ?? 0;
        const needPct = stage.passPercentage ?? 70;
        if (stage.passed) {
          lines.push(`- Stage ${stage.order} "${stage.stageTitle}" — ${pct}% ✅ Passed`);
        } else if (stage.status === "in_progress" || stage.status === "active") {
          lines.push(`- Stage ${stage.order} "${stage.stageTitle}" — ${pct}% ⏳ In Progress (need ${needPct}%)`);
        } else if (stage.status !== "locked") {
          lines.push(`- Stage ${stage.order} "${stage.stageTitle}" — ${pct}% ❌ Failed (need ${needPct}%)`);
        }
      }

      const passedCount = breakDown.filter((s: any) => s.passed).length;
      const failedCount = breakDown.filter((s: any) => !s.passed && s.status !== "locked").length;
      lines.push(`- Stages passed: ${passedCount}, failed: ${failedCount}`);
    }

    const subSummary = body?.submissionSummary;
    if (Array.isArray(subSummary)) {
      lines.push("");
      lines.push("### Submissions");
      for (const s of subSummary) {
        if (s.value > 0) lines.push(`- ${s.name}: ${s.value}`);
      }
    }

    const weakestStages = Array.isArray(breakDown)
      ? breakDown.filter((s: any) => !s.passed && s.status !== "locked")
      : [];
    if (weakestStages.length > 0) {
      lines.push("");
      lines.push("### Areas for Improvement");
      for (const stage of weakestStages) {
        const needPct = stage.passPercentage ?? 70;
        lines.push(`- Stage ${stage.order} "${stage.stageTitle}": ${stage.percentage ?? 0}% (need ${needPct}% to pass)`);
        lines.push(`  Suggested: Review task instructions/resources for this stage, check grader feedback on submissions, and resubmit if attempts remain.`);
      }
    }

    return lines.join("\n");
  } catch (error) {
    logger.error(error, "Failed to fetch user score context for chatbot");
    return null;
  }
}

function createZenTransformStream() {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        const payload = trimmed.slice(6);
        if (payload === "[DONE]") continue;

        try {
          const json = JSON.parse(payload);
          const content = json.choices?.[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
            );
          }
        } catch {
          // skip malformed chunks
        }
      }
    },
  });
}

async function fetchUserFeedbackContext(
  userId: string,
  maxItems = 10,
): Promise<{ ratings: number | undefined; recentTopics: string[] }> {
  try {
    const ChatFeedback = (await import("~/.server/model/chatFeedback")).default;
    const feedbacks = await ChatFeedback.find({ userId })
      .sort({ createdAt: -1 })
      .limit(maxItems)
      .lean();

    if (feedbacks.length === 0) {
      return { ratings: undefined, recentTopics: [] };
    }

    const ratings = feedbacks.reduce((sum, f) => sum + f.rating, 0);
    const topicSet = new Set<string>();
    for (const f of feedbacks) {
      for (const t of f.topics || []) {
        topicSet.add(t);
      }
    }

    return {
      ratings,
      recentTopics: Array.from(topicSet).slice(0, 5),
    };
  } catch {
    return { ratings: undefined, recentTopics: [] };
  }
}

async function prepareChatContext(
  request: Request,
  messages: ChatMessage[],
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return { error: Response.json({ success: false, message: "Unauthorized" }, { status: 401 }) };
  }

  const user = session.user;
  const latestMessage = messages.filter((m) => m.role === "user").pop();
  const query = latestMessage?.content || "";

  const articles = getRelevantArticles(query);

  let scoreContext: string | null = null;
  if (needsScoreContext(query)) {
    scoreContext = await fetchUserScoreContext(request);
  }

  const feedbackContext = await fetchUserFeedbackContext(user.id);

  const systemPrompt = buildSystemPrompt(
    user.name || "User",
    user.role || "user",
    user.program ?? undefined,
    articles,
    scoreContext,
    feedbackContext,
  );

  const apiMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.slice(-10),
  ];

  return { apiMessages };
}

const createTicketTool = {
  type: "function" as const,
  function: {
    name: "create_ticket",
    description: "Create a support ticket for the user when they report an issue or request help",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short summary of the issue (min 3 characters)" },
        description: { type: "string", description: "Detailed description of the issue (min 10 characters)" },
        category: { type: "string", enum: ["account", "security", "task", "other"], description: "Category of the issue" },
        priority: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Priority level (default: low)" },
      },
      required: ["title", "description", "category"],
    },
  },
};

async function callZenApi(
  apiMessages: { role: string; content: string }[],
  stream: boolean,
  tools?: typeof createTicketTool[],
) {
  const body: Record<string, unknown> = {
    model: "deepseek-v4-flash-free",
    messages: apiMessages,
    max_tokens: 4096,
    temperature: 0.7,
    stream,
  };
  if (tools) body.tools = tools;

  return fetch("https://opencode.ai/zen/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openCodeZenApiKey}`,
    },
    body: JSON.stringify(body),
  });
}

async function executeCreateTicket(
  request: Request,
  args: Record<string, unknown>,
): Promise<{ success: boolean; message: string; ticketId?: string }> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { success: false, message: "You must be logged in to create a ticket." };

  const { cohort, program, id: userId } = session.user;
  const parsed = createTicketSchema.safeParse({
    title: args.title,
    description: args.description,
    category: args.category || "other",
    priority: args.priority || "low",
  });
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message).join(" ");
    return { success: false, message: `Validation failed: ${issues}` };
  }

  try {
    const Ticket = (await import("~/.server/model/ticket")).default;
    const ticket = await Ticket.create({
      ...parsed.data,
      userId,
      ticketId: generateTicketId(),
    });
    await invalidateCache(`tickets:pg${program}*`);

    const { AuditLogService } = await import("~/.server/services/auditlog.service");
    await AuditLogService.record(request, {
      action: "SUPPORT_TICKET",
      category: "support",
      description: `[Chatbot] Created ticket "${parsed.data.title}" - (${program})`,
      details: { ticketId: ticket.ticketId.toString(), cohort, program },
    });

    const { workflowClient } = await import("~/.server/workflows/client");
    await workflowClient.trigger({
      url: `${env.clientUrl}/api/v1/workflow/ticket-confirmation`,
      body: {
        userId,
        ticketId: ticket.ticketId,
        title: parsed.data.title,
        description: parsed.data.description || "",
        priority: parsed.data.priority,
      },
    });

    const { NotificationService } = await import("~/.server/services/notification.service");
    NotificationService.send({
      userId,
      type: "ticket_created",
      title: "Ticket Created",
      message: `Your ticket "${parsed.data.title}" has been created via the AI assistant.`,
      metadata: { ticketId: ticket.ticketId },
    });

    return { success: true, message: "Ticket created successfully", ticketId: ticket.ticketId };
  } catch (error) {
    logger.error(error, "Failed to create ticket from chatbot");
    return { success: false, message: "Failed to create ticket due to a server error. Please try again later." };
  }
}

export async function handleTicketChat(request: Request, messages: ChatMessage[]) {
  const ctx = await prepareChatContext(request, messages);
  if ("error" in ctx) return ctx.error;

  try {
    const response = await callZenApi(ctx.apiMessages, false, [createTicketTool]);
    if (!response.ok) {
      const errorBody = await response.text();
      logger.error({ status: response.status, body: errorBody }, "Zen API tool call error");
      return Response.json({ success: false, message: "AI service error. Please try again." }, { status: 502 });
    }

    const data = await response.json();
    const choice = data.choices?.[0]?.message;
    const toolCalls = choice?.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      const toolCall = toolCalls[0];
      if (toolCall.function.name === "create_ticket") {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await executeCreateTicket(request, args);

        const followUpMessages = [
          ...ctx.apiMessages,
          { role: "assistant" as const, content: null as unknown as string, tool_calls: toolCalls },
          {
            role: "tool" as const,
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          },
        ];

        const followUp = await callZenApi(followUpMessages, false);
        if (followUp.ok) {
          const followUpData = await followUp.json();
          const reply = followUpData.choices?.[0]?.message?.content || "";
          return Response.json({ success: true, reply, ticketCreated: result.success, ticketId: result.ticketId });
        }
      }
    }

    const reply = choice?.content || "";
    return Response.json({ success: true, reply });
  } catch (error) {
    logger.error(error, "Ticket chat handler failed");
    return Response.json({ success: false, message: "Failed to process your request. Please try again." }, { status: 500 });
  }
}

export async function handleChat(request: Request, messages: ChatMessage[]) {
  const ctx = await prepareChatContext(request, messages);
  if ("error" in ctx) return ctx.error;

  try {
    const response = await callZenApi(ctx.apiMessages, false);

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error({ status: response.status, body: errorBody }, "Zen API error");
      return Response.json(
        { success: false, message: "AI service error. Please try again later." },
        { status: 502 },
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";

    return Response.json({ success: true, reply });
  } catch (error) {
    logger.error(error, "Chat API call failed");
    return Response.json(
      { success: false, message: "Failed to get response. Please try again." },
      { status: 500 },
    );
  }
}

export async function handleChatStream(
  request: Request,
  messages: ChatMessage[],
) {
  const ctx = await prepareChatContext(request, messages);
  if ("error" in ctx) return ctx.error;

  try {
    const response = await callZenApi(ctx.apiMessages, true);

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error({ status: response.status, body: errorBody }, "Zen API stream error");
      return Response.json(
        { success: false, message: "AI service error. Please try again later." },
        { status: 502 },
      );
    }

    const stream = response.body!.pipeThrough(createZenTransformStream());

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    logger.error(error, "Chat stream call failed");
    return Response.json(
      { success: false, message: "Failed to get response. Please try again." },
      { status: 500 },
    );
  }
}
