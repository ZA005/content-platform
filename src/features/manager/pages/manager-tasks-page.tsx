import { useEffect, useState } from "react";
import { Plus, MoreHorizontal, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { STORAGE_KEYS, TASK_STATUS } from "@/core/constants";
import type { Creator, Task, TaskWithCreator } from "@/core/types";
import { storageService } from "@/infrastructure/storage/storage-service";
import { TaskFormModal } from "@/features/tasks/components/task-form-modal";
import type { TaskFormValues } from "@/features/tasks/schema";
import { format, parseISO } from "date-fns";

export function ManagerTasksPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [tasks, setTasks] = useState<TaskWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setIsLoading(true);
    const creatorsData = storageService.get<Creator[]>(STORAGE_KEYS.CREATORS) ?? [];
    const tasksData = storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
    setCreators(creatorsData);

    const tasksWithCreators = tasksData.map((task) => ({
      ...task,
      creator: creatorsData.find((c) => c.id === task.creatorId),
    }));
    setTasks(tasksWithCreators);
    setIsLoading(false);
  };

  const openCreate = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleTaskSubmit = async (values: TaskFormValues) => {
    const tasksData = storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
    const now = new Date().toISOString();

    if (editingTask) {
      const updatedTasks = tasksData.map((t) =>
        t.id === editingTask.id
          ? {
              ...t,
              ...values,
              updatedAt: now,
            }
          : t,
      );
      storageService.set(STORAGE_KEYS.TASKS, updatedTasks);
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).slice(2),
        ...values,
        status: TASK_STATUS.NOT_STARTED,
        createdAt: now,
        updatedAt: now,
      };
      storageService.set(STORAGE_KEYS.TASKS, [...tasksData, newTask]);
    }
    loadData();
  };

  const handleDeleteTask = (taskId: string) => {
    const tasksData = storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
    const updated = tasksData.filter((t) => t.id !== taskId);
    storageService.set(STORAGE_KEYS.TASKS, updated);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">Manage and assign tasks to your creators.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Assign Task
        </Button>
      </div>

      {isLoading ? (
        <LoadingState rows={4} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks yet"
          description="Start by assigning a task to one of your creators."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Assign Task
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead className="hidden sm:table-cell">Instruction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="text-sm">
                    {format(parseISO(task.scheduledDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="text-sm font-medium">{task.creator?.name || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{task.creator?.brands.join(", ")}</div>
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate text-sm sm:table-cell">
                    {task.instruction}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={task.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="size-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(task)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-danger focus:text-danger"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TaskFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        creators={creators}
        task={editingTask}
        onSubmit={handleTaskSubmit}
      />
    </div>
  );
}
