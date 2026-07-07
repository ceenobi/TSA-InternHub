import {
  RiCheckLine,
  RiCloseLine,
  RiExternalLinkLine,
  RiRefreshLine,
} from "@remixicon/react";
import { dehydrate } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { getOptimizedImageUrl } from "~/lib/cloudinary";
import { Await, useFetcher } from "react-router";
import { gradeTask } from "~/.server/action/grade";
import ActionButton from "~/components/ui/action-button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import DataError from "~/components/ui/data-error";
import NotFound from "~/components/ui/not-found";
import { CardListSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { formatDate, getInitials } from "~/lib/utils";
import { requirePermission } from "~/middleware/auth.middleware";
import { getGradeTaskQuery } from "~/queries/tasks.server";
import type { Route } from "../_dashboard.admin-tasks.$taskId.grade/+types/route";

export const middleware = [requirePermission("MANAGE_TASKS")];

export function meta({}: Route.MetaArgs) {
  return [{ title: "Grade Task | TSA InternHub" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { taskId } = params;
  const queryClient = getQueryClientRsc();
  const gradeData = queryClient.ensureQueryData(
    getGradeTaskQuery(request, taskId),
  );
  return {
    dehydratedState: dehydrate(queryClient),
    gradeData,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  if (payload.intent === "grade") {
    return gradeTask(request, payload);
  }
}

const statusColors: Record<string, string> = {
  submitted: "bg-blue-500",
  graded: "bg-green-500",
  returned: "bg-destructive",
};

export default function GradeTask({ loaderData }: Route.ComponentProps) {
  const { gradeData } = loaderData;
  const fetcher = useFetcher();

  return (
    <Suspense fallback={<CardListSkeleton count={3} />}>
      <Await resolve={gradeData} errorElement={<DataError />}>
        {(data) => {
          if (!data)
            return (
              <NotFound
                title="Task not found"
                message="This task may have been deleted."
              />
            );
          return <GradeTaskInner data={data} fetcher={fetcher} />;
        }}
      </Await>
    </Suspense>
  );
}

type GradeFetcherData = { success: boolean; message: string } | undefined;

function GradeTaskInner({
  data,
  fetcher,
}: {
  data: import("~/types").GradeTaskData;
  fetcher: ReturnType<typeof useFetcher>;
}) {
  const { task, stage, submissions } = data;
  const actionData = fetcher.data as GradeFetcherData;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [scoreValues, setScoreValues] = useState<Record<string, string>>({});
  const [feedbackValues, setFeedbackValues] = useState<Record<string, string>>(
    {},
  );

  const isSubmitting = fetcher.state !== "idle";
  let status: "graded" | "returned" | undefined;

  const handleGrade = (submissionId: string, status: "graded" | "returned") => {
    const score = scoreValues[submissionId];
    if (!score || isNaN(Number(score))) return;

    fetcher.submit(
      {
        intent: "grade",
        submissionId,
        score: Number(score),
        feedback: feedbackValues[submissionId] || "",
        status,
      },
      { method: "post", encType: "application/json" },
    );
    setEditingId(null);
  };

  const openEdit = (submission: (typeof submissions)[0]) => {
    setEditingId(submission._id);
    setScoreValues((prev) => ({
      ...prev,
      [submission._id]: submission.score?.toString() ?? "",
    }));
    setFeedbackValues((prev) => ({
      ...prev,
      [submission._id]: submission.feedback ?? "",
    }));
  };

  return (
    <>
      <Card className="rounded-sm mb-8 dark:bg-muted/30">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{task.title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Stage {stage.order}: {stage.title}
              </p>
            </div>
            <Badge variant={task.isBonus ? "secondary" : "default"}>
              {task.maxScore} pts · {task.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && <p className="text-sm">{task.description}</p>}
          {task.instructions && (
            <div>
              <h4 className="text-sm font-medium mb-1">Instructions</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {task.instructions}
              </p>
            </div>
          )}
          {task.resources && task.resources.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {task.resources.map(
                (r: { name: string; url: string }, i: number) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-mainBlue dark:text-darkBlue bg-mainBlue/5 dark:bg-darkBlue/5 px-2 py-0.5 rounded-sm"
                  >
                    <RiExternalLinkLine size={12} />
                    {r.name}
                  </a>
                ),
              )}
            </div>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            {task.dueDate && <span>Due: {formatDate(task.dueDate)}</span>}
            {task.maxAttempts > 0 && (
              <span>Max attempts: {task.maxAttempts}</span>
            )}
            <span>Passmark: {stage.passPercentage}%</span>
          </div>
        </CardContent>
      </Card>

      {actionData && !actionData.success && (
        <div className="mb-6 rounded-sm border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {actionData.message || "Failed to grade submission"}
        </div>
      )}

      <div className="space-y-4">
        {submissions.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No submissions yet.
          </p>
        ) : (
          submissions.map((submission, index) => (
            <Card
              key={submission._id}
              className="rounded-sm bg-background dark:bg-muted/30 hover:border-mainBlue/30 dark:hover:border-darkBlue/40 group relative transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="lg"
                      className="size-12 ring-2 ring-border group-hover:ring-mainBlue/30 dark:group-hover:ring-darkBlue/40 transition-all"
                    >
                      <AvatarImage
                        src={getOptimizedImageUrl(submission.user.image, 48)}
                        alt={submission.user.name}
                      />
                      <AvatarFallback className="bg-mainBlue/10 dark:bg-darkBlue/20 text-mainBlue dark:text-darkBlue font-semibold text-sm">
                        {getInitials(submission.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {submission.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Attempt {submission.attemptNumber} ·{" "}
                        {formatDate(submission.submittedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {submission.isLate && (
                      <Badge variant="destructive">Late</Badge>
                    )}
                    <Badge className={statusColors[submission.status]}>
                      {submission.status}
                    </Badge>
                  </div>
                </div>

                {submission.content && (
                  <div className="mb-3">
                    <p className="text-sm whitespace-pre-wrap line-clamp-4">
                      {submission.content}
                    </p>
                  </div>
                )}

                {submission.fileUrls && submission.fileUrls.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {submission.fileUrls.map(
                      (f: { name: string; url: string }, i: number) => (
                        <a
                          key={i}
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-mainBlue dark:text-darkBlue bg-mainBlue/5 dark:bg-darkBlue/5 px-2 py-0.5 rounded-sm"
                        >
                          <RiExternalLinkLine size={12} />
                          {f.name || f.url}
                        </a>
                      ),
                    )}
                  </div>
                )}

                {/* Read-only display for graded/returned */}
                {(submission.status === "graded" ||
                  submission.status === "returned") &&
                  editingId !== submission._id && (
                    <div className="rounded-sm bg-muted/50 px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Score: {submission.score}/{submission.maxScore}
                          <span className="text-muted-foreground ml-1">
                            ({submission.percentage}%)
                          </span>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(submission)}
                          className="rounded-sm bg-mainBlue text-white dark:bg-mainGold/20 border dark:border-mainGold hover:bg-mainBlue/90 hover:dark:bg-mainGold/30 hover:text-white"
                        >
                          Re-grade
                        </Button>
                      </div>
                      {submission.feedback && (
                        <p className="text-sm text-muted-foreground">
                          {submission.feedback}
                        </p>
                      )}
                      {submission.gradedAt && (
                        <p className="text-xs text-muted-foreground">
                          Graded on {formatDate(submission.gradedAt)}
                        </p>
                      )}
                    </div>
                  )}

                {/* Inline grading form */}
                {(submission.status === "submitted" ||
                  editingId === submission._id) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium min-w-16">
                        Score
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={submission.maxScore}
                        value={scoreValues[submission._id] ?? ""}
                        onChange={(e) =>
                          setScoreValues((prev) => ({
                            ...prev,
                            [submission._id]: e.target.value,
                          }))
                        }
                        placeholder={`0 - ${submission.maxScore}`}
                        className="w-32 rounded-sm border border-border bg-background/30 px-3 py-1.5 text-sm outline-none focus:border-mainBlue dark:focus:border-darkBlue"
                      />
                      <span className="text-xs text-muted-foreground">
                        / {submission.maxScore}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <label className="text-sm font-medium min-w-16 pt-1.5">
                        Feedback
                      </label>
                      <textarea
                        value={feedbackValues[submission._id] ?? ""}
                        onChange={(e) =>
                          setFeedbackValues((prev) => ({
                            ...prev,
                            [submission._id]: e.target.value,
                          }))
                        }
                        placeholder="Optional feedback..."
                        rows={3}
                        className="flex-1 rounded-sm border border-border bg-background/30 px-3 py-1.5 text-sm outline-none focus:border-mainBlue dark:focus:border-darkBlue resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      {editingId === submission._id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          <RiCloseLine size={16} className="mr-1" />
                          Cancel
                        </Button>
                      )}
                      <ActionButton
                        text={
                          <>
                            <RiRefreshLine size={14} />
                            Return
                          </>
                        }
                        loading={isSubmitting || status === "returned"}
                        onClick={() => handleGrade(submission._id, "returned")}
                        variant="outline"
                      />
                      <ActionButton
                        text={
                          <>
                            <RiCheckLine size={14} />
                            Grade
                          </>
                        }
                        loading={isSubmitting || status === "graded"}
                        onClick={() => handleGrade(submission._id, "graded")}
                        variant="default"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
