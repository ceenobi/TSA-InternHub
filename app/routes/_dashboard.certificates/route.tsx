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

export async function loader({ request }: Route.LoaderArgs) {
  const res = await getUserCertificates(request);
  const data = await res.json();
  return { certificates: (data.body ?? []) as CertificateItem[] };
}

export default function Certificates({ loaderData }: Route.ComponentProps) {
  const { certificates } = loaderData;

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
