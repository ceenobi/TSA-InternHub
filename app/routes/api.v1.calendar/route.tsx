import { getCalendarData } from "~/.server/action/calendar";
import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  return getCalendarData(request);
}
