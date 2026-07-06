import type { AppLoadContext } from "react-router";
import { redirect } from "react-router";
import type { Permission } from "~/lib/constants";
import { hasPermission } from "~/lib/rbac";
import type { UserData } from "~/types";

export interface RouterContext extends AppLoadContext {
  user?: UserData;
  cookie?: string;
}

/**
 * Middleware for guest-only routes (e.g., Login, Signup).
 * Redirects authenticated users to the dashboard.
 */
export async function guestOnlyMiddleware(
  { request }: { request: Request },
  next: () => Promise<Response>,
) {
  const { getSession } = await import("~/.server/action/auth");
  const session = await getSession(request);
  if (session) {
    return redirect("/");
  }
  return await next();
}

/**
 * Middleware for authenticated routes (e.g., Dashboard).
 * Redirects guests to the login page and provides user context to loaders.
 */
export async function authenticatedMiddleware(
  { request, context }: { request: Request; context: RouterContext },
  next: () => Promise<Response>,
) {
  const { getSession } = await import("~/.server/action/auth");
  const session = await getSession(request);

  if (!session) {
    return redirect("/auth/login");
  }

  const { user } = session;
  const { pathname } = new URL(request.url);

  // 1. Email Verification Check
  if (!user?.emailVerified && pathname !== "/account/verify-email") {
    return redirect("/account/verify-email");
  }

  // 2. Onboarding Check
  // const isOnboardingRoute = pathname.startsWith("/onboarding");
  // if (user.emailVerified && !user.isOnboarded && !isOnboardingRoute) {
  //   return redirect("/onboarding");
  // }

  // Pass user and cookie to context so loaders don't have to re-fetch
  // better-auth returns id, but UserData uses _id (MongoDB convention)
  const { id, ...rest } = user;
  context.user = { _id: id, ...rest } as unknown as UserData;
  context.cookie = request.headers.get("Cookie") || "";

  return await next();
}

/**
 * Middleware for routes that need session data if available but are publicly accessible.
 * Provides user context to loaders if authenticated, otherwise continues without redirecting.
 */
export async function sessionMiddleware(
  { request, context }: { request: Request; context: RouterContext },
  next: () => Promise<Response>,
) {
  const { getSession } = await import("~/.server/action/auth");
  const session = await getSession(request);

  if (session) {
    // better-auth returns id, but UserData uses _id (MongoDB convention)
    const { id, ...rest } = session.user;
    context.user = { _id: id, ...rest } as unknown as UserData;
    context.cookie = request.headers.get("Cookie") || "";
  }
  return await next();
}

/**
 * Middleware factory for permission-based route guards.
 * Throws a 403 Forbidden Response if the user does not have the required permission.
 * Designed to be used in the middleware array: `export const middleware = [requirePermission("MANAGE_COHORTS")]`
 *
 * Requires `authenticatedMiddleware` to have run first so `context.user` is populated.
 *
 * @param scope - Optional. Restrict to `"action"` (POST/PUT/PATCH/DELETE) or `"loader"` (GET) only.
 */
export function requirePermission(
  permission: Permission,
  scope?: "action" | "loader",
) {
  return async function permissionMiddleware(
    { request, context }: { request: Request; context: RouterContext },
    next: () => Promise<Response>,
  ) {
    if (scope) {
      const isAction = !["GET", "HEAD"].includes(request.method);
      if (scope === "action" && !isAction) return await next();
      if (scope === "loader" && isAction) return await next();
    }

    const user = context.user;

    if (!user || !hasPermission(user.role, permission)) {
      throw Response.json(
        {
          success: false,
          message: `Access denied. Requires '${permission}' permission.`,
        },
        { status: 403 },
      );
    }
    return await next();
  };
}
