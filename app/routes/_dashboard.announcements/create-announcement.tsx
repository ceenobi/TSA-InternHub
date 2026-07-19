import { zodResolver } from "@hookform/resolvers/zod";
import { RiAddFill, RiLoaderLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { FormBox } from "~/components/ui/formbox";
import Modal from "~/components/ui/modal";
import { createAnnouncementSchema } from "~/lib/schemaValidation";
import type { CohortDataType } from "~/types";

import type { z } from "zod";
import AlertBox from "~/components/provider/alert-box";

type FormData = z.input<typeof createAnnouncementSchema>;

export default function CreateAnnouncement({
  cohorts,
}: {
  cohorts: CohortDataType[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const fetcher = useFetcher();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: {
      title: "",
      content: "",
      target: "all",
      priority: "normal",
      pinned: false,
    },
  });

  const actionData = fetcher.data as
    | { success?: boolean; message?: string }
    | undefined;

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Announcement created");
      reset();
      setIsOpen(false);
    }
  }, [actionData]);

  useEffect(() => {
    if (isOpen) {
      fetcher.data = undefined;
    }
  }, [isOpen]);

  const programOptions = [
    { name: "Full-Stack", id: "full-stack" },
    { name: "Product Design", id: "product-design" },
    { name: "Data Analysis", id: "data-analysis" },
    { name: "Cyber Security", id: "cyber-security" },
  ];

  const targetOptions = [
    { name: "Everyone", id: "all" },
    { name: "Specific Cohort", id: "cohort" },
    { name: "Program", id: "program" },
  ];

  const priorityOptions = [
    { name: "Low", id: "low" },
    { name: "Normal", id: "normal" },
    { name: "High", id: "high" },
    { name: "Urgent", id: "urgent" },
  ];

  const cohortOptions = cohorts.map((c) => ({
    name: c.cohort,
    id: c._id,
  }));

  const watchedTarget = watch("target");

  const onFormSubmit = (data: FormData) => {
    fetcher.submit(
      { intent: "create-announcement", ...data },
      {
        method: "post",
        action: "/announcements",
        encType: "application/json",
      },
    );
  };

  const handleClose = () => {
    fetcher.reset();
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="px-4 h-10 rounded-sm border dark:border-darkBlue/50 bg-mainBlue dark:bg-darkBlue/20 hover:bg-mainBlue/90 hover:dark:bg-darkBlue/30 text-white"
      >
        Create Announcement <RiAddFill className="ml-1" />
      </Button>
      <Modal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title="Create Announcement"
        description="Send an announcement to users."
      >
        {actionData !== undefined && actionData.success === false && (
          <AlertBox
            title={"Error"}
            description={actionData.message || "Error posting announcement"}
            variant={"error"}
            onClose={handleClose}
          />
        )}
        <fetcher.Form
          id="create-announcement-form"
          onSubmit={handleSubmit(onFormSubmit)}
          className="space-y-4 pt-2"
        >
          <FormBox
            label="Title"
            type="text"
            id="title"
            register={register}
            errors={errors}
            name="title"
            placeholder="e.g. Platform maintenance this weekend"
          />

          <FormBox
            label="Content"
            type="textarea"
            id="content"
            register={register}
            errors={errors}
            name="content"
            placeholder="Write your announcement…"
          />

          <FormBox
            label="Target Audience"
            type="select"
            id="targetAudience"
            name="target"
            register={register}
            control={control}
            errors={errors}
            placeholder="Select target audience"
            getSelectData={targetOptions}
            onValueChange={(val) =>
              setValue("target", val as FormData["target"])
            }
          />

          {watchedTarget === "cohort" && (
            <FormBox
              label="Select Cohort"
              type="select"
              id="targetCohort"
              name="targetCohort"
              register={register}
              control={control}
              errors={errors}
              placeholder="Choose a cohort"
              getSelectData={cohortOptions}
              onValueChange={(val) =>
                setValue("targetCohort", val as FormData["targetCohort"])
              }
            />
          )}

          {watchedTarget === "program" && (
            <FormBox
              label="Select Program"
              type="select"
              id="targetProgram"
              name="targetProgram"
              register={register}
              control={control}
              errors={errors}
              placeholder="Choose a program"
              getSelectData={programOptions}
              onValueChange={(val) =>
                setValue("targetProgram", val as FormData["targetProgram"])
              }
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormBox
              label="Priority"
              type="select"
              id="priority"
              name="priority"
              register={register}
              control={control}
              errors={errors}
              placeholder="Select priority"
              getSelectData={priorityOptions}
              onValueChange={(val) =>
                setValue("priority", val as FormData["priority"])
              }
            />

            <FormBox
              label="Expiry Date (optional)"
              type="date"
              id="expiresAt"
              register={register}
              errors={errors}
              name="expiresAt"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("pinned")}
              className="rounded-sm border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-medium">Pin this announcement</span>
          </label>

          <Button
            type="submit"
            disabled={fetcher.state !== "idle"}
            className="w-full rounded-sm bg-mainBlue dark:bg-darkBlue/40 text-white h-10"
          >
            {fetcher.state !== "idle" && (
              <RiLoaderLine className="animate-spin mr-1" size={16} />
            )}
            {fetcher.state !== "idle" ? "Creating…" : "Create Announcement"}
          </Button>
        </fetcher.Form>
      </Modal>
    </>
  );
}
