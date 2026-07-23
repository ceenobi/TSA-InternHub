import { Outlet } from "react-router";
import Logo from "~/components/ui/logo";
import {
  sessionMiddleware,
  // type RouterContext,
} from "~/middleware/auth.middleware";
import type { Route } from "./+types/route";
import { ThemeToggle } from "~/components/nav/theme-toggle";

export const middleware = [sessionMiddleware];

// export async function loader({ context }: Route.LoaderArgs) {
//   const { user } = context as unknown as Required<Pick<RouterContext, "user">>;
//   return { user };
// }

export default function SupportLayout({}: Route.ComponentProps) {
  // const { user } = loaderData;
  return (
    <main>
      <div className="fixed top-0 w-full bg-accent z-30 border-b">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <Logo size={24} />
           <ThemeToggle />
          {/*<div className="flex gap-3 lg:gap-2 items-center">
            <Profile user={user} />
          </div>*/}
        </div>
      </div>
      <section className="py-20 px-4 lg:px-8">
        <Outlet />
      </section>
    </main>
  );
}
