import { redirect } from "react-router";
import type { Route } from "./+types/api.delete-media";
import { deleteFile } from "~/.server/action/upload";
import { z } from "zod";
import { deleteMediaSchema } from "~/lib/schemaValidation";

export async function loader() {
  return redirect("/");
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST" && request.method !== "DELETE") {
    return Response.json({ message: "Method not allowed" }, { status: 405 });
  }

  try {
    const data = await request.json();
    const result = deleteMediaSchema.safeParse(data);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          message: "Invalid payload",
          errors: z.treeifyError(result.error),
        },
        { status: 400 },
      );
    }
    return await deleteFile(request, result.data);
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return Response.json(
      {
        success: false,
        message: "Invalid JSON payload",
      },
      { status: 400 },
    );
  }
}
