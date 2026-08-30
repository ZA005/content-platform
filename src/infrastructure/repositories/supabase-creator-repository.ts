import type { CreateCreatorInput, CreatorRepository, UpdateCreatorInput } from "@/core/interfaces/repositories";
import { CREATOR_STATUS } from "@/core/constants";
import type { Creator, ID } from "@/core/types";
import { getSupabaseClient } from "@/infrastructure/supabase/supabase-client";

interface CreatorRow {
  id: string;
  name: string;
  username: string;
  status: string;
  brands: string[];
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

function rowToCreator(row: CreatorRow): Creator {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    password: "", // Never populated from Supabase (only in auth.users)
    status: row.status as "active" | "disabled",
    brands: row.brands,
    avatarUrl: row.avatar_url ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseCreatorRepository implements CreatorRepository {
  async list(): Promise<Creator[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("creators").select("*").order("name", { ascending: true });

    if (error) throw error;
    return (data || []).map(rowToCreator);
  }

  async getById(id: ID): Promise<Creator | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("creators").select("*").eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data ? rowToCreator(data) : null;
  }

  async getByUsername(username: string): Promise<Creator | null> {
    const supabase = getSupabaseClient();
    const normalized = username.trim().toLowerCase();
    const { data, error } = await supabase
      .from("creators")
      .select("*")
      .ilike("username", normalized)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data ? rowToCreator(data) : null;
  }

  async create(input: CreateCreatorInput): Promise<Creator> {
    const supabase = getSupabaseClient();

    // Call Edge Function to create creator with auth user atomically
    const { data, error } = await supabase.functions.invoke("admin-manage-user", {
      body: {
        action: "create",
        entity: "creator",
        name: input.name,
        username: input.username,
        password: input.password,
        brands: input.brands || [],
        avatarUrl: input.avatarUrl || null,
      },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return {
      id: data.data.id,
      name: data.data.name,
      username: data.data.username,
      password: "",
      status: data.data.status as "active" | "disabled",
      brands: data.data.brands || [],
      avatarUrl: data.data.avatarUrl || "",
      createdAt: data.data.createdAt,
      updatedAt: data.data.updatedAt,
    };
  }

  async update(id: ID, input: UpdateCreatorInput): Promise<Creator> {
    const supabase = getSupabaseClient();

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.username !== undefined) updateData.username = input.username.toLowerCase().trim();
    if (input.password !== undefined) updateData.password = input.password;
    if (input.brands !== undefined) updateData.brands = input.brands;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl || null;

    const { data, error } = await supabase
      .from("creators")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return rowToCreator(data);
  }

  async disable(id: ID): Promise<Creator> {
    return this.update(id, { status: CREATOR_STATUS.DISABLED });
  }

  async enable(id: ID): Promise<Creator> {
    return this.update(id, { status: CREATOR_STATUS.ACTIVE });
  }

  async delete(id: ID): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("creators")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}

export const supabaseCreatorRepository = new SupabaseCreatorRepository();
