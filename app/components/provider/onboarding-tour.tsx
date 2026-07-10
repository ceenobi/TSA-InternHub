import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "~/components/ui/button";

const TOUR_KEY = "tour-completed";

type TourStep = {
  title: string;
  description: string;
  target?: string;
  position?: "bottom" | "top" | "left" | "right";
};

const STEPS: TourStep[] = [
  {
    title: "Welcome to TSA InternHub!",
    description:
      "Let's take a quick tour of the key areas. You can skip this anytime.",
  },
  {
    title: "Sidebar Navigation",
    description:
      "All main sections live here — Dashboard, Tasks, Hub, Projects, and more. Use the toggle to collapse or expand it.",
    target: "aside",
    position: "right",
  },
  {
    title: "Tasks",
    description:
      "View your assignments, submit work, and track your progress across stages.",
    target: 'a[href="/tasks"]',
    position: "right",
  },
  {
    title: "Notifications",
    description:
      "Stay updated on submissions, announcements, and feedback from your instructors.",
    target: "[data-tour='notifications']",
    position: "bottom",
  },
  {
    title: "AI Assistant",
    description:
      "Ask questions about tasks, grades, deadlines, and resources — powered by AI.",
    target: "[data-tour='chatbot']",
    position: "top",
  },
  {
    title: "Settings",
    description:
      "Update your profile, avatar, password, and preferences anytime.",
    target: 'a[href="/settings"]',
    position: "right",
  },
  {
    title: "You're all set!",
    description:
      "Explore the app at your own pace. You can replay this tour anytime from the help menu.",
  },
];

function getTargetRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector);
  return el?.getBoundingClientRect() ?? null;
}

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) setVisible(true);
  }, []);

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const dismiss = () => {
    localStorage.setItem(TOUR_KEY, "true");
    setVisible(false);
  };

  const handleSkip = dismiss;
  const handleFinish = dismiss;

  if (!visible) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const targetRect = current.target ? getTargetRect(current.target) : null;

  let tooltipStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 9999,
    width: 300,
    background: "var(--card, #fff)",
    border: "1px solid var(--border, #e5e7eb)",
    borderRadius: 8,
    padding: 20,
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
  };

  let highlightStyle: React.CSSProperties | undefined;

  if (targetRect) {
    const gap = 12;
    const tw = 300;
    const th = 140;
    let left: number, top: number;

    switch (current.position) {
      case "bottom":
        left = targetRect.left + targetRect.width / 2 - tw / 2;
        top = targetRect.bottom + gap;
        break;
      case "top":
        left = targetRect.left + targetRect.width / 2 - tw / 2;
        top = targetRect.top - th - gap;
        break;
      case "left":
        left = targetRect.left - tw - gap;
        top = targetRect.top + targetRect.height / 2 - th / 2;
        break;
      case "right":
        left = targetRect.right + gap;
        top = targetRect.top + targetRect.height / 2 - th / 2;
        break;
      default:
        left = targetRect.left + targetRect.width / 2 - tw / 2;
        top = targetRect.bottom + gap;
    }

    tooltipStyle.left = Math.max(8, Math.min(left, window.innerWidth - 308));
    tooltipStyle.top = Math.max(8, top);

    highlightStyle = {
      position: "fixed",
      left: targetRect.left - 4,
      top: targetRect.top - 4,
      width: targetRect.width + 8,
      height: targetRect.height + 8,
      borderRadius: 4,
      zIndex: 9998,
      pointerEvents: "none",
      boxShadow: "0 0 0 4px var(--color-mainBlue, #3b82f6)",
      transition: "all 0.3s ease",
    };
  } else {
    tooltipStyle.left = "50%";
    tooltipStyle.top = "50%";
    tooltipStyle.transform = "translate(-50%, -50%)";
  }

  return createPortal(
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9997,
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
        onClick={handleSkip}
      />
      {highlightStyle && <div style={highlightStyle} />}
      <div style={tooltipStyle}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">
            {step + 1} of {STEPS.length}
          </span>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
          >
            Skip
          </button>
        </div>
        <h3 className="text-sm font-semibold mb-1">{current.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          {current.description}
        </p>
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={isFirst}
            className="rounded-sm text-xs"
          >
            Back
          </Button>
          {isLast ? (
            <Button
              type="button"
              size="sm"
              onClick={handleFinish}
              className="rounded-sm text-xs bg-mainBlue hover:bg-mainBlue/90 text-white"
            >
              Finish
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              className="rounded-sm text-xs bg-mainBlue hover:bg-mainBlue/90 text-white"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}

export function resetTour() {
  localStorage.removeItem(TOUR_KEY);
}

export function isTourCompleted() {
  return !!localStorage.getItem(TOUR_KEY);
}