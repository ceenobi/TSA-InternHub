import { RiUserCommunityFill } from "@remixicon/react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

export default function Logo({
  classname,
  size,
  showLogoText = false,
}: {
  classname?: string;
  size?: number;
  showLogoText?: boolean;
}) {
  return (
    <Link to="/" className="flex gap-2 items-center w-fit">
      <RiUserCommunityFill
        className={cn(classname, "text-mainBlue dark:text-darkBlue")}
        size={size ?? 34}
      />
      {showLogoText && (
        <h2
          className={`${classname} text-base font-semibold tracking-tight text-mainDark dark:text-white`}
        >
          TSA Intern Hub
        </h2>
      )}
    </Link>
  );
}
