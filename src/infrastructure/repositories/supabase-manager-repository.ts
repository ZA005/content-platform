import type { CreateManagerInput, ManagerRepository, UpdateManagerInput } from "@/core/interfaces/repositories";
import type { ID, Manager } from "@/core/types";
import { getSupabaseClient } from "@/infrastructure/supabase/supabase-client";

interface ManagerRow {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

function rowToManager(row: ManagerRow): Manager {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    password: "", // Never populated from Supabase (only in auth.users)
    avatarUrl: row.avatar_url ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseManagerRepository implements ManagerRepository {
  async list(): Promise<Manager[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("managers").select("*").order("name", { ascending: true });

    if (error) throw error;
    return (data || []).map(rowToManager);
  }

  async getById(id: ID): Promise<Manager | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("managers").select("*").eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data ? rowToManager(data) : null;
  }

  async getByUsername(username: string): Promise<Manager | null> {
    const supabase = getSupabaseClient();
    const normalized = username.trim().toLowerCase();
    const { data, error } = await supabase
      .from("managers")
      .select("*")
      .ilike("username", normalized)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data ? rowToManager(data) : null;
  }

  async create(input: CreateManagerInput): Promise<Manager> {
    const supabase = getSupabaseClient();

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Insert directly into managers table
    const { data, error } = await supabase
      .from("managers")
      .insert({
        id,
        name: input.name,
        username: input.username.toLowerCase().trim(),
        avatar_url: input.avatarUrl || null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return rowToManager(data);
  }

  async update(id: ID, input: UpdateManagerInput): Promise<Manager> {
    const supabase = getSupabaseClient();

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.username !== undefined) updateData.username = input.username.toLowerCase().trim();
    if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl || null;
    if (input.password !== undefined) updateData.password = input.password;

    const { data, error } = await supabase
      .from("managers")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return rowToManager(data);
  }

  async delete(id: ID): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("managers")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}

export const supabaseManagerRepository = new SupabaseManagerRepository();
