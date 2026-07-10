import { Outlet } from "react-router";
import { onboardUser } from "~/.server/action/auth";
import {
  authenticatedMiddleware,
  type RouterContext,
} from "~/middleware/auth.middleware";
import type { Route } from "./+types/route";

export const middleware = [authenticatedMiddleware];

export async function loader({ context }: Route.LoaderArgs) {
  const { user } = context as unknown as Required<Pick<RouterContext, "user">>;
  return { user };
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  return await onboardUser(request, payload);
}

export default function OnboardingLayout({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  return <Outlet context={{ user }} />;
}
