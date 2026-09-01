export function synthesizeEmail(username: string): string {
  return `${username.toLowerCase()}@users.contentplatform.internal`;
}

export interface CreateCreatorUserInput {
  name: string;
  username: string;
  password: string;
  brands?: string[];
  avatarUrl?: string;
}

export interface CreateCreatorUserResult {
  data?: {
    id: string;
    name: string;
    username: string;
    password: string;
    status: string;
    brands: string[];
    avatarUrl: string;
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
}

/**
 * Creates a Supabase Auth user + creators row + profiles row atomically
 * (with manual rollback on partial failure, since Supabase has no
 * cross-resource transaction spanning auth.users and public tables).
 */
export async function createCreatorUser(
  adminClient: any,
  input: CreateCreatorUserInput,
): Promise<CreateCreatorUserResult> {
  const email = synthesizeEmail(input.username);

  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("username", input.username)
    .single();

  if (existingProfile) {
    return { error: "This username is already taken" };
  }

  try {
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        username: input.username,
        role: "creator",
        name: input.name,
      },
    });

    if (authError || !authData.user) {
      return { error: authError?.message || "Failed to create auth user" };
    }

    const userId = authData.user.id;

    const { data: creatorData, error: creatorError } = await adminClient
      .from("creators")
      .insert({
        name: input.name,
        username: input.username,
        status: "active",
        brands: input.brands || [],
        avatar_url: input.avatarUrl || null,
      })
      .select()
      .single();

    if (creatorError) {
      await adminClient.auth.admin.deleteUser(userId);
      return { error: creatorError.message };
    }

    const entityId = creatorData.id;

    const { error: profileError } = await adminClient.from("profiles").insert({
      id: userId,
      role: "creator",
      name: input.name,
      username: input.username,
      creator_id: entityId,
      manager_id: null,
    });

    if (profileError) {
      await adminClient.auth.admin.deleteUser(userId);
      await adminClient.from("creators").delete().eq("id", entityId);
      return { error: profileError.message };
    }

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
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}
