import logger from "~/.server/config/logger";
import type { IntegrationEvent } from "~/.server/model/integration";
import Integration from "~/.server/model/integration";
import { fetchWithCache } from "~/.server/utils/cache";

/**
 * Parse a GitHub repo URL into owner and repo name.
 * Supports:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   https://github.com/owner/repo/tree/branch
 * Returns null if the URL is not a valid GitHub repo URL.
 */
function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname
      .replace(/\.git$/, "")
      .split("/")
      .filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

/**
 * Get the latest commit SHA on the default branch of a GitHub repo.
 */
async function getLatestCommitSha(
  token: string,
  owner: string,
  repo: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "InternsPortal",
        },
      },
    );
    if (!res.ok) {
      logger.error(
        { status: res.status, owner, repo },
        "GitHub API: failed to fetch latest commit",
      );
      return null;
    }
    const data: any[] = await res.json();
    return data[0]?.sha || null;
  } catch (error) {
    logger.error(error, "GitHub API: error fetching latest commit");
    return null;
  }
}

/**
 * Set a commit status on a GitHub commit.
 * State can be: "success" | "failure" | "pending" | "error"
 */
async function setCommitStatus(
  token: string,
  owner: string,
  repo: string,
  sha: string,
  state: "success" | "failure" | "pending" | "error",
  description: string,
  targetUrl?: string,
) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/statuses/${sha}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "InternsPortal",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state,
          description,
          context: "InternsPortal / Task Grading",
          ...(targetUrl ? { target_url: targetUrl } : {}),
        }),
      },
    );
    if (!res.ok) {
      logger.error(
        { status: res.status, owner, repo, sha, state },
        "GitHub API: failed to set commit status",
      );
    }
  } catch (error) {
    logger.error(error, "GitHub API: error setting commit status");
  }
}

export const githubClient = {
  async updateCommitStatus(
    payload: {
      cohortId: string;
      repoUrl?: string;
      score?: number;
      maxScore?: number;
      taskTitle?: string;
      userName?: string;
    },
    event?: IntegrationEvent,
  ) {
    if (!payload.repoUrl) return;

    const parsed = parseRepoUrl(payload.repoUrl);
    if (!parsed) {
      logger.warn(
        { repoUrl: payload.repoUrl },
        "GitHub: invalid repo URL, skipping",
      );
      return;
    }

    const cacheKey = `integration:github:${payload.cohortId}`;
    const integration = await fetchWithCache(cacheKey, 600, async () => {
      return await Integration.findOne({
        cohortId: payload.cohortId,
        provider: "github",
        enabled: true,
      })
        .select("config enabledEvents")
        .lean();
    });

    if (!integration?.config?.accessToken) return;

    // If specific events are enabled, only proceed for allowed events
    if (
      event &&
      integration.enabledEvents &&
      integration.enabledEvents.length > 0 &&
      !integration.enabledEvents.includes(event)
    ) {
      return;
    }

    const sha = await getLatestCommitSha(
      integration.config.accessToken,
      parsed.owner,
      parsed.repo,
    );
    if (!sha) {
      logger.warn(
        { owner: parsed.owner, repo: parsed.repo },
        "GitHub: could not determine latest commit SHA",
      );
      return;
    }

    // Determine state based on score
    let state: "success" | "failure" | "pending";
    let description: string;

    if (payload.score !== undefined && payload.maxScore) {
      const percentage = (payload.score / payload.maxScore) * 100;
      if (percentage >= 50) {
        state = "success";
        description = `Graded: ${payload.score}/${payload.maxScore} (${Math.round(percentage)}%)`;
      } else {
        state = "failure";
        description = `Below pass mark: ${payload.score}/${payload.maxScore} (${Math.round(percentage)}%)`;
      }
    } else {
      state = "pending";
      description = "Submission received, awaiting grade";
    }

    if (payload.taskTitle) {
      description = `${payload.taskTitle} — ${description}`;
    }

    await setCommitStatus(
      integration.config.accessToken,
      parsed.owner,
      parsed.repo,
      sha,
      state,
      description,
    );

    logger.info(
      { owner: parsed.owner, repo: parsed.repo, sha, state },
      "GitHub: commit status updated",
    );
  },
};
