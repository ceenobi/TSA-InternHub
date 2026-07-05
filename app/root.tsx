import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from "react-router";

import {
  RiArrowGoBackFill,
  RiErrorWarningLine,
  RiHome6Line,
  RiLoopRightFill,
  RiSearchEyeLine,
} from "@remixicon/react";
import {
  HydrationBoundary,
  QueryClientProvider,
  type DehydratedState,
} from "@tanstack/react-query";
import "react-phone-number-input/style.css";
import type { Route } from "./+types/root";
import "./app.css";
import { ProgressBar } from "./components/provider/progress-bar";
import { ThemeProvider } from "./components/provider/theme";
import ToastProvider from "./components/provider/toast";
import { Button } from "./components/ui/button";
import { TooltipProvider } from "./components/ui/tooltip";
import { getQueryClientRsc } from "./lib/getQueryClient";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "icon",
    href: "/tsa-hub.svg",
    sizes: "any",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storageKey = "TsaInternTheme";
                  var defaultTheme = "system";
                  var theme = localStorage.getItem(storageKey) || defaultTheme;
                  var supportDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

                  var root = document.documentElement;
                  root.classList.remove("light", "dark");

                  if (theme === "dark" || (theme === "system" && supportDarkMode)) {
                    root.classList.add("dark");
                  } else {
                    root.classList.add("light");
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ProgressBar />
        <TooltipProvider>
          <ThemeProvider defaultTheme="system" storageKey="TsaInternTheme">
            {children}
          </ThemeProvider>
          <ToastProvider />
        </TooltipProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const queryClient = getQueryClientRsc();
  const matches = useMatches();
  const dehydratedState = matches.reduce(
    (acc, match) => {
      const state = (match.loaderData as any)
        ?.dehydratedState as DehydratedState;
      if (state) {
        return {
          ...acc,
          queries: [...(acc?.queries || []), ...(state.queries || [])],
          mutations: [...(acc?.mutations || []), ...(state.mutations || [])],
        };
      }
      return acc;
    },
    { queries: [], mutations: [] } as DehydratedState,
  );

  if (import.meta.env.DEV && dehydratedState.queries.length > 0) {
    console.log(
      "Global Hydration State merged for queries:",
      dehydratedState.queries.map((q) => q.queryKey),
    );
  }
  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <Outlet />
      </HydrationBoundary>
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let is404 = false;
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    is404 = error.status === 404;
    message = is404 ? "Page not found" : `${error.status} ${error.statusText}`;
    details = is404
      ? "The page you're looking for doesn't exist or has been moved."
      : error.statusText || details;
  } else if (error && error instanceof Error) {
    details = error.message;
    if (import.meta.env.DEV) {
      stack = error.stack;
    }
  }

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-20  h-full w-full bg-white dark:bg-accentBlack/30 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff14_1px,transparent_1px),linear-gradient(to_bottom,#ffffff14_1px,transparent_1px)] bg-size-[6rem_4rem]" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        {/* Icon */}
        <div
          className={`mb-6 size-16 rounded-full flex items-center justify-center ${
            is404
              ? "bg-mainBlue/10 dark:bg-darkBlue/10"
              : "bg-destructive/20 dark:bg-destructive/30"
          }`}
        >
          {is404 ? (
            <RiSearchEyeLine
              size={32}
              className="text-mainBlue dark:text-darkBlue"
            />
          ) : (
            <RiErrorWarningLine size={32} className="text-destructive" />
          )}
        </div>

        {/* Logo */}
        {/*<Logo classname="mb-2" />*/}

        {/* Message */}
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-mainDark dark:text-white">
          {message}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-sm">
          {details}
        </p>

        {/* Actions */}
        <div className="mt-8 flex items-center gap-3">
          <Link to="/">
            <Button
              variant="outline"
              className="rounded-sm border-border bg-white dark:bg-transparent hover:bg-muted"
            >
              <RiHome6Line size={16} />
              Go home
            </Button>
          </Link>
          {!is404 && (
            <Button
              variant="default"
              onClick={() => window.location.reload()}
              className="rounded-sm border border-mainBlue dark:border-mainGold/60 bg-white dark:bg-mainGold/20 text-mainBlack dark:text-white hover:bg-mainBlue hover:text-white hover:dark:bg-mainGold/30"
            >
              <RiLoopRightFill size={16} />
              Try again
            </Button>
          )}
        </div>

        {/* Dev stack trace */}
        {stack && (
          <details className="mt-8 w-full text-left">
            <summary className="cursor-pointer text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors select-none">
              <span className="inline-flex items-center gap-1.5">
                <RiArrowGoBackFill size={12} className="rotate-90" />
                Stack trace
              </span>
            </summary>
            <pre className="mt-3 w-full max-h-72 overflow-auto rounded-md border border-border bg-card dark:bg-accentBlack/60 p-4 text-[11px] leading-relaxed text-muted-foreground">
              <code>{stack}</code>
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}
