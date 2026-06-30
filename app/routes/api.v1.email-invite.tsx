import { sendInviteCode } from "~/.server/action/auth";
import type { Route } from "./+types/api.v1.email-invite";

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  return sendInviteCode(request, payload);
}
