export interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "completed";
  sessionsCompleted: number;
  createdAt: number;
}

export interface SessionRecord {
  id: string;
  type: "focus" | "break";
  startedAt: number;
  completedAt: number;
  durationMinutes: number;
  violations: number;
  taskId?: string;
}

export interface UploadedImage {
  id: string;
  name: string;
  dataUrl: string;
  uploadedAt: number;
  sessionId?: string;
  reviewed: boolean;
  notes: string;
}

export interface ProductivityStats {
  totalFocusMinutes: number;
  completedSessions: number;
  completedTasks: number;
  totalViolations: number;
  dailySessions: { date: string; count: number }[];
}

export interface TimerState {
  isRunning: boolean;
  sessionType: "focus" | "break";
  startTime: number | null;
  pausedElapsed: number;
  currentSessionId: string | null;
  violations: number;
  activeTaskId: string | null;
  focusDuration: number;
  breakDuration: number;
}

const DB_NAME = "FocusTimerDB";
const DB_VERSION = 1;
const IMAGES_STORE = "images";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IMAGES_STORE)) {
        db.createObjectStore(IMAGES_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveImage(image: UploadedImage): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGES_STORE, "readwrite");
    const store = tx.objectStore(IMAGES_STORE);
    const req = store.put(image);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllImages(): Promise<UploadedImage[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGES_STORE, "readonly");
    const store = tx.objectStore(IMAGES_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function updateImage(image: UploadedImage): Promise<void> {
  return saveImage(image);
}

export async function deleteImage(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGES_STORE, "readwrite");
    const store = tx.objectStore(IMAGES_STORE);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export function getTasks(): Task[] {
  try {
    return JSON.parse(localStorage.getItem("focus_tasks") || "[]");
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem("focus_tasks", JSON.stringify(tasks));
}

export function getSessions(): SessionRecord[] {
  try {
    return JSON.parse(localStorage.getItem("focus_sessions") || "[]");
  } catch {
    return [];
  }
}

export function saveSessions(sessions: SessionRecord[]): void {
  localStorage.setItem("focus_sessions", JSON.stringify(sessions));
}

export function getTimerState(): TimerState {
  const defaultState: TimerState = {
    isRunning: false,
    sessionType: "focus",
    startTime: null,
    pausedElapsed: 0,
    currentSessionId: null,
    violations: 0,
    activeTaskId: null,
    focusDuration: 25,
    breakDuration: 5,
  };
  try {
    const stored = localStorage.getItem("focus_timer_state");
    if (!stored) return defaultState;
    const parsed = JSON.parse(stored);
    if (parsed.isRunning && parsed.startTime) {
      const elapsed = Date.now() - parsed.startTime + parsed.pausedElapsed;
      const duration = parsed.sessionType === "focus"
        ? parsed.focusDuration * 60 * 1000
        : parsed.breakDuration * 60 * 1000;
      if (elapsed >= duration) {
        return { ...parsed, isRunning: false, pausedElapsed: duration };
      }
    }
    return parsed;
  } catch {
    return defaultState;
  }
}

export function saveTimerState(state: TimerState): void {
  localStorage.setItem("focus_timer_state", JSON.stringify(state));
}

export function getStats(): ProductivityStats {
  const sessions = getSessions();
  const tasks = getTasks();

  const totalFocusMinutes = sessions
    .filter((s) => s.type === "focus")
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const completedSessions = sessions.filter((s) => s.type === "focus").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const totalViolations = sessions.reduce((sum, s) => sum + s.violations, 0);

  const last7Days: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const count = sessions.filter(
      (s) => s.type === "focus" && new Date(s.startedAt).toISOString().split("T")[0] === dateStr
    ).length;
    last7Days.push({ date: dateStr, count });
  }

  return {
    totalFocusMinutes,
    completedSessions,
    completedTasks,
    totalViolations,
    dailySessions: last7Days,
  };
}

export function exportSessionData(): void {
  const data = {
    tasks: getTasks(),
    sessions: getSessions(),
    stats: getStats(),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `focus-timer-export-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
