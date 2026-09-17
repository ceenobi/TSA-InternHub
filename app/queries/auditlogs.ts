import type { AuditLogsQueryResult } from "~/queries/auditlogs.server";

export const getUserAuditLogsClientQuery = (request: Request) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;
  const category = url.searchParams.get("category") || "all";
  return {
    queryKey: ["auditLogs", page, limit, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("category", category);
      const response = await fetch(`/api/v1/audit-logs?${params}`, {
        headers: request.headers,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch audit logs");
      }
      const data = await response.json();
      return data.body as AuditLogsQueryResult;
    },
  };
};

export const getAllAuditLogsClientQuery = (request: Request) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;
  const category = url.searchParams.get("category") || "all";
  return {
    queryKey: ["auditLogs", "all", page, limit, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("category", category);
      const response = await fetch(`/api/v1/audit-logs/general?${params}`, {
        headers: request.headers,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch audit logs");
      }
      const data = await response.json();
      return data.body as AuditLogsQueryResult;
    },
  };
};
