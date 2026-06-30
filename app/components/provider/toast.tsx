import { Toaster } from "sonner";
import { useTheme } from "./theme";

const ToastProvider = () => {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme as any}
      position="bottom-right"
      toastOptions={{
        className: "font-sans",
        style: {
          borderRadius: "8px",
          padding: "16px",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          border: "1px solid rgba(0, 0, 0, 0.05)",
        },
        classNames: {
          toast:
            "group bg-white dark:bg-DarkBlue text-gray-900 dark:text-white border-none backdrop-blur-md bg-opacity-90 dark:bg-opacity-80",
          success:
            "!bg-[#00af54]/10 !text-[#00af54] dark:!bg-[#00af54]/20 dark:!text-[#00af54] border-l-4 border-[#00af54]",
          error:
            "!bg-red-50 !text-red-600 dark:!bg-red-950/30 dark:!text-red-400 border-l-4 border-red-500",
          info: "!bg-[#007cbe]/10 !text-[#007cbe] dark:!bg-[#007cbe]/20 dark:!text-[#007cbe] border-l-4 border-[#007cbe]",
        },
      }}
    />
  );
};

export default ToastProvider;
