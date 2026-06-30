import { useEffect } from "react";
import { useActionData, useNavigate } from "react-router";
import { toast } from "sonner";
import { logoutUser } from "~/.server/action/auth";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import type { Route } from "./+types/logout";

export async function action({ request }: Route.ActionArgs) {
  return await logoutUser(request);
}

export default function LogoutPage() {
  const actionData = useActionData<{ success: boolean }>();
  const navigate = useNavigate();
  const queryClient = getQueryClientRsc();

  useEffect(() => {
    if (actionData?.success) {
      queryClient.clear();
      toast.success(`Successfully logged out`, {
        id: "logout",
      });
      navigate("/auth/login");
    }
  }, [actionData, navigate]);
  return null;
}
