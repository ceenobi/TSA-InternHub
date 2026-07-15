import {
  RiAlertFill,
  RiCheckboxCircleFill,
  RiCloseLine,
  RiErrorWarningFill,
  RiInformationFill,
} from "@remixicon/react";
import * as React from "react";
import { cn } from "~/lib/utils";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "../ui/alert";

export type AlertBoxVariant =
  | "success"
  | "info"
  | "warning"
  | "error"
  | "default";

interface AlertBoxProps extends Omit<React.ComponentProps<"div">, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: AlertBoxVariant;
  action?: React.ReactNode;
  onClose?: () => void;
}

const variantStyles: Record<AlertBoxVariant, string> = {
  success:
    "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/15 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400",
  info: "bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/15 dark:border-blue-500/30 text-blue-800 dark:text-blue-400",
  warning:
    "bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/15 dark:border-amber-500/30 text-amber-800 dark:text-amber-400",
  error:
    "bg-red-500/10 border-red-500/20 dark:bg-red-500/15 dark:border-red-500/30 text-red-800 dark:text-red-400",
  default: "bg-card text-card-foreground border-border",
};

const iconMap = {
  success: RiCheckboxCircleFill,
  info: RiInformationFill,
  warning: RiAlertFill,
  error: RiErrorWarningFill,
  default: RiInformationFill,
};

const iconStyles: Record<AlertBoxVariant, string> = {
  success: "text-emerald-600 dark:text-emerald-400",
  info: "text-blue-600 dark:text-blue-400",
  warning: "text-amber-600 dark:text-amber-400",
  error: "text-red-600 dark:text-red-400",
  default: "text-muted-foreground",
};

const descriptionStyles: Record<AlertBoxVariant, string> = {
  success: "text-emerald-700/90 dark:text-emerald-400/90",
  info: "text-blue-700/90 dark:text-blue-400/90",
  warning: "text-amber-700/90 dark:text-amber-400/90",
  error: "text-red-700/90 dark:text-red-400/90",
  default: "text-muted-foreground",
};

export default function AlertBox({
  title,
  description,
  variant = "default",
  action,
  onClose,
  className,
  ...props
}: AlertBoxProps) {
  const Icon = iconMap[variant];
  const customClasses = variantStyles[variant];

  return (
    <Alert
      className={cn(
        "relative transition-[opacity,transform] duration-300 shadow-sm rounded-sm",
        customClasses,
        onClose && "pr-10",
        action && "pr-24",
        className,
      )}
      {...props}
    >
      <Icon
        className={cn("size-4 translate-y-0.5 shrink-0", iconStyles[variant])}
      />
      {title && (
        <AlertTitle className="font-bold text-sm tracking-tight leading-none mb-1">
          {title}
        </AlertTitle>
      )}
      {description && (
        <AlertDescription
          className={cn("text-xs leading-relaxed", descriptionStyles[variant])}
        >
          {description}
        </AlertDescription>
      )}
      {action && <AlertAction>{action}</AlertAction>}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-3 p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-[opacity,background-color] text-current"
          aria-label="Close alert"
        >
          <RiCloseLine size={16} />
        </button>
      )}
    </Alert>
  );
}
