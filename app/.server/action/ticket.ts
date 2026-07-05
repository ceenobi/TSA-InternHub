import z from "zod";
import { createTicketSchema } from "~/lib/schemaValidation";
import { tryCatchWrapper } from "~/lib/tryCatchWrapper";
import { generateTicketId } from "~/lib/utils";
import type { CreateTicketSchemaType } from "~/types";
import { env } from "../config/keys";
import logger from "../config/logger";
import { dispatchIntegrationEvent } from "../integrations/registry";
import Ticket from "../model/ticket";
import User from "../model/user";
import { AuditLogService } from "../services/auditlog.service";
import { auth } from "../services/better-auth";
import { NotificationService } from "../services/notification.service";
import { fetchWithCache, invalidateCache } from "../utils/cache";
import { checkRateLimit } from "../utils/rate-limit";
import { workflowClient } from "../workflows/client";

export async function createTicket(
  request: Request,
  payload: CreateTicketSchemaType,
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized, session expired" },
        { status: 401 },
      );
    }
    const { cohort, program, id: userId } = session.user;
    const result = createTicketSchema.safeParse(payload);
    if (!result.success) {
      logger.error("Invalid profile data format");
      return Response.json(
        {
          success: false,
          message: "Invalid dataschema",
          errors: z.treeifyError(result.error),
        },
        { status: 400 },
      );
    }
    const ticket = await Ticket.create({
      ...result.data,
      userId,
      ticketId: generateTicketId(),
    });
    await invalidateCache(`tickets:pg${program}*`);
    await AuditLogService.record(request, {
      action: "SUPPORT_TICKET",
      category: "support",
      description: `Created ticket "${result.data.title}" - (${program})`,
      details: {
        ticketId: ticket.ticketId.toString(),
        cohort,
        program,
      },
    });

    // Trigger ticket confirmation email
    await workflowClient.trigger({
      url: `${env.clientUrl}/api/v1/workflow/ticket-confirmation`,
      body: {
        userId,
        ticketId: ticket.ticketId,
        title: result.data.title,
        description: result.data.description || "",
        priority: result.data.priority,
      },
    });

    // In-app notification
    NotificationService.send({
      userId,
      type: "ticket_created",
      title: "Ticket Created",
      message: `Your ticket "${result.data.title}" has been created.`,
      metadata: { ticketId: ticket.ticketId },
    });

    const Cohort = (await import("../model/cohort")).default;
    const userCohort = await Cohort.findOne({ program }).select("_id").lean();
    if (userCohort) {
      dispatchIntegrationEvent("ticket_created", {
        cohortId: userCohort._id.toString(),
        ticketTitle: result.data.title,
      });
    }

    return Response.json(
      { success: true, message: "Ticket created successfully" },
      { status: 201 },
    );
  });
}

export async function fetchTickets({
  request,
  page,
  limit,
  query,
  status,
  priority,
  category,
}: {
  request: Request;
  page: number;
  limit: number;
  query: string | undefined;
  status: "open" | "in-progress" | "resolved" | "closed" | undefined;
  priority: "low" | "medium" | "high" | "critical" | undefined;
  category: "auth" | "task" | "security" | "other" | undefined;
}) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "general");
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const { program, id: userId, role } = session.user;
    const isSuperAdmin = role === "super_admin";
    const cacheKey = `tickets:pg${program}:p${page}:l${limit}:q${query ?? ""}:s${status ?? ""}:pr${priority ?? ""}:cat${category ?? ""}`;
    const body = await fetchWithCache(cacheKey, 3600, async () => {
      const dbFilter: Record<string, any> = {
        ...(!isSuperAdmin && { program }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(category && { category }),
      };
      if (query) {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = { $regex: escaped, $options: "i" };
        dbFilter.$or = [{ title: regex }, { ticketId: regex }];
      }
      const total = await Ticket.countDocuments(dbFilter);
      const tickets = await Ticket.find(dbFilter)
        .populate("userId", "name email phone")
        .populate("assignedTo", "name email phone")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      const matchStage: Record<string, any> = !isSuperAdmin ? { program } : {};

      const ticketStats = await Ticket.aggregate([
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        {
          $group: {
            _id: null,
            totalTickets: { $sum: 1 },
            openTickets: {
              $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
            },
            closedTickets: {
              $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] },
            },
            inProgressTickets: {
              $sum: {
                $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0],
              },
            },
            resolvedTickets: {
              $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
            },
          },
        },
      ]);
      return {
        tickets,
        summary: ticketStats[0] || {},
        meta: {
          currentPage: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
          hasMore: (page - 1) * limit + tickets.length < total,
        },
      };
    });
    return Response.json({
      success: true,
      message: "Tickets fetched successfully",
      body,
    });
  });
}

export async function ticketActions(
  request: Request,
  payload: { id: string; status: string; assignedTo: string },
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const { program, role } = session.user;

    if (!payload.id) {
      logger.error("Ticket Id is required to perform action");
      return Response.json(
        { success: false, message: "Ticket Id is required to perform action" },
        { status: 401 },
      );
    }

    const STATUSES_REQUIRING_ASSIGNMENT = new Set([
      "resolved",
      "in-progress",
      "closed",
    ]);

    // Validate assignee existence and permissions (independent of ticket state)
    if (payload.assignedTo) {
      if (role !== "super_admin") {
        return Response.json(
          {
            success: false,
            message: "Unauthorized: Only super admins can assign tickets",
          },
          { status: 403 },
        );
      }
      const assignee = await User.findById(payload.assignedTo)
        .select("role program")
        .lean();
      if (!assignee) {
        logger.error("Assignee not found");
        return Response.json(
          { success: false, message: "Assignee not found" },
          { status: 404 },
        );
      }
      if (assignee.role !== "admin") {
        logger.error("Tickets can only be assigned to admins");
        return Response.json(
          {
            success: false,
            message: "Tickets can only be assigned to admins",
          },
          { status: 400 },
        );
      }
      // Ensure the admin's program matches the ticket creator's program
      const ticketOwner = await Ticket.findById(payload.id)
        .select("userId")
        .lean();
      if (ticketOwner?.userId) {
        const creator = await User.findById(ticketOwner.userId)
          .select("program")
          .lean();
        if (creator && creator.program !== assignee.program) {
          logger.error(
            `Admin program "${assignee.program}" does not match ticket creator's program "${creator.program}"`,
          );
          return Response.json(
            {
              success: false,
              message: `Admin must be in the same program (${creator.program}) as the ticket creator`,
            },
            { status: 400 },
          );
        }
      }
    }

    // Build atomic filter to prevent race conditions
    const filter: Record<string, any> = { _id: payload.id };

    // If the status requires assignment, ensure the ticket is assigned atomically
    if (
      payload.status &&
      STATUSES_REQUIRING_ASSIGNMENT.has(payload.status) &&
      !payload.assignedTo
    ) {
      filter.assignedTo = { $ne: null };
    }

    // If assigning, prevent overwriting an existing assignment atomically
    if (payload.assignedTo) {
      filter.$or = [
        { assignedTo: { $exists: false } },
        { assignedTo: null },
        { assignedTo: payload.assignedTo },
      ];
    }

    const updateFields: Record<string, any> = {};
    if (payload.status) updateFields.status = payload.status;
    if (payload.assignedTo !== undefined)
      updateFields.assignedTo = payload.assignedTo;

    const updatedTicket = await Ticket.findOneAndUpdate(filter, updateFields, {
      returnDocument: "after",
      runValidators: true,
    })
      .populate("userId", "name email phone")
      .populate("assignedTo", "name email phone")
      .lean();

    if (!updatedTicket) {
      // Determine the reason based on what was attempted
      const ticket = await Ticket.findById(payload.id)
        .select("assignedTo")
        .lean();
      if (!ticket) {
        return Response.json(
          { success: false, message: "Ticket not found" },
          { status: 404 },
        );
      }
      if (
        payload.status &&
        STATUSES_REQUIRING_ASSIGNMENT.has(payload.status) &&
        !ticket.assignedTo
      ) {
        return Response.json(
          {
            success: false,
            message: `Ticket cannot be set to "${payload.status}" without being assigned to an admin`,
          },
          { status: 400 },
        );
      }
      if (
        payload.assignedTo &&
        ticket.assignedTo?.toString() !== payload.assignedTo
      ) {
        return Response.json(
          {
            success: false,
            message: "Ticket is already assigned to another admin",
          },
          { status: 403 },
        );
      }
      return Response.json(
        { success: false, message: "Operation failed, please try again" },
        { status: 400 },
      );
    }

    await invalidateCache(`tickets:pg${program}*`);

    // Notifications
    if (updatedTicket.assignedTo && payload.assignedTo) {
      await workflowClient.trigger({
        url: `${env.clientUrl}/api/v1/workflow/ticket-assigned`,
        body: {
          userId: updatedTicket.assignedTo._id.toString(),
          ticketId: updatedTicket.ticketId,
          title: updatedTicket.title,
        },
      });
      NotificationService.send({
        userId: updatedTicket.assignedTo._id.toString(),
        type: "ticket_assigned",
        title: "Ticket Assigned",
        message: `Ticket "${updatedTicket.title}" has been assigned to you.`,
        metadata: { ticketId: updatedTicket.ticketId },
      });

      const Cohort = (await import("../model/cohort")).default;
      const userCohort = await Cohort.findOne({
        program: (updatedTicket.userId as any)?.program || program,
      })
        .select("_id")
        .lean();
      if (userCohort) {
        dispatchIntegrationEvent("ticket_assigned", {
          cohortId: userCohort._id.toString(),
          ticketTitle: updatedTicket.title,
          assigneeName: (updatedTicket.assignedTo as any)?.name,
        });
      }
    }
    if (updatedTicket.status === "resolved") {
      await workflowClient.trigger({
        url: `${env.clientUrl}/api/v1/workflow/ticket-resolved`,
        body: {
          userId: updatedTicket.userId._id.toString(),
          ticketId: updatedTicket.ticketId,
          title: updatedTicket.title,
        },
      });
      NotificationService.send({
        userId: updatedTicket.userId._id.toString(),
        type: "ticket_resolved",
        title: "Ticket Resolved",
        message: `Your ticket "${updatedTicket.title}" has been resolved.`,
        metadata: { ticketId: updatedTicket.ticketId },
      });

      const Cohort = (await import("../model/cohort")).default;
      const userCohort = await Cohort.findOne({ program }).select("_id").lean();
      if (userCohort) {
        dispatchIntegrationEvent("ticket_resolved", {
          cohortId: userCohort._id.toString(),
          ticketTitle: updatedTicket.title,
        });
      }
    }

    return Response.json(
      { success: true, message: "Ticket updated successfully" },
      { status: 200 },
    );
  });
}
