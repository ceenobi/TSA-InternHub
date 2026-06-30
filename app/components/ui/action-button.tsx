import { RiLoaderLine } from "@remixicon/react";
import { Button } from "./button";

interface ActionButtonProps {
  type?: "button" | "submit" | "reset" | undefined;
  loading?: boolean;
  text?: React.ReactNode;
  classname?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  form?: string;
  size?: "default" | "sm" | "lg";
}

export default function ActionButton({
  type,
  loading,
  text,
  classname,
  onClick,
  disabled,
  variant,
  form,
  size,
}: ActionButtonProps) {
  return (
    <Button
      type={type}
      disabled={loading || disabled}
      onClick={onClick}
      className={`cursor-pointer transition-transform ease-in-out duration-300 h-10 capitalize rounded-sm ${classname}`}
      variant={variant}
      form={form}
      size={size}
    >
      {loading && (
        <RiLoaderLine data-icon="inline-start" className="animate-spin" />
      )}
      {text}
    </Button>
  );
}
