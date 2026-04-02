import { Play, Pause, RotateCcw, SkipForward, Settings, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { type TimerState } from "@/lib/storage";

interface TimerControlsProps {
  timerState: TimerState;
  isSessionLocked: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkipToBreak: () => void;
  onFocusDurationChange: (mins: number) => void;
  onBreakDurationChange: (mins: number) => void;
}

export function TimerControls({
  timerState,
  isSessionLocked,
  onStart,
  onPause,
  onReset,
  onSkipToBreak,
  onFocusDurationChange,
  onBreakDurationChange,
}: TimerControlsProps) {
  const isFocus = timerState.sessionType === "focus";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={onReset}
          title="Reset (R)"
          className="w-10 h-10 rounded-xl"
          data-testid="button-reset"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          onClick={isSessionLocked ? onPause : onStart}
          size="lg"
          className="w-16 h-16 rounded-2xl text-lg font-semibold shadow-lg transition-all duration-200 hover:scale-105"
          style={{
            background: isFocus
              ? "linear-gradient(135deg, hsl(258 80% 65%), hsl(258 80% 55%))"
              : "linear-gradient(135deg, hsl(180 65% 50%), hsl(180 65% 40%))",
          }}
          data-testid={isSessionLocked ? "button-pause" : "button-start"}
        >
          {isSessionLocked ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-0.5" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onSkipToBreak}
          disabled={!isSessionLocked}
          title="Skip to break"
          className="w-10 h-10 rounded-xl"
          data-testid="button-skip"
        >
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground text-xs"
              disabled={isSessionLocked}
              data-testid="button-settings"
            >
              <Settings className="w-3.5 h-3.5" />
              {timerState.focusDuration}m / {timerState.breakDuration}m
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4 space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">
                  Focus Duration: <strong>{timerState.focusDuration} min</strong>
                </Label>
                <Slider
                  value={[timerState.focusDuration]}
                  onValueChange={([v]) => onFocusDurationChange(v)}
                  min={5}
                  max={60}
                  step={5}
                  data-testid="slider-focus-duration"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 min</span>
                  <span>60 min</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">
                  Break Duration: <strong>{timerState.breakDuration} min</strong>
                </Label>
                <Slider
                  value={[timerState.breakDuration]}
                  onValueChange={([v]) => onBreakDurationChange(v)}
                  min={1}
                  max={30}
                  step={1}
                  data-testid="slider-break-duration"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 min</span>
                  <span>30 min</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground text-xs"
              data-testid="button-keyboard-shortcuts"
            >
              <Keyboard className="w-3.5 h-3.5" />
              Shortcuts
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3">
            <div className="space-y-2 text-sm">
              <p className="font-medium mb-2">Keyboard Shortcuts</p>
              <div className="flex justify-between text-muted-foreground">
                <span>Start / Pause</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Space</kbd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Reset</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">R</kbd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Skip</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">S</kbd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Dark Mode</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">D</kbd>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
