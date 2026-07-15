import { Button } from "../ui/button";
import { useTheme } from "../provider/theme";
import { RiContrast2Line, RiSunLine } from "@remixicon/react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="cursor-pointer"
    >
      {theme === "dark" ? (
        <RiSunLine className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-[transform,opacity]" />
      ) : (
        <RiContrast2Line className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-[transform,opacity]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
