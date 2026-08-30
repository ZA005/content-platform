import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminManageUserRequest {
  action: "create" | "updateCredentials" | "delete";
  entity: "creator" | "manager";
  id?: string;
  name?: string;
  username?: string;
  password?: string;
  brands?: string[];
  avatarUrl?: string;
  newUsername?: string;
  newPassword?: string;
}

interface AdminManageUserResponse {
  data?: any;
  error?: string;
}

function synthesizeEmail(username: string): string {
  return `${username.toLowerCase()}@users.contentplatform.internal`;
}

async function handleCreate(
  req: AdminManageUserRequest,
  supabaseUrl: string,
  adminClient: any,
  userRole: string,
): Promise<AdminManageUserResponse> {
  const role = userRole.toLowerCase();

  // Admins can create managers and creators
  // Managers can create creators only
  if (req.entity === "manager" && role !== "admin") {
    return { error: "Only admins can create manager accounts" };
  }

  if (role !== "admin" && role !== "manager") {
    return { error: `Only admins and managers can create users. Your role: ${userRole || "unknown"}` };
  }

  if (!req.name || !req.username || !req.password || !req.entity) {
    return { error: "Missing required fields: name, username, password, entity" };
  }

  const email = synthesizeEmail(req.username);

  // Check username uniqueness
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("username", req.username)
    .single();

  if (existingProfile) {
    return { error: "This username is already taken" };
  }

  try {
    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: req.password,
      email_confirm: true,
      user_metadata: {
        username: req.username,
        role: req.entity,
        name: req.name,
      },
    });

    if (authError || !authData.user) {
      return { error: authError?.message || "Failed to create auth user" };
    }

    const userId = authData.user.id;

    // Create creators/managers row
    let entityId: string | null = null;

    if (req.entity === "creator") {
      const { data: creatorData, error: creatorError } = await adminClient
        .from("creators")
        .insert({
          name: req.name,
          username: req.username,
          status: "active",
          brands: req.brands || [],
          avatar_url: req.avatarUrl || null,
        })
        .select()
        .single();

      if (creatorError) {
        // Cleanup: delete the created auth user
        await adminClient.auth.admin.deleteUser(userId);
        return { error: creatorError.message };
      }
      entityId = creatorData.id;
    } else if (req.entity === "manager") {
      const { data: managerData, error: managerError } = await adminClient
        .from("managers")
        .insert({
          name: req.name,
          username: req.username,
          avatar_url: req.avatarUrl || null,
        })
        .select()
        .single();

      if (managerError) {
        // Cleanup: delete the created auth user
        await adminClient.auth.admin.deleteUser(userId);
        return { error: managerError.message };
      }
      entityId = managerData.id;
    }

    // Create profiles row
    const profileData = {
      id: userId,
      role: req.entity,
      name: req.name,
      username: req.username,
      creator_id: req.entity === "creator" ? entityId : null,
      manager_id: req.entity === "manager" ? entityId : null,
    };

    const { error: profileError } = await adminClient.from("profiles").insert(profileData);

    if (profileError) {
      // Cleanup: delete the created auth user and entity
      await adminClient.auth.admin.deleteUser(userId);
      if (req.entity === "creator") {
        await adminClient.from("creators").delete().eq("id", entityId);
      } else {
        await adminClient.from("managers").delete().eq("id", entityId);
      }
      return { error: profileError.message };
    }

    // Return the created entity data
    if (req.entity === "creator") {
      const { data: creatorData } = await adminClient
        .from("creators")
        .select("*")
        .eq("id", entityId)
        .single();
      return {
        data: {
          id: creatorData.id,
          name: creatorData.name,
          username: creatorData.username,
          password: "",
          status: creatorData.status,
          brands: creatorData.brands,
          avatarUrl: creatorData.avatar_url || "",
          createdAt: creatorData.created_at,
          updatedAt: creatorData.updated_at,
        },
      };
    } else {
      const { data: managerData } = await adminClient
        .from("managers")
        .select("*")
        .eq("id", entityId)
        .single();
      return {
        data: {
          id: managerData.id,
          name: managerData.name,
          username: managerData.username,
          password: "",
          avatarUrl: managerData.avatar_url || "",
          createdAt: managerData.created_at,
          updatedAt: managerData.updated_at,
        },
      };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function handleUpdateCredentials(
  req: AdminManageUserRequest,
  adminClient: any,
  userRole: string,
): Promise<AdminManageUserResponse> {
  if (userRole !== "admin") {
    return { error: "Only admins can update credentials" };
  }

  if (!req.id || !req.entity) {
    return { error: "Missing required fields: id, entity" };
  }

  if (!req.newUsername && !req.newPassword) {
    return { error: "Provide at least one of: newUsername, newPassword" };
  }

  try {
    // Resolve the profile and auth user
    const { data: profileData, error: profileError } = await adminClient
      .from("profiles")
      .select("id, creator_id, manager_id")
      .eq(req.entity === "creator" ? "creator_id" : "manager_id", req.id)
      .single();

    if (profileError || !profileData) {
      return { error: "User not found" };
    }

    const userId = profileData.id;

    const updateData: Record<string, any> = {};

    if (req.newUsername) {
      // Check uniqueness of new username
      const { data: existing } = await adminClient
        .from("profiles")
        .select("id")
        .eq("username", req.newUsername)
        .single();

      if (existing) {
        return { error: "This username is already taken" };
      }

      updateData.username = req.newUsername;
      updateData.email = synthesizeEmail(req.newUsername);
    }

    if (req.newPassword) {
      updateData.password = req.newPassword;
    }

    // Update auth user
    const { error: authError } = await adminClient.auth.admin.updateUserById(userId, updateData);

    if (authError) {
      return { error: authError.message };
    }

    // Update profiles
    if (req.newUsername) {
      const { error: profileUpdateError } = await adminClient
        .from("profiles")
        .update({ username: req.newUsername })
        .eq("id", userId);

      if (profileUpdateError) {
        return { error: profileUpdateError.message };
      }

      // Update creators/managers username
      const tableToUpdate = req.entity === "creator" ? "creators" : "managers";
      const { error: entityUpdateError } = await adminClient
        .from(tableToUpdate)
        .update({ username: req.newUsername })
        .eq("id", req.id);

      if (entityUpdateError) {
        return { error: entityUpdateError.message };
      }
    }

    // Return updated entity
    const tableToSelect = req.entity === "creator" ? "creators" : "managers";
    const { data: entityData } = await adminClient
      .from(tableToSelect)
      .select("*")
      .eq("id", req.id)
      .single();

    if (req.entity === "creator") {
      return {
        data: {
          id: entityData.id,
          name: entityData.name,
          username: entityData.username,
          password: "",
          status: entityData.status,
          brands: entityData.brands,
          avatarUrl: entityData.avatar_url || "",
          createdAt: entityData.created_at,
          updatedAt: entityData.updated_at,
        },
      };
    } else {
      return {
        data: {
          id: entityData.id,
          name: entityData.name,
          username: entityData.username,
          password: "",
          avatarUrl: entityData.avatar_url || "",
          createdAt: entityData.created_at,
          updatedAt: entityData.updated_at,
        },
      };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function handleDelete(
  req: AdminManageUserRequest,
  adminClient: any,
  userRole: string,
): Promise<AdminManageUserResponse> {
  if (userRole !== "admin") {
    return { error: "Only admins can delete users" };
  }

  if (!req.id || !req.entity) {
    return { error: "Missing required fields: id, entity" };
  }

  try {
    // Resolve the profile and auth user
    const { data: profileData, error: profileError } = await adminClient
      .from("profiles")
      .select("id, creator_id, manager_id")
      .eq(req.entity === "creator" ? "creator_id" : "manager_id", req.id)
      .single();

    if (profileError || !profileData) {
      return { error: "User not found" };
    }

    // Delete auth user (cascades profile)
    const { error: authError } = await adminClient.auth.admin.deleteUser(profileData.id);

    if (authError) {
      return { error: authError.message };
    }

    // Delete entity (creators/managers row)
    const tableToDelete = req.entity === "creator" ? "creators" : "managers";
    const { error: entityError } = await adminClient
      .from(tableToDelete)
      .delete()
      .eq("id", req.id);

    if (entityError) {
      return { error: entityError.message };
    }

    return { data: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase config" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build admin client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user info
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await adminClient.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get caller's role from profiles table (using service role, bypasses RLS)
    const { data: callerProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ error: `Failed to load profile: ${profileError.message}` }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!callerProfile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userRole = callerProfile.role ? String(callerProfile.role).trim() : "";

    const body: AdminManageUserRequest = await req.json();

    let response: AdminManageUserResponse;

    if (body.action === "create") {
      response = await handleCreate(body, supabaseUrl, adminClient, userRole);
    } else if (body.action === "updateCredentials") {
      response = await handleUpdateCredentials(body, adminClient, userRole);
    } else if (body.action === "delete") {
      response = await handleDelete(body, adminClient, userRole);
    } else {
      response = { error: "Invalid action" };
    }

    const statusCode = response.error ? 400 : 200;

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
