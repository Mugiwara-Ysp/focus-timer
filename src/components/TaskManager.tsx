import { useState, useEffect } from "react";
import { Plus, Check, Clock, Trash2, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTasks, saveTasks, type Task } from "@/lib/storage";

interface TaskManagerProps {
  activeTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
  isSessionLocked: boolean;
}

export function TaskManager({ activeTaskId, onSelectTask, isSessionLocked }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    setTasks(getTasks());
  }, []);

  const refresh = () => setTasks(getTasks());

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      status: "todo",
      sessionsCompleted: 0,
      createdAt: Date.now(),
    };
    const updated = [...getTasks(), task];
    saveTasks(updated);
    setTasks(updated);
    setNewTaskTitle("");
  };

  const deleteTask = (id: string) => {
    const updated = getTasks().filter((t) => t.id !== id);
    saveTasks(updated);
    setTasks(updated);
    if (activeTaskId === id) onSelectTask(null);
  };

  const completeTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (task.sessionsCompleted < 1) return;
    const updated = getTasks().map((t) =>
      t.id === id ? { ...t, status: t.status === "completed" ? "todo" : "completed" as Task["status"] } : t
    );
    saveTasks(updated);
    refresh();
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = () => {
    if (!editTitle.trim() || !editingId) return;
    const updated = getTasks().map((t) =>
      t.id === editingId ? { ...t, title: editTitle.trim() } : t
    );
    saveTasks(updated);
    setTasks(updated);
    setEditingId(null);
  };

  const statusColors: Record<Task["status"], string> = {
    todo: "text-muted-foreground",
    "in-progress": "text-primary",
    completed: "text-green-500",
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a new task..."
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          disabled={isSessionLocked}
          className="flex-1 bg-card"
          data-testid="input-new-task"
        />
        <Button
          onClick={addTask}
          disabled={isSessionLocked || !newTaskTitle.trim()}
          size="icon"
          data-testid="button-add-task"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {tasks.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No tasks yet. Add one above.
          </p>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => !isSessionLocked && onSelectTask(activeTaskId === task.id ? null : task.id)}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
              activeTaskId === task.id
                ? "border-primary/50 bg-accent/50"
                : "border-border bg-card hover:border-primary/30"
            } ${task.status === "completed" ? "opacity-60" : ""}`}
            data-testid={`card-task-${task.id}`}
          >
            <button
              onClick={(e) => { e.stopPropagation(); completeTask(task.id); }}
              disabled={task.sessionsCompleted < 1}
              className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                task.status === "completed"
                  ? "bg-green-500 border-green-500"
                  : task.sessionsCompleted < 1
                  ? "border-muted-foreground/30 cursor-not-allowed"
                  : "border-muted-foreground hover:border-green-500"
              }`}
              title={task.sessionsCompleted < 1 ? "Complete at least 1 session first" : "Mark complete"}
              data-testid={`button-complete-task-${task.id}`}
            >
              {task.status === "completed" && <Check className="w-3 h-3 text-white" />}
            </button>

            {editingId === task.id ? (
              <div className="flex-1 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                  className="h-7 text-sm"
                  autoFocus
                  data-testid={`input-edit-task-${task.id}`}
                />
                <Button size="sm" onClick={saveEdit} className="h-7 px-2" data-testid={`button-save-edit-${task.id}`}>
                  <Check className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 px-2">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs capitalize ${statusColors[task.status]}`}>
                    {task.status.replace("-", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {task.sessionsCompleted} session{task.sessionsCompleted !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}

            {editingId !== task.id && (
              <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => startEdit(task)}
                  disabled={isSessionLocked}
                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                  data-testid={`button-edit-task-${task.id}`}
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  disabled={isSessionLocked}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                  data-testid={`button-delete-task-${task.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
