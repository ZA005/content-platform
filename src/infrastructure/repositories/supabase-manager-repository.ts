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

    const { data: result, error } = await supabase.functions.invoke("admin-manage-user", {
      body: {
        action: "create",
        entity: "manager",
        name: input.name,
        username: input.username,
        password: input.password,
        avatarUrl: input.avatarUrl,
      },
    });

    if (error) throw new Error(error.message || "Failed to create manager");
    if (result?.error) throw new Error(result.error);

    return result.data as Manager;
  }

  async update(id: ID, input: UpdateManagerInput): Promise<Manager> {
    const supabase = getSupabaseClient();

    // Credential updates (username/password) go through the Edge Function
    if (input.username || input.password) {
      const { data: result, error } = await supabase.functions.invoke("admin-manage-user", {
        body: {
          action: "updateCredentials",
          entity: "manager",
          id,
          newUsername: input.username,
          newPassword: input.password,
        },
      });

      if (error) throw new Error(error.message || "Failed to update manager");
      if (result?.error) throw new Error(result.error);

      return result.data as Manager;
    }

    // Other field updates go directly to the table
    const updateData: Record<string, any> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;

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

    const { error } = await supabase.functions.invoke("admin-manage-user", {
      body: {
        action: "delete",
        entity: "manager",
        id,
      },
    });

    if (error) throw new Error(error.message || "Failed to delete manager");
  }
}

export const supabaseManagerRepository = new SupabaseManagerRepository();
