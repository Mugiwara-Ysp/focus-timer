import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_VIOLATIONS } from "@/hooks/useTimer";

interface ViolationOverlayProps {
  violations: number;
  isVisible: boolean;
  onDismiss: () => void;
  onReset: () => void;
}

export function ViolationOverlay({ violations, isVisible, onDismiss, onReset }: ViolationOverlayProps) {
  if (!isVisible) return null;

  const isMaxViolations = violations >= MAX_VIOLATIONS;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      data-testid="violation-overlay"
    >
      <div className="relative max-w-md w-full mx-4 rounded-2xl border border-destructive/30 p-8 animate-slide-up"
        style={{
          background: "rgba(20, 10, 10, 0.95)",
          boxShadow: "0 0 60px rgba(255,60,60,0.2)",
        }}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />
            <div className="relative w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              {isMaxViolations ? "Session Failed!" : "Focus Mode Active!"}
            </h2>
            <p className="text-sm text-gray-400">
              {isMaxViolations
                ? "You've exceeded the maximum violations. The session has been reset."
                : "Returning to the focus session is required. Stay focused!"}
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive font-medium">
              {violations} / {MAX_VIOLATIONS} violations
            </span>
          </div>

          {isMaxViolations ? (
            <Button
              onClick={onReset}
              variant="destructive"
              className="w-full"
              data-testid="button-reset-after-violations"
            >
              Reset Session
            </Button>
          ) : (
            <Button
              onClick={onDismiss}
              className="w-full"
              style={{ background: "hsl(258 80% 70%)" }}
              data-testid="button-return-focus"
            >
              <X className="w-4 h-4 mr-2" />
              Return to Focus
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
