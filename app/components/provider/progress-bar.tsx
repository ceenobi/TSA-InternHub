import { useEffect, useState } from "react";
import { useNavigation } from "react-router";
import { ProgressLoader } from "../ui/progress-loader";

export function ProgressBar() {
  const navigation = useNavigation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (navigation.state === "loading") {
      // Defer state updates to avoid synchronous setState in effect
      queueMicrotask(() => {
        setIsVisible(true);
        setProgress(10);
      });
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 5;
        });
      }, 300);
    } else if (isVisible) {
      // Defer completion state
      queueMicrotask(() => {
        setProgress(100);
      });
      const timeout = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 400);
      return () => clearTimeout(timeout);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [navigation.state, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-100 pointer-events-none">
      <ProgressLoader
        value={progress}
        className="h-1 rounded-none bg-transparent"
        indicatorClassName="bg-mainBlue dark:bg-darkBlue transition-[width] duration-300 ease-out shadow-[0_0_10px_rgba(110,89,255,0.5)]"
      />
    </div>
  );
}
