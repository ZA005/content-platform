import type { UpsertWorkScheduleInput, WorkScheduleRepository } from "@/core/interfaces/repositories";
import type { ID, WorkSchedule } from "@/core/types";
import { getSupabaseClient } from "@/infrastructure/supabase/supabase-client";

interface WorkScheduleRow {
  id: string;
  user_id: string;
  working_days: number[];
  custom_days_off: string[];
  updated_at: string;
}

function rowToWorkSchedule(row: WorkScheduleRow): WorkSchedule {
  return {
    id: row.id,
    userId: row.user_id,
    workingDays: row.working_days,
    customDaysOff: row.custom_days_off,
    updatedAt: row.updated_at,
  };
}

export class SupabaseWorkScheduleRepository implements WorkScheduleRepository {
  async list(): Promise<WorkSchedule[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("work_schedules")
      .select("*")
      .order("user_id", { ascending: true });

    if (error) throw error;
    return (data || []).map(rowToWorkSchedule);
  }

  async getByUserId(userId: ID): Promise<WorkSchedule | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("work_schedules")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data ? rowToWorkSchedule(data) : null;
  }

  async upsert(userId: ID, input: UpsertWorkScheduleInput): Promise<WorkSchedule> {
    const supabase = getSupabaseClient();
    const id = `sch-${userId}-${Date.now()}`;

    const { data, error } = await supabase
      .from("work_schedules")
      .upsert(
        {
          id,
          user_id: userId,
          working_days: input.workingDays,
          custom_days_off: input.customDaysOff ?? [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Failed to upsert work schedule");
    return rowToWorkSchedule(data);
  }

  async delete(scheduleId: ID): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("work_schedules")
      .delete()
      .eq("id", scheduleId);

    if (error) throw error;
  }
}

export const supabaseWorkScheduleRepository = new SupabaseWorkScheduleRepository();
