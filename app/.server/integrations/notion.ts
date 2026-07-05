import { Client } from "@notionhq/client";
import logger from "~/.server/config/logger";
import type { IntegrationEvent } from "~/.server/model/integration";
import Integration from "~/.server/model/integration";
import Project from "~/.server/model/project";
import Stage from "~/.server/model/stage";
import Task from "~/.server/model/task";
import { fetchWithCache } from "~/.server/utils/cache";

async function getIntegration(cohortId: string) {
  const cacheKey = `integration:notion:${cohortId}`;
  return await fetchWithCache(cacheKey, 600, async () => {
    return await Integration.findOne({
      cohortId,
      provider: "notion",
      enabled: true,
    })
      .select("config enabledEvents")
      .lean();
  });
}

function isEventAllowed(
  integration: any,
  event: IntegrationEvent,
): boolean {
  if (!integration?.config?.integrationToken || !integration?.config?.databaseId) return false;
  if (
    integration.enabledEvents?.length > 0 &&
    !integration.enabledEvents.includes(event)
  ) {
    return false;
  }
  return true;
}

function buildResourceBlocks(
  resources: { name: string; url: string }[],
): any[] {
  if (!resources?.length) return [];

  return [
    {
      object: "block",
      type: "heading_3",
      heading_3: {
        rich_text: [{ type: "text", text: { content: "Resources" } }],
      },
    },
    ...resources.map((r) => ({
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            type: "text",
            text: { content: r.name, link: r.url ? { url: r.url } : undefined },
          },
        ],
      },
    })),
  ];
}

function buildTaskBlocks(tasks: any[]): any[] {
  if (!tasks?.length) return [];

  return tasks.flatMap((t) => [
    {
      object: "block",
      type: "heading_3",
      heading_3: {
        rich_text: [{ type: "text", text: { content: t.title } }],
      },
    },
    ...(t.description
      ? [
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                { type: "text", text: { content: t.description } },
              ],
            },
          },
        ]
      : []),
    ...(t.instructions
      ? [
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: { content: `Instructions: ${t.instructions}` },
                },
              ],
            },
          },
        ]
      : []),
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            type: "text",
            text: {
              content: `Type: ${t.type}  |  Max Score: ${t.maxScore}  |  Due: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "N/A"}`,
            },
          },
        ],
      },
    },
    ...buildResourceBlocks(t.resources || []),
  ]);
}

function buildStageBlocks(stages: any[]): any[] {
  if (!stages?.length) return [];

  return stages.flatMap((s) => [
    {
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ type: "text", text: { content: s.title } }],
      },
    },
    ...(s.description
      ? [
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                { type: "text", text: { content: s.description } },
              ],
            },
          },
        ]
      : []),
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            type: "text",
            text: {
              content: `Pass mark: ${s.passPercentage}%  |  ${s.startDate ? `Start: ${new Date(s.startDate).toLocaleDateString()}` : ""}  |  ${s.endDate ? `End: ${new Date(s.endDate).toLocaleDateString()}` : ""}`,
            },
          },
        ],
      },
    },
    ...buildTaskBlocks(s.tasks || []),
  ]);
}

export const notionClient = {
  async syncProjectToNotion(payload: {
    cohortId: string;
    projectTitle: string;
    projectId?: string;
  }) {
    const integration = await getIntegration(payload.cohortId);
    if (!isEventAllowed(integration, "project_started")) return;

    const integrationToken = integration.config.integrationToken;
    const databaseId = integration.config.databaseId;

    try {
      const project = await Project.findById(payload.projectId)
        .select("title description status startDate endDate")
        .lean();

      if (!project) {
        logger.warn(
          { projectTitle: payload.projectTitle },
          "Notion: project not found",
        );
        return;
      }

      const stages = await Stage.find({ project: project._id })
        .select("title description passPercentage startDate endDate order")
        .sort({ order: 1 })
        .lean();

      const stageIds = stages.map((s) => s._id);
      const tasks = await Task.find({ stage: { $in: stageIds } })
        .select("title description instructions resources type maxScore dueDate stage order")
        .sort({ order: 1 })
        .lean();

      const tasksByStage = tasks.reduce<Record<string, any[]>>((acc, t) => {
        const key = t.stage.toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
      }, {});

      const stagesWithTasks = stages.map((s) => ({
        ...s,
        tasks: tasksByStage[s._id.toString()] || [],
      }));

      const notion = new Client({ auth: integrationToken });

      const existing = await notion.request({
        path: `/databases/${databaseId}/query`,
        method: "post",
        body: {
          filter: {
            property: "Name",
            title: { equals: project.title },
          },
        },
      }) as any;

      const statusEmoji =
        project.status === "active"
          ? "🟢"
          : project.status === "completed"
            ? "✅"
            : project.status === "on-hold"
              ? "⏸️"
              : "📋";

      if (existing.results.length > 0) {
        const pageId = existing.results[0].id;
        await notion.pages.update({
          page_id: pageId,
          properties: {
            Description: {
              rich_text: [
                { type: "text", text: { content: project.description } },
              ],
            },
            Status: {
              select: { name: project.status.charAt(0).toUpperCase() + project.status.slice(1) },
            },
            ...(project.startDate
              ? {
                  "Start Date": {
                    date: { start: project.startDate.toISOString().split("T")[0] },
                  },
                }
              : {}),
            ...(project.endDate
              ? {
                  "End Date": {
                    date: {
                      start: project.endDate.toISOString().split("T")[0],
                    },
                  },
                }
              : {}),
          },
        });

        const existingBlocks = await notion.blocks.children.list({
          block_id: pageId,
        });
        if (existingBlocks.results.length > 0) {
          const blockIds = existingBlocks.results.map((b: any) => b.id);
          await Promise.allSettled(
            blockIds.map((id: string) =>
              notion.blocks.delete({ block_id: id }),
            ),
          );
        }

        await notion.blocks.children.append({
          block_id: pageId,
          children: buildStageBlocks(stagesWithTasks),
        });

        logger.info(
          { projectTitle: project.title },
          "Notion: project page updated",
        );
      } else {
        await notion.pages.create({
          parent: { database_id: databaseId },
          properties: {
            Name: {
              title: [
                { type: "text", text: { content: `${statusEmoji} ${project.title}` } },
              ],
            },
            Description: {
              rich_text: [
                { type: "text", text: { content: project.description } },
              ],
            },
            Status: {
              select: { name: project.status.charAt(0).toUpperCase() + project.status.slice(1) },
            },
            ...(project.startDate
              ? {
                  "Start Date": {
                    date: { start: project.startDate.toISOString().split("T")[0] },
                  },
                }
              : {}),
            ...(project.endDate
              ? {
                  "End Date": {
                    date: {
                      start: project.endDate.toISOString().split("T")[0],
                    },
                  },
                }
              : {}),
          },
          children: buildStageBlocks(stagesWithTasks),
        });

        logger.info(
          { projectTitle: project.title },
          "Notion: project page created",
        );
      }
    } catch (error) {
      logger.error(error, "Notion: failed to sync project");
    }
  },
};
