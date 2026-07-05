import logger from "~/.server/config/logger";
import type { IntegrationEvent } from "~/.server/model/integration";
import { githubClient } from "./github";
import { googleCalendarClient } from "./google-calendar";
import { googleDocsClient } from "./google-docs";
import { notionClient } from "./notion";
import { slackClient } from "./slack";
import { zoomClient } from "./zoom";

type EventPayload = {
  cohortId: string;
  [key: string]: any;
};

const eventHandlers: Record<
  IntegrationEvent,
  (payload: EventPayload) => Promise<void>[]
> = {
  submission_graded: (p) => [
    slackClient.sendMessage(
      p.cohortId,
      "submission_graded",
      `📝 *Submission Graded*\n${p.userName || "A user"} scored ${p.score}/${p.maxScore} on "${p.taskTitle}".`,
    ),
    githubClient.updateCommitStatus(
      {
        cohortId: p.cohortId,
        repoUrl: p.repoUrl,
        score: p.score,
        maxScore: p.maxScore,
        taskTitle: p.taskTitle,
      },
      "submission_graded",
    ),
    googleDocsClient.addCommentToDoc(p),
  ],
  stage_completed: (p) => [
    slackClient.sendMessage(
      p.cohortId,
      "stage_completed",
      `🎉 *Stage Completed*\n${p.userName || "A user"} completed stage "${p.stageTitle}" with ${p.percentage}%.`,
    ),
  ],
  stage_failed: (p) => [
    slackClient.sendMessage(
      p.cohortId,
      "stage_failed",
      `⚠️ *Stage Failed*\n${p.userName || "A user"} did not meet the pass mark for "${p.stageTitle}".`,
    ),
  ],
  project_started: (p) => [
    slackClient.sendMessage(
      p.cohortId,
      "project_started",
      `🚀 *Project Started*\nThe project "${p.projectTitle}" is now active.`,
    ),
    googleCalendarClient.createProjectEvent(p as any),
    zoomClient.createProjectMeeting(p as any),
    notionClient.syncProjectToNotion(p as any),
  ],
  project_completed: (p) => [
    slackClient.sendMessage(
      p.cohortId,
      "project_completed",
      `✅ *Project Completed*\nThe project "${p.projectTitle}" has been marked as complete.`,
    ),
    googleCalendarClient.updateProjectEvent(p as any),
  ],
  task_overdue: (p) => [
    slackClient.sendMessage(
      p.cohortId,
      "task_overdue",
      `⏰ *Task Overdue*\n"${p.taskTitle}" is now overdue for ${p.userName || "a user"}.`,
    ),
  ],
  ticket_assigned: (p) => [
    slackClient.sendMessage(
      p.cohortId,
      "ticket_assigned",
      `🎫 *Ticket Assigned*\n"${p.ticketTitle}" has been assigned to ${p.assigneeName || "an admin"}.`,
    ),
  ],
  ticket_resolved: (p) => [
    slackClient.sendMessage(
      p.cohortId,
      "ticket_resolved",
      `✅ *Ticket Resolved*\n"${p.ticketTitle}" has been resolved.`,
    ),
  ],
  ticket_created: () => [],
};

/**
 * Fire integration actions for a given event.
 * All calls are fire-and-forget — errors are logged, never thrown.
 */
export async function dispatchIntegrationEvent(
  event: IntegrationEvent,
  payload: EventPayload,
): Promise<void> {
  const handlers = eventHandlers[event];
  if (!handlers) return;

  await Promise.allSettled(
    handlers(payload).map((p) =>
      p.catch((err: any) =>
        logger.error({ err, event }, `Integration handler failed for ${event}`),
      ),
    ),
  );
}
