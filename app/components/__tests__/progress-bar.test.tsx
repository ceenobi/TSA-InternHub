import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { ProgressBar } from "../provider/progress-bar";
import { useNavigation } from "react-router";

vi.mock("react-router", () => ({
  useNavigation: vi.fn(() => ({ state: "idle" })),
}));

afterEach(() => {
  cleanup();
});

describe("ProgressBar", () => {
  it("renders nothing when navigation is idle", () => {
    vi.mocked(useNavigation).mockReturnValue({
      state: "idle",
    } as unknown as ReturnType<typeof useNavigation>);
    const { container } = render(<ProgressBar />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the loader when navigation is loading", async () => {
    vi.mocked(useNavigation).mockReturnValue({
      state: "loading",
    } as unknown as ReturnType<typeof useNavigation>);
    const { container, unmount } = render(<ProgressBar />);
    await waitFor(() => {
      expect(container.querySelector(".z-100")).not.toBeNull();
    });
    unmount();
  });
});
