import type { AuthRepository } from "@/core/interfaces/repositories";
import type { AuthUser, Session } from "@/core/types";
import { getSupabaseClient } from "@/infrastructure/supabase/supabase-client";

interface ProfileRow {
  id: string;
  role: "admin" | "creator" | "manager";
  name: string;
  username: string;
  creator_id: string | null;
  manager_id: string | null;
}

export class SupabaseAuthRepository implements AuthRepository {
  async login(username: string, password: string): Promise<AuthUser> {
    const supabase = getSupabaseClient();
    const normalizedUsername = username.trim().toLowerCase();

    const { data: emailData, error: emailError } = await supabase.rpc("resolve_login_email", {
      p_username: normalizedUsername,
    });

    if (emailError || !emailData) {
      throw new Error("Invalid username or password.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailData,
      password,
    });

    if (error || !data.user) {
      throw new Error("Invalid username or password.");
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profileData) {
      throw new Error("Failed to load user profile.");
    }

    const profile = profileData as ProfileRow;

    if (profile.role === "creator") {
      const { data: creatorData } = await supabase
        .from("creators")
        .select("status")
        .eq("id", profile.creator_id)
        .single();

      if (creatorData?.status === "disabled") {
        await supabase.auth.signOut();
        throw new Error("This creator account has been disabled. Contact your admin.");
      }
    }

    const user: AuthUser = {
      id: profile.id,
      username: profile.username,
      role: profile.role,
      name: profile.name,
      creatorId: profile.role === "creator" ? profile.creator_id || undefined : undefined,
    };

    return user;
  }

  async logout(): Promise<void> {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  }

  async getSession(): Promise<Session | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.user) {
      return null;
    }

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.session.user.id)
        .single();

      if (profileError || !profileData) {
        return null;
      }

      const profile = profileData as ProfileRow;

      const user: AuthUser = {
        id: profile.id,
        username: profile.username,
        role: profile.role,
        name: profile.name,
        creatorId: profile.role === "creator" ? profile.creator_id || undefined : undefined,
      };

      return {
        user,
        issuedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }
}

export const supabaseAuthRepository = new SupabaseAuthRepository();
