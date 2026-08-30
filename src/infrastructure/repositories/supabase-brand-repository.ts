import type { BrandRepository } from "@/core/interfaces/repositories";
import { getSupabaseClient } from "@/infrastructure/supabase/supabase-client";

export class SupabaseBrandRepository implements BrandRepository {
  async list(): Promise<string[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("brands").select("name").order("name", { ascending: true });

    if (error) throw error;
    return (data || []).map((row: { name: string }) => row.name);
  }

  async add(name: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("brands").insert({ name });

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        throw new Error("This brand already exists");
      }
      throw error;
    }
  }

  async remove(name: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("brands").delete().eq("name", name);

    if (error) throw error;
  }
}

export const supabaseBrandRepository = new SupabaseBrandRepository();
