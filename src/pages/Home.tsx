import { useState, useEffect, useCallback } from "react";
import { Moon, Sun, LayoutDashboard, CheckSquare, Image, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircularTimer } from "@/components/CircularTimer";
import { TimerControls } from "@/components/TimerControls";
import { ViolationOverlay } from "@/components/ViolationOverlay";
import { TaskManager } from "@/components/TaskManager";
import { ImageUploader } from "@/components/ImageUploader";
import { Dashboard } from "@/components/Dashboard";
import { useTimer, MAX_VIOLATIONS } from "@/hooks/useTimer";
import { useFocusMode } from "@/hooks/useFocusMode";

export function Home() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("focus_theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [showViolationOverlay, setShowViolationOverlay] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("focus_theme", isDark ? "dark" : "light");
  }, [isDark]);

  const {
    timerState,
    remainingMs,
    progress,
    isSessionLocked,
    start,
    pause,
    reset,
    skipToBreak,
    addViolation,
    setFocusDuration,
    setBreakDuration,
    setActiveTask,
  } = useTimer();

  const handleViolation = useCallback(
    (reason: string) => {
      addViolation(reason);
      setShowViolationOverlay(true);
    },
    [addViolation]
  );

  useFocusMode({
    isRunning: timerState.isRunning,
    onViolation: handleViolation,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (isSessionLocked) pause();
        else start();
      } else if (e.key === "r" || e.key === "R") {
        if (!isSessionLocked) reset();
      } else if (e.key === "s" || e.key === "S") {
        if (isSessionLocked) skipToBreak();
      } else if (e.key === "d" || e.key === "D") {
        setIsDark((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSessionLocked, pause, start, reset, skipToBreak]);

  const handleDismissViolation = () => {
    setShowViolationOverlay(false);
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleResetAfterViolations = () => {
    setShowViolationOverlay(false);
    reset();
  };

  const isFocus = timerState.sessionType === "focus";

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          background: isFocus
            ? "radial-gradient(ellipse at 50% 0%, hsl(258 80% 70% / 0.08) 0%, transparent 60%)"
            : "radial-gradient(ellipse at 50% 0%, hsl(180 65% 55% / 0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(258 80% 65%), hsl(258 80% 50%))",
              }}
            >
              <Timer className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">FocusFlow</h1>
          </div>
          <div className="flex items-center gap-2">
            {isSessionLocked && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">Session Active</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDark((prev) => !prev)}
              className="w-9 h-9 rounded-xl"
              data-testid="button-toggle-theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div
              className="rounded-2xl border p-6 flex flex-col items-center gap-5"
              style={{
                background: isDark
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(255,255,255,0.7)",
                backdropFilter: "blur(20px)",
              }}
            >
              <CircularTimer
                progress={progress}
                remainingMs={remainingMs}
                sessionType={timerState.sessionType}
                isRunning={timerState.isRunning}
                violations={timerState.violations}
              />
              <TimerControls
                timerState={timerState}
                isSessionLocked={isSessionLocked}
                onStart={start}
                onPause={pause}
                onReset={reset}
                onSkipToBreak={skipToBreak}
                onFocusDurationChange={setFocusDuration}
                onBreakDurationChange={setBreakDuration}
              />
              {isSessionLocked && timerState.violations > 0 && (
                <div className="w-full">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Violations</span>
                    <span className="text-destructive font-medium">
                      {timerState.violations} / {MAX_VIOLATIONS}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-destructive rounded-full transition-all duration-300"
                      style={{ width: `${(timerState.violations / MAX_VIOLATIONS) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              {isSessionLocked && (
                <p className="text-xs text-muted-foreground text-center">
                  Stay focused! You cannot exit until the session ends.
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <Tabs defaultValue="tasks" className="space-y-4">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="tasks" className="gap-1.5 text-xs">
                  <CheckSquare className="w-3.5 h-3.5" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="images" className="gap-1.5 text-xs">
                  <Image className="w-3.5 h-3.5" />
                  Questions
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Stats
                </TabsTrigger>
              </TabsList>

              <div
                className="rounded-2xl border p-5"
                style={{
                  background: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <TabsContent value="tasks" className="mt-0">
                  <div className="mb-3">
                    <h2 className="font-semibold text-sm">Task Manager</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {timerState.activeTaskId
                        ? "Session linked to a task."
                        : "Click a task to link it to your session."}
                    </p>
                  </div>
                  <TaskManager
                    activeTaskId={timerState.activeTaskId}
                    onSelectTask={setActiveTask}
                    isSessionLocked={isSessionLocked}
                  />
                </TabsContent>

                <TabsContent value="images" className="mt-0">
                  <div className="mb-3">
                    <h2 className="font-semibold text-sm">Question Upload & Review</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isSessionLocked
                        ? "Upload images during your session. Review after it ends."
                        : "Upload and review your question screenshots."}
                    </p>
                  </div>
                  <ImageUploader
                    isSessionActive={isSessionLocked}
                    currentSessionId={timerState.currentSessionId}
                  />
                </TabsContent>

                <TabsContent value="dashboard" className="mt-0">
                  <div className="mb-3">
                    <h2 className="font-semibold text-sm">Productivity Stats</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your focus history and performance overview.
                    </p>
                  </div>
                  <Dashboard />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      <ViolationOverlay
        violations={timerState.violations}
        isVisible={showViolationOverlay}
        onDismiss={handleDismissViolation}
        onReset={handleResetAfterViolations}
      />
    </div>
  );
}
