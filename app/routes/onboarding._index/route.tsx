import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useFetcher, useNavigate, useOutletContext } from "react-router";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import ActionButton from "~/components/ui/action-button";
import { FormBox } from "~/components/ui/formbox";
import { formFields } from "~/lib/constants";
import { getOptimizedImageUrl } from "~/lib/cloudinary";
import { onboardingSchema } from "~/lib/schemaValidation";
import { useFileUpload } from "~/hooks/useFileUpload";
import type { OnboardingSchemaType, UserData } from "~/types";
import type { Route } from "./+types/route";

const genderOptions = [
  { name: "Male", id: "male" },
  { name: "Female", id: "female" },
  { name: "Other", id: "other" },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Onboarding | TSA InternHub" },
    {
      name: "description",
      content:
        "Complete your profile to get started with TSA InternHub.",
    },
  ];
}

export default function OnboardingRoute() {
  const { user } = useOutletContext() as { user: UserData };
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastUploadedRef = useRef<{ image: string; imagePublicId: string } | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    selectedFiles: imagePreview,
    setSelectedFiles: setImagePreview,
    handleFiles: handleImageUpload,
  } = useFileUpload({ limit: 1, size: 2 });

  const profileFields = formFields.filter((f) =>
    ["name", "phone"].includes(f.name),
  );

  const form = useForm<OnboardingSchemaType>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: user.name || "",
      phone: user.phone || "",
      gender: (user.gender as "male" | "female" | "other") || undefined,
    },
    mode: "onChange",
  });

  const actionData = fetcher.data as
    | { success?: boolean; message?: string }
    | undefined;

  useEffect(() => {
    if (!actionData) return;
    if (actionData.success) {
      toast.success(actionData.message);
      navigate("/", { replace: true });
    } else {
      toast.error(actionData.message || "Something went wrong");
      const publicId = lastUploadedRef.current?.imagePublicId;
      if (publicId) {
        fetch("/api/delete-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicIds: [publicId] }),
        });
      }
      lastUploadedRef.current = null;
    }
  }, [actionData, navigate]);

  useEffect(() => {
    if (imagePreview.length === 0 || isUploading) return;
    setIsUploading(true);

    const upload = async () => {
      try {
        const sigRes = await fetch("/api/upload-signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: "avatars" }),
        });
        const sig = await sigRes.json();
        if (!sig.success) {
          toast.error(sig.message || "Failed to get upload signature");
          return;
        }

        const fd = new FormData();
        fd.append("file", imagePreview[0].file);
        fd.append("api_key", sig.apiKey);
        fd.append("timestamp", sig.timestamp);
        fd.append("signature", sig.signature);
        fd.append("upload_preset", sig.uploadPreset);
        fd.append("folder", sig.folder);
        if (sig.eager) fd.append("eager", sig.eager);
        if (sig.responsive_breakpoints)
          fd.append("responsive_breakpoints", sig.responsive_breakpoints);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
          { method: "POST", body: fd },
        );
        const result = await uploadRes.json();
        if (!result.secure_url) {
          toast.error(result.error?.message || "Upload failed");
          return;
        }

        lastUploadedRef.current = {
          image: result.secure_url,
          imagePublicId: result.public_id,
        };

        const payload = {
          ...form.getValues(),
          image: result.secure_url,
          imagePublicId: result.public_id,
        };
        fetcher.submit(payload, {
          method: "post",
          encType: "application/json",
          action: "/onboarding",
        });
      } catch {
        toast.error("An error occurred during upload");
      } finally {
        setIsUploading(false);
        setImagePreview([]);
      }
    };

    upload();
  }, [imagePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      handleImageUpload(e);
    }
  };

  const onSubmit = (data: OnboardingSchemaType) => {
    fetcher.submit(data, {
      method: "post",
      encType: "application/json",
      action: "/onboarding",
    });
  };

  const isSubmitting = fetcher.state !== "idle";

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl rounded-sm dark:bg-muted/30">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Welcome, {user.name?.split(" ")[0] || "there"}!
          </CardTitle>
          <CardDescription className="text-sm">
            Complete your profile to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center gap-4 md:w-48 shrink-0">
              <Avatar className="size-24 ring-2 ring-offset-2 ring-border">
                <AvatarImage
                  src={previewUrl || getOptimizedImageUrl(user.image, 96) || undefined}
                />
                <AvatarFallback className="text-2xl">
                  {user.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                disabled={isSubmitting || isUploading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={isSubmitting || isUploading}
                className="rounded-sm w-full"
              >
                {isUploading ? "Uploading..." : "Upload Photo"}
              </Button>
            </div>

            <fetcher.Form
              id="onboarding-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex-1 space-y-4"
            >
              {profileFields.map((field) => (
                <FormBox
                  key={field.name}
                  label={field.label}
                  type={field.type}
                  placeholder={field.placeholder}
                  id={field.name}
                  register={form.register}
                  control={form.control}
                  errors={form.formState.errors}
                  name={field.name as keyof OnboardingSchemaType}
                />
              ))}
              <FormBox
                label="Gender"
                type="select"
                placeholder="Select gender"
                id="gender"
                register={form.register}
                control={form.control}
                errors={form.formState.errors}
                name="gender"
                options={genderOptions}
              />
            </fetcher.Form>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <ActionButton
              text="Complete Setup"
              type="submit"
              form="onboarding-form"
              loading={isSubmitting || isUploading}
              disabled={isSubmitting || isUploading}
              classname="rounded-sm border dark:border-darkBlue bg-mainBlue dark:bg-darkBlue/20 text-white hover:bg-mainBlue/90 hover:dark:bg-darkBlue/30"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}