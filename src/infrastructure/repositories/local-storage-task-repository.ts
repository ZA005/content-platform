import { STORAGE_KEYS, TASK_STATUS } from "@/core/constants";
import type {
  CreateTaskInput,
  TaskRepository,
  UpdateTaskInput,
} from "@/core/interfaces/repositories";
import type { ID, Task } from "@/core/types";
import { storageService } from "@/infrastructure/storage/storage-service";

function readAll(): Task[] {
  return storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
}

function writeAll(tasks: Task[]): void {
  storageService.set(STORAGE_KEYS.TASKS, tasks);
}

function generateId(): ID {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * A task that's still open and scheduled before today is surfaced as
 * "overdue" without mutating the stored status, so a task the creator
 * marks complete later doesn't need a separate un-overdue transition.
 */
function deriveDisplayStatus(task: Task): Task {
  const isOpen = task.status !== TASK_STATUS.COMPLETED && task.status !== TASK_STATUS.OVERDUE;
  const todayIso = new Date().toISOString().slice(0, 10);
  if (isOpen && task.scheduledDate < todayIso) {
    return { ...task, status: TASK_STATUS.OVERDUE };
  }
  return task;
}

export class LocalStorageTaskRepository implements TaskRepository {
  async list(): Promise<Task[]> {
    return readAll()
      .map(deriveDisplayStatus)
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  }

  async getById(id: ID): Promise<Task | null> {
    const task = readAll().find((t) => t.id === id) ?? null;
    return task ? deriveDisplayStatus(task) : null;
  }

  async listByDate(date: string): Promise<Task[]> {
    const all = await this.list();
    return all.filter((t) => t.scheduledDate === date);
  }

  async listByCreator(creatorId: string): Promise<Task[]> {
    const all = await this.list();
    return all.filter((t) => t.creatorId === creatorId);
  }

  async listByCreatorAndDateRange(creatorId: string, startDate: string, endDate: string): Promise<Task[]> {
    const all = await this.list();
    return all.filter((t) => t.creatorId === creatorId && t.scheduledDate >= startDate && t.scheduledDate <= endDate);
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const tasks = readAll();
    const now = new Date().toISOString();
    const task: Task = {
      id: generateId(),
      creatorId: input.creatorId,
      brand: input.brand,
      scheduledDate: input.scheduledDate,
      scriptLink: input.scriptLink,
      instruction: input.instruction,
      notes: input.notes,
      status: input.status ?? TASK_STATUS.NOT_STARTED,
      createdAt: now,
      updatedAt: now,
    };
    writeAll([...tasks, task]);
    return task;
  }

  async update(id: ID, input: UpdateTaskInput): Promise<Task> {
    const tasks = readAll();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Task not found.");

    const updated: Task = {
      ...tasks[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    tasks[index] = updated;
    writeAll(tasks);
    return updated;
  }

  async delete(id: ID): Promise<void> {
    writeAll(readAll().filter((t) => t.id !== id));
  }
}

export const localStorageTaskRepository = new LocalStorageTaskRepository();
