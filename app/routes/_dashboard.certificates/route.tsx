import { RiAwardFill } from "@remixicon/react";
import { PageSection, PageWrapper } from "~/components/provider/page-wrapper";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { getUserCertificates } from "~/.server/action/certificate";
import type { RouterContext } from "~/middleware/auth.middleware";
import type { Route } from "./+types/route";

interface CertificateItem {
  _id: string;
  certificateId: string;
  type: string;
  score: number;
  program: string;
  issuedAt: string;
  project: { _id: string; title: string } | null;
  cohort: { _id: string; cohort: string } | null;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "My Certificates | TSA InternHub" },
    {
      name: "description",
      content: "View the certificates you have earned on the platform.",
    },
  ];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = (context as unknown as RouterContext).user;
  if (!user || user.role !== "user") {
    return { restricted: true, certificates: [] as CertificateItem[] };
  }
  const res = await getUserCertificates(request);
  const data = await res.json();
  return {
    restricted: false,
    certificates: (data.body ?? []) as CertificateItem[],
  };
}

export default function Certificates({ loaderData }: Route.ComponentProps) {
  const { certificates, restricted } = loaderData;

  if (restricted) {
    return (
      <PageWrapper>
        <PageSection index={0}>
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
            <RiAwardFill className="text-muted-foreground" size={48} />
            <h1 className="text-xl font-semibold">Certificates</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              Certificates are only available to members. Admins and super
              admins do not have access to this page.
            </p>
          </div>
        </PageSection>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageSection index={0}>
        <div className="px-4 py-6">
          <div className="mb-6 flex items-center gap-2">
            <RiAwardFill className="text-mainBlue dark:text-darkBlue" size={22} />
            <h1 className="text-xl font-semibold">My Certificates</h1>
          </div>

          {certificates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You have not earned any certificates yet. Complete a project to
              receive one.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {certificates.map((c) => (
                <Card key={c._id}>
                  <CardHeader>
                    <CardTitle className="capitalize">{c.program}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <span className="text-foreground">Project: </span>
                      {c.project?.title ?? "—"}
                    </p>
                    <p>
                      <span className="text-foreground">Cohort: </span>
                      {c.cohort?.cohort ?? "—"}
                    </p>
                    <p>
                      <span className="text-foreground">Score: </span>
                      {c.score}
                    </p>
                    <p>
                      <span className="text-foreground">Issued: </span>
                      {new Date(c.issuedAt).toLocaleDateString()}
                    </p>
                    <p className={cn("break-all text-xs")}>
                      <span className="text-foreground">ID: </span>
                      {c.certificateId}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageSection>
    </PageWrapper>
  );
}
