import { helpdeskKnowledgeBase } from "~/lib/knowledge-base";
import { env } from "~/.server/config/keys";
import { auth } from "~/.server/services/better-auth";
import logger from "~/.server/config/logger";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
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
) {
  let prompt = `You are a helpful AI assistant for TSA InternHub, a platform that manages internship tasks, submissions, grading, and project tracking.

You are talking to ${userName}${userRole !== "user" ? ` (${userRole})` : ""}${userProgram ? ` from the ${userProgram} program` : ""}.

Guidelines:
- Answer questions about the TSA InternHub platform using the knowledge base articles provided below.
- For general questions (non-platform), use your own knowledge.
- Be concise, friendly, and helpful.
- When relevant, suggest next steps or related features the user might want to explore.
- A user whose role is ${userRole === "user"} can be referred to as Intern or student from the chat.
- Format responses using markdown where appropriate (bold for emphasis, bullet points for lists, etc.).

`;

  if (articles.length > 0) {
    prompt += "## Relevant Knowledge Base Articles\n\n";
    for (const article of articles) {
      prompt += `### ${article.title}\n${article.content}\n\n`;
    }
  }

  if (scoreContext) {
    prompt += `## User's Current Performance\n\n${scoreContext}\n\n`;
  }

  prompt += `If the user asks something you don't know about the platform, be honest and suggest they check the Knowledge Base or contact support.`;

  return prompt;
}

async function fetchUserScoreContext(request: Request): Promise<string | null> {
  try {
    const { getTaskStatsForUser } = await import("~/.server/action/task");
    const response = await getTaskStatsForUser(request);
    const data = await response.json();
    if (!data.success) return null;

    const summary = data.body?.summary;
    if (!summary) return null;

    const lines: string[] = [];
    lines.push(`- Tasks completed: ${summary.tasksCompleted} / ${summary.totalTasks}`);
    lines.push(`- Average score: ${summary.averageScore}%`);
    lines.push(`- On-time rate: ${summary.onTimeRate}%`);
    lines.push(`- Stage progress: ${summary.stageProgress}%`);

    const breakDown = data.body?.stageBreakdown;
    if (Array.isArray(breakDown) && breakDown.length > 0) {
      const passed = breakDown.filter((s: any) => s.passed).length;
      const failed = breakDown.filter((s: any) => !s.passed && s.status !== "locked").length;
      lines.push(`- Stages passed: ${passed}, failed: ${failed}`);
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

  const systemPrompt = buildSystemPrompt(
    user.name || "User",
    user.role || "user",
    user.program ?? undefined,
    articles,
    scoreContext,
  );

  const apiMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.slice(-10),
  ];

  return { apiMessages };
}

async function callZenApi(
  apiMessages: { role: string; content: string }[],
  stream: boolean,
) {
  return fetch("https://opencode.ai/zen/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openCodeZenApiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-v4-flash-free",
      messages: apiMessages,
      max_tokens: 2048,
      stream,
    }),
  });
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
