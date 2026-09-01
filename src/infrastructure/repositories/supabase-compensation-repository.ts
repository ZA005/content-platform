import type { CompensationRepository, UpsertCompensationInput } from "@/core/interfaces/repositories";
import type { CompensationProfile, ID, UserRole } from "@/core/types";
import { getSupabaseClient } from "@/infrastructure/supabase/supabase-client";

interface CompensationRow {
  id: string;
  user_id: string;
  role: "creator" | "manager";
  base_salary_centavos: number;
  day_off_multiplier: number | null;
  effective_date: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

function rowToCompensationProfile(row: CompensationRow): CompensationProfile {
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role,
    baseSalaryCentavos: row.base_salary_centavos,
    dayOffMultiplier: row.day_off_multiplier ?? undefined,
    effectiveDate: row.effective_date,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseCompensationRepository implements CompensationRepository {
  async list(): Promise<CompensationProfile[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("compensation_profiles")
      .select("*")
      .eq("active", true)
      .order("user_id", { ascending: true });

    if (error) throw error;
    return (data || []).map(rowToCompensationProfile);
  }

  async getByUserId(userId: ID): Promise<CompensationProfile | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("compensation_profiles")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true)
      .maybeSingle();

    console.log("🔍 DEBUG SupabaseCompensationRepository.getByUserId:", {
      userId,
      dataFound: !!data,
      error: error?.message,
      data: data ? { user_id: data.user_id, base_salary_centavos: data.base_salary_centavos } : null,
    });

    if (error) throw error;
    return data ? rowToCompensationProfile(data) : null;
  }

  async upsert(
    userId: ID,
    role: Extract<UserRole, "creator" | "manager">,
    input: UpsertCompensationInput
  ): Promise<CompensationProfile> {
    const supabase = getSupabaseClient();
    const id = `comp-${userId}-${Date.now()}`;

    const { data, error } = await supabase
      .from("compensation_profiles")
      .upsert(
        {
          id,
          user_id: userId,
          role,
          base_salary_centavos: input.baseSalaryCentavos,
          day_off_multiplier: input.dayOffMultiplier ?? null,
          effective_date: input.effectiveDate ?? new Date().toISOString().split("T")[0],
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Failed to upsert compensation profile");
    return rowToCompensationProfile(data);
  }

  async delete(id: ID): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("compensation_profiles").delete().eq("id", id);

    if (error) throw error;
  }
}

export const supabaseCompensationRepository = new SupabaseCompensationRepository();
