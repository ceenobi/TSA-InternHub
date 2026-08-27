import { tryCatchWrapper } from "~/lib/tryCatchWrapper";
import { auth } from "../services/better-auth";
import { checkRateLimit } from "../utils/rate-limit";
import Certificate from "../model/certificate";
import { fetchWithCache } from "../utils/cache";

export async function getUserCertificates(request: Request) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "general");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json(
        { success: false, message: "Unauthorized, session expired" },
        { status: 401 },
      );
    }

    const cacheKey = `certificates:user${session.user.id}`;
    const body = await fetchWithCache(cacheKey, 300, async () => {
      const certificates = await Certificate.find({ user: session.user.id })
        .populate({ path: "project", select: "title" })
        .populate({ path: "cohort", select: "cohort" })
        .sort({ issuedAt: -1 })
        .lean();
      return certificates.map((c: any) => ({
        _id: c._id.toString(),
        certificateId: c.certificateId,
        type: c.type,
        score: c.score,
        program: c.program,
        issuedAt: c.issuedAt?.toISOString?.() ?? c.issuedAt,
        project: c.project
          ? {
              _id: c.project._id.toString(),
              title: c.project.title,
            }
          : null,
        cohort: c.cohort
          ? {
              _id: c.cohort._id.toString(),
              cohort: c.cohort.cohort,
            }
          : null,
      }));
    });

    return Response.json({
      success: true,
      message: "Certificates fetched successfully",
      body,
    });
  });
}
