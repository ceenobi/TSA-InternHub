import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { OnboardingTour } from "../provider/onboarding-tour";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("OnboardingTour", () => {
  it("shows the tour automatically on first visit", () => {
    render(<OnboardingTour />);
    expect(
      screen.getByText(/welcome to tsa internhub/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 of 7/i)).toBeInTheDocument();
  });

  it("advances steps with Next and disables Back on the first step", () => {
    render(<OnboardingTour />);
    const back = screen.getByRole("button", { name: /back/i });
    expect(back).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/sidebar navigation/i)).toBeInTheDocument();
    expect(screen.getByText(/2 of 7/i)).toBeInTheDocument();
  });

  it("skips and records completion", () => {
    render(<OnboardingTour />);
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(
      screen.queryByText(/welcome to tsa internhub/i),
    ).not.toBeInTheDocument();
    expect(localStorage.getItem("tour-completed")).toBe("true");
  });

  it("finishes from the last step", () => {
    render(<OnboardingTour />);
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
    }
    expect(screen.getByText(/you're all set/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /finish/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /finish/i }));
    expect(localStorage.getItem("tour-completed")).toBe("true");
    expect(
      screen.queryByText(/you're all set/i),
    ).not.toBeInTheDocument();
  });
});
