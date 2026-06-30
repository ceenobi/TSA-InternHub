import {
  RiCheckLine,
  RiExternalLinkLine,
  RiRefreshLine,
  RiTimeLine,
} from "@remixicon/react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import Paginate from "~/components/ui/paginate";
import { Separator } from "~/components/ui/separator";
import usePaginate from "~/hooks/usePaginate";
import type { SubmissionData, UserData } from "~/types";

type Props = {
  submissions: {
    submissions: SubmissionData[];
    meta: {
      currentPage: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
  user: UserData;
};

function getSubmissionStatusColor(status: string) {
  switch (status) {
    case "submitted":
      return "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-300 dark:bg-blue-100 dark:text-blue-800";
    case "graded":
      return "border-green-600 bg-green-50 text-green-700 dark:border-green-300 dark:bg-green-100 dark:text-green-800";
    case "returned":
      return "border-amber-600 bg-amber-50 text-amber-700 dark:border-amber-300 dark:bg-amber-100 dark:text-amber-800";
    default:
      return "border-gray-600 bg-gray-50 text-gray-700 dark:border-gray-300 dark:bg-gray-100 dark:text-gray-800";
  }
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SubmissionList({ submissions, user }: Props) {
  const { submissions: items, meta } = submissions;
  const pagination = usePaginate(meta);

  return (
    <div>
      <div className="space-y-3">
        {items.map((submission) => (
          <SubmissionCard key={submission._id} submission={submission} />
        ))}
      </div>

      {meta.totalPages > 1 && (
        <Paginate
          totalPages={pagination.totalPages}
          hasMore={pagination.hasMore}
          handlePageChange={pagination.handlePageChange}
          onLimitChange={pagination.handleLimitChange}
          currentPage={pagination.currentPage}
          limit={pagination.limit}
        />
      )}
    </div>
  );
}

function SubmissionCard({ submission }: { submission: SubmissionData }) {
  const [expanded, setExpanded] = useState(false);
  const task = submission.task as unknown as
    | { _id: string; title: string; maxScore: number }
    | undefined;

  const needsTruncation = (submission.content?.length ?? 0) > 200;

  return (
    <Card size="sm" className="rounded-sm dark:bg-muted/30">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold">
              {task?.title ?? "Unknown Task"}
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Attempt #{submission.attemptNumber}</span>
              <span>·</span>
              <span>{formatDate(submission.submittedAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {submission.isLate && (
              <Badge variant="destructive" className="text-[10px]">
                Late
              </Badge>
            )}
            <Badge
              className={getSubmissionStatusColor(submission.status)}
              variant="outline"
            >
              {submission.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <div className="mx-4 border-t border-border" />

      <CardContent className="space-y-3 pt-4">
        {submission.content && (
          <div>
            <p
              className={`text-sm text-muted-foreground whitespace-pre-wrap ${
                !expanded && needsTruncation ? "line-clamp-3" : ""
              }`}
            >
              {submission.content}
            </p>
            {needsTruncation && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-mainBlue dark:text-mainGold mt-1 hover:underline"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        {submission.fileUrls && submission.fileUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {submission.fileUrls.map((file, i) => (
              <a
                key={i}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-mainBlue/50 transition-colors"
              >
                {file.name || "Link"}
                <RiExternalLinkLine size={12} />
              </a>
            ))}
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {submission.status === "graded" ? (
              <div className="flex items-center gap-2">
                <RiCheckLine size={16} className="text-green-600" />
                <span className="text-sm font-medium">
                  {submission.score}/{submission.maxScore}
                </span>
                {submission.percentage !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    ({submission.percentage.toFixed(1)}%)
                  </span>
                )}
              </div>
            ) : submission.status === "returned" ? (
              <div className="flex items-center gap-2">
                <RiRefreshLine size={16} className="text-amber-600" />
                <span className="text-sm font-medium">
                  {submission.score}/{submission.maxScore}
                </span>
                {submission.percentage !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    ({submission.percentage.toFixed(1)}%)
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <RiTimeLine size={16} className="text-blue-600" />
                <span className="text-sm text-muted-foreground">
                  Awaiting review
                </span>
              </div>
            )}
          </div>

          {submission.latePenalty > 0 && (
            <span className="text-xs text-destructive">
              -{submission.latePenalty}% penalty
            </span>
          )}
        </div>

        {submission.feedback && (
          <div className="rounded-md bg-muted/50 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">
              Feedback{submission.gradedBy ? ` from ${(submission.gradedBy as unknown as { name: string })?.name ?? "reviewer"}` : ""}
            </p>
            <p className="text-sm">{submission.feedback}</p>
          </div>
        )}

        {submission.gradedAt && (
          <p className="text-xs text-muted-foreground">
            Graded on {formatDate(submission.gradedAt)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
