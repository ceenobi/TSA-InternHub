import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../provider/theme";

function Consumer() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme("dark")}>set-dark</button>
    </div>
  );
}

beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  localStorage.clear();
  document.documentElement.className = "";
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.className = "";
});

describe("ThemeProvider", () => {
  it("falls back to the default context when used without a provider", () => {
    render(<Consumer />);
    expect(screen.getByTestId("theme")).toHaveTextContent("system");
  });

  it("defaults to the system theme and persists it", async () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    expect(await screen.findByTestId("theme")).toHaveTextContent("system");
    expect(localStorage.getItem("TsaInternTheme")).toBe("system");
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("initializes from a stored theme", async () => {
    localStorage.setItem("TsaInternTheme", "dark");
    render(
      <ThemeProvider defaultTheme="light">
        <Consumer />
      </ThemeProvider>,
    );
    expect(await screen.findByTestId("theme")).toHaveTextContent("dark");
  });

  it("applies and persists a theme change", async () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    await screen.findByTestId("theme");
    await act(async () => {
      screen.getByText("set-dark").click();
    });
    expect(localStorage.getItem("TsaInternTheme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
