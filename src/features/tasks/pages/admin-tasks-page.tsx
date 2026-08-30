import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ExternalLink, ListTodo, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DateNav } from "@/components/shared/date-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import type { TaskWithCreator } from "@/core/types";
import { useCreators } from "@/features/creators/hooks/use-creators";
import { StatusFilterSelect, ALL_STATUSES } from "../components/status-filter-select";
import { TaskDetailDialog } from "../components/task-detail-dialog";
import { TaskFormModal } from "../components/task-form-modal";
import { useTasks } from "../hooks/use-tasks";
import type { TaskFormValues } from "../schema";

export function AdminTasksPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES);

  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks({ date: selectedDate });
  const { creators } = useCreators();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithCreator | null>(null);
  const [viewingTask, setViewingTask] = useState<TaskWithCreator | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskWithCreator | null>(null);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesStatus = statusFilter === ALL_STATUSES || task.status === statusFilter;
      const matchesQuery =
        !query ||
        task.creator?.name.toLowerCase().includes(query) ||
        task.brand.toLowerCase().includes(query) ||
        task.instruction.toLowerCase().includes(query) ||
        task.notes.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [tasks, search, statusFilter]);

  const tasksByBrand = useMemo(() => {
    const grouped = new Map<string, typeof filteredTasks>();
    filteredTasks.forEach((task) => {
      const list = grouped.get(task.brand) ?? [];
      list.push(task);
      grouped.set(task.brand, list);
    });
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredTasks]);

  const openCreate = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  const openEdit = (task: TaskWithCreator) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleSubmit = async (values: TaskFormValues) => {
    if (editingTask) {
      await updateTask(editingTask.id, values);
    } else {
      await createTask(values);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">Assign and track content production tasks.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Assign Task
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:gap-4">
        <DateNav date={selectedDate} onChange={setSelectedDate} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 sm:w-56"
            />
          </div>
          <StatusFilterSelect value={statusFilter} onChange={setStatusFilter} />
        </div>
      </div>

      {isLoading ? (
        <LoadingState rows={5} />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks for this day"
          description={`Nothing scheduled for ${format(new Date(selectedDate), "MMMM d, yyyy")} yet. Assign a task to get started.`}
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Assign Task
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {tasksByBrand.map(([brand, brandTasks]) => (
            <div key={brand} className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">{brand}</h2>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creator</TableHead>
                      <TableHead className="hidden sm:table-cell">Script</TableHead>
                      <TableHead className="hidden md:table-cell">Instruction</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brandTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium text-foreground">
                          <div className="flex flex-col gap-1">
                            <span>{task.creator?.name ?? "Unassigned"}</span>
                            <div className="flex flex-col gap-1 sm:hidden">
                              <a
                                href={task.scriptLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                              >
                                Script <ExternalLink className="size-3" />
                              </a>
                              <span className="text-xs text-muted-foreground line-clamp-2">{task.instruction}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <a
                            href={task.scriptLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                          >
                            Script <ExternalLink className="size-3" />
                          </a>
                        </TableCell>
                        <TableCell className="hidden md:table-cell truncate text-muted-foreground">
                          {task.instruction}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={task.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col gap-1 sm:flex-row sm:justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setViewingTask(task)} className="text-xs sm:text-sm">
                              View
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(task)} className="h-8 w-8 sm:h-9 sm:w-9">
                              <Pencil className="size-3 sm:size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-danger hover:text-danger sm:h-9 sm:w-9"
                              onClick={() => setDeletingTask(task)}
                            >
                              <Trash2 className="size-3 sm:size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        creators={creators}
        task={editingTask}
        defaultDate={selectedDate}
        onSubmit={handleSubmit}
      />

      <TaskDetailDialog task={viewingTask} open={Boolean(viewingTask)} onOpenChange={(o) => !o && setViewingTask(null)} />

      <ConfirmDialog
        open={Boolean(deletingTask)}
        onOpenChange={(o) => !o && setDeletingTask(null)}
        title="Delete this task?"
        description="This can't be undone. The creator will no longer see this task."
        confirmLabel="Delete task"
        onConfirm={async () => {
          if (deletingTask) await deleteTask(deletingTask.id);
        }}
      />
    </div>
  );
}
