import "react-phone-number-input/style.css";

import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import { type E164Number } from "libphonenumber-js/core";
import type {
  Control,
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form";
import { Controller } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import { cn } from "~/lib/utils";
import { Checkbox } from "./checkbox";
import { Field, FieldError, FieldLabel, FieldSet } from "./field";
import { FormSelect, type SelectOption } from "./form-select";
import { Input } from "./input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./input-otp";
import { Switch } from "./switch";
import { Textarea } from "./textarea";

type FormFieldProps<T extends FieldValues> = {
  label: string;
  type: string;
  id: string;
  register: UseFormRegister<T>;
  errors?: FieldErrors<T> | undefined;
  placeholder?: string;
  isVisible?: boolean;
  setIsVisible?: (visible: boolean | ((prev: boolean) => boolean)) => void;
  name: Path<T>;
  classname?: string;
  disabled?: boolean;
  defaultValue?: string | Date | number | boolean;
  inputType?:
    "input" | "textarea" | "select" | "switch" | "editor" | "tel" | "otp";
  showLabel?: boolean;
  registerOptions?: RegisterOptions<T>;
  control?: Control<T>;
  getSelectData?: SelectOption[];
  onValueChange?: (value: string | null) => void;
  options?: SelectOption[];
};

export function FormBox<T extends FieldValues>({
  isVisible,
  setIsVisible,
  label,
  type,
  placeholder,
  id,
  register,
  errors,
  name,
  classname,
  disabled = false,
  defaultValue,
  showLabel = true,
  registerOptions,
  control,
  getSelectData,
  onValueChange,
  options,
}: FormFieldProps<T>) {
  const toggleVisibility = () => setIsVisible?.((prev) => !prev);
  const error =
    name.split(".").reduce((acc, part) => {
      if (acc && typeof acc === "object" && part in acc) {
        return (acc as any)[part];
      }
      return undefined;
    }, errors as any) || (errors as any)?.[name];

  const renderField = () => {
    const activeInputType = [
      "textarea",
      "select",
      "switch",
      "editor",
      "tel",
      "otp",
      "checkbox",
    ].includes(type)
      ? type
      : "input";

    switch (activeInputType) {
      case "otp":
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <InputOTP
                maxLength={6}
                value={field.value ?? ""}
                onChange={field.onChange}
                containerClassName="w-full"
                className={cn(error ? "aria-invalid:border-destructive" : "")}
              >
                <InputOTPGroup className="w-full flex gap-2">
                  <InputOTPSlot
                    className="flex-1 h-14 rounded-md border text-lg"
                    index={0}
                  />
                  <InputOTPSlot
                    className="flex-1 h-14 rounded-md border text-lg"
                    index={1}
                  />
                  <InputOTPSlot
                    className="flex-1 h-14 rounded-md border text-lg"
                    index={2}
                  />
                  <InputOTPSlot
                    className="flex-1 h-14 rounded-md border text-lg"
                    index={3}
                  />
                  <InputOTPSlot
                    className="flex-1 h-14 rounded-md border text-lg"
                    index={4}
                  />
                  <InputOTPSlot
                    className="flex-1 h-14 rounded-md border text-lg"
                    index={5}
                  />
                </InputOTPGroup>
              </InputOTP>
            )}
          />
        );
      case "switch":
        return (
          <div>
            <Controller
              name={name}
              control={control}
              render={({ field: { onChange, value } }) => (
                <Switch
                  id={id}
                  checked={value}
                  onCheckedChange={onChange}
                  disabled={disabled}
                />
              )}
            />
          </div>
        );
      case "checkbox":
        return (
          <div>
            <Controller
              name={name}
              control={control}
              render={({ field: { onChange, value } }) => (
                <Checkbox
                  id={id}
                  checked={value}
                  onCheckedChange={onChange}
                  disabled={disabled}
                  className={`rounded-sm text-sm border bg-inherit focus:outline-blue-500 focus:ring-blue-500 ${error ? "border-destructive dark:border-destructive" : ""}`}
                />
              )}
            />
          </div>
        );
      case "tel":
        return (
          <Controller
            name={name}
            control={control}
            render={({ field: { onChange, value } }) => (
              <PhoneInput
                defaultCountry="NG"
                placeholder={placeholder}
                international
                withCountryCallingCode
                value={value as E164Number | undefined}
                onChange={onChange}
                className={`px-2 py-2.75 rounded-sm text-sm font-medium border border-zinc-200 dark:border-accentBlack/60  focus:outline-blue-500 focus:ring-blue-500 ${error ? "border-destructive dark:border-destructive" : ""}`}
              />
            )}
          />
        );
      case "select":
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <FormSelect
                options={options || getSelectData}
                value={field.value ?? ""}
                onValueChange={(val) => {
                  field.onChange(val);
                  onValueChange?.(val);
                }}
                disabled={disabled}
                error={!!error}
                placeholder={placeholder}
              />
            )}
          />
        );
      case "textarea":
        return (
          <Textarea
            id={id}
            {...register(name, registerOptions)}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              "focus:outline-blue-500 focus:ring-blue-500 rounded-sm border border-zinc-200 dark:border-accentBlack/60 font-normal",
              error ? "border-destructive dark:border-destructive" : "",
            )}
            defaultValue={
              defaultValue instanceof Date
                ? defaultValue.toISOString().split("T")[0]
                : typeof defaultValue === "boolean"
                  ? String(defaultValue)
                  : (defaultValue as any)
            }
          />
        );
        default:
        return (
          <div>
            <Input
              type={type === "password" && isVisible ? "text" : type}
              placeholder={placeholder}
              step={type === "number" ? "any" : undefined}
              className={cn(
                "rounded-sm border border-zinc-200 dark:border-accentBlack/60 h-10 pl-2 font-normal",
                error ? "border-destructive dark:border-destructive" : "",
              )}
              id={id}
              {...register(name, registerOptions)}
              disabled={disabled}
              defaultValue={
                defaultValue instanceof Date
                  ? defaultValue.toISOString().split("T")[0]
                  : typeof defaultValue === "boolean"
                    ? String(defaultValue)
                    : (defaultValue as any)
              }
            />
            {type === "password" && (
              <button
                type="button"
                className={cn(
                  "absolute right-3 text-muted-foreground border-0 focus:outline-none cursor-pointer",
                  showLabel ? "inset-y-[60%]" : "inset-y-[30%]",
                )}
                onClick={toggleVisibility}
              >
                {isVisible ? (
                  <RiEyeOffLine size={20} />
                ) : (
                  <RiEyeLine size={20} />
                )}
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div className={cn("relative", classname)}>
      <FieldSet className="w-full relative">
        <Field
          orientation={
            ["checkbox", "switch"].includes(type) ? "horizontal" : "vertical"
          }
          className={cn(
            ["checkbox", "switch"].includes(type) &&
              "flex flex-row-reverse items-start",
          )}
        >
          {showLabel && (
            <FieldLabel
              htmlFor={id}
              className={cn(
                "text-xs font-medium",
                error ? "text-destructive" : "",
              )}
            >
              {label}
            </FieldLabel>
          )}
          {renderField()}
        </Field>
      </FieldSet>
      <FieldError className="text-xs text-destructive min-h-5">
        {error?.message ? String(error.message) : "\u00A0"}
      </FieldError>
    </div>
  );
}
