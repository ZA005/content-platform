import { TASK_STATUS } from "@/core/constants";
import type { CreateTaskInput, TaskRepository, UpdateTaskInput } from "@/core/interfaces/repositories";
import type { ID, Task } from "@/core/types";
import { getSupabaseClient } from "@/infrastructure/supabase/supabase-client";

interface TaskRow {
  id: string;
  creator_id: string;
  brand: string;
  scheduled_date: string;
  script_link: string;
  reference_link: string | null;
  instruction: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    creatorId: row.creator_id,
    brand: row.brand,
    scheduledDate: row.scheduled_date,
    scriptLink: row.script_link,
    referenceLink: row.reference_link ?? "",
    instruction: row.instruction,
    notes: row.notes,
    status: row.status as any,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

export class SupabaseTaskRepository implements TaskRepository {
  async list(): Promise<Task[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("scheduled_date", { ascending: true });

    if (error) throw error;
    return (data || []).map((row) => deriveDisplayStatus(rowToTask(row)));
  }

  async getById(id: ID): Promise<Task | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("tasks").select("*").eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data ? deriveDisplayStatus(rowToTask(data)) : null;
  }

  async listByDate(date: string): Promise<Task[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("scheduled_date", date)
      .order("scheduled_date", { ascending: true });

    if (error) throw error;
    return (data || []).map((row) => deriveDisplayStatus(rowToTask(row)));
  }

  async listByCreator(creatorId: string): Promise<Task[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("creator_id", creatorId)
      .order("scheduled_date", { ascending: true });

    if (error) throw error;
    return (data || []).map((row) => deriveDisplayStatus(rowToTask(row)));
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        creator_id: input.creatorId,
        brand: input.brand,
        scheduled_date: input.scheduledDate,
        script_link: input.scriptLink,
        reference_link: input.referenceLink ?? null,
        instruction: input.instruction,
        notes: input.notes,
        status: input.status ?? TASK_STATUS.NOT_STARTED,
      })
      .select()
      .single();

    if (error) throw error;
    return deriveDisplayStatus(rowToTask(data));
  }

  async update(id: ID, input: UpdateTaskInput): Promise<Task> {
    const supabase = getSupabaseClient();
    const updateData: Record<string, any> = {};

    if (input.creatorId !== undefined) updateData.creator_id = input.creatorId;
    if (input.brand !== undefined) updateData.brand = input.brand;
    if (input.scheduledDate !== undefined) updateData.scheduled_date = input.scheduledDate;
    if (input.scriptLink !== undefined) updateData.script_link = input.scriptLink;
    if (input.referenceLink !== undefined) updateData.reference_link = input.referenceLink ?? null;
    if (input.instruction !== undefined) updateData.instruction = input.instruction;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.status !== undefined) updateData.status = input.status;

    const { data, error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return deriveDisplayStatus(rowToTask(data));
  }

  async delete(id: ID): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) throw error;
  }
}

export const supabaseTaskRepository = new SupabaseTaskRepository();
