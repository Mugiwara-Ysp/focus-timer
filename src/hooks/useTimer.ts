import { useState, useEffect, useRef, useCallback } from "react";
import {
  getTimerState,
  saveTimerState,
  getSessions,
  saveSessions,
  getTasks,
  saveTasks,
  type TimerState,
  type SessionRecord,
} from "@/lib/storage";
import { playSessionStart, playSessionEnd, playBreakStart, playViolationAlert } from "@/lib/sounds";

const MAX_VIOLATIONS = 5;

export interface UseTimerReturn {
  timerState: TimerState;
  remainingMs: number;
  progress: number;
  isSessionLocked: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skipToBreak: () => void;
  addViolation: (reason: string) => void;
  setFocusDuration: (mins: number) => void;
  setBreakDuration: (mins: number) => void;
  setActiveTask: (taskId: string | null) => void;
  totalDurationMs: number;
}

export function useTimer(): UseTimerReturn {
  const [timerState, setTimerState] = useState<TimerState>(getTimerState);
  const [remainingMs, setRemainingMs] = useState(0);
  const rafRef = useRef<number | null>(null);
  const sessionCompletedRef = useRef(false);

  const totalDurationMs =
    timerState.sessionType === "focus"
      ? timerState.focusDuration * 60 * 1000
      : timerState.breakDuration * 60 * 1000;

  const getElapsed = useCallback(
    (state: TimerState) => {
      if (state.isRunning && state.startTime !== null) {
        return Date.now() - state.startTime + state.pausedElapsed;
      }
      return state.pausedElapsed;
    },
    []
  );

  const completeSession = useCallback((state: TimerState) => {
    if (sessionCompletedRef.current) return;
    sessionCompletedRef.current = true;

    const sessions = getSessions();
    const isSessionFocus = state.sessionType === "focus";
    const sessionRecord: SessionRecord = {
      id: state.currentSessionId || crypto.randomUUID(),
      type: state.sessionType,
      startedAt: state.startTime || Date.now(),
      completedAt: Date.now(),
      durationMinutes: isSessionFocus ? state.focusDuration : state.breakDuration,
      violations: state.violations,
      taskId: state.activeTaskId || undefined,
    };

    sessions.push(sessionRecord);
    saveSessions(sessions);

    if (isSessionFocus && state.activeTaskId) {
      const tasks = getTasks();
      const updated = tasks.map((t) =>
        t.id === state.activeTaskId
          ? { ...t, sessionsCompleted: t.sessionsCompleted + 1 }
          : t
      );
      saveTasks(updated);
    }

    if (isSessionFocus) {
      playSessionEnd();
    } else {
      playSessionStart();
    }

    const nextType = isSessionFocus ? "break" : "focus";
    const nextState: TimerState = {
      ...state,
      isRunning: false,
      sessionType: nextType,
      startTime: null,
      pausedElapsed: 0,
      currentSessionId: crypto.randomUUID(),
      violations: 0,
    };
    setTimerState(nextState);
    saveTimerState(nextState);
  }, []);

  useEffect(() => {
    function tick() {
      const state = getTimerState();
      if (!state.isRunning || state.startTime === null) {
        rafRef.current = null;
        return;
      }
      const elapsed = Date.now() - state.startTime + state.pausedElapsed;
      const duration =
        state.sessionType === "focus"
          ? state.focusDuration * 60 * 1000
          : state.breakDuration * 60 * 1000;
      const remaining = Math.max(0, duration - elapsed);
      setRemainingMs(remaining);

      if (remaining <= 0) {
        completeSession(state);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    if (timerState.isRunning) {
      sessionCompletedRef.current = false;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const elapsed = getElapsed(timerState);
      const duration =
        timerState.sessionType === "focus"
          ? timerState.focusDuration * 60 * 1000
          : timerState.breakDuration * 60 * 1000;
      setRemainingMs(Math.max(0, duration - elapsed));
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [timerState, completeSession, getElapsed]);

  const updateState = useCallback((updater: (prev: TimerState) => TimerState) => {
    setTimerState((prev) => {
      const next = updater(prev);
      saveTimerState(next);
      return next;
    });
  }, []);

  const start = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      isRunning: true,
      startTime: Date.now() - prev.pausedElapsed,
      currentSessionId: prev.currentSessionId || crypto.randomUUID(),
    }));
    if (timerState.sessionType === "focus") {
      playSessionStart();
    } else {
      playBreakStart();
    }
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, [timerState.sessionType, updateState]);

  const pause = useCallback(() => {
    updateState((prev) => {
      if (!prev.isRunning || prev.startTime === null) return prev;
      const elapsed = Date.now() - prev.startTime + prev.pausedElapsed;
      return {
        ...prev,
        isRunning: false,
        startTime: null,
        pausedElapsed: elapsed,
      };
    });
  }, [updateState]);

  const reset = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    const newState: TimerState = {
      ...getTimerState(),
      isRunning: false,
      sessionType: "focus",
      startTime: null,
      pausedElapsed: 0,
      currentSessionId: null,
      violations: 0,
    };
    setTimerState(newState);
    saveTimerState(newState);
  }, []);

  const skipToBreak = useCallback(() => {
    const state = getTimerState();
    completeSession(state);
  }, [completeSession]);

  const addViolation = useCallback((_reason: string) => {
    playViolationAlert();
    updateState((prev) => {
      const newViolations = prev.violations + 1;
      return { ...prev, violations: newViolations };
    });
  }, [updateState]);

  const setFocusDuration = useCallback((mins: number) => {
    updateState((prev) => ({ ...prev, focusDuration: mins, pausedElapsed: 0, startTime: null, isRunning: false }));
  }, [updateState]);

  const setBreakDuration = useCallback((mins: number) => {
    updateState((prev) => ({ ...prev, breakDuration: mins, pausedElapsed: 0, startTime: null, isRunning: false }));
  }, [updateState]);

  const setActiveTask = useCallback((taskId: string | null) => {
    updateState((prev) => ({ ...prev, activeTaskId: taskId }));
  }, [updateState]);

  const progress = totalDurationMs > 0 ? 1 - remainingMs / totalDurationMs : 0;
  const isSessionLocked = timerState.isRunning;

  return {
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
    totalDurationMs,
  };
}

export { MAX_VIOLATIONS };
