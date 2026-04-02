import { useEffect, useRef, useCallback } from "react";

interface UseFocusModeOptions {
  isRunning: boolean;
  onViolation: (reason: string) => void;
}

export function useFocusMode({ isRunning, onViolation }: UseFocusModeOptions) {
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  const handleViolation = useCallback(
    (reason: string) => {
      if (isRunningRef.current) {
        onViolation(reason);
      }
    },
    [onViolation]
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunningRef.current) {
        handleViolation("tab_switch");
      }
    };

    const handleBlur = () => {
      if (isRunningRef.current) {
        handleViolation("window_blur");
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isRunningRef.current) {
        handleViolation("fullscreen_exit");
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRunningRef.current) {
        e.preventDefault();
        e.returnValue = "Focus session is active! Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [handleViolation]);
}
