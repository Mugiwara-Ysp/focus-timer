interface CircularTimerProps {
  progress: number;
  remainingMs: number;
  sessionType: "focus" | "break";
  isRunning: boolean;
  violations: number;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function CircularTimer({
  progress,
  remainingMs,
  sessionType,
  isRunning,
  violations,
}: CircularTimerProps) {
  const size = 280;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const isFocus = sessionType === "focus";
  const trackColor = isFocus
    ? "hsl(258 80% 70% / 0.15)"
    : "hsl(180 65% 55% / 0.15)";
  const progressColor = isFocus ? "hsl(258 80% 70%)" : "hsl(180 65% 55%)";
  const glowColor = isFocus ? "rgba(162, 105, 255, 0.3)" : "rgba(72, 200, 190, 0.3)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {isRunning && (
        <div
          className="absolute inset-0 rounded-full animate-pulse-ring"
          style={{
            background: "transparent",
            boxShadow: `0 0 0 0 ${glowColor}`,
            border: `2px solid ${glowColor}`,
          }}
        />
      )}

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg]"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="progress-ring"
          filter="url(#glow)"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span
          className="font-mono text-5xl font-semibold tabular-nums tracking-tight"
          style={{ color: progressColor }}
          data-testid="timer-display"
        >
          {formatTime(remainingMs)}
        </span>
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
          {isFocus ? "Focus" : "Break"}
        </span>
        {violations > 0 && (
          <span className="text-xs text-destructive font-medium mt-1">
            {violations} violation{violations !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
