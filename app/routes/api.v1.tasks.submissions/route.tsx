import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;
  const taskId = url.searchParams.get("taskId") || undefined;

  const { getUserTaskSubmissions } = await import(
    "~/.server/action/submissions"
  );
  return getUserTaskSubmissions({ request, taskId, page, limit });
}
